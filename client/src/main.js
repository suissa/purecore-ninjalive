import './style.css';
import './modal.css';
import { io } from 'socket.io-client';
import { loadConfig, saveConfig, applyTheme } from './config.js';
import { PunctuationChunkerService } from './services/PunctuationChunkerService.js';
import { StreamingTranslationService } from './services/StreamingTranslationService.js';
import { ElevenLabsStreamingTTSService } from './services/ElevenLabsStreamingTTSService.js';
import { AudioPlaybackQueueService } from './services/AudioPlaybackQueueService.js';
import { WebRTCAudioInjectionService } from './services/WebRTCAudioInjectionService.js';
import { TranscriptStore } from './services/TranscriptStore.js';
import { LatencyMetricsService } from './services/LatencyMetricsService.js';
import { RemoteAudioCaptureService } from './services/RemoteAudioCaptureService.js';
import { StreamingSTTService } from './services/StreamingSTTService.js';
import { SettingsStore } from './services/SettingsStore.js';

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
const prejoinVideo = document.getElementById('prejoin-video');
const prejoinName = document.getElementById('prejoin-name');
const prejoinStatus = document.getElementById('prejoin-status');
const prejoinStatusIcon = document.getElementById('prejoin-status-icon');
const prejoinStatusTitle = document.getElementById('prejoin-status-title');
const prejoinStatusDesc = document.getElementById('prejoin-status-desc');
const prejoinMicBtn = document.getElementById('prejoin-mic-btn');
const prejoinCameraBtn = document.getElementById('prejoin-camera-btn');
const micDevicePill = document.getElementById('mic-device-pill');
const speakerDevicePill = document.getElementById('speaker-device-pill');
const cameraDevicePill = document.getElementById('camera-device-pill');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const roomPassword = document.getElementById('room-password');
const roomLimit = document.getElementById('room-limit');
const adminRecordingAllowedInput = document.getElementById('admin-recording-allowed');
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
const subtitlesOverlay = document.getElementById('subtitles-overlay');
const subtitlesSpeaker = document.getElementById('subtitles-speaker');
const subtitlesText = document.getElementById('subtitles-text');
const translationToggleBtn = document.getElementById('translation-toggle-btn');
const voiceModeBtn = document.getElementById('voice-mode-btn');
const translationPanel = document.getElementById('translation-panel');
const closeTranslationBtn = document.getElementById('close-translation');
const pauseTranslationBtn = document.getElementById('pause-translation-btn');
const clearTranscriptBtn = document.getElementById('clear-transcript-btn');
const translationLiveStatus = document.getElementById('translation-live-status');
const latencyStatus = document.getElementById('latency-status');
const audioModeStatus = document.getElementById('audio-mode-status');
const remoteOriginalText = document.getElementById('remote-original-text');
const remoteTranslationText = document.getElementById('remote-translation-text');
const remoteTranslationStatus = document.getElementById('remote-translation-status');
const responsePtInput = document.getElementById('response-pt-input');
const responsePtSent = document.getElementById('response-pt-sent');
const responseEnOutput = document.getElementById('response-en-output');
const sendResponseNowBtn = document.getElementById('send-response-now');
const clearResponseQueueBtn = document.getElementById('clear-response-queue');
const interruptAiVoiceBtn = document.getElementById('interrupt-ai-voice');
const elevenLabsStatus = document.getElementById('elevenlabs-status');
const translationLogs = document.getElementById('translation-logs');
const translationSttProvider = document.getElementById('translation-stt-provider');
const translationLlmProvider = document.getElementById('translation-llm-provider');
const translationModelName = document.getElementById('translation-model-name');
const elevenLabsVoiceId = document.getElementById('elevenlabs-voice-id');
const ttsStability = document.getElementById('tts-stability');
const ttsSimilarity = document.getElementById('tts-similarity');
const ttsStyle = document.getElementById('tts-style');
const ttsSpeed = document.getElementById('tts-speed');
const useClonedVoice = document.getElementById('use-cloned-voice');
const injectWebrtcAudio = document.getElementById('inject-webrtc-audio');
const playSpeakers = document.getElementById('play-speakers');
const virtualMicMode = document.getElementById('virtual-mic-mode');

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
let adminRecordingAllowed = false;
let sharedScreenUserId = null;
let audioContext;
const speakingDetectors = {};
const SPEAKING_THRESHOLD = 0.035;
const SPEAKING_HOLD_MS = 250;

