import './style.css';
import './modal.css';
import { io } from 'socket.io-client';
import { loadConfig, saveConfig, applyTheme } from './config.js';

// Config
const SERVER_URL = window.location.origin;
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const callScreen = document.getElementById('call-screen');
const videoGrid = document.querySelector('.video-grid');
const localVideo = document.getElementById('local-video');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const roomPassword = document.getElementById('room-password');
const roomLimit = document.getElementById('room-limit');
const joinBtn = document.getElementById('join-btn');
const chatPanel = document.getElementById('chat-panel');
const chatToggleBtn = document.getElementById('chat-toggle-btn');
const closeChatBtn = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const chatImageInput = document.getElementById('chat-image-input');
const attachImageBtn = document.getElementById('attach-image-btn');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const unreadBadge = document.getElementById('unread-badge');

// Controls
const audioBtn = document.getElementById('audio-btn');
const videoBtn = document.getElementById('video-btn');
const screenBtn = document.getElementById('screen-btn');
const recordBtn = document.getElementById('record-btn');
const leaveBtn = document.getElementById('leave-btn');

// State
let socket;
let localStream;
const peers = {}; // userId -> RTCPeerConnection
const remoteStreams = {}; // userId -> MediaStream
let roomId;
let userId;
let username;
const participants = {}; // userId -> { username }
let isScreenSharing = false;
let mediaRecorder;
let recordedChunks = [];
let isChatOpen = false;
let unreadCount = 0;

// Admin
let isAdmin = false;
const adminMuteAllBtn = document.getElementById('admin-mute-all');

// Transcript & Analysis
let recognition;
let transcript = "";
const downloadTranscriptBtn = document.getElementById('download-transcript');
const analysisPanel = document.getElementById('analysis-panel');
const analysisBtn = document.getElementById('analysis-btn');
const wpmDisplay = document.getElementById('wpm-display');
const sentimentDisplay = document.getElementById('sentiment-display');
const anxietyDisplay = document.getElementById('anxiety-display');

// Settings
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveConfigBtn = document.getElementById('save-config-btn');
const confTitle = document.getElementById('conf-title');
const confLogo = document.getElementById('conf-logo');
const confPrimary = document.getElementById('conf-primary');
const confSecondary = document.getElementById('conf-secondary');
const confBg = document.getElementById('conf-bg');
const confFont = document.getElementById('conf-font');

let appConfig = loadConfig();

// Initialize
function init() {
  userId = 'user-' + Math.random().toString(36).substr(2, 9);
  usernameInput.value = localStorage.getItem('ninja_username') || '';

  // Apply initial config
  applyTheme(appConfig);

  joinBtn.addEventListener('click', joinRoom);

  // Controls Handlers
  audioBtn.addEventListener('click', toggleAudio);
  videoBtn.addEventListener('click', toggleVideo);
  screenBtn.addEventListener('click', toggleScreenShare);
  recordBtn.addEventListener('click', toggleRecording);
  leaveBtn.addEventListener('click', leaveCall);

  // Chat Handlers
  chatToggleBtn.addEventListener('click', toggleChat);
  closeChatBtn.addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', sendMessage);
  attachImageBtn.addEventListener('click', () => chatImageInput.click());
  chatImageInput.addEventListener('change', () => {
    const [file] = chatImageInput.files;
    if (file) sendImageFile(file);
    chatImageInput.value = '';
  });
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  chatInput.addEventListener('paste', handleChatPaste);
  document.addEventListener('paste', handleChatPaste);

  // Admin Handlers
  adminMuteAllBtn.addEventListener('click', () => {
    if (confirm('Mute everyone else?')) {
      socket.emit('admin-mute-all');
    }
  });

  // Transcript Handlers
  downloadTranscriptBtn.addEventListener('click', downloadTranscript);
  initTranscription();

  // Analysis & Settings Handlers
  analysisBtn.addEventListener('click', toggleAnalysis);
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveConfigBtn.addEventListener('click', saveSettings);

  // Check URL for Room ID
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get('room');
  if (urlRoom) {
    roomInput.value = urlRoom;
    joinRoom();
  }
}

