import "./style.css";
import "./modal.css";
import { io } from "socket.io-client";
import { loadConfig, saveConfig, applyTheme } from "./config.js";

// Config
const SERVER_URL = window.location.origin;
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

function generateRandomRoomName() {
  const adjs = [
    "silent",
    "shadow",
    "swift",
    "hidden",
    "dark",
    "iron",
    "golden",
    "ghost",
    "wind",
  ];
  const nouns = [
    "ninja",
    "blade",
    "shuriken",
    "dojo",
    "kunai",
    "dragon",
    "tiger",
    "lotus",
    "smoke",
  ];
  const adj = adjs[Math.floor(Math.random() * adjs.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const callScreen = document.getElementById("call-screen");
const videoGrid = document.querySelector(".video-grid");
const localVideo = document.getElementById("local-video");
const roomInput = document.getElementById("room-input");
const roomPassword = document.getElementById("room-password");
const roomLimit = document.getElementById("room-limit");
const joinBtn = document.getElementById("join-btn");
const chatPanel = document.getElementById("chat-panel");
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const closeChatBtn = document.getElementById("close-chat");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");
const unreadBadge = document.getElementById("unread-badge");

// Controls
const audioBtn = document.getElementById("audio-btn");
const videoBtn = document.getElementById("video-btn");
const screenBtn = document.getElementById("screen-btn");
const recordBtn = document.getElementById("record-btn");
const leaveBtn = document.getElementById("leave-btn");

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
const adminMuteAllBtn = document.getElementById("admin-mute-all");

// Transcript & Analysis
let recognition;
let transcript = "";
const downloadTranscriptBtn = document.getElementById("download-transcript");
const analysisPanel = document.getElementById("analysis-panel");
const analysisBtn = document.getElementById("analysis-btn");
const wpmDisplay = document.getElementById("wpm-display");
const sentimentDisplay = document.getElementById("sentiment-display");
const anxietyDisplay = document.getElementById("anxiety-display");

// Settings
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings");
const saveConfigBtn = document.getElementById("save-config-btn");
const confTitle = document.getElementById("conf-title");
const confLogo = document.getElementById("conf-logo");
const confPrimary = document.getElementById("conf-primary");
const confSecondary = document.getElementById("conf-secondary");
const confBg = document.getElementById("conf-bg");
const confFont = document.getElementById("conf-font");

let appConfig = loadConfig();

// Initialize
function init() {
  userId = "user-" + Math.random().toString(36).substr(2, 9);

  // Apply initial config
  applyTheme(appConfig);

  joinBtn.addEventListener("click", joinRoom);

  // Controls Handlers
  audioBtn.addEventListener("click", toggleAudio);
  videoBtn.addEventListener("click", toggleVideo);
  screenBtn.addEventListener("click", toggleScreenShare);
  recordBtn.addEventListener("click", toggleRecording);
  leaveBtn.addEventListener("click", leaveCall);

  // Chat Handlers
  chatToggleBtn.addEventListener("click", toggleChat);
  closeChatBtn.addEventListener("click", toggleChat);
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Admin Handlers
  adminMuteAllBtn.addEventListener("click", () => {
    if (confirm("Mute everyone else?")) {
      socket.emit("admin-mute-all");
    }
  });

  // Transcript Handlers
  if (downloadTranscriptBtn) {
    downloadTranscriptBtn.addEventListener("click", downloadTranscript);
  }
  initTranscription();

  // Analysis & Settings Handlers
  if (analysisBtn) {
    analysisBtn.addEventListener("click", toggleAnalysis);
  }
  settingsBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);
  saveConfigBtn.addEventListener("click", saveSettings);

  // Check URL for Room ID
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get("room");
  if (urlRoom) {
    roomInput.value = urlRoom;
    joinRoom();
  } else {
    // Animate login entrance if not joining automatically
    animateLoginEntrance();
  }

  // Initialize interactive effects
  initElasticElements();

  // Set random room name if empty
  if (!roomInput.value || roomInput.value === "Room Name") {
    roomInput.value = generateRandomRoomName();
  }

  // Clear input on focus for easy replacement
  roomInput.addEventListener("focus", function () {
    this.value = "";
  });
}

function animateLoginEntrance() {
  const card = document.querySelector(".login-card");
  if (!card) return;

  gsap.fromTo(
    card,
    {
      z: -1000,
      opacity: 0,
      scale: 0.2,
      rotationX: -45,
    },
    {
      z: 0,
      opacity: 1,
      scale: 1,
      rotationX: 0,
      duration: 1.5,
      ease: "elastic.out(1, 0.6)",
      delay: 0.5,
    }
  );
}

function initElasticElements() {
  const card = document.querySelector(".login-card");
  if (!card) return;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;

    gsap.to(card, {
      rotationX: rotateX,
      rotationY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  card.addEventListener("mouseleave", () => {
    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
    });
  });
}

async function joinRoom() {
  const roomBase = roomInput.value.trim();
  if (!roomBase) return alert("Please enter a room name");

  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get("room");

  if (urlRoom && (urlRoom === roomBase || urlRoom.startsWith(roomBase + "-"))) {
    roomId = urlRoom;
  } else {
    roomId = `${roomBase}-${Date.now()}`;
  }

  // UI Transition
  loginScreen.classList.add("hidden");
  callScreen.classList.remove("hidden");

  // Connect Socket
  socket = io(SERVER_URL);

  setupSocketListeners();

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Media API not supported");
    }

    // Fallback Strategy: Video+Audio -> Video Only -> Audio Only
    try {
      console.log("Attempting to get Video + Audio...");
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err1) {
      console.warn("Failed to get Video + Audio:", err1);
      try {
        console.log("Attempting to get Video Only...");
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        addSystemMessage(
          "Microphone access failed. You are in video-only mode."
        );
        // Disable audio button since we don't have audio
        audioBtn.classList.add("disabled");
        audioBtn.title = "No Microphone Access";
      } catch (err2) {
        console.warn("Failed to get Video Only:", err2);
        try {
          console.log("Attempting to get Audio Only...");
          localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          addSystemMessage("Camera access failed. You are in audio-only mode.");
          // Disable video button
          videoBtn.classList.add("disabled");
          videoBtn.title = "No Camera Access";
          // Create a placeholder video track so logic doesn't break?
          // Or just let it be audio-only. The UI puts a placeholder if no video usually.
        } catch (err3) {
          console.error("All media attempts failed.", err3);
          throw err3; // Re-throw the last error to be caught by outer block
        }
      }
    }

    localVideo.srcObject = localStream;

    // Join with settings
    socket.emit("join-room", {
      roomId,
      userId,
      password: roomPassword.value.trim(),
      limit: roomLimit.value,
    });
    addSystemMessage(`Joined room: ${roomId}`);

    const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  } catch (err) {
    console.error("Error accessing media:", err);
    let msg = "Could not access camera/mic.\n";
    if (err.name === "NotAllowedError") {
      msg += "Permission denied. Please allow access in browser settings.";
    } else if (err.name === "NotFoundError") {
      msg += "No device found.";
    } else {
      msg += `${err.name}: ${err.message}`;
    }
    alert(msg);
    // Return to login
    leaveCall();
  }
}

