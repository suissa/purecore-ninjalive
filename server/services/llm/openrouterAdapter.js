const { streamChatCompletions } = require('./openaiAdapter');
function createOpenRouterAdapter(config = {}) {
  return {
    streamTranslation: (payload) => streamChatCompletions({
      ...payload,
      apiKey: config.api_key,
      baseUrl: config.base_url || 'https://openrouter.ai/api/v1',
      extraHeaders: { 'HTTP-Referer': 'http://localhost', 'X-Title': 'ninjameeting live translation' }
    })
  };
}
module.exports = { createOpenRouterAdapter };