async function joinRoom() {
  const roomBase = roomInput.value.trim();
  username = usernameInput.value.trim() || `Guest ${userId.slice(-4)}`;

  if (!username) return alert('Please enter a username');
  if (!roomBase) return alert('Please enter a room name');

  localStorage.setItem('ninja_username', username);

  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get('room');

  // Use the typed/shared room name directly. Previously a timestamp was appended
  // when typing a room manually, which put the phone and computer into different
  // rooms even when the visible room name matched.
  roomId = urlRoom || roomBase;

  participants[userId] = { username };
  updateLocalParticipant(username);

  // UI Transition happens before camera/mic permissions so the user gets a room
  // tile and can use chat even if media access is blocked or still pending.
  loginScreen.classList.add('hidden');
  callScreen.classList.remove('hidden');
  addSystemMessage(`Joined room: ${roomId} as ${username}`);

  // Connect Socket
  socket = io(SERVER_URL);
  setupSocketListeners();

  socket.emit('join-room', {
    roomId,
    userId,
    username,
    password: roomPassword.value.trim(),
    limit: roomLimit.value
  });

  const newUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
  window.history.pushState({ path: newUrl }, '', newUrl);

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Media API not supported');
    }

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    updateLocalMediaState(true);
    attachLocalMediaToPeers();
  } catch (err) {
    console.error('Error accessing media:', err);
    updateLocalMediaState(false);
    addSystemMessage('Camera/mic unavailable. You can still see the room and use chat.');
  }
}

function setupSocketListeners() {
  socket.on('existing-users', (users) => {
    users.forEach(({ userId: existingUserId, username: existingUsername }) => {
      participants[existingUserId] = { username: existingUsername };
      addRemoteParticipant(existingUserId);
    });
  });

  socket.on('user-connected', ({ userId: newUserId, username: newUsername }) => {
    console.log('User connected:', newUserId);
    participants[newUserId] = { username: newUsername };
    addSystemMessage(`${getDisplayName(newUserId)} joined`);
    addRemoteParticipant(newUserId);
    connectToNewUser(newUserId, true); // true = initiator
  });

  socket.on('user-disconnected', (payload) => {
    const disconnectedUserId = typeof payload === 'string' ? payload : payload.userId;
    console.log('User disconnected:', disconnectedUserId);
    addSystemMessage(`${getDisplayName(disconnectedUserId)} left`);
    if (peers[disconnectedUserId]) {
      peers[disconnectedUserId].close();
      delete peers[disconnectedUserId];
    }
    removeRemoteVideo(disconnectedUserId);
    delete participants[disconnectedUserId];
  });

  socket.on('admin-status', (data) => {
    isAdmin = data.isAdmin;
    if (isAdmin) {
      addSystemMessage('You are the Admin.');
      adminMuteAllBtn.classList.remove('hidden');
    }
  });

  socket.on('admin-mute-command', () => {
    if (!isAdmin) {
      addSystemMessage('Admin muted everyone.');
      muteAudio();
    }
  });

  socket.on('admin-mute-command-user', (targetId) => {
    if (targetId === userId) {
      addSystemMessage('Admin muted you.');
      muteAudio();
    }
  });

  socket.on('admin-kick-command', (targetId) => {
    if (targetId === userId) {
      alert('You have been kicked by the admin.');
      leaveCall();
    }
  });

  socket.on('offer', async (payload) => {
    // payload: { target, caller, sdp, roomId }
    if (payload.target && payload.target !== userId) return;

    console.log('Received offer from:', payload.caller);
    if (peers[payload.caller]) {
      await answerExistingPeerOffer(payload.caller, payload.sdp);
    } else {
      await connectToNewUser(payload.caller, false, payload.sdp);
    }
  });

  socket.on('answer', async (payload) => {
    if (payload.target && payload.target !== userId) return;
    console.log('Received answer from:', payload.caller);

    const peer = peers[payload.caller];
    if (peer) {
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  });

  socket.on('ice-candidate', async (payload) => {
    if (payload.target && payload.target !== userId) return; // Should be targeted usually

    const senderId = payload.caller || payload.sender;

    if (senderId && peers[senderId]) {
      try {
        await peers[senderId].addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    }
  });

  socket.on('chat-message', (data) => {
    addMessage(data.message, 'theirs', data.username || getDisplayName(data.userId || data.sender));
    if (!isChatOpen) {
      unreadCount++;
      unreadBadge.textContent = unreadCount;
      unreadBadge.classList.remove('hidden');
    }
  });

  socket.on('join-error', (msg) => {
    alert(msg);
    // Reset state and show login
    loginScreen.classList.remove('hidden');
    callScreen.classList.add('hidden');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    localStream = null;
    socket.disconnect();
  });
}

async function answerExistingPeerOffer(targetUserId, offerSdp) {
  const peer = peers[targetUserId];
  if (!peer || !offerSdp) return;

  await peer.setRemoteDescription(new RTCSessionDescription(offerSdp));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit('answer', {
    roomId,
    target: targetUserId,
    caller: userId,
    sdp: answer
  });
}

async function connectToNewUser(targetUserId, initiator, offerSdp = null) {
  if (peers[targetUserId]) return; // Already connected

  const peer = new RTCPeerConnection(ICE_SERVERS);
  peers[targetUserId] = peer;

  // Add local tracks when camera/mic permission is available. Users can still
  // join, see participant tiles, and chat without granting media permissions.
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peer.addTrack(track, localStream);
    });
  }

  // Handle remote tracks
  peer.ontrack = (event) => {
    console.log('Got remote track from:', targetUserId);
    addRemoteVideo(event.streams[0], targetUserId);
  };

  // ICE Candidates
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        roomId,
        target: targetUserId, // Hint for server/receiver
        caller: userId,       // Important so they know who sent it
        candidate: event.candidate
      });
    }
  };

  if (initiator) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('offer', {
      roomId,
      target: targetUserId,
      caller: userId,
      sdp: offer
    });
  } else {
    // We are answering
    if (offerSdp) {
      await peer.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('answer', {
        roomId,
        target: targetUserId,
        caller: userId,
        sdp: answer
      });
    }
  }
}

