import os
import json
import importlib.util
import importlib.machinery
import pkgutil
import sys

if not hasattr(pkgutil, 'get_loader'):
    def get_loader(name):
        if name == '__main__':
            main_mod = sys.modules.get('__main__')
            if main_mod and hasattr(main_mod, '__file__'):
                return importlib.machinery.SourceFileLoader(name, main_mod.__file__)
            return None
        spec = importlib.util.find_spec(name)
        return spec.loader if spec else None
    pkgutil.get_loader = get_loader

from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from config import config
from datetime import datetime
from models.resume_reader import parse_resume_file
import secrets

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    openai = None
    OPENAI_AVAILABLE = False

app = Flask(__name__)
app.config.from_object(config['development'])
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(16))

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = os.getenv('MODEL_TYPE', 'gpt-3.5-turbo')
if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# In-memory storage for candidate profiles and transcripts
candidate_profiles = {}  # session_id -> candidate profile
transcripts = {}  # session_id -> transcript data
sessions_data = {}  # session_id -> session metadata

# Store current transcript in memory (Phase 1)
transcript = {
    'segments': [],
    'session_start': None
}

@app.route('/')
def index():
    """Main route - shows resume upload or interview based on session state"""
    if 'session_id' in session and session['session_id'] in candidate_profiles:
        # Resume already uploaded, show interview
        return redirect(url_for('interview'))
    # Show resume upload page
    return render_template('resume_upload.html')

@app.route('/resume-upload', methods=['GET', 'POST'])
def resume_upload():
    """Serve the resume upload page"""
    return render_template('resume_upload.html')

@app.route('/interview')
def interview():
    """Main interview interface - requires resume to be uploaded"""
    if 'session_id' not in session or session['session_id'] not in candidate_profiles:
        return redirect(url_for('index'))
    return render_template('interview.html')

@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    """Handle resume file upload and parsing"""
    try:
        # Get file from request
        if 'resume' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        # Validate file extension
        allowed_extensions = app.config['ALLOWED_EXTENSIONS']
        file_ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
        
        if file_ext not in allowed_extensions:
            return jsonify({
                'status': 'error',
                'message': f'Only {", ".join(allowed_extensions)} files are allowed'
            }), 400
        
        # Save file
        filename = f"resume_{datetime.now().timestamp()}.{file_ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Parse resume
        try:
            profile = parse_resume_file(filepath)
            
            # Create or get session
            if 'session_id' not in session:
                session_id = secrets.token_hex(16)
                session['session_id'] = session_id
            else:
                session_id = session['session_id']
            
            # Store profile and metadata
            candidate_profiles[session_id] = profile
            sessions_data[session_id] = {
                'resume_filename': filename,
                'uploaded_at': datetime.now().isoformat(),
                'file_path': filepath
            }
            
            # Initialize transcript for this session
            if session_id not in transcripts:
                transcripts[session_id] = {
                    'segments': [],
                    'session_start': None
                }
            
            return jsonify({
                'status': 'success',
                'message': 'Resume uploaded and parsed successfully',
                'profile': {
                    'name': profile.get('name'),
                    'email': profile.get('email'),
                    'skills_count': len(profile.get('skills', [])),
                    'education_count': len(profile.get('education', [])),
                    'projects_count': len(profile.get('projects', [])),
                    'skills': profile.get('skills', [])[:10],  # First 10 skills
                    'education': profile.get('education', [])[:3]  # First 3 entries
                }
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Error parsing resume: {str(e)}'
            }), 400
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Upload error: {str(e)}'
        }), 400

@app.route('/api/get-profile', methods=['GET'])
def get_profile():
    """Get current candidate profile"""
    if 'session_id' not in session or session['session_id'] not in candidate_profiles:
        return jsonify({'status': 'error', 'message': 'No resume uploaded'}), 404
    
    profile = candidate_profiles[session['session_id']]
    # Return profile without raw_text
    return jsonify({
        'status': 'success',
        'profile': {k: v for k, v in profile.items() if k != 'raw_text'}
    })

def build_resume_context(profile):
    education = '\n'.join(profile.get('education', [])) or 'Not provided'
    skills = ', '.join(profile.get('skills', [])) or 'Not provided'
    projects = '\n'.join(profile.get('projects', [])) or 'Not provided'
    experience_lines = []
    for exp in profile.get('experience', []):
        title = exp.get('title', '').strip()
        description = exp.get('description', '').strip()
        if title and description:
            experience_lines.append(f"{title}: {description}")
        elif title:
            experience_lines.append(title)
    experience = '\n'.join(experience_lines) or 'Not provided'
    certifications = '\n'.join(profile.get('certifications', [])) or 'Not provided'

    return f"""Candidate Profile:
Name: {profile.get('name', 'Candidate')}
Email: {profile.get('email', 'Not provided')}
Phone: {profile.get('phone', 'Not provided')}

Education:
{education}

Skills:
{skills}

Experience:
{experience}

Projects:
{projects}

Certifications:
{certifications}
"""