const responseChunker = new PunctuationChunkerService();
const translationService = new StreamingTranslationService();
const ttsService = new ElevenLabsStreamingTTSService();
const transcriptStore = new TranscriptStore();
const latencyMetrics = new LatencyMetricsService();
const translationSettingsStore = new SettingsStore();
let audioPlaybackQueue;
let audioInjectionService;
let remoteAudioCapture;
let sttService;
let liveTranslationEnabled = false;
let aiVoiceEnabled = false;

// Admin
let isAdmin = false;
let recordingAllowedForRoom = false;
const adminMuteAllBtn = document.getElementById('admin-mute-all');

// Transcript & Analysis
let recognition;
let transcript = "";
let liveSubtitleRecognition;
let liveSubtitleResetTimer;
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
const confLiveSubtitles = document.getElementById('conf-live-subtitles');
const confSubtitlesLang = document.getElementById('conf-subtitles-lang');
const confOpenRouterKey = document.getElementById('conf-openrouter-key');
const openRouterKeyGroup = document.getElementById('openrouter-key-group');

let appConfig = loadConfig();

// Initialize
function init() {
  userId = 'user-' + Math.random().toString(36).substr(2, 9);
  usernameInput.value = localStorage.getItem('ninja_username') || '';
  updatePrejoinName();

  // Apply initial config
  applyTheme(appConfig);

  joinBtn.addEventListener('click', joinRoom);
  usernameInput.addEventListener('input', updatePrejoinName);
  prejoinMicBtn.addEventListener('click', togglePrejoinAudio);
  prejoinCameraBtn.addEventListener('click', togglePrejoinVideo);

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

  // Analysis & Settings Handlers
  analysisBtn.addEventListener('click', toggleAnalysis);
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveConfigBtn.addEventListener('click', saveSettings);
  confSubtitlesLang.addEventListener('change', updateOpenRouterKeyVisibility);
  translationToggleBtn?.addEventListener('click', toggleTranslationPanel);
  closeTranslationBtn?.addEventListener('click', toggleTranslationPanel);
  voiceModeBtn?.addEventListener('click', toggleVoiceMode);
  pauseTranslationBtn?.addEventListener('click', toggleLiveTranslation);
  clearTranscriptBtn?.addEventListener('click', clearLocalTranscriptHistory);
  responsePtInput?.addEventListener('input', handleResponseInput);
  sendResponseNowBtn?.addEventListener('click', () => responseChunker.flush().concat(responsePtInput.value.trim()).filter(Boolean).forEach(processPortugueseResponse));
  clearResponseQueueBtn?.addEventListener('click', () => audioPlaybackQueue?.clear());
  interruptAiVoiceBtn?.addEventListener('click', interruptAiVoice);
  document.querySelectorAll('.translation-tab').forEach((tab) => tab.addEventListener('click', () => selectTranslationTab(tab.dataset.translationTab)));
  loadTranslationSettings();
  initializeTranslationServices();

  // Check URL for Room ID
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get('room');
  if (urlRoom) {
    roomInput.value = urlRoom;
  }

  preparePrejoinPreview();
}


function updatePrejoinName() {
  const fallbackName = 'Your username';
  if (prejoinName) prejoinName.textContent = usernameInput.value.trim() || fallbackName;
}