// UI Helpers for Dynamic Video
function getDisplayName(participantId) {
  return participants[participantId]?.username || `User ${participantId.substr(0, 4)}`;
}

function updateLocalParticipant(displayName) {
  const badge = document.getElementById('local-user-badge');
  if (badge) badge.textContent = `${displayName} (You)`;
  const localContainer = document.querySelector('.video-container.local');
  if (localContainer) localContainer.classList.add('media-pending');
}

function updateLocalMediaState(hasMedia) {
  const localContainer = document.querySelector('.video-container.local');
  if (!localContainer) return;
  localContainer.classList.toggle('media-pending', !hasMedia);
  if (!hasMedia) {
    localVideo.srcObject = null;
  }
}

function addRemoteParticipant(remoteUserId) {
  let videoContainer = document.getElementById(`container-${remoteUserId}`);
  if (videoContainer) return videoContainer;

  videoContainer = document.createElement('div');
  videoContainer.id = `container-${remoteUserId}`;
  videoContainer.className = 'video-container remote media-pending';

  const video = document.createElement('video');
  video.id = `video-${remoteUserId}`;
  video.autoplay = true;
  video.playsInline = true;

  const placeholder = document.createElement('div');
  placeholder.className = 'video-placeholder';
  placeholder.innerHTML = `<i class="fa-solid fa-user-ninja"></i><span>Waiting for media</span>`;

  const overlay = document.createElement('div');
  overlay.className = 'video-overlay';

  let adminControls = '';
  if (isAdmin) {
    adminControls = `
          <div class="admin-controls" style="position:absolute; top:10px; right:10px; display:flex; gap:5px;">
             <button class="icon-btn" onclick="window.emitMute('${remoteUserId}')" title="Mute User" style="background:rgba(0,0,0,0.5); color:white; padding:5px; border-radius:50%;"><i class="fa-solid fa-microphone-slash"></i></button>
             <button class="icon-btn" onclick="window.emitKick('${remoteUserId}')" title="Kick User" style="background:rgba(255,0,0,0.5); color:white; padding:5px; border-radius:50%;"><i class="fa-solid fa-user-xmark"></i></button>
          </div>
        `;
  }

  overlay.innerHTML = `<span class="user-badge">${getDisplayName(remoteUserId)}</span>${adminControls}`;

  videoContainer.appendChild(video);
  videoContainer.appendChild(placeholder);
  videoContainer.appendChild(overlay);
  videoGrid.appendChild(videoContainer);
  return videoContainer;
}

function addRemoteVideo(stream, remoteUserId) {
  const videoContainer = addRemoteParticipant(remoteUserId);
  const video = videoContainer.querySelector('video');
  video.srcObject = stream;
  videoContainer.classList.remove('media-pending');
  remoteStreams[remoteUserId] = stream;
}

function attachLocalMediaToPeers() {
  if (!localStream) return;

  Object.entries(peers).forEach(async ([peerId, peer]) => {
    localStream.getTracks().forEach((track) => {
      const hasSender = peer.getSenders().some((sender) => sender.track?.kind === track.kind);
      if (!hasSender) peer.addTrack(track, localStream);
    });

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('offer', {
        roomId,
        target: peerId,
        caller: userId,
        sdp: offer
      });
    } catch (err) {
      console.error('Error renegotiating media with peer:', err);
    }
  });
}

