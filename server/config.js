const fs = require('fs');
const path = require('path');

function coerce(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!Number.isNaN(Number(value)) && value.trim() !== '') return Number(value);
  const envMatch = value.match(/^\$\{(.+)}$/);
  if (envMatch) return process.env[envMatch[1]] || '';
  return value;
}

function parseSimpleYaml(content) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.match(/^\s*/)[0].length;
    const [, key, rawValue = ''] = rawLine.trim().match(/^([^:]+):\s*(.*)$/) || [];
    if (!key) continue;
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;
    if (rawValue === '') {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = coerce(rawValue.replace(/^['"]|['"]$/g, ''));
    }
  }
  return root;
}

function loadServerConfig() {
  const configPath = path.join(__dirname, '..', 'config.yml');
  const fallback = { llm: { provider: 'openrouter', model: 'openai/gpt-4o-mini' }, elevenlabs: {} };
  if (!fs.existsSync(configPath)) return fallback;
  return { ...fallback, ...parseSimpleYaml(fs.readFileSync(configPath, 'utf8')) };
}

module.exports = { loadServerConfig, parseSimpleYaml };