function setupSocketListeners() {
  socket.on("user-connected", (newUserId) => {
    console.log("User connected:", newUserId);
    addSystemMessage(`User ${newUserId.substr(0, 4)} joined`);
    connectToNewUser(newUserId, true); // true = initiator
  });

  socket.on("user-disconnected", (disconnectedUserId) => {
    console.log("User disconnected:", disconnectedUserId);
    addSystemMessage(`User ${disconnectedUserId.substr(0, 4)} left`);
    if (peers[disconnectedUserId]) {
      peers[disconnectedUserId].close();
      delete peers[disconnectedUserId];
    }
    removeRemoteVideo(disconnectedUserId);
  });

  socket.on("admin-status", (data) => {
    isAdmin = data.isAdmin;
    if (isAdmin) {
      addSystemMessage("You are the Admin.");
      adminMuteAllBtn.classList.remove("hidden");
    }
  });

  socket.on("admin-mute-command", () => {
    if (!isAdmin) {
      addSystemMessage("Admin muted everyone.");
      muteAudio();
    }
  });

  socket.on("admin-mute-command-user", (targetId) => {
    if (targetId === userId) {
      addSystemMessage("Admin muted you.");
      muteAudio();
    }
  });

  socket.on("admin-kick-command", (targetId) => {
    if (targetId === userId) {
      alert("You have been kicked by the admin.");
      leaveCall();
    }
  });

  socket.on("offer", async (payload) => {
    // payload: { target, caller, sdp, roomId }
    if (payload.target && payload.target !== userId) return;

    console.log("Received offer from:", payload.caller);
    await connectToNewUser(payload.caller, false, payload.sdp);
  });

  socket.on("answer", async (payload) => {
    if (payload.target && payload.target !== userId) return;
    console.log("Received answer from:", payload.caller);

    const peer = peers[payload.caller];
    if (peer) {
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  });

  socket.on("ice-candidate", async (payload) => {
    if (payload.target && payload.target !== userId) return; // Should be targeted usually

    const senderId = payload.caller || payload.sender;

    if (senderId && peers[senderId]) {
      try {
        await peers[senderId].addIceCandidate(
          new RTCIceCandidate(payload.candidate)
        );
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    }
  });

  socket.on("chat-message", (data) => {
    addMessage(data.message, "theirs");
    if (!isChatOpen) {
      unreadCount++;
      unreadBadge.textContent = unreadCount;
      unreadBadge.classList.remove("hidden");
    }
  });

  socket.on("join-error", (msg) => {
    alert(msg);
    // Reset state and show login
    loginScreen.classList.remove("hidden");
    callScreen.classList.add("hidden");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    socket.disconnect();
  });
}

async function connectToNewUser(targetUserId, initiator, offerSdp = null) {
  if (peers[targetUserId]) return; // Already connected

  const peer = new RTCPeerConnection(ICE_SERVERS);
  peers[targetUserId] = peer;

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    peer.addTrack(track, localStream);
  });

  // Handle remote tracks
  peer.ontrack = (event) => {
    console.log("Got remote track from:", targetUserId);
    addRemoteVideo(event.streams[0], targetUserId);
  };

  // ICE Candidates
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        roomId,
        target: targetUserId, // Hint for server/receiver
        caller: userId, // Important so they know who sent it
        candidate: event.candidate,
      });
    }
  };

  if (initiator) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("offer", {
      roomId,
      target: targetUserId,
      caller: userId,
      sdp: offer,
    });
  } else {
    // We are answering
    if (offerSdp) {
      await peer.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", {
        roomId,
        target: targetUserId,
        caller: userId,
        sdp: answer,
      });
    }
  }
}