async function preparePrejoinPreview() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updatePrejoinPermissionState({ hasAudio: false, hasVideo: false, message: 'Media API not supported in this browser.' });
    return null;
  }

  const tracks = [];

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStream = stream;
    prejoinVideo.srcObject = stream;
    updatePrejoinPermissionState({ hasAudio: true, hasVideo: true });
    return stream;
  } catch (combinedError) {
    console.warn('Could not access both camera and microphone:', combinedError);
  }

  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    tracks.push(...audioStream.getAudioTracks());
  } catch (audioError) {
    console.warn('Could not access microphone:', audioError);
  }

  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    tracks.push(...videoStream.getVideoTracks());
  } catch (videoError) {
    console.warn('Could not access camera:', videoError);
  }

  localStream = tracks.length ? new MediaStream(tracks) : null;
  if (prejoinVideo) prejoinVideo.srcObject = localStream;
  updatePrejoinPermissionState({
    hasAudio: Boolean(localStream?.getAudioTracks().length),
    hasVideo: Boolean(localStream?.getVideoTracks().length)
  });

  return localStream;
}

function updatePrejoinPermissionState({ hasAudio, hasVideo, message = '' }) {
  setPermissionControl(prejoinMicBtn, micDevicePill, hasAudio, 'Microphone permission granted', 'Microphone permission missing');
  setPermissionControl(prejoinCameraBtn, cameraDevicePill, hasVideo, 'Camera permission granted', 'Camera permission missing');
  setPermissionControl(null, speakerDevicePill, true, 'Audio output ready', 'Audio output unavailable');

  const allReady = hasAudio && hasVideo;
  const partialReady = hasAudio || hasVideo;
  prejoinStatus.classList.toggle('ready', allReady);
  prejoinStatus.classList.toggle('partial', partialReady && !allReady);
  prejoinStatus.classList.toggle('denied', !partialReady);
  prejoinStatusIcon.className = allReady ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';

  if (allReady) {
    prejoinStatusTitle.textContent = 'Câmera e microfone prontos';
    prejoinStatusDesc.textContent = 'Suas permissões estão liberadas para entrar na sala.';
  } else if (!hasVideo && hasAudio) {
    prejoinStatusTitle.textContent = 'A câmera não foi encontrada';
    prejoinStatusDesc.textContent = 'Você pode participar com áudio e chat enquanto verifica a câmera.';
  } else if (hasVideo && !hasAudio) {
    prejoinStatusTitle.textContent = 'Microfone sem permissão';
    prejoinStatusDesc.textContent = 'Você pode participar com câmera e chat enquanto verifica o microfone.';
  } else {
    prejoinStatusTitle.textContent = 'Câmera e microfone sem permissão';
    prejoinStatusDesc.textContent = message || 'Libere as permissões ou participe usando apenas o chat.';
  }
}

function setPermissionControl(button, pill, isAllowed, allowedLabel, deniedLabel) {
  [button, pill].filter(Boolean).forEach((element) => {
    element.classList.toggle('allowed', isAllowed);
    element.classList.toggle('denied', !isAllowed);
  });

  if (pill) {
    const label = pill.querySelector('span');
    if (label) label.textContent = isAllowed ? allowedLabel : deniedLabel;
  }
}

async function togglePrejoinAudio() {
  const audioTrack = localStream?.getAudioTracks()[0];
  if (!audioTrack) {
    await preparePrejoinPreview();
    return;
  }

  audioTrack.enabled = !audioTrack.enabled;
  prejoinMicBtn.classList.toggle('muted', !audioTrack.enabled);
}

async function togglePrejoinVideo() {
  const videoTrack = localStream?.getVideoTracks()[0];
  if (!videoTrack) {
    await preparePrejoinPreview();
    return;
  }

  videoTrack.enabled = !videoTrack.enabled;
  prejoinVideo.classList.toggle('video-muted', !videoTrack.enabled);
  prejoinCameraBtn.classList.toggle('muted', !videoTrack.enabled);
}

