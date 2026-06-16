import { describe, expect, it, vi } from 'vitest';
import { PunctuationChunkerService } from '../../client/src/services/PunctuationChunkerService.js';
import { TranscriptStore } from '../../client/src/services/TranscriptStore.js';

describe('translation voice pipeline', () => {
  it('sends Portuguese to TTS only after final punctuation and queues generated audio', async () => {
    const chunker = new PunctuationChunkerService();
    const queued = [];
    const translate = vi.fn(async function* (text) { yield text === 'Olá?' ? 'Hello?' : 'ignored'; });
    const tts = vi.fn(async (text) => new TextEncoder().encode(`audio:${text}`).buffer);
    const queue = { enqueue: vi.fn(async (audio) => queued.push(audio.byteLength)) };

    expect(chunker.push('Olá')).toEqual([]);
    for (const sentence of chunker.push('?')) {
      let english = '';
      for await (const chunk of translate(sentence)) english += chunk;
      const audio = await tts(english);
      await queue.enqueue(audio);
    }

    expect(translate).toHaveBeenCalledWith('Olá?');
    expect(tts).toHaveBeenCalledWith('Hello?');
    expect(queue.enqueue).toHaveBeenCalledTimes(1);
    expect(queued[0]).toBeGreaterThan(0);
  });

  it('keeps STT partial/final and streamed LLM chunks ordered', async () => {
    const store = new TranscriptStore();
    store.add({ event: 'stt_partial_received' });
    store.add({ event: 'stt_final_received' });
    store.add({ event: 'llm_translation_chunk_received' });
    expect(store.all().map((event) => event.event)).toEqual(['stt_partial_received', 'stt_final_received', 'llm_translation_chunk_received']);
  });
});
