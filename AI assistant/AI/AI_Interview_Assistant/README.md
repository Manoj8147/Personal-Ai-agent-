# AI Interview Assistant

A comprehensive interview practice tool powered by AI that helps candidates prepare for technical and behavioral interviews.

## 🚀 Features (7-Phase Roadmap)

### Phase 1.5: Resume Upload ✅ (FIRST SCREEN - NEW!)
- Upload resume in PDF, DOCX, or TXT format
- Automatic extraction of:
  - Name, Email, Phone
  - Education & Certifications
  - Skills (parsed & structured)
  - Experience & Projects
- Resume data stored in session
- Personalize interview using resume context

### Phase 1: Transcript Display ✅
- Capture microphone audio
- Display live transcript
- Manual text entry for testing

### Phase 2: Question Detection (Coming Soon)
- Automatically detect interview questions
- Identify question type (What, Why, How, Explain, etc.)
- Question highlighting

### Phase 3: Answer Generation (Coming Soon)
- AI-powered answer suggestions
- Personalized responses based on resume
- Multiple answer variations

### Phase 5: Dashboard & Analytics (Coming Soon)
- Interview statistics
- Topic breakdown
- Confidence scoring
- Visual charts (Chart.js)

### Phase 6: UI Polish (Coming Soon)
- Modern, responsive design
- Animations and transitions
- Professional styling

### Phase 7: Deployment (Coming Soon)
- Backend: Render/Railway
- Frontend: Vercel/Netlify
- PostgreSQL database

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (React later)
- **Backend:** Python + Flask
- **Speech-to-Text:** OpenAI Whisper
- **LLM:** OpenAI API / Ollama (Llama 3 or Mistral)
- **Database:** SQLite (Dev) / PostgreSQL (Prod)
- **Deployment:** Render, Railway, Vercel, Netlify

---

## 📋 Prerequisites

- Python 3.8+
- Node.js (for deployment)
- OpenAI API key (optional for Phase 3+)
- Ollama (optional alternative to OpenAI)

---

## 🎯 How It Works

### Application Flow
```
1. User opens application (http://127.0.0.1:5000)
   ↓
2. Resume Upload Page (Phase 1.5)
   - Upload PDF, DOCX, or TXT resume
   - AI extracts: Name, Skills, Education, Experience, Projects
   - Profile stored in session
   ↓
3. Interview Page (Phase 1)
   - Candidate name displayed
   - Interviewer asks questions
   - Transcript captured with speaker identification
   - Word count and segment tracking
   ↓
4. Detected Questions (Phase 2 - Coming Soon)
   - AI identifies questions vs statements
   - Highlights questions in transcript
   ↓
5. AI-Generated Answers (Phase 3 - Coming Soon)
   - Resume context used for personalization
   - AI generates contextual answers
   ↓
6. Interview Summary (Phase 5 - Coming Soon)
   - Analytics dashboard
   - Performance metrics
   - Export report
```

---

## ⚙️ Local Setup

### 1. Clone Repository
```bash
cd AI_Interview_Assistant
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/Scripts/activate  # Windows
# source venv/bin/activate    # macOS/Linux
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create .env File
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 5. Run Flask App
```bash
python app.py
```

### 6. Open in Browser
```
http://localhost:5000
```

---

## 📁 Project Structure

```
AI_Interview_Assistant/
│
├── app.py                    # Flask main application
├── config.py                 # Configuration management
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
│
├── models/                   # ML models & data extraction
│   ├── resume_reader.py     # Resume parsing (PDF/DOCX/TXT) ✅
│   ├── whisper.py           # Speech-to-text (Phase 2)
│   ├── llm.py               # LLM integration (Phase 3)
│   ├── question_detector.py # Question detection (Phase 2)
│   └── resume_reader.py     # Resume parsing (Phase 1.5)
│
├── database/                 # Phase 5+: Database
│   └── interview.db         # SQLite database
│
├── templates/                # Frontend
│   ├── resume_upload.html   # Resume upload page (NEW - First Screen!)
│   ├── interview.html       # Main interview page
│   └── dashboard.html       # Phase 5: Analytics dashboard
│
├── static/                   # Frontend assets
│   ├── css/
│   │   └── style.css        # Main styling
│   ├── js/
│   │   ├── script.js        # Interview logic
│   │   └── resume_upload.js # Resume upload logic (NEW)
│   └── images/              # Phase 6: Progress icons, logos
│
├── uploads/                  # Uploaded resume files
│
├── sample_resume.txt         # Demo resume for testing
└── README.md                 # This file

