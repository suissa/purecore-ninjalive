export class StreamingSTTService {
  constructor({ onPartial = () => {}, onFinal = () => {} } = {}) { this.onPartial = onPartial; this.onFinal = onFinal; }
  simulate(text, isFinal = true) { if (isFinal) this.onFinal(text); else this.onPartial(text); }
}