def generate_chat_response(profile, user_text):
    prompt = build_resume_context(profile) + "\n" + (
        "Answer the user's question in a concise and natural text format as the candidate. "
        "Use only the information from the resume and do not invent new experience.\n"
        f"Interview question: {user_text}\n"
    )

    if OPENAI_AVAILABLE and OPENAI_API_KEY:
        try:
            response = openai.ChatCompletion.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are the candidate answering interview questions using only the resume details provided."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300,
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return fallback_response(profile, user_text)

    return fallback_response(profile, user_text)

def fallback_response(profile, user_text):
    lower_text = user_text.lower()
    skills = profile.get('skills', [])
    skills_list = ', '.join(skills[:8]) if skills else 'my key skills'
    education = profile.get('education', [])
    education_line = education[0] if education else 'my education background'
    projects = profile.get('projects', [])
    projects_line = ', '.join(projects[:3]) if projects else 'my projects'
    experience_lines = []
    for exp in profile.get('experience', []):
        title = exp.get('title', '').strip()
        description = exp.get('description', '').strip()
        if title and description:
            experience_lines.append(f"{title} ({description})")
        elif title:
            experience_lines.append(title)
    experience_text = '; '.join(experience_lines) if experience_lines else 'relevant experience'
    certifications = profile.get('certifications', [])
    certifications_text = ', '.join(certifications[:3]) if certifications else 'relevant certifications'

    if 'tell me about yourself' in lower_text or 'about yourself' in lower_text or 'introduce yourself' in lower_text:
        return (
            f"I am {profile.get('name', 'a candidate')} with experience in {skills_list}. "
            f"I have worked on projects such as {projects_line} and studied {education_line}."
        )
    if 'skill' in lower_text or 'strength' in lower_text or 'technolog' in lower_text or 'expertise' in lower_text:
        return f"My key skills include {skills_list}. I can use these strengths to contribute to the role effectively."
    if 'project' in lower_text or 'worked on' in lower_text or 'developed' in lower_text:
        return f"I have delivered projects including {projects_line}, where I contributed to the design and execution of the work."
    if 'experience' in lower_text or 'role' in lower_text or 'position' in lower_text or 'worked as' in lower_text:
        return f"I have experience in {experience_text}, supported by skills in {skills_list}."
    if 'education' in lower_text or 'degree' in lower_text or 'graduat' in lower_text or 'school' in lower_text or 'college' in lower_text:
        return f"I studied {education_line}, which prepared me with the foundation for the work I do." 
    if 'certif' in lower_text or 'license' in lower_text:
        return f"I hold certifications such as {certifications_text}, which support my expertise in this area."
    if 'why should we hire' in lower_text or 'why hire' in lower_text or 'fit' in lower_text:
        return (
            f"You should hire me because I bring strong skills in {skills_list}, experience from projects like {projects_line}, "
            f"and a solid educational background in {education_line}."
        )

    return (
        f"Based on my resume, I have skills in {skills_list} and experience with projects such as {projects_line}. "
        f"For your question, '{user_text}', I would answer using that experience and background."
    )

@app.route('/api/chat', methods=['POST'])
def chat():
    if 'session_id' not in session or session['session_id'] not in candidate_profiles:
        return jsonify({'status': 'error', 'message': 'Resume must be uploaded first'}), 400

    data = request.json or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'status': 'error', 'message': 'No text provided'}), 400

    profile = candidate_profiles[session['session_id']]

    try:
        answer = generate_chat_response(profile, text)
        return jsonify({'status': 'success', 'answer': answer})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/start-session', methods=['POST'])
def start_session():
    """Initialize a new interview session"""
    if 'session_id' not in session or session['session_id'] not in candidate_profiles:
        return jsonify({'status': 'error', 'message': 'Resume must be uploaded first'}), 400
    
    session_id = session['session_id']
    transcripts[session_id] = {
        'segments': [],
        'session_start': datetime.now().isoformat()
    }
    return jsonify({'status': 'success', 'message': 'Session started'})

@app.route('/api/add-transcript', methods=['POST'])
def add_transcript():
    """Add transcript text from client"""
    if 'session_id' not in session or session['session_id'] not in transcripts:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    
    data = request.json
    session_id = session['session_id']
    
    if not data or 'text' not in data:
        return jsonify({'status': 'error', 'message': 'No text provided'}), 400
    
    segment = {
        'speaker': data.get('speaker', 'Candidate'),
        'text': data.get('text', ''),
        'timestamp': data.get('timestamp', datetime.now().isoformat())
    }
    
    transcripts[session_id]['segments'].append(segment)
    return jsonify({
        'status': 'success',
        'segment_count': len(transcripts[session_id]['segments'])
    })

@app.route('/api/get-transcript', methods=['GET'])
def get_transcript():
    """Retrieve current transcript"""
    if 'session_id' not in session or session['session_id'] not in transcripts:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    
    session_id = session['session_id']
    return jsonify(transcripts[session_id])

@app.route('/api/clear-transcript', methods=['POST'])
def clear_transcript():
    """Clear the current transcript"""
    if 'session_id' not in session or session['session_id'] not in transcripts:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    
    session_id = session['session_id']
    transcripts[session_id] = {
        'segments': [],
        'session_start': None
    }
    return jsonify({'status': 'success', 'message': 'Transcript cleared'})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