function removeRemoteVideo(remoteUserId) {
  const el = document.getElementById(`container-${remoteUserId}`);
  if (el) el.remove();
  delete remoteStreams[remoteUserId];
}

// Controls
function toggleAudio() {
  if (!localStream) return addSystemMessage('Camera/mic permission is not active yet.');
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    if (audioTrack.enabled) {
      audioBtn.classList.remove('off');
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    } else {
      audioBtn.classList.add('off');
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    }
  }
}

function toggleVideo() {
  if (!localStream) return addSystemMessage('Camera/mic permission is not active yet.');
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    if (videoTrack.enabled) {
      videoBtn.classList.remove('off');
      videoBtn.innerHTML = '<i class="fa-solid fa-video"></i>';
    } else {
      videoBtn.classList.add('off');
      videoBtn.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
    }
  }
}

async function toggleScreenShare() {
  if (!localStream) return addSystemMessage('Camera/mic permission is required before screen sharing.');
  if (isScreenSharing) {
    // Stop
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = camStream.getVideoTracks()[0];

    localVideo.srcObject = camStream;
    localStream.removeTrack(localStream.getVideoTracks()[0]);
    localStream.addTrack(videoTrack);

    // Update all peers
    for (const pid in peers) {
      const sender = peers[pid].getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    }

    screenBtn.classList.remove('active');
    isScreenSharing = false;
  } else {
    // Start
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      localVideo.srcObject = screenStream;

      screenTrack.onended = () => {
        if (isScreenSharing) toggleScreenShare();
      };

      // Update all peers
      for (const pid in peers) {
        const sender = peers[pid].getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      }

      screenBtn.classList.add('active');
      isScreenSharing = true;

    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  }
}

function toggleRecording() {
  const remoteKeys = Object.keys(remoteStreams);
  if (remoteKeys.length === 0) return alert('No one to record.');

  const targetStream = remoteStreams[remoteKeys[0]];

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordBtn.classList.remove('recording-active');
  } else {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(targetStream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      addSystemMessage('Recording saved.');
    };

    mediaRecorder.start();
    recordBtn.classList.add('recording-active');
    addSystemMessage('Recording started (Single Stream)...');
  }
}

function leaveCall() {
  if (socket) socket.disconnect();
  // Close all peers
  for (const pid in peers) {
    peers[pid].close();
  }
  location.reload();
}

// Chat
function toggleChat() {
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    chatPanel.classList.remove('hidden');
    unreadCount = 0;
    unreadBadge.classList.add('hidden');
  } else {
    chatPanel.classList.add('hidden');
  }
}

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  sendChatPayload({ type: 'text', text: msg });
  analyzeSpeech(msg); // Self analysis
  chatInput.value = '';
}

function sendChatPayload(message) {
  if (!socket) return;

  const payload = {
    roomId,
    userId,
    username,
    message
  };

  socket.emit('chat-message', payload);
  addMessage(message, 'mine', username);
}

function handleChatPaste(e) {
  if (!socket || !e.clipboardData?.items) return;

  const imageItem = [...e.clipboardData.items].find((item) => item.type.startsWith('image/'));
  if (!imageItem) return;

  e.preventDefault();
  const file = imageItem.getAsFile();
  if (file) sendImageFile(file);
}

function sendImageFile(file) {
  if (!file.type.startsWith('image/')) return alert('Please select an image file.');
  if (file.size > 4 * 1024 * 1024) return alert('Image is too large. Please send an image up to 4 MB.');

  const reader = new FileReader();
  reader.onload = () => {
    sendChatPayload({
      type: 'image',
      name: file.name || 'pasted-image.png',
      image: reader.result
    });
  };
  reader.onerror = () => alert('Could not read image.');
  reader.readAsDataURL(file);
}

