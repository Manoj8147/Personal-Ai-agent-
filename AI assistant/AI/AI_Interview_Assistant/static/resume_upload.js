// Resume Upload JavaScript
const resumeFile = document.getElementById('resumeFile');
const fileInputLabel = document.getElementById('fileInputLabel');
const fileSelected = document.getElementById('fileSelected');
const fileName = document.getElementById('fileName');
const uploadBtn = document.getElementById('uploadBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const parseResult = document.getElementById('parseResult');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

let selectedFile = null;

// Drag and drop support
fileInputLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputLabel.classList.add('dragover');
});

fileInputLabel.addEventListener('dragleave', () => {
    fileInputLabel.classList.remove('dragover');
});

fileInputLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputLabel.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelected(files[0]);
    }
});

// File input change
resumeFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
    }
});

// Click label to open file picker
fileInputLabel.addEventListener('click', () => {
    resumeFile.click();
});

function handleFileSelected(file) {
    // Validate file
    const validExtensions = ['pdf', 'docx', 'txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        showError('File size exceeds 16MB limit.');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = file.name;
    fileSelected.classList.add('show');
    uploadBtn.style.display = 'block';
    uploadBtn.textContent = '📤 Upload Resume';
    uploadBtn.disabled = false;
    hideError();
}

function removeFile() {
    selectedFile = null;
    resumeFile.value = '';
    fileSelected.classList.remove('show');
    uploadBtn.style.display = 'none';
}

uploadBtn.addEventListener('click', uploadResume);

async function uploadResume() {
    if (!selectedFile) {
        showError('Please select a file first.');
        return;
    }
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = '⏳ Uploading...';
    loadingSpinner.classList.add('show');
    
    try {
        const response = await fetch('/api/upload-resume', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadingSpinner.classList.remove('show');
            showSuccess('Resume uploaded and parsed successfully!');
            displayParseResult(data.profile);
            setTimeout(() => {
                uploadBtn.style.display = 'none';
                fileInputLabel.style.display = 'none';
                fileSelected.style.display = 'none';
            }, 500);
        } else {
            loadingSpinner.classList.remove('show');
            showError(data.message || 'Error uploading resume');
            uploadBtn.disabled = false;
            uploadBtn.textContent = '📤 Upload Resume';
        }
    } catch (error) {
        loadingSpinner.classList.remove('show');
        showError('Error uploading resume: ' + error.message);
        uploadBtn.disabled = false;
        uploadBtn.textContent = '📤 Upload Resume';
    }
}

function displayParseResult(profile) {
    // Display name
    if (profile.name && profile.name !== 'Candidate') {
        document.getElementById('nameSection').style.display = 'block';
        document.getElementById('nameValue').textContent = profile.name;
    }
    
    // Display skills
    if (profile.skills && profile.skills.length > 0) {
        document.getElementById('skillsSection').style.display = 'block';
        const skillsList = document.getElementById('skillsList');
        skillsList.innerHTML = '';
        profile.skills.slice(0, 8).forEach(skill => {
            const li = document.createElement('li');
            li.textContent = skill;
            skillsList.appendChild(li);
        });
    }
    
    // Display education
    if (profile.education && profile.education.length > 0) {
        document.getElementById('educationSection').style.display = 'block';
        const educationList = document.getElementById('educationList');
        educationList.innerHTML = '';
        profile.education.forEach(edu => {
            const li = document.createElement('li');
            li.textContent = edu;
            educationList.appendChild(li);
        });
    }
    
    // Display projects
    if (profile.projects && profile.projects.length > 0) {
        document.getElementById('projectsSection').style.display = 'block';
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '';
        profile.projects.slice(0, 5).forEach(project => {
            const li = document.createElement('li');
            li.textContent = project;
            projectsList.appendChild(li);
        });
    }
    
    parseResult.classList.add('show');
}

function goToInterview() {
    window.location.href = '/interview';
}

function showError(message) {
    errorMessage.textContent = '❌ ' + message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showSuccess(message) {
    successMessage.textContent = '✅ ' + message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

// Check if already uploaded and redirect
window.addEventListener('load', () => {
    fetch('/api/get-profile')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                // Already have a profile, this shouldn't happen on resume upload page
                // but if it does, could auto-redirect
            }
        })
        .catch(() => {
            // No profile, that's expected on this page
        });
});