// UI Helpers for Dynamic Video
function addRemoteVideo(stream, remoteUserId) {
  let videoContainer = document.getElementById(`container-${remoteUserId}`);

  if (!videoContainer) {
    videoContainer = document.createElement("div");
    videoContainer.id = `container-${remoteUserId}`;
    videoContainer.className = "video-container remote";

    const video = document.createElement("video");
    video.id = `video-${remoteUserId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;

    const overlay = document.createElement("div");
    overlay.className = "video-overlay";

    let adminControls = "";
    if (isAdmin) {
      adminControls = `
            <div class="admin-controls" style="position:absolute; top:10px; right:10px; display:flex; gap:5px;">
               <button class="icon-btn" onclick="window.emitMute('${remoteUserId}')" title="Mute User" style="background:rgba(0,0,0,0.5); color:white; padding:5px; border-radius:50%;"><i class="fa-solid fa-microphone-slash"></i></button>
               <button class="icon-btn" onclick="window.emitKick('${remoteUserId}')" title="Kick User" style="background:rgba(255,0,0,0.5); color:white; padding:5px; border-radius:50%;"><i class="fa-solid fa-user-xmark"></i></button>
            </div>
          `;
    }

    overlay.innerHTML = `<span class="user-badge">User ${remoteUserId.substr(
      0,
      4
    )}</span>${adminControls}`;

    videoContainer.appendChild(video);
    videoContainer.appendChild(overlay);
    videoGrid.appendChild(videoContainer);

    remoteStreams[remoteUserId] = stream;
  } else {
    const video = videoContainer.querySelector("video");
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
      audioBtn.classList.remove("off");
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    } else {
      audioBtn.classList.add("off");
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    }
  }
}

function toggleVideo() {
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    if (videoTrack.enabled) {
      videoBtn.classList.remove("off");
      videoBtn.innerHTML = '<i class="fa-solid fa-video"></i>';
    } else {
      videoBtn.classList.add("off");
      videoBtn.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
    }
  }
}

async function toggleScreenShare() {
  if (isScreenSharing) {
    // Stop
    const camStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    const videoTrack = camStream.getVideoTracks()[0];

    localVideo.srcObject = camStream;
    localStream.removeTrack(localStream.getVideoTracks()[0]);
    localStream.addTrack(videoTrack);

    // Update all peers
    for (const pid in peers) {
      const sender = peers[pid]
        .getSenders()
        .find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
    }

    screenBtn.classList.remove("active");
    isScreenSharing = false;
  } else {
    // Start
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        cursor: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      localVideo.srcObject = screenStream;

      screenTrack.onended = () => {
        if (isScreenSharing) toggleScreenShare();
      };

      // Update all peers
      for (const pid in peers) {
        const sender = peers[pid]
          .getSenders()
          .find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      }

      screenBtn.classList.add("active");
      isScreenSharing = true;
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  }
}

function toggleRecording() {
  const remoteKeys = Object.keys(remoteStreams);
  if (remoteKeys.length === 0) return alert("No one to record.");

  const targetStream = remoteStreams[remoteKeys[0]];

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    recordBtn.classList.remove("recording-active");
  } else {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(targetStream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      addSystemMessage("Recording saved.");
    };

    mediaRecorder.start();
    recordBtn.classList.add("recording-active");
    addSystemMessage("Recording started (Single Stream)...");
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
    chatPanel.classList.remove("hidden");
    unreadCount = 0;
    unreadBadge.classList.add("hidden");
  } else {
    chatPanel.classList.add("hidden");
  }
}

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  if (socket) {
    socket.emit("chat-message", { roomId, message: msg });
    addMessage(msg, "mine");
    analyzeSpeech(msg); // Self analysis
    chatInput.value = "";
  }
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.textContent = text;
  chatMessages.appendChild(div);

  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth",
  });
}

function addSystemMessage(text) {
  console.log("System:", text);
  const div = document.createElement("div");
  div.style.alignSelf = "center";
  div.style.color = "#94a3b8";
  div.style.fontSize = "0.8rem";
  div.textContent = text;
  chatMessages.appendChild(div);
}

// Transcription
function initTranscription() {
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "pt-BR"; // Default to PT-BR

    recognition.onresult = (event) => {
      let finalTrans = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript + " ";
        }
      }
      if (finalTrans) {
        const timestamp = new Date().toLocaleTimeString();
        const line = `[${timestamp}] Me: ${finalTrans}\n`;
        transcript += line;

        analyzeSpeech(finalTrans); // Live Analysis

        localStorage.setItem(`transcript-${roomId}`, transcript);
        console.log("Transcript:", line);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error", event.error);
    };

    recognition.onend = () => {
      if (peerConnection || Object.keys(peers).length > 0) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.start();
  } else {
    console.warn("Speech Recognition API not supported.");
    downloadTranscriptBtn.style.display = "none";
  }
}

function downloadTranscript() {
  if (!transcript) return alert("No transcript available yet.");
  const blob = new Blob([transcript], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
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
  startTime: Date.now(),
};

function analyzeSpeech(text) {
  // 1. WPM
  const words = text.split(" ").length;
  analysisHistory.words += words;
  const minutes = (Date.now() - analysisHistory.startTime) / 60000;
  const wpm = minutes > 0 ? Math.round(analysisHistory.words / minutes) : 0;

  // 2. Anxiety (Heuristic: > 150 WPM normal conversation is high)
  const anxietyLevel = wpm > 160 ? "High" : wpm > 130 ? "Medium" : "Low";
  const anxietyColor =
    wpm > 160
      ? "var(--danger)"
      : wpm > 130
      ? "var(--accent-color)"
      : "var(--success)";

  // 3. Sentiment (Simple Keywords)
  const negativeWords = [
    "worried",
    "bad",
    "scared",
    "angry",
    "hate",
    "problem",
    "fail",
    "medo",
    "ruim",
    "raiva",
    "problema",
  ];
  const positiveWords = [
    "good",
    "happy",
    "great",
    "love",
    "success",
    "bom",
    "feliz",
    "amor",
    "sucesso",
  ];

  let score = 0;
  text
    .toLowerCase()
    .split(" ")
    .forEach((w) => {
      if (negativeWords.includes(w)) score--;
      if (positiveWords.includes(w)) score++;
    });

  let sentiment = "Neutral";
  if (score > 0) sentiment = "Positive";
  if (score < 0) sentiment = "Negative";

  // Update UI
  wpmDisplay.textContent = wpm;
  sentimentDisplay.textContent = sentiment;
  anxietyDisplay.textContent = anxietyLevel;
  anxietyDisplay.style.color = anxietyColor;
}

function toggleAnalysis() {
  if (analysisPanel.classList.contains("hidden")) {
    analysisPanel.classList.remove("hidden");
  } else {
    analysisPanel.classList.add("hidden");
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

  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

function saveSettings() {
  const newConfig = {
    theme: {
      primaryColor: confPrimary.value,
      secondaryColor: confSecondary.value,
      backgroundColor: confBg.value,
      fontFamily: confFont.value,
    },
    branding: {
      title: confTitle.value,
      logoUrl: confLogo.value,
    },
    analysis: { enabled: true },
  };

  appConfig = newConfig;
  saveConfig(newConfig);
  closeSettings();
  alert("Settings saved!");
}

// Global helpers
window.emitMute = (targetId) => {
  if (confirm("Mute this user?")) socket.emit("admin-mute-user", targetId);
};
window.emitKick = (targetId) => {
  if (confirm("Kick this user?")) socket.emit("admin-kick-user", targetId);
};

function muteAudio() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack && audioTrack.enabled) {
      audioTrack.enabled = false;
      audioBtn.classList.add("off");
      audioBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    }
  }
}

// Start
init();
