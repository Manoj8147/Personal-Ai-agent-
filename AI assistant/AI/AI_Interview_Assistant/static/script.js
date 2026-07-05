// API Constants
const API_BASE = '/api';

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBox = document.getElementById('chatBox');
const transcriptBox = document.getElementById('transcriptBox');
const segmentCount = document.getElementById('segmentCount');
const wordCount = document.getElementById('wordCount');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');

// State
let isRecording = false;
let transcript = { segments: [] };
let recognition = null;
let speechSupported = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    speechSupported = initSpeechRecognition();
    startSession();
    setupEventListeners();
    updateTranscriptDisplay();
});

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Speech recognition is not supported in this browser.');
        return false;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        updateStatus('recording', 'Listening... speak now');
    };

    recognition.onresult = event => {
        const transcriptText = Array.from(event.results)
            .slice(event.resultIndex)
            .map(result => result[0].transcript)
            .join(' ')
            .trim();

        if (transcriptText) {
            addUserMessage(transcriptText);
            saveTranscriptSegment('Candidate', transcriptText);
            sendChatRequest(transcriptText);
        }
    };

    recognition.onend = () => {
        if (isRecording) {
            recognition.start();
        } else {
            updateStatus('idle', 'Voice chat stopped');
        }
    };

    recognition.onerror = event => {
        console.error('Speech recognition error:', event.error);
        updateStatus('idle', `Voice error: ${event.error}`);
        isRecording = false;
        updateControls();
    };

    return true;
}

async function saveTranscriptSegment(speaker, text) {
    try {
        await fetch(`${API_BASE}/add-transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speaker, text })
        });
        await getAndUpdateTranscript();
    } catch (error) {
        console.error('Failed to save transcript segment:', error);
    }
}

function setupEventListeners() {
    startBtn.addEventListener('click', () => startRecording());
    stopBtn.addEventListener('click', () => stopRecording());
    clearBtn.addEventListener('click', () => clearTranscript());
    chatForm.addEventListener('submit', handleChatSubmit);
}

function handleChatSubmit(event) {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    addUserMessage(text);
    sendChatRequest(text);
}

async function startSession() {
    try {
        await fetch(`${API_BASE}/start-session`, { method: 'POST' });
        console.log('Session started');
    } catch (error) {
        console.error('Failed to start session:', error);
    }
}

function startRecording() {
    if (!speechSupported) {
        alert('Voice recording is not supported in this browser. Please use the text chat instead.');
        return;
    }

    isRecording = true;
    updateControls();
    updateStatus('recording', 'Starting voice chat...');
    console.log('Voice recording started');

    try {
        recognition.start();
    } catch (error) {
        console.error('Failed to start speech recognition:', error);
        updateStatus('idle', 'Unable to start voice chat');
        isRecording = false;
        updateControls();
    }
}

function stopRecording() {
    isRecording = false;
    updateControls();
    updateStatus('idle', 'Voice chat stopped');
    console.log('Voice recording stopped');

    if (recognition) {
        recognition.stop();
    }
}

function addUserMessage(text) {
    const placeholder = chatBox.querySelector('.chat-placeholder');
    if (placeholder) placeholder.remove();

    const message = document.createElement('div');
    message.className = 'chat-message user';
    message.innerHTML = `
        <div class="chat-message-label">You</div>
        <div class="chat-message-bubble">${escapeHtml(text)}</div>
    `;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addBotMessage(text) {
    const placeholder = chatBox.querySelector('.chat-placeholder');
    if (placeholder) placeholder.remove();

    const message = document.createElement('div');
    message.className = 'chat-message bot';
    message.innerHTML = `
        <div class="chat-message-bubble">${escapeHtml(text)}</div>
    `;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendChatRequest(text) {
    addBotMessage('Typing...');
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        const typingNode = chatBox.querySelector('.chat-message.bot:last-child .chat-message-bubble');
        if (response.ok && data.status === 'success') {
            if (typingNode) typingNode.textContent = data.answer;
        } else {
            if (typingNode) typingNode.textContent = data.message || 'Unable to get a response.';
        }
    } catch (error) {
        const typingNode = chatBox.querySelector('.chat-message.bot:last-child .chat-message-bubble');
        if (typingNode) typingNode.textContent = 'Error connecting to AI.';
        console.error('Chat request failed:', error);
    }
}

async function getAndUpdateTranscript() {
    try {
        const response = await fetch(`${API_BASE}/get-transcript`);
        transcript = await response.json();
        updateTranscriptDisplay();
    } catch (error) {
        console.error('Error fetching transcript:', error);
    }
}

function updateTranscriptDisplay() {
    if (!transcript.segments || transcript.segments.length === 0) {
        transcriptBox.innerHTML = '<div class="placeholder">Start recording to see transcript appear here...</div>';
        segmentCount.textContent = '0';
        wordCount.textContent = '0';
        return;
    }

    transcriptBox.innerHTML = transcript.segments
        .map((segment, index) => {
            const speakerClass = segment.speaker.toLowerCase();
            const time = segment.timestamp ? new Date(segment.timestamp).toLocaleTimeString() : '';
            return `
                <div class="transcript-segment ${speakerClass}">
                    <div class="segment-speaker">${segment.speaker}</div>
                    <div class="segment-text">${escapeHtml(segment.text)}</div>
                    ${time ? `<div class="segment-time">${time}</div>` : ''}
                </div>
            `;
        })
        .join('');

    segmentCount.textContent = transcript.segments.length;
    const totalWords = transcript.segments
        .reduce((sum, seg) => sum + (seg.text.split(/\s+/).length || 0), 0);
    wordCount.textContent = totalWords;
}

async function clearTranscript() {
    if (confirm('Are you sure you want to clear the transcript?')) {
        try {
            await fetch(`${API_BASE}/clear-transcript`, { method: 'POST' });
            transcript = { segments: [] };
            updateTranscriptDisplay();
            updateStatus('idle', 'Transcript cleared');
        } catch (error) {
            console.error('Error clearing transcript:', error);
            alert('Failed to clear transcript');
        }
    }
}

function updateControls() {
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
}

function updateStatus(status, message) {
    statusIcon.className = 'status-icon';
    if (status === 'recording') {
        statusIcon.classList.add('recording');
    } else {
        statusIcon.classList.add('inactive');
    }
    statusText.textContent = message;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh transcript every 2 seconds
setInterval(getAndUpdateTranscript, 2000);
