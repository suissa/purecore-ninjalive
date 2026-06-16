const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const { loadServerConfig } = require('./config');
const { createLLMAdapter } = require('./services/llm/factory');
const { streamElevenLabsTTS } = require('./services/elevenlabsStreamingTTS');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
const serverConfig = loadServerConfig();

app.get('/api/runtime-config', (_req, res) => {
  res.json({
    llm: { provider: serverConfig.llm?.provider, model: serverConfig.llm?.model },
    elevenlabs: { voice_id: serverConfig.elevenlabs?.voice_id, model_id: serverConfig.elevenlabs?.model_id },
    stt: serverConfig.stt,
    privacy: serverConfig.privacy
  });
});

app.post('/api/translation/stream', async (req, res) => {
  try {
    const { text, direction = 'en_pt', provider, model } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    const adapter = createLLMAdapter(serverConfig, provider || serverConfig.llm?.provider);
    for await (const chunk of adapter.streamTranslation({ text, direction, model: model || serverConfig.llm?.model })) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
    else { res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`); res.end(); }
  }
});

app.post('/api/tts/elevenlabs/stream', async (req, res) => {
  try {
    const upstream = await streamElevenLabsTTS({ config: serverConfig, payload: req.body || {} });
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    for await (const chunk of upstream.body) res.write(Buffer.from(chunk));
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from client/dist (production build)
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 8e6
});

// Store room state: roomId -> room metadata and participants
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userId, username, password, limit, recordingAllowed }) => {
    const displayName = (username || userId || 'Guest').toString().trim().slice(0, 40);
    let room = rooms.get(roomId);

    // Create room if not exists
    if (!room) {
      room = {
        users: new Map(),
        password,
        limit: parseInt(limit) || 5,
        recordingAllowed: Boolean(recordingAllowed),
        admin: userId // First user is admin
      };
      rooms.set(roomId, room);
      console.log(`Created room ${roomId} with limit ${room.limit} and admin ${userId}`);
    }

    // Validation
    if (room.users.size >= room.limit) {
      return socket.emit('join-error', 'Room is full.');
    }

    if (room.password && room.password !== password) {
      return socket.emit('join-error', 'Invalid password.');
    }

    const existingUsers = [...room.users.entries()].map(([id, user]) => ({
      userId: id,
      username: user.username
    }));

    // Join
    socket.join(roomId);
    room.users.set(userId, { username: displayName, socketId: socket.id });
    console.log(`User ${displayName} (${userId}/${socket.id}) joined room ${roomId}`);

    // Notify participants. The new user receives everyone already in the room so
    // both devices can create visible participant windows immediately.
    socket.emit('existing-users', existingUsers);
    socket.emit('admin-status', {
      isAdmin: userId === room.admin,
      recordingAllowed: room.recordingAllowed
    }); // Tell user if they are admin
    socket.to(roomId).emit('user-connected', { userId, username: displayName });

    // Admin Events
    socket.on('admin-mute-all', () => {
      if (room.admin === userId) {
        socket.to(roomId).emit('admin-mute-command');
      }
    });

    socket.on('admin-mute-user', (targetId) => {
      if (room.admin === userId) {
        socket.to(roomId).emit('admin-mute-command-user', targetId);
      }
    });

    socket.on('admin-kick-user', (targetId) => {
      if (room.admin === userId) {
        // We need to find the socket for this user to disconnect them?
        // Actually we can just broadcast a "kick" message and the client handles it,
        // OR we map userId -> socketId to force disconnect here.
        // For simple MVP without user->socket map, we broadcast "kick-command" to room
        // and let the specific client react.
        io.to(roomId).emit('admin-kick-command', targetId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      if (room && room.users) {
        room.users.delete(userId);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        } else if (room.admin === userId) {
          // Reassign admin to next available user
          const nextAdmin = [...room.users.keys()][0];
          room.admin = nextAdmin;
          // Notify new admin (trickier without direct socket map, but we can broadcast)
          // Ideally we'd map userId -> socketId.
          // For now, let's keep it simple: No admin transfer or simple one.
          // Let's iterate sockets in room to find the one matching nextAdmin?
          // Expensive. Let's just not reassign for MVP or keep it simple.
          console.log(`Admin left. New admin: ${nextAdmin}`);
        }
      }
      socket.to(roomId).emit('user-disconnected', { userId, username: displayName });
    });
  });

  // Signaling events
  socket.on('offer', (payload) => {
    // payload: { target: targetUserId, caller: myUserId, sdp: offerSdp }
    // Or simpler: broadcast to room for 1-on-1
    // We'll assume the client sends the offer to the room or specific user.
    // Let's implement forwarding to a specific target or broadcast if simple 1-on-1.
    // For robust app, use target.

    // Use socket.to(roomId).emit('offer', payload) ?
    // Better: payload has { sdp, roomId }

    console.log('Received offer');
    socket.to(payload.roomId).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    console.log('Received answer');
    socket.to(payload.roomId).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    socket.to(payload.roomId).emit('ice-candidate', payload);
  });

  socket.on('screen-share-status', (payload) => {
    socket.to(payload.roomId).emit('screen-share-status', payload);
  });

  // Chat
  socket.on('chat-message', (payload) => {
    socket.to(payload.roomId).emit('chat-message', {
      ...payload,
      sender: payload.sender || socket.id
    });
  });
});

const PORT = process.env.PORT || 2000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Network access enabled. Host IP: ${require('os').networkInterfaces().eth0?.[0]?.address || 'unknown'}`);
});
