# 🚀 Quick Start Guide

Get **ninjalive** up and running in under 2 minutes!

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ A modern browser (Chrome, Firefox, Edge, or Safari)
- ✅ A working **camera** and **microphone**

---

## 🎯 Step-by-Step Setup

### Step 1: Install Dependencies

From the project root directory, run:

```bash
npm run install:all
```

This installs all dependencies for:
- The signaling server (backend)
- The client application (frontend)
- The browser proxy (optional)

**What this does behind the scenes:**
```bash
npm install                    # Server dependencies
cd client && npm install       # Client dependencies
cd browser-proxy && npm install # Proxy dependencies
```

---

### Step 2: Build the Client

The client needs to be built before the server can serve it:

```bash
npm run build:client
```

This compiles the Vite application into production-ready files in `client/dist/`.

**💡 Tip:** The `postinstall` script automatically builds the client after installation, so this step might already be done!

---

### Step 3: Start the Server

```bash
npm start
```

You should see:

```
Signaling server running on port 2000
Network access enabled. Host IP: 192.168.x.x
```

**🎉 That's it! The server is now running.**

---

### Step 4: Open the Application

Open your browser and navigate to:

```
http://localhost:2000
```

You'll see the **ninjalive** login screen with a ninja-themed card interface.

---

## 🎮 Joining Your First Room

### Option A: Manual Room Creation

1. **Enter a Room Name** (or use the auto-generated one like `silent-ninja-423`)
2. **(Optional)** Set a password to restrict access
3. **(Optional)** Set maximum number of users (default: 5)
4. Click **"Meet your clan"** 🥷
5. **Allow camera/microphone** when your browser prompts you

### Option B: URL-Based Joining

If someone shares a room URL with you, just open it:

```
http://localhost:2000?room=silent-ninja-423-1650000000000
```

The app will automatically join you to that room!

---

## 📹 Testing Your Setup

### Test with Multiple Tabs/Browsers

1. Open `http://localhost:2000` in **Tab 1** → Join room `test-room`
2. Open `http://localhost:2000` in **Tab 2** → Join room `test-room`
3. You should see both video feeds connect automatically!

### Test with Different Devices (Same Network)

1. Find your local IP from the server startup message
2. On another device, open: `http://YOUR_IP:2000`
3. Join the same room name

---

## 🎛️ Using the Controls

Once in a room, you'll see a control dock at the bottom:

| Button | What It Does |
|--------|--------------|
| 🎤 **Microphone** | Toggle your microphone on/off |
| 📹 **Camera** | Toggle your camera on/off |
| 🖥️ **Screen Share** | Share your screen instead of camera |
| ⏺️ **Record** | Start/stop recording (downloads WebM file) |
| 💬 **Chat** | Open/close the chat panel |
| ⚙️ **Settings** | Customize colors, logo, fonts |
| 🧠 **Analysis** | Toggle live speech analysis panel |
| 🔇 **Mute All** (Admin) | Mute everyone in the room |
| 📞 **Leave** | Exit the call |

---

## 👑 Admin Features

The **first person** to join a room becomes the **Admin**.

### Admin Controls

- **Mute All** — Click the "A" badge button to mute everyone
- **Mute Individual** — Click the microphone icon on a user's video
- **Kick User** — Click the X icon on a user's video to remove them

Admin status is shown with an **"A" badge** on the mute all button.

---

## 💡 Pro Tips

### 🎨 Customize the Look

Click the **⚙️ Settings** button to:
- Change the primary/secondary colors
- Update the logo URL
- Modify the application title
- Switch fonts
- Adjust background color

Settings are **saved automatically** to your browser!

### 🧠 Try the Speech Analysis

1. Click the **🧠 Analysis** button
2. Start speaking
3. See real-time metrics:
   - **Speech Rate** (Words Per Minute)
   - **Sentiment** (Positive/Negative/Neutral)
   - **Anxiety Level** (Low/Medium/High)

### 📝 Download Transcripts

If your browser supports speech recognition (Chrome recommended):
1. Speak during the meeting
2. Click **📄 Download Transcript**
3. Get a timestamped `.txt` file

### 🎥 Record Meetings

1. Click the **⏺️ Record** button
2. The recording captures the first remote stream
3. Click again to stop
4. The WebM file downloads automatically!

---

## 🤖 Optional: Browser Proxy

The browser proxy lets you stream a headless Chromium instance.

### Start the Proxy

In a **new terminal**, run:

```bash
npm run start:proxy
```

The proxy runs on **port 3001**.

### Launch a Browser

```bash
curl -X POST http://localhost:3001/api/launch \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:2000", "width": 1280, "height": 720}'
```

### View the Stream

**WebSocket (Socket.IO):** Connect and listen for `frame` events.

**MJPEG Stream:** Open in browser:
```
http://localhost:3001/stream.mjpg
```

### Close the Browser

```bash
curl -X POST http://localhost:3001/api/close
```

📖 See `browser-proxy/README.md` for full documentation.

---

## 🔧 Common Issues & Fixes

### ❌ "Permission denied" for Camera/Mic

**Fix:** Click the 🔒 icon in your browser's address bar → Allow camera and microphone.

### ❌ "Room is full"

**Fix:** Ask existing users to leave, or create a new room with a higher limit.

### ❌ "Invalid password"

**Fix:** Ask the room creator for the correct password.

### ❌ Blank screen or no video

**Fix:** 
1. Check that you allowed camera permissions
2. Try refreshing the page
3. Check browser console for errors (`F12` → Console)

### ❌ WebRTC connection fails

**Fix:**
1. Ensure you're on the same network (for local testing)
2. Check firewall settings
3. For production, configure TURN servers

### ❌ Speech recognition not working

**Fix:** Use **Google Chrome** (best support). Other browsers may not support the Web Speech API.

---

## 📚 Next Steps

Now that you're up and running:

- 📖 Read the full [README.md](README.md) for architecture and API reference
- 🎨 Explore customization options in the Settings modal
- 🤖 Set up the Browser Proxy for remote streaming
- 🚀 Deploy to production (see Deployment section in README)
- 🤝 Contribute! Check out open issues and submit a PR

---

## 🆘 Need Help?

- 🐛 **Found a bug?** → [Open an Issue](../../issues)
- 💬 **Have a question?** → [Discussions](../../discussions)
- 📧 **Contact the author** → [@suissa](https://github.com/suissa)

---

<div align="center">

**Enjoy your secure, P2P meetings! 🥷**

Made with ❤️ by the PureCore community

</div>
