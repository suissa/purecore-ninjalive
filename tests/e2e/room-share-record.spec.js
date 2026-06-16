const { mkdirSync } = require('node:fs');
const { test, expect, chromium } = require('@playwright/test');

async function mockMedia(page, label) {
  await page.addInitScript((name) => {
    const makeCanvasStream = (text) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      let frame = 0;
      const draw = () => {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0f111a');
        gradient.addColorStop(1, text.includes('screen') ? '#2563eb' : '#10b981');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px sans-serif';
        ctx.fillText(`${name} ${text}`, 72, 120);
        ctx.font = '32px sans-serif';
        ctx.fillText(`frame ${frame++}`, 72, 180);
      };
      draw();
      setInterval(draw, 120);
      return canvas.captureStream(15);
    };

    const makeAudioTrack = () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 220;
      gain.gain.value = 0.001;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      return destination.stream.getAudioTracks()[0];
    };

    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = async (constraints = {}) => {
      const tracks = [];
      if (constraints.video) tracks.push(makeCanvasStream('camera').getVideoTracks()[0]);
      if (constraints.audio) tracks.push(makeAudioTrack());
      return new MediaStream(tracks);
    };
    navigator.mediaDevices.getDisplayMedia = async () => {
      const stream = makeCanvasStream('screen shared');
      stream.getVideoTracks()[0].label = `${name} screen shared`;
      return stream;
    };
  }, label);
}

async function joinRoom(page, { name, room, allowRecording = false }) {
  await page.goto('/');
  await page.getByTestId('username-input').fill(name);
  await page.getByTestId('room-input').fill(room);
  if (allowRecording) await page.getByText('Permitir gravação pelo Admin').click();
  await page.getByTestId('join-btn').click();
  await expect(page.locator('#call-screen')).toBeVisible();
}

test('two browsers join, one shares screen and records, and the other sees shared screen layout', async () => {
  const room = `e2e-share-${Date.now()}`;
  const screenshotsDir = 'test-results/screenshots';
  mkdirSync(screenshotsDir, { recursive: true });
  const adminBrowser = await chromium.launch();
  const viewerBrowser = await chromium.launch();
  const adminContext = await adminBrowser.newContext();
  const viewerContext = await viewerBrowser.newContext();
  const admin = await adminContext.newPage();
  const viewer = await viewerContext.newPage();

  await mockMedia(admin, 'Admin');
  await mockMedia(viewer, 'Viewer');

  await joinRoom(admin, { name: 'Admin', room, allowRecording: true });
  await joinRoom(viewer, { name: 'Viewer', room });

  await expect(admin.getByTestId('remote-participant-tile').first()).toBeVisible();
  await expect(viewer.getByTestId('remote-participant-tile').first()).toBeVisible();

  await admin.screenshot({ path: `${screenshotsDir}/admin-before-share.png`, fullPage: true });
  await viewer.screenshot({ path: `${screenshotsDir}/viewer-before-share.png`, fullPage: true });

  await admin.getByTestId('screen-share-btn').click();
  await expect(admin.locator('#local-container')).toHaveClass(/screen-share-featured/);
  await expect(viewer.locator('[data-testid="remote-participant-tile"].screen-share-featured')).toBeVisible();
  await expect(viewer.locator('.video-grid')).toHaveClass(/screen-share-layout/);

  await admin.screenshot({ path: `${screenshotsDir}/admin-sharing-screen.png`, fullPage: true });
  await viewer.screenshot({ path: `${screenshotsDir}/viewer-sees-shared-screen.png`, fullPage: true });

  await expect(admin.getByTestId('record-btn')).toBeVisible();
  await admin.getByTestId('record-btn').click();
  await expect(admin.getByTestId('record-btn')).toHaveClass(/recording-active/);

  await adminBrowser.close();
  await viewerBrowser.close();
});