async function joinRoom() {
  const roomBase = roomInput.value.trim();
  username = usernameInput.value.trim() || `Guest ${userId.slice(-4)}`;
  adminRecordingAllowed = adminRecordingAllowedInput.checked;

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
    limit: roomLimit.value,
    recordingAllowed: adminRecordingAllowed
  });

  const newUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
  window.history.pushState({ path: newUrl }, '', newUrl);

  try {
    if (!localStream) {
      await preparePrejoinPreview();
    }

    if (localStream) {
      localVideo.srcObject = localStream;
      updateLocalMediaState(true);
      startSpeakingDetection(localStream, userId);
      if (appConfig.subtitles.enabled) startLiveSubtitles();
      attachLocalMediaToPeers();
    } else {
      throw new Error('Media unavailable');
    }
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
    recordingAllowedForRoom = Boolean(data.recordingAllowed);
    recordBtn.classList.toggle('hidden', !(isAdmin && recordingAllowedForRoom));

    if (isAdmin) {
      addSystemMessage('You are the Admin.');
      adminMuteAllBtn.classList.remove('hidden');
      if (recordingAllowedForRoom) {
        addSystemMessage('Admin recording is allowed for this room.');
      }
    }
  });

  socket.on('screen-share-status', ({ userId: sharingUserId, isSharing }) => {
    setSharedScreenUser(isSharing ? sharingUserId : null);
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


function getSharedAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch((err) => console.warn('Could not resume audio context:', err));
  }

  return audioContext;
}

function startSpeakingDetection(stream, participantId) {
  const audioTrack = stream?.getAudioTracks?.()[0];
  if (!audioTrack) {
    updateSpeakingIndicator(participantId, false);
    return;
  }

  stopSpeakingDetection(participantId);

  const context = getSharedAudioContext();
  if (!context) return;

  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.35;

  const audioOnlyStream = new MediaStream([audioTrack]);
  const source = context.createMediaStreamSource(audioOnlyStream);
  const samples = new Uint8Array(analyser.fftSize);
  let lastSpokeAt = 0;
  let animationFrame = null;

  source.connect(analyser);

  const detect = () => {
    if (!audioTrack.enabled || audioTrack.readyState !== 'live') {
      updateSpeakingIndicator(participantId, false);
      animationFrame = requestAnimationFrame(detect);
      return;
    }

    analyser.getByteTimeDomainData(samples);
    let sumSquares = 0;
    samples.forEach((sample) => {
      const centered = (sample - 128) / 128;
      sumSquares += centered * centered;
    });

    const rms = Math.sqrt(sumSquares / samples.length);
    const now = performance.now();
    if (rms > SPEAKING_THRESHOLD) lastSpokeAt = now;

    updateSpeakingIndicator(participantId, now - lastSpokeAt < SPEAKING_HOLD_MS);
    animationFrame = requestAnimationFrame(detect);
  };

  speakingDetectors[participantId] = {
    stop: () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      source.disconnect();
      updateSpeakingIndicator(participantId, false);
    }
  };

  detect();
}

function stopSpeakingDetection(participantId) {
  if (!speakingDetectors[participantId]) return;
  speakingDetectors[participantId].stop();
  delete speakingDetectors[participantId];
}

function updateSpeakingIndicator(participantId, isSpeaking) {
  const indicatorId = participantId === userId ? 'local-speaking-indicator' : `speaking-${participantId}`;
  const indicator = document.getElementById(indicatorId);
  if (!indicator) return;

  indicator.classList.toggle('speaking', isSpeaking);
  indicator.title = isSpeaking ? 'Speaking now' : 'Not speaking';
}

// UI Helpers for Dynamic Video
function getDisplayName(participantId) {
  return participants[participantId]?.username || `User ${participantId.substr(0, 4)}`;
}

