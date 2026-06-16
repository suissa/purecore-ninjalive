import { describe, expect, it, vi } from 'vitest';
import { PunctuationChunkerService } from '../../client/src/services/PunctuationChunkerService.js';
import { StreamingTranslationService } from '../../client/src/services/StreamingTranslationService.js';
import { TranscriptStore } from '../../client/src/services/TranscriptStore.js';
import { LatencyMetricsService } from '../../client/src/services/LatencyMetricsService.js';
import { WebRTCAudioInjectionService } from '../../client/src/services/WebRTCAudioInjectionService.js';

describe('PunctuationChunkerService', () => {
  it('detects terminal punctuation and does not duplicate text', () => {
    const chunker = new PunctuationChunkerService();
    expect(chunker.push('Olá. Tudo bem? Ainda')).toEqual(['Olá.', 'Tudo bem?']);
    expect(chunker.push(' não')).toEqual([]);
    expect(chunker.push('...\nFim;')).toEqual(['Ainda não...', 'Fim;']);
    expect(chunker.push('')).toEqual([]);
  });
  it('keeps incomplete text in buffer', () => {
    const chunker = new PunctuationChunkerService();
    expect(chunker.push('sem pontuação')).toEqual([]);
    expect(chunker.flush()).toEqual(['sem pontuação']);
  });
});

describe('StreamingTranslationService', () => {
  it('accumulates chunks without breaking words', () => {
    let value = '';
    value = StreamingTranslationService.appendChunk(value, 'Hello');
    value = StreamingTranslationService.appendChunk(value, 'world');
    value = StreamingTranslationService.appendChunk(value, '!');
    expect(value).toBe('Hello world!');
  });
});

describe('TranscriptStore', () => {
  it('preserves event order', () => {
    const store = new TranscriptStore();
    store.add({ event: 'a' }); store.add({ event: 'b' });
    expect(store.all().map((event) => event.event)).toEqual(['a', 'b']);
  });
});

describe('LatencyMetricsService', () => {
  it('calculates first token, first audio, and total latency', () => {
    let now = 100;
    const metrics = new LatencyMetricsService(() => now);
    metrics.start('1'); now = 140; metrics.mark('1', 'firstTranslatedToken'); now = 190; metrics.mark('1', 'firstAudio'); now = 250; metrics.mark('1', 'done');
    expect(metrics.get('1')).toEqual({ time_to_first_translated_token: 40, time_to_first_audio: 90, total_sentence_latency: 150 });
  });
});

describe('WebRTCAudioInjectionService', () => {
  it('switches between original microphone and generated track', async () => {
    const sender = { track: { kind: 'audio', id: 'original' }, replaceTrack: vi.fn(async (track) => { sender.track = track; }) };
    const service = new WebRTCAudioInjectionService({ getPeers: () => ({ one: { getSenders: () => [sender] } }), getLocalStream: () => ({ getAudioTracks: () => [{ kind: 'audio', id: 'real' }] }) });
    await service.useGeneratedAudio({ kind: 'audio', id: 'ai' });
    expect(sender.track.id).toBe('ai');
    await service.useRealMicrophone();
    expect(sender.track.id).toBe('real');
  });
});
