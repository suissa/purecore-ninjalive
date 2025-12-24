import './style.css';
import { io } from 'socket.io-client';

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
const roomInput = document.getElementById('room-input');
const roomPassword = document.getElementById('room-password');
const roomLimit = document.getElementById('room-limit');
const joinBtn = document.getElementById('join-btn');
const chatPanel = document.getElementById('chat-panel');
const chatToggleBtn = document.getElementById('chat-toggle-btn');
const closeChatBtn = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
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
let isScreenSharing = false;
let mediaRecorder;
let recordedChunks = [];
let isChatOpen = false;
let unreadCount = 0;

// Admin
let isAdmin = false;
const adminMuteAllBtn = document.getElementById('admin-mute-all');

// Transcript
let recognition;
let transcript = "";
const downloadTranscriptBtn = document.getElementById('download-transcript');

// Initialize
function init() {
  userId = 'user-' + Math.random().toString(36).substr(2, 9);

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
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Admin Handlers
  adminMuteAllBtn.addEventListener('click', () => {
    if (confirm('Mute everyone else?')) {
      socket.emit('admin-mute-all');
    }
  });

  // Transcript Handlers
  downloadTranscriptBtn.addEventListener('click', downloadTranscript);
  initTranscription();

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
  if (!roomBase) return alert('Please enter a room name');

  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get('room');

  if (urlRoom && (urlRoom === roomBase || urlRoom.startsWith(roomBase + '-'))) {
    roomId = urlRoom;
  } else {
    roomId = `${roomBase}-${Date.now()}`;
  }

  // UI Transition
  loginScreen.classList.add('hidden');
  callScreen.classList.remove('hidden');

  // Connect Socket
  socket = io(SERVER_URL);

  setupSocketListeners();

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Media API not supported');
    }

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Join with settings
    socket.emit('join-room', {
      roomId,
      userId,
      password: roomPassword.value.trim(),
      limit: roomLimit.value
    });
    addSystemMessage(`Joined room: ${roomId}`);

    const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

  } catch (err) {
    console.error('Error accessing media:', err);
    alert('Could not access camera/mic. Ensure HTTPS/localhost.');
  }
}

function setupSocketListeners() {
  socket.on('user-connected', (newUserId) => {
    console.log('User connected:', newUserId);
    addSystemMessage(`User ${newUserId.substr(0, 4)} joined`);
    connectToNewUser(newUserId, true); // true = initiator
  });

  socket.on('user-disconnected', (disconnectedUserId) => {
    console.log('User disconnected:', disconnectedUserId);
    addSystemMessage(`User ${disconnectedUserId.substr(0, 4)} left`);
    if (peers[disconnectedUserId]) {
      peers[disconnectedUserId].close();
      delete peers[disconnectedUserId];
    }
    removeRemoteVideo(disconnectedUserId);

    socket.on('admin-status', (data) => {
      isAdmin = data.isAdmin;
      if (isAdmin) {
        addSystemMessage('You are the Admin.');
        adminMuteAllBtn.classList.remove('hidden');
      }
    });

    socket.on('admin-mute-command', () => {
      // If we are NOT the admin (admin doesn't mute self usually, or does? User request: "Mute todo mundo". Usually means others.)
      // Let's assume admin is exempt.
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
  }

  socket.on('offer', async (payload) => {
    // payload: { target, caller, sdp, roomId }
    // If we are not the target (and it was targeted), ignore.
    if (payload.target && payload.target !== userId) return;

    console.log('Received offer from:', payload.caller);
    await connectToNewUser(payload.caller, false, payload.sdp);
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

    // If senderId is not in payload, we might have trouble in Mesh if we don't know who sent it.
    // We'll assume the server or client attaches 'caller' or 'sender' to the payload.
    // Let's assume payload has 'sender' or 'caller'.

    const senderId = payload.caller || payload.sender; // Adjust based on server
    // Note: The original server code just broadcasted. We need to make sure we know WHO it is from.
    // We will assume we modify the client to send 'caller' in all signals.

    if (senderId && peers[senderId]) {
      try {
        await peers[senderId].addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    }
  });

  socket.on('chat-message', (data) => {
    addMessage(data.message, 'theirs');
    if (!isChatOpen) {
      unreadCount++;
      unreadBadge.textContent = unreadCount;
      unreadBadge.classList.remove('hidden');
    }
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
  // Disconnect socket to avoid state issues
  socket.disconnect();
});
}

async function connectToNewUser(targetUserId, initiator, offerSdp = null) {
  if (peers[targetUserId]) return; // Already connected

  const peer = new RTCPeerConnection(ICE_SERVERS);
  peers[targetUserId] = peer;

  // Add local tracks
  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  // Handle remote tracks
  peer.ontrack = (event) => {
    console.log('Got remote track from:', targetUserId);
    // Only add once per stream (video/audio come separately but same stream)
    // or just updating srcObject is fine.
    // Only add once per stream (video/audio come separately but same stream)
    // or just updating srcObject is fine.
    addRemoteVideo(event.streams[0], targetUserId);
  };
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
function addRemoteVideo(stream, remoteUserId) {
  // Check if exists
  let videoContainer = document.getElementById(`container-${remoteUserId}`);

  if (!videoContainer) {
    videoContainer = document.createElement('div');
    videoContainer.id = `container-${remoteUserId}`;
    videoContainer.className = 'video-container remote';

    const video = document.createElement('video');
    video.id = `video-${remoteUserId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;

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

    overlay.innerHTML = `<span class="user-badge">User ${remoteUserId.substr(0, 4)}</span>${adminControls}`;

    videoContainer.appendChild(video);
    videoContainer.appendChild(overlay);
    videoGrid.appendChild(videoContainer);

    remoteStreams[remoteUserId] = stream;
  } else {
    // Just update stream if needed
    const video = videoContainer.querySelector('video');
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }
}

function removeRemoteVideo(remoteUserId) {
  const el = document.getElementById(`container-${remoteUserId}`);
  if (el) el.remove();
  delete remoteStreams[remoteUserId];
}

// Controls
function toggleAudio() {
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
  // Basic screen share implementation for Mesh is tricky because we need to replace track on ALL peers.
  if (isScreenSharing) {
    // Stop
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = camStream.getVideoTracks()[0];

    localVideo.srcObject = camStream;
    localStream.removeTrack(localStream.getVideoTracks()[0]);
    localStream.addTrack(videoTrack);

    // Update all peers
    for (const pid in peers) {
      const sender = peers[pid].getSenders().find(s => s.track.kind === 'video');
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
        const sender = peers[pid].getSenders().find(s => s.track.kind === 'video');
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
  // Recording Mesh is harder. We will just record the first remote stream we find for now, or alert that it's limited.
  const remoteKeys = Object.keys(remoteStreams);
  if (remoteKeys.length === 0) return alert('No one to record.');

  // Ideally we mix streams, but for MVP we record one.
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

  if (socket) {
    socket.emit('chat-message', { roomId, message: msg });
    addMessage(msg, 'mine');
    chatInput.value = '';
  }
}

function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.textContent = text;
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
    recognition.lang = 'pt-BR'; // Default to PT-BR based on user language

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
        // Save
        localStorage.setItem(`transcript-${roomId}`, transcript);
        console.log('Transcript:', line);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      // Auto restart if call is active
      if (peerConnection || Object.keys(peers).length > 0) {
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

// Global helpers for inline HTML onclicks
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
