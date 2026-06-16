export class StreamingTranslationService {
  constructor({ endpoint = '/api/translation/stream', fetchImpl = fetch } = {}) {
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
    this.abortController = null;
  }
  async *translate({ text, direction, provider, model }) {
    this.abortController = new AbortController();
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, direction, provider, model }), signal: this.abortController.signal
    });
    if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      for (const frame of frames) {
        const line = frame.split('\n').find((item) => item.startsWith('data:'));
        if (!line) continue;
        const payload = JSON.parse(line.replace(/^data:\s*/, ''));
        if (payload.done) return;
        if (payload.chunk) yield payload.chunk;
      }
    }
  }
  cancel() { this.abortController?.abort(); }
  static appendChunk(previous, chunk) {
    if (!previous) return chunk;
    if (!chunk) return previous;
    const needsSpace = !/\s$/.test(previous) && !/^\s|^[,.;:!?]/.test(chunk);
    return `${previous}${needsSpace ? ' ' : ''}${chunk}`;
  }
}
