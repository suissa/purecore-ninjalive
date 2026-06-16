async function streamElevenLabsTTS({ config, payload }) {
  const eleven = config.elevenlabs || {};
  if (!eleven.api_key) throw new Error('Missing ElevenLabs API key on backend config.');
  const voiceId = payload.voice_id || eleven.voice_id;
  if (!voiceId) throw new Error('Missing ElevenLabs voice_id.');
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg', 'xi-api-key': eleven.api_key },
    body: JSON.stringify({
      text: payload.text,
      model_id: payload.model_id || eleven.model_id || 'eleven_multilingual_v2',
      voice_settings: {
        stability: Number(payload.stability ?? eleven.stability ?? 0.45),
        similarity_boost: Number(payload.similarity_boost ?? eleven.similarity_boost ?? 0.85),
        style: Number(payload.style ?? eleven.style ?? 0),
        speed: Number(payload.speed ?? eleven.speed ?? 1)
      }
    })
  });
  if (!response.ok) throw new Error(`ElevenLabs failed: ${response.status}`);
  return response;
}
module.exports = { streamElevenLabsTTS };