function updateLocalParticipant(displayName) {
  const badge = document.getElementById('local-user-badge');
  if (badge) badge.textContent = `${displayName} (You)`;
  const localContainer = document.querySelector('.video-container.local');
  if (localContainer) {
    localContainer.classList.add('media-pending');
    localContainer.dataset.participantId = userId;
  }
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
  videoContainer.dataset.participantId = remoteUserId;
  videoContainer.dataset.testid = 'remote-participant-tile';

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

  overlay.innerHTML = `
    <span class="user-badge">${getDisplayName(remoteUserId)}</span>
    <div class="participant-indicators">
      <div id="speaking-${remoteUserId}" class="audio-indicator speaking-indicator" title="Not speaking"><i class="fa-solid fa-microphone"></i></div>
    </div>
    ${adminControls}
  `;

  videoContainer.appendChild(video);
  videoContainer.appendChild(placeholder);
  videoContainer.appendChild(overlay);
  videoGrid.appendChild(videoContainer);
  updateVideoLayout();
  return videoContainer;
}

function addRemoteVideo(stream, remoteUserId) {
  const videoContainer = addRemoteParticipant(remoteUserId);
  const video = videoContainer.querySelector('video');
  video.srcObject = stream;
  videoContainer.classList.remove('media-pending');
  remoteStreams[remoteUserId] = stream;
  remoteAudioCapture?.register(remoteUserId, stream);
  startSpeakingDetection(stream, remoteUserId);
  updateVideoLayout();
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
  stopSpeakingDetection(remoteUserId);
  delete remoteStreams[remoteUserId];
  remoteAudioCapture?.unregister(remoteUserId);
  if (sharedScreenUserId === remoteUserId) sharedScreenUserId = null;
  updateVideoLayout();
}


function getParticipantTile(participantId) {
  if (participantId === userId) return document.getElementById('local-container');
  return document.getElementById(`container-${participantId}`);
}

function setSharedScreenUser(participantId) {
  sharedScreenUserId = participantId;
  updateVideoLayout();
}

function updateVideoLayout() {
  const tiles = [...videoGrid.querySelectorAll('.video-container')];
  tiles.forEach((tile) => {
    tile.classList.remove('screen-share-featured', 'rail-bottom', 'rail-top', 'rail-right', 'rail-left', 'compact-tile');
    tile.style.removeProperty('--rail-index');
  });

  const featuredTile = sharedScreenUserId ? getParticipantTile(sharedScreenUserId) : null;
  videoGrid.classList.toggle('screen-share-layout', Boolean(featuredTile));

  if (!featuredTile) {
    videoGrid.classList.toggle('dense-grid', tiles.length > 6);
    return;
  }

  featuredTile.classList.add('screen-share-featured');
  const railTiles = tiles.filter((tile) => tile !== featuredTile);
  const bottomCapacity = 6;
  const topCapacity = 6;
  const rightCapacity = 4;
  const leftCapacity = 4;

  railTiles.forEach((tile, index) => {
    let railClass = 'rail-left';
    let railIndex = index - bottomCapacity - topCapacity - rightCapacity;

    if (index < bottomCapacity) {
      railClass = 'rail-bottom';
      railIndex = index;
    } else if (index < bottomCapacity + topCapacity) {
      railClass = 'rail-top';
      railIndex = index - bottomCapacity;
    } else if (index < bottomCapacity + topCapacity + rightCapacity) {
      railClass = 'rail-right';
      railIndex = index - bottomCapacity - topCapacity;
    }

    tile.classList.add(railClass);
    if (railTiles.length > bottomCapacity + topCapacity + rightCapacity + leftCapacity) {
      tile.classList.add('compact-tile');
    }
    tile.style.setProperty('--rail-index', railIndex);
  });
}

function updateOpenRouterKeyVisibility() {
  openRouterKeyGroup.classList.toggle('hidden', confSubtitlesLang.value !== 'en');
}

function getSpeechRecognitionClass() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function getSubtitleRecognitionLanguage() {
  return appConfig.subtitles.language === 'en' ? 'en-US' : 'pt-BR';
}