```

---

## 🎯 Development Roadmap

| Day | Phase | Focus | Status |
|-----|-------|-------|--------|
| 0.5 | Resume Upload | Resume parsing & First screen | ✅ Complete |
| 1 | Transcript Display | Speech capture & display | ✅ Complete |
| 2 | Question Detection | Auto-detect Q's | ⏳ Planned |
| 3 | Answer Generation | AI suggestions using resume | ⏳ Planned |
| 5 | Analytics Dashboard | Stats & charts | ⏳ Planned |
| 6 | UI Polish | Responsive design | ⏳ Planned |
| 7 | Deployment | Production ready | ⏳ Planned |

---

## 🚀 Quick Start Examples

### Start the App
```bash
python app.py
```

### Phase 1 Testing
1. Open http://localhost:5000
2. Enter text in the "Test Input" section
3. Select speaker (Interviewer/Candidate)
4. Click "Add to Transcript"
5. Watch transcript display in real-time

### Phase 2+ (Coming Soon)
```python
# Question detection example (pseudo-code)
from models.question_detector import detect_questions

transcript = "Tell me about yourself. What is Machine Learning?"
questions = detect_questions(transcript)
# Output: ["Tell me about yourself.", "What is Machine Learning?"]
```

---

## 🔌 API Endpoints

### Resume Management (Phase 1.5)
```
POST /resume-upload
Serves the resume upload page

POST /api/upload-resume
Upload and parse resume file
Body: FormData with 'resume' file
Response: { 
  "status": "success",
  "profile": {
    "name": "Manoj Sharma",
    "skills": ["Python", "SQL", ...],
    "education": ["B.Tech IT"],
    "projects_count": 3
  }
}

GET /api/get-profile
Retrieve candidate profile (requires session)
Response: {
  "status": "success",
  "profile": {
    "name": "...",
    "email": "...",
    "skills": [...],
    "education": [...],
    "experience": [...],
    "projects": [...],
    "certifications": [...]
  }
}
```

### Interview Management (Phase 1)
```
GET /interview
Main interview interface (requires resume upload)

POST /api/start-session
Initialize a new interview session
Response: { "status": "success" }

POST /api/add-transcript
Add text to transcript
Body: {
  "speaker": "Candidate",
  "text": "I have 5 years of experience",
  "timestamp": "2024-07-05T10:30:00"
}
Response: { "status": "success", "segment_count": 1 }

GET /api/get-transcript
Retrieve current interview transcript
Response: {
  "segments": [...],
  "session_start": "2024-07-05T10:00:00"
}

POST /api/clear-transcript
Clear all transcript segments
Response: { "status": "success" }
```

### Health Check
```
GET /health
Check server status
Response: { "status": "healthy" }
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=sk-...your-key...
MODEL_TYPE=gpt-3.5-turbo
OLLAMA_BASE_URL=http://localhost:11434
MAX_UPLOAD_SIZE=16777216
```

---

## 📝 Notes

### Phase 1 (Current)
- ✅ Basic Flask backend set up
- ✅ HTML/CSS frontend template
- ✅ JavaScript for dynamic transcript display
- ✅ Manual text input for testing
- ⏳ Real microphone integration (Whisper API)

### Planned Features
- Real-time speech recognition
- AI-powered answer suggestions
- Resume-based personalization
- Interview analytics dashboard
- Export reports as PDF
- Multi-language support

---

## 🐛 Troubleshooting

### Port 5000 already in use
```bash
# Change port in app.py
if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Use 5001 instead
```

### Module not found error
```bash
# Re-install requirements
pip install -r requirements.txt --force-reinstall
```

### No module named 'flask'
```bash
# Ensure venv is activated
source venv/Scripts/activate  # Windows
pip install flask
```

---

## 📚 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [OpenAI API](https://platform.openai.com/docs)
- [Ollama](https://ollama.ai/)

---

## 📄 License

MIT License - Feel free to use this project for learning and commercial purposes.

---

## 👨‍💻 Author

Created as a comprehensive AI Interview Assistant project.

---

**Happy coding! 🚀**
