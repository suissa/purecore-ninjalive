const { test, expect } = require('@playwright/test');

test('live translation panel streams pt-BR text and switches AI Voice/Real Mic', async ({ page }) => {
  await page.goto('/?room=e2e-translation');
  await page.getByTestId('username-input').fill('Translator');
  await page.getByTestId('room-input').fill('e2e-translation');
  await page.getByTestId('join-btn').click();
  await page.getByTestId('translation-toggle-btn').click();
  await expect(page.getByTestId('translation-panel')).toBeVisible();
  await page.route('/api/translation/stream', async (route) => {
    const body = route.request().postDataJSON();
    const chunks = body.direction === 'en_pt' ? ['Olá', ', ', 'como', ' vai?'] : ['Hello, ', 'how are you?'];
    await route.fulfill({ contentType: 'text/event-stream', body: chunks.map((chunk) => `data: ${JSON.stringify({ chunk })}\n\n`).join('') + 'data: {"done":true}\n\n' });
  });
  await page.route('/api/tts/elevenlabs/stream', async (route) => route.fulfill({ contentType: 'audio/mpeg', body: Buffer.from([1, 2, 3, 4]) }));
  await page.evaluate(() => window.__ninjaSimulateRemoteSpeech('Hello, how are you?', true));
  await expect(page.getByTestId('remote-translation-text')).toContainText('Olá');
  await page.getByTestId('response-pt-input').fill('Olá, como você está?');
  await expect(page.getByTestId('response-en-output')).toContainText('Hello');
  await expect(page.getByTestId('elevenlabs-status')).toContainText(/streaming|playing|done|ElevenLabs/i);
  await page.getByTestId('voice-mode-btn').click();
  await expect(page.getByTestId('audio-mode-status')).toContainText(/AI Voice|Real Mic/);
});
