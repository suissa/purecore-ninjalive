export class ElevenLabsStreamingTTSService {
  constructor({ endpoint = '/api/tts/elevenlabs/stream', fetchImpl = fetch } = {}) { this.endpoint = endpoint; this.fetchImpl = fetchImpl; this.abortController = null; }
  async synthesize(payload) {
    this.abortController = new AbortController();
    const response = await this.fetchImpl(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: this.abortController.signal });
    if (!response.ok) throw new Error(`ElevenLabs TTS failed: ${response.status}`);
    return response.arrayBuffer();
  }
  cancel() { this.abortController?.abort(); }
}
