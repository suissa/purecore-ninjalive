# ninjalive 🥷

<p align="center" >
<img src="logo-ninja.png" alt="ninjalive" width="400">
</p>

> **Secure. Invisible. P2P.** — A privacy-first, peer-to-peer WebRTC video conferencing system with real-time behavioral analysis.

[![License](https://img.shields.io/badge/License-Cogfulness%20Ethical%20License%20v1.0-blue)](LICENSE-COGFULNESS)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-orange)](https://webrtc.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black)](https://socket.io/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Browser Proxy](#-browser-proxy)
- [Advanced Features](#-advanced-features)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## ✨ Features

### Core Capabilities

- **🎥 Peer-to-Peer Video & Audio** — Direct WebRTC connections with zero server-side media relay
- **🔒 Room-Based Access Control** — Password-protected rooms with configurable user limits
- **👤 Admin Controls** — Room creator gets admin privileges: mute all, mute individual users, kick users
- **💬 Real-Time Chat** — Built-in messaging with unread notifications
- **🖥️ Screen Sharing** — Toggle between camera and screen sharing seamlessly
- **🎙️ Recording** — Record meetings directly from the browser and download as WebM
- **📱 Responsive Design** — Works on desktop and mobile devices

### Advanced Features

- **🧠 Live Behavioral Analysis** — Real-time speech rate (WPM), sentiment analysis, and anxiety level detection
- **📝 Auto-Transcription** — Automatic speech-to-text with downloadable transcripts
- **🎨 Customizable Branding** — Change colors, fonts, logo, and project name on the fly
- **🔮 Media Fallback Strategy** — Intelligent fallback from Video+Audio → Video Only → Audio Only
- **🌐 URL-Based Room Joining** — Share room URLs for instant access
- **✨ 3D Animations** — GSAP-powered elastic hover effects and smooth transitions
- **🎭 Glass Morphism UI** — Modern, sleek interface with blur effects

### Browser Proxy

- **🤖 Headless Browser Streaming** — Stream any web application via Playwright
- **📡 MJPEG & WebSocket Streaming** — Multiple streaming protocols for compatibility
- **🖱️ Remote Interaction** — Click, type, and control the remote browser via WebSocket
- **🔄 Real-Time Frame Broadcasting** — ~10fps screenshot streaming

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ninjalive                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Client     │    │    Server    │    │     Proxy    │  │
│  │  (Vite+SPA)  │◄──►│  (Signaling) │◄──►│ (Playwright) │  │
│  │              │    │              │    │              │  │
│  │  - WebRTC    │    │  - Socket.IO │    │  - Browser   │  │
│  │  - Socket.IO │    │  - Rooms     │    │    Control   │  │
│  │  - GSAP UI   │    │  - Admin     │    │  - Streaming │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│         WebRTC P2P Connections (Direct Media)              │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Signaling Server** (Port 2000) — Handles room creation, user discovery, and WebRTC signaling (offers, answers, ICE candidates)
2. **Client Application** (Vite SPA) — Manages WebRTC peer connections, media streams, and UI
3. **Browser Proxy** (Port 3001) — Optional headless browser streaming for remote access
4. **WebRTC Mesh** — Direct peer-to-peer media connections between users (no server relay)

---

## 🛠️ Tech Stack

### Frontend

- **Vite** — Lightning-fast build tool and dev server
- **Socket.IO Client** — Real-time bidirectional communication
- **GSAP** — Professional-grade animations with elastic easing
- **Font Awesome 6** — Comprehensive icon library
- **Google Fonts** — Outfit, Roboto, Arizonia, Smooch, Iceland

### Backend

- **Node.js + Express** — Lightweight HTTP server
- **Socket.IO Server** — WebSocket signaling server
- **WebRTC** — Native browser API for peer-to-peer media

### Browser Proxy

- **Playwright** — Headless Chromium for browser automation
- **Express** — API server for browser control
- **Socket.IO** — Real-time frame streaming and interaction

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **bun** — Package manager
- **Modern Browser** — Chrome, Firefox, Edge, or Safari with WebRTC support
- **Camera & Microphone** — For video/audio functionality

---

## 🚀 Quick Start

Get up and running in under a minute:

```bash
# Clone the repository
git clone <repository-url>
cd ninjalive

# Install all dependencies (client, server, proxy)
npm run install:all

# Start the signaling server
npm start
```

Open `http://localhost:2000` in your browser, enter a room name, and click **"Meet your clan"**!

📖 **[See QUICKSTART.md for detailed step-by-step instructions](QUICKSTART.md)**

---

## 📥 Installation

### Option 1: Install Everything at Once

```bash
npm run install:all
```

This installs dependencies for:

- Root server
- Client application
- Browser proxy

### Option 2: Install Individually

```bash
# Server dependencies
npm install

# Client dependencies
cd client && npm install && cd ..

# Browser proxy dependencies
cd browser-proxy && npm install && cd ..
```

### Build the Client

```bash
npm run build:client
```

This compiles the Vite client into production-ready static files served by the Express server.

---

## 🎮 Usage

### Starting the Application

```bash
# Start the main signaling server (serves client + handles WebRTC signaling)
npm start

# Start the browser proxy (optional, for remote browser streaming)
npm run start:proxy
```

### Joining a Room

1. Navigate to `http://localhost:2000`
2. Enter a **Room Name** (or use the auto-generated one)
3. Optionally set a **Password** for access control
4. Optionally set **Max Users** (default: 5)
5. Click **"Meet your clan"**
6. Allow camera/microphone permissions when prompted

### Sharing the Room

The URL automatically updates with the room ID. Share it with others:

```
http://localhost:2000?room=silent-ninja-423-1650000000000
```

### Admin Controls

The **first person** to join a room becomes the **Admin** and can:

- **Mute All** — Mute everyone else in the room
- **Mute Individual** — Mute specific users via their video overlay
- **Kick Users** — Remove users from the room

### Controls Guide

| Button             | Icon | Function                              |
| ------------------ | ---- | ------------------------------------- |
| **Audio**    | 🎤   | Toggle microphone on/off              |
| **Video**    | 📹   | Toggle camera on/off                  |
| **Screen**   | 🖥️ | Share screen instead of camera        |
| **Record**   | ⏺️ | Start/stop recording (downloads WebM) |
| **Chat**     | 💬   | Toggle chat panel                     |
| **Settings** | ⚙️ | Open customization modal              |
| **Analysis** | 🧠   | Toggle live speech analysis           |
| **Mute All** | 🔇   | Admin: mute everyone (A badge)        |
| **Leave**    | 📞   | End call and reload page              |

---

## 📁 Project Structure

```
ninjalive/
├── client/                 # Frontend Vite application
│   ├── src/
│   │   ├── main.js        # Main application logic (WebRTC, Socket.IO, UI)
│   │   ├── config.js      # Configuration management and theming
│   │   └── counter.js     # Utility functions
│   ├── public/            # Static assets (logos, favicon)
│   ├── index.html         # Application HTML template
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Client dependencies
│
├── server/                # Backend signaling server
│   ├── index.js           # Socket.IO server + room management
│   └── package.json       # Server dependencies
│
├── browser-proxy/         # Headless browser streaming proxy
│   ├── public/            # Proxy static files
│   ├── index.js           # Playwright browser control + streaming
│   ├── package.json       # Proxy dependencies
│   └── README.md          # Proxy-specific documentation
│
├── site/                  # Marketing/landing page (optional)
│   ├── index.html         # Landing page
│   ├── style.css          # Landing page styles
│   ├── main.js            # Landing page logic
│   └── assets/            # Images, fonts, etc.
│
├── reports/               # Test reports and logs
├── package.json           # Root package (scripts, meta)
├── CHANGELOG.md           # Version history
├── LICENSE-COGFULNESS     # Cogfulness Ethical License v1.0
└── README.md              # This file
```

---

## ⚙️ Configuration

### Environment Variables

| Variable       | Default  | Description                   |
| -------------- | -------- | ----------------------------- |
| `PORT`       | `2000` | Port for the signaling server |
| `PROXY_PORT` | `3001` | Port for the browser proxy    |

### Application Configuration

The app includes an in-app **Settings Modal** (click ⚙️) for:

- **Agency/Project Name** — Customize the application title
- **Logo URL** — Replace the default logo with your own
- **Primary Color** — Main accent color (default: `#138df5`)
- **Secondary Color** — Secondary accent color (default: `#5ac6fc`)
- **Background Color** — App background color (default: `#0d1117`)
- **Font Family** — Choose from Outfit, Roboto, Serif, or Monospace

Settings are saved to `localStorage` and persist across sessions.

### WebRTC Configuration

Uses Google's public STUN servers by default:

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};
```

For production deployment behind NAT, consider adding TURN servers.

---

## 🔌 API Reference

### Server Events (Socket.IO)

#### Client → Server

| Event               | Payload                                   | Description                 |
| ------------------- | ----------------------------------------- | --------------------------- |
| `join-room`       | `{ roomId, userId, password, limit }`   | Join or create a room       |
| `offer`           | `{ roomId, target, caller, sdp }`       | Send WebRTC offer to peers  |
| `answer`          | `{ roomId, target, caller, sdp }`       | Send WebRTC answer to peers |
| `ice-candidate`   | `{ roomId, target, caller, candidate }` | Send ICE candidate to peers |
| `chat-message`    | `{ roomId, message }`                   | Send chat message to room   |
| `admin-mute-all`  | —                                        | Admin mutes all users       |
| `admin-mute-user` | `targetId`                              | Admin mutes specific user   |
| `admin-kick-user` | `targetId`                              | Admin kicks specific user   |

#### Server → Client

| Event                       | Payload                           | Description                             |
| --------------------------- | --------------------------------- | --------------------------------------- |
| `user-connected`          | `userId`                        | New user joined the room                |
| `user-disconnected`       | `userId`                        | User left the room                      |
| `admin-status`            | `{ isAdmin: boolean }`          | Notify if user is admin                 |
| `admin-mute-command`      | —                                | Admin muted everyone                    |
| `admin-mute-command-user` | `targetId`                      | Specific user was muted                 |
| `admin-kick-command`      | `targetId`                      | Specific user was kicked                |
| `offer`                   | `{ roomId, caller, sdp }`       | Received WebRTC offer                   |
| `answer`                  | `{ roomId, caller, sdp }`       | Received WebRTC answer                  |
| `ice-candidate`           | `{ roomId, caller, candidate }` | Received ICE candidate                  |
| `chat-message`            | `{ roomId, message }`           | Received chat message                   |
| `join-error`              | `string`                        | Room join failed (full, wrong password) |

### Browser Proxy API

#### REST Endpoints

| Method   | Endpoint         | Body                         | Response                        |
| -------- | ---------------- | ---------------------------- | ------------------------------- |
| `POST` | `/api/launch`  | `{ url, width?, height? }` | `{ status: 'launched', url }` |
| `POST` | `/api/close`   | —                           | `{ status: 'closed' }`        |
| `GET`  | `/stream.mjpg` | —                           | MJPEG video stream              |

#### WebSocket Events

| Event           | Direction        | Payload                           | Description               |
| --------------- | ---------------- | --------------------------------- | ------------------------- |
| `frame`       | Server → Client | `base64`                        | Screenshot frame (~10fps) |
| `interaction` | Client → Server | `{ type, x?, y?, text?, key? }` | Click/type/press events   |

---

## 🤖 Browser Proxy

The browser proxy allows you to stream a headless Chromium instance and interact with it remotely.

### Use Cases

- Remote browser automation
- Streaming web applications to multiple users
- Automated testing with visual feedback
- Shared browsing experiences

### Starting the Proxy

```bash
npm run start:proxy
```

The proxy runs on **port 3001** to avoid conflicts with the main app.

### Launching a Browser

```bash
curl -X POST http://localhost:3001/api/launch \
  -H "Content-Type: application/json" \
  -d '{"url": "http://example.com", "width": 1280, "height": 720}'
```

### Viewing the Stream

**Option 1: WebSocket (Socket.IO)**

Connect to the Socket.IO server and listen for `frame` events containing base64-encoded JPEG frames.

**Option 2: MJPEG Stream**

Open in a browser or video player:

```
http://localhost:3001/stream.mjpg
```

### Closing the Browser

```bash
curl -X POST http://localhost:3001/api/close
```

📖 See `browser-proxy/README.md` for more details.

---

## 🧠 Advanced Features

### Live Behavioral Analysis

The app includes real-time speech analysis:

- **Speech Rate (WPM)** — Words per minute calculation
- **Sentiment Analysis** — Keyword-based positive/negative/neutral detection
- **Anxiety Level** — Heuristic detection based on speech rate (>160 WPM = High)

Supports English and Portuguese keywords.

### Auto-Transcription

Uses the browser's **Web Speech API** for automatic speech-to-text:

- Continuous recognition during the call
- Timestamped transcripts
- Downloadable as `.txt` files
- Stored in `localStorage` per room

**Note:** Requires a browser with Speech Recognition API support (Chrome recommended).

### Media Fallback Strategy

Intelligent media acquisition with fallback:

1. **Try Video + Audio** — Full camera + microphone
2. **Fallback to Video Only** — If microphone fails
3. **Fallback to Audio Only** — If camera fails
4. **Display appropriate error messages** — User-friendly feedback

This ensures users can join even with partial hardware availability.

### GSAP Animations

Professional-grade animations:

- **Elastic Login Entrance** — Card flies in with elastic easing
- **3D Tilt on Hover** — Mouse tracking with perspective transforms
- **Smooth Transitions** — All UI changes are animated
- **Scroll Animations** — Smooth scroll to latest chat message

---

## 🚀 Deployment

### Local Development

```bash
cd client && npm run dev  # Dev server with hot reload
cd .. && npm start        # Production server
```

### Production Build

```bash
npm run build:client  # Builds client to client/dist/
npm start             # Serves static files + signaling
```

### Using PM2 (Recommended for Production)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Deployment Checklist

- [ ] Build the client: `npm run build:client`
- [ ] Set environment variables (`PORT`, etc.)
- [ ] Configure TURN servers for NAT traversal
- [ ] Enable HTTPS (required for WebRTC `getUserMedia`)
- [ ] Set up reverse proxy (nginx, Caddy, etc.)
- [ ] Configure CORS for your domain
- [ ] Set up process manager (PM2, systemd, etc.)

### HTTPS Requirement

**WebRTC `getUserMedia` requires HTTPS** in production. Use:

- Let's Encrypt for free SSL certificates
- ngrok for temporary HTTPS tunnels during development
- Self-signed certificates for local testing

---

## 🐛 Troubleshooting

### Common Issues

#### "Camera/Microphone Permission Denied"

- Check browser permissions and allow access
- Ensure HTTPS is enabled in production
- Try the fallback modes (video-only or audio-only)

#### "Room is Full"

- Increase the user limit when creating the room
- Ask existing users to leave

#### WebRTC Connection Fails

- Check firewall settings (UDP ports 10000-60000)
- Configure TURN servers for symmetric NAT
- Verify STUN server accessibility

#### Speech Recognition Not Working

- Use **Chrome** (best support for Web Speech API)
- Enable microphone permissions
- Check browser console for API availability

#### Build Errors

```bash
# Clean and reinstall
rm -rf client/node_modules client/dist
cd client && npm install && npm run build
```

#### Port Already in Use

```bash
# Change the port
PORT=3000 npm start

# Or find what's using port 2000
lsof -i :2000  # macOS/Linux
netstat -ano | findstr :2000  # Windows
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Test in multiple browsers (Chrome, Firefox, Edge)
- Update documentation for new features
- Ensure backward compatibility

---

## 📄 License

This project is licensed under the **Cogfulness Ethical License v1.0**.

See the [LICENSE-COGFULNESS](LICENSE-COGFULNESS) file for details.

---

## 👤 Author

**suissa** — [@suissa](https://github.com/suissa)

Part of the **PureCore** ecosystem.

---

## 🙏 Acknowledgments

- **WebRTC** — For peer-to-peer media streaming
- **Socket.IO** — For real-time signaling
- **GSAP** — For professional animations
- **Playwright** — For headless browser automation
- **Font Awesome** — For comprehensive icons
- **Google Fonts** — For typography

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](../../issues)
- 💬 **Questions**: [GitHub Discussions](../../discussions)
- 📧 **Contact**: [Author](https://github.com/suissa)

---

<div align="center">

**Made with ❤️ by the PureCore community**

⭐ Star this repo if you find it helpful!

</div>