function addMessage(message, type, author = '') {
  const normalizedMessage = typeof message === 'string' ? { type: 'text', text: message } : message;
  const div = document.createElement('div');
  div.classList.add('message', type);

  if (author) {
    const authorEl = document.createElement('div');
    authorEl.className = 'message-author';
    authorEl.textContent = author;
    div.appendChild(authorEl);
  }

  if (normalizedMessage.type === 'image') {
    const img = document.createElement('img');
    img.className = 'chat-image';
    img.src = normalizedMessage.image;
    img.alt = normalizedMessage.name || 'Chat image';
    div.appendChild(img);
  } else {
    const text = document.createElement('span');
    text.textContent = normalizedMessage.text || '';
    div.appendChild(text);
  }

  chatMessages.appendChild(div);

  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

function addSystemMessage(text) {
  console.log('System:', text);
  const div = document.createElement('div');
  div.style.alignSelf = 'center';
  div.style.color = '#94a3b8';
  div.style.fontSize = '0.8rem';
  div.textContent = text;
  chatMessages.appendChild(div);
}

// Transcription
function initTranscription() {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR'; // Default to PT-BR

    recognition.onresult = (event) => {
      let finalTrans = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTrans) {
        const timestamp = new Date().toLocaleTimeString();
        const line = `[${timestamp}] Me: ${finalTrans}\n`;
        transcript += line;

        analyzeSpeech(finalTrans); // Live Analysis

        localStorage.setItem(`transcript-${roomId}`, transcript);
        console.log('Transcript:', line);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      if (Object.keys(peers).length > 0) {
        try { recognition.start(); } catch (e) { }
      }
    };

    recognition.start();
  } else {
    console.warn('Speech Recognition API not supported.');
    downloadTranscriptBtn.style.display = 'none';
  }
}

function downloadTranscript() {
  if (!transcript) return alert('No transcript available yet.');
  const blob = new Blob([transcript], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript-${roomId}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

// Analysis Logic
let analysisHistory = {
  words: 0,
  startTime: Date.now()
};

function analyzeSpeech(text) {
  // 1. WPM
  const words = text.split(' ').length;
  analysisHistory.words += words;
  const minutes = (Date.now() - analysisHistory.startTime) / 60000;
  const wpm = minutes > 0 ? Math.round(analysisHistory.words / minutes) : 0;

  // 2. Anxiety (Heuristic: > 150 WPM normal conversation is high)
  const anxietyLevel = wpm > 160 ? 'High' : (wpm > 130 ? 'Medium' : 'Low');
  const anxietyColor = wpm > 160 ? 'var(--danger)' : (wpm > 130 ? 'var(--accent-color)' : 'var(--success)');

  // 3. Sentiment (Simple Keywords)
  const negativeWords = ['worried', 'bad', 'scared', 'angry', 'hate', 'problem', 'fail', 'medo', 'ruim', 'raiva', 'problema'];
  const positiveWords = ['good', 'happy', 'great', 'love', 'success', 'bom', 'feliz', 'amor', 'sucesso'];

  let score = 0;
  text.toLowerCase().split(' ').forEach(w => {
    if (negativeWords.includes(w)) score--;
    if (positiveWords.includes(w)) score++;
  });

  let sentiment = 'Neutral';
  if (score > 0) sentiment = 'Positive';
  if (score < 0) sentiment = 'Negative';

  // Update UI
  wpmDisplay.textContent = wpm;
  sentimentDisplay.textContent = sentiment;
  anxietyDisplay.textContent = anxietyLevel;
  anxietyDisplay.style.color = anxietyColor;
}

function toggleAnalysis() {
  if (analysisPanel.classList.contains('hidden')) {
    analysisPanel.classList.remove('hidden');
  } else {
    analysisPanel.classList.add('hidden');
  }
}

// Settings Logic
function openSettings() {
  // Populate
  confTitle.value = appConfig.branding.title;
  confLogo.value = appConfig.branding.logoUrl;
  confPrimary.value = appConfig.theme.primaryColor;
  confSecondary.value = appConfig.theme.secondaryColor;
  confBg.value = appConfig.theme.backgroundColor;
  confFont.value = appConfig.theme.fontFamily;

  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function saveSettings() {
  const newConfig = {
    theme: {
      primaryColor: confPrimary.value,
      secondaryColor: confSecondary.value,
      backgroundColor: confBg.value,
      fontFamily: confFont.value
    },
    branding: {
      title: confTitle.value,
      logoUrl: confLogo.value
    },
    analysis: { enabled: true }
  };

  appConfig = newConfig;
  saveConfig(newConfig);
  closeSettings();
  alert('Settings saved!');
}

// Global helpers
window.emitMute = (targetId) => {
  if (confirm('Mute this user?')) socket.emit('admin-mute-user', targetId);
};
window.emitKick = (targetId) => {
  if (confirm('Kick this user?')) socket.emit('admin-kick-user', targetId);
};

function muteAudio() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack && audioTrack.enabled) {
      audioTrack.enabled = false;
      audioBtn.classList.add('off');
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    }
  }
}

// Start
init();