function startLiveSubtitles() {
  const SpeechRecognitionClass = getSpeechRecognitionClass();
  if (!SpeechRecognitionClass) {
    addSystemMessage('Live Subtitles are not supported in this browser.');
    return;
  }

  stopLiveSubtitles();
  liveSubtitleRecognition = new SpeechRecognitionClass();
  liveSubtitleRecognition.continuous = true;
  liveSubtitleRecognition.interimResults = true;
  liveSubtitleRecognition.lang = getSubtitleRecognitionLanguage();

  liveSubtitleRecognition.onresult = (event) => {
    let subtitle = '';
    let finalSubtitle = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const piece = event.results[i][0].transcript;
      subtitle += piece;
      if (event.results[i].isFinal) finalSubtitle += piece;
    }

    showLiveSubtitle(subtitle.trim());

    if (finalSubtitle.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      transcript += `[${timestamp}] Live Subtitles: ${finalSubtitle.trim()}\n`;
      localStorage.setItem(`transcript-${roomId}`, transcript);
    }
  };

  liveSubtitleRecognition.onerror = (event) => {
    console.warn('Live subtitles recognition error:', event.error);
  };

  liveSubtitleRecognition.onend = () => {
    if (appConfig.subtitles.enabled && localStream) {
      try { liveSubtitleRecognition.start(); } catch (e) { }
    }
  };

  try {
    liveSubtitleRecognition.start();
    subtitlesOverlay.classList.remove('hidden');
  } catch (err) {
    console.warn('Could not start live subtitles:', err);
  }
}

function stopLiveSubtitles() {
  if (liveSubtitleResetTimer) clearTimeout(liveSubtitleResetTimer);
  if (liveSubtitleRecognition) {
    liveSubtitleRecognition.onend = null;
    try { liveSubtitleRecognition.stop(); } catch (e) { }
  }
  liveSubtitleRecognition = null;
  subtitlesOverlay.classList.add('hidden');
  subtitlesText.textContent = '';
}

function showLiveSubtitle(text) {
  if (!text) return;
  subtitlesSpeaker.textContent = appConfig.subtitles.language === 'en' ? 'Live Subtitles (EN)' : 'Legendas ao vivo (PT-BR)';
  subtitlesText.textContent = text;
  subtitlesOverlay.classList.remove('hidden');
  if (liveSubtitleResetTimer) clearTimeout(liveSubtitleResetTimer);
  liveSubtitleResetTimer = setTimeout(() => {
    subtitlesText.textContent = '';
  }, 5000);
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
      startSpeakingDetection(localStream, userId);
    } else {
      audioBtn.classList.add('off');
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
      updateSpeakingIndicator(userId, false);
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
    if (socket) socket.emit('screen-share-status', { roomId, userId, isSharing: false });
    setSharedScreenUser(null);
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
      if (socket) socket.emit('screen-share-status', { roomId, userId, isSharing: true });
      setSharedScreenUser(userId);

    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  }
}

function toggleRecording() {
  if (!isAdmin || !recordingAllowedForRoom) {
    return alert('Only the admin can record when admin recording is allowed for this room.');
  }

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
  stopLiveSubtitles();
  Object.keys(speakingDetectors).forEach(stopSpeakingDetection);
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
  confLiveSubtitles.checked = Boolean(appConfig.subtitles.enabled);
  confSubtitlesLang.value = appConfig.subtitles.language || 'pt-br';
  confOpenRouterKey.value = appConfig.subtitles.openRouterKey || '';
  updateOpenRouterKeyVisibility();

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
    analysis: { enabled: true },
    subtitles: {
      enabled: confLiveSubtitles.checked,
      language: confSubtitlesLang.value,
      openRouterKey: confOpenRouterKey.value.trim()
    }
  };

  appConfig = newConfig;
  saveConfig(newConfig);
  if (newConfig.subtitles.enabled) {
    startLiveSubtitles();
  } else {
    stopLiveSubtitles();
  }
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
      updateSpeakingIndicator(userId, false);
    }
  }
}

// Start
init();

function initializeTranslationServices() {
  audioInjectionService = new WebRTCAudioInjectionService({ getPeers: () => peers, getLocalStream: () => localStream });
  remoteAudioCapture = new RemoteAudioCaptureService({ onEvent: addTranslationLog });
  sttService = new StreamingSTTService({
    onPartial: (text) => handleRemoteSpeechText(text, false),
    onFinal: (text) => handleRemoteSpeechText(text, true)
  });
  window.__ninjaSimulateRemoteSpeech = (text, isFinal = true) => sttService.simulate(text, isFinal);
}

