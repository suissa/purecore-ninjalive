const { createOpenAIAdapter } = require('./openaiAdapter');
const { createOpenRouterAdapter } = require('./openrouterAdapter');
function createLLMAdapter(config, provider = config.llm?.provider) {
  if (provider === 'openai') return createOpenAIAdapter(config.llm.openai);
  if (provider === 'openrouter') return createOpenRouterAdapter(config.llm.openrouter);
  throw new Error(`Unsupported LLM provider: ${provider}`);
}
module.exports = { createLLMAdapter };
