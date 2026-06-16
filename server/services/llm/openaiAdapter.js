const { PROMPTS } = require('./prompts');
async function* streamChatCompletions({ text, direction, model, apiKey, baseUrl, extraHeaders = {} }) {
  if (!apiKey) throw new Error('Missing LLM API key on backend config.');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, stream: true, messages: [{ role: 'system', content: PROMPTS[direction] || PROMPTS.en_pt }, { role: 'user', content: text }] })
  });
  if (!response.ok) throw new Error(`LLM provider failed: ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.replace(/^data:\s*/, '');
      if (data === '[DONE]') return;
      const json = JSON.parse(data);
      const chunk = json.choices?.[0]?.delta?.content;
      if (chunk) yield chunk;
    }
  }
}
function createOpenAIAdapter(config = {}) {
  return { streamTranslation: (payload) => streamChatCompletions({ ...payload, apiKey: config.api_key, baseUrl: config.base_url || 'https://api.openai.com/v1' }) };
}
module.exports = { createOpenAIAdapter, streamChatCompletions };