function ensureAudioPlaybackQueue() {
  if (!audioPlaybackQueue) {
    audioPlaybackQueue = new AudioPlaybackQueueService({ audioContext: getSharedAudioContext(), playToSpeakers: playSpeakers?.checked !== false });
    audioPlaybackQueue.onStatus = (status) => {
      elevenLabsStatus.textContent = `ElevenLabs: ${status}`;
      addTranslationLog(status === 'playing' ? 'audio_buffer_playing' : `tts_${status}`);
    };
  }
  audioPlaybackQueue.playToSpeakers = playSpeakers?.checked !== false;
  return audioPlaybackQueue;
}

function toggleTranslationPanel() {
  translationPanel?.classList.toggle('hidden');
  if (!translationPanel?.classList.contains('hidden')) toggleLiveTranslation(true);
}

function toggleLiveTranslation(force) {
  liveTranslationEnabled = typeof force === 'boolean' ? force : !liveTranslationEnabled;
  translationLiveStatus.textContent = liveTranslationEnabled ? 'Live Translation ON' : 'Live Translation OFF';
  translationToggleBtn?.classList.toggle('active', liveTranslationEnabled);
  pauseTranslationBtn.textContent = liveTranslationEnabled ? 'Pausar' : 'Retomar';
}

function selectTranslationTab(name) {
  document.querySelectorAll('.translation-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.translationTab === name));
  document.querySelectorAll('.translation-tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `translation-tab-${name}`));
}

function addTranslationLog(event, details = {}) {
  const entry = transcriptStore.add({ event, details });
  if (translationLogs) {
    const row = document.createElement('div');
    row.textContent = `${new Date(entry.timestamp).toLocaleTimeString()} · ${event}`;
    translationLogs.prepend(row);
  }
}

function updateLatency(sentenceId) {
  const metrics = latencyMetrics.get(sentenceId);
  latencyStatus.textContent = `STT -- · LLM ${metrics.time_to_first_translated_token ?? '--'}ms · TTS ${metrics.time_to_first_audio ?? '--'}ms · Total ${metrics.total_sentence_latency ?? '--'}ms`;
}

async function handleRemoteSpeechText(text, isFinal) {
  if (!liveTranslationEnabled || !text?.trim()) return;
  const sentenceId = `remote-${Date.now()}`;
  latencyMetrics.start(sentenceId);
  remoteOriginalText.value = `${remoteOriginalText.value}${remoteOriginalText.value ? '\n' : ''}${text}`;
  remoteTranslationStatus.textContent = isFinal ? 'Status: traduzindo' : 'Status: transcrevendo';
  addTranslationLog(isFinal ? 'stt_final_received' : 'stt_partial_received', { text });
  let translated = '';
  for await (const chunk of translationService.translate({ text, direction: 'en_pt', provider: translationLlmProvider.value, model: translationModelName.value })) {
    if (!translated) latencyMetrics.mark(sentenceId, 'firstTranslatedToken');
    translated = StreamingTranslationService.appendChunk(translated, chunk);
    remoteTranslationText.value = `${remoteTranslationText.value.replace(/\s*$/, '')}${chunk}`;
    addTranslationLog('llm_translation_chunk_received');
    addTranslationLog('textarea_updated');
    updateLatency(sentenceId);
  }
  latencyMetrics.mark(sentenceId, 'done');
  remoteTranslationText.value += '\n';
  remoteTranslationStatus.textContent = 'Status: finalizado';
  updateLatency(sentenceId);
}

function handleResponseInput(event) {
  const sentences = responseChunker.push(event.target.value);
  sentences.forEach(processPortugueseResponse);
}

async function processPortugueseResponse(text) {
  if (!text?.trim()) return;
  const sentenceId = `response-${Date.now()}`;
  latencyMetrics.start(sentenceId);
  responsePtSent.value = text;
  responseEnOutput.value = '';
  elevenLabsStatus.textContent = 'ElevenLabs: queued';
  addTranslationLog('punctuation_detected', { text });
  let english = '';
  for await (const chunk of translationService.translate({ text, direction: 'pt_en', provider: translationLlmProvider.value, model: translationModelName.value })) {
    if (!english) latencyMetrics.mark(sentenceId, 'firstTranslatedToken');
    english = StreamingTranslationService.appendChunk(english, chunk);
    responseEnOutput.value = english;
    addTranslationLog('llm_translation_chunk_received');
    updateLatency(sentenceId);
  }
  if (useClonedVoice?.checked && english) await synthesizeAndPlay(english, sentenceId);
  latencyMetrics.mark(sentenceId, 'done');
  updateLatency(sentenceId);
}

async function synthesizeAndPlay(text, sentenceId) {
  elevenLabsStatus.textContent = 'ElevenLabs: streaming';
  addTranslationLog('elevenlabs_stream_started');
  const audio = await ttsService.synthesize({
    text,
    voice_id: elevenLabsVoiceId.value,
    stability: Number(ttsStability.value),
    similarity_boost: Number(ttsSimilarity.value),
    style: Number(ttsStyle.value),
    speed: Number(ttsSpeed.value)
  });
  latencyMetrics.mark(sentenceId, 'firstAudio');
  addTranslationLog('elevenlabs_audio_chunk_received');
  const queue = ensureAudioPlaybackQueue();
  if (injectWebrtcAudio?.checked) {
    const generatedTrack = queue.getGeneratedTrack();
    if (generatedTrack) {
      await audioInjectionService.useGeneratedAudio(generatedTrack);
      aiVoiceEnabled = true;
      updateAudioModeUI();
      addTranslationLog('webrtc_track_replaced');
    }
  }
  await queue.enqueue(audio);
}

async function toggleVoiceMode() {
  if (!audioInjectionService) return;
  if (aiVoiceEnabled) {
    await audioInjectionService.useRealMicrophone();
    aiVoiceEnabled = false;
  } else {
    const track = ensureAudioPlaybackQueue().getGeneratedTrack();
    if (track) {
      await audioInjectionService.useGeneratedAudio(track);
      aiVoiceEnabled = true;
    }
  }
  updateAudioModeUI();
  addTranslationLog('webrtc_track_replaced');
}

function updateAudioModeUI() {
  audioModeStatus.textContent = aiVoiceEnabled ? 'AI Voice' : 'Real Mic';
  voiceModeBtn?.classList.toggle('active', aiVoiceEnabled);
}

async function interruptAiVoice() {
  ttsService.cancel();
  audioPlaybackQueue?.clear();
  await audioInjectionService?.useRealMicrophone();
  aiVoiceEnabled = false;
  updateAudioModeUI();
}

function clearLocalTranscriptHistory() {
  transcriptStore.clear();
  if (translationLogs) translationLogs.innerHTML = '';
  if (remoteOriginalText) remoteOriginalText.value = '';
  if (remoteTranslationText) remoteTranslationText.value = '';
}

function loadTranslationSettings() {
  const settings = translationSettingsStore.load({ provider: 'openrouter', model: 'openai/gpt-4o-mini' });
  if (translationLlmProvider) translationLlmProvider.value = settings.provider;
  if (translationModelName) translationModelName.value = settings.model;
  fetch('/api/runtime-config').then((res) => res.ok ? res.json() : null).then((runtime) => {
    if (!runtime) return;
    if (runtime.llm?.provider && translationLlmProvider) translationLlmProvider.value = runtime.llm.provider;
    if (runtime.llm?.model && translationModelName) translationModelName.value = runtime.llm.model;
    if (runtime.elevenlabs?.voice_id && elevenLabsVoiceId) elevenLabsVoiceId.value = runtime.elevenlabs.voice_id;
  }).catch(() => {});
}
