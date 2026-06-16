# ninjameeting live translation

Aplicação web de videochamada WebRTC com sala multiusuário, chat, compartilhamento de tela, gravação administrada e um painel experimental de tradução/voz em tempo real.

## Configuração segura de APIs

As credenciais ficam no backend. Preencha variáveis de ambiente usadas por `config.yml`:

```bash
export OPENAI_API_KEY=...
export OPENROUTER_API_KEY=...
export ELEVENLABS_API_KEY=...
export ELEVENLABS_VOICE_ID=...
```

O frontend consulta apenas endpoints proxy (`/api/translation/stream` e `/api/tts/elevenlabs/stream`) e nunca recebe API keys.

## Tradução e voz

- Áudio remoto pode ser registrado pelo `RemoteAudioCaptureService`; por limitação dos navegadores, a WebSpeech API não aceita diretamente uma `MediaStreamTrack` remota como entrada STT arbitrária. O app expõe a arquitetura para STT streaming e mantém um hook de teste `window.__ninjaSimulateRemoteSpeech` para validar o pipeline.
- A tradução usa `StreamingTranslationService` e um factory no backend com adapters OpenAI/OpenRouter.
- A resposta em português é segmentada pelo `PunctuationChunkerService`; cada frase pontuada é traduzida para inglês e enviada ao proxy ElevenLabs streaming.
- O áudio gerado é reproduzido em fila e pode ser roteado para a chamada própria com `MediaStreamAudioDestinationNode` + `RTCRtpSender.replaceTrack`.

## Modo microfone virtual

Para chamadas externas fora deste app, o navegador não consegue injetar áudio diretamente no microfone de outro aplicativo. Use um dispositivo virtual de áudio do sistema operacional e selecione esse dispositivo como microfone no app externo. A UI mostra essa limitação em “Virtual Microphone Mode”.

## Privacidade

Por padrão o app não salva áudio nem transcrições localmente. O banner do painel de tradução informa consentimento e há botão para apagar histórico local em memória.
