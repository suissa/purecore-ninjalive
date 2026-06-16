export class PunctuationChunkerService {
  constructor({ terminalPattern = /(?:\.\.\.|[.!?;\n])/ } = {}) {
    this.terminalPattern = terminalPattern;
    this.buffer = '';
    this.sent = new Set();
  }
  push(text = '') {
    this.buffer += text;
    const chunks = [];
    let lastEnd = 0;
    const re = /\.\.\.|[.!?;\n]/g;
    let match;
    while ((match = re.exec(this.buffer))) {
      const sentence = this.buffer.slice(lastEnd, match.index + match[0].length).trim();
      lastEnd = match.index + match[0].length;
      if (sentence && !this.sent.has(sentence)) {
        this.sent.add(sentence);
        chunks.push(sentence);
      }
    }
    this.buffer = this.buffer.slice(lastEnd);
    return chunks;
  }
  flush() {
    const value = this.buffer.trim();
    this.buffer = '';
    if (!value || this.sent.has(value)) return [];
    this.sent.add(value);
    return [value];
  }
  reset() { this.buffer = ''; this.sent.clear(); }
}
