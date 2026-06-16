# Prompt para UI de videochamada com tradução bidirecional

Crie uma aplicação web de videochamada com interface inspirada em ferramentas modernas de reunião, sem usar marca, logotipo, assets ou textos proprietários. A tela deve parecer uma sala profissional com grid de participantes, barra inferior de controles, painel lateral de chat/transcrição, seletor de idioma, seletor de voz clonada, botão de microfone, câmera, compartilhar tela, encerrar chamada, indicador de latência e status de streaming.

Funcionalidades obrigatórias:
- WebRTC nativo para vídeo, áudio e compartilhamento de tela.
- Transcrição do áudio remoto em inglês e tradução streaming para português brasileiro, chunk por chunk, em um textarea/painel de transcrição.
- Textarea de resposta em pt-BR que detecta pontuação final (`.`, `!`, `?`, `...`, `;`, quebra de linha), envia somente o trecho novo para LLM, traduz para inglês falado e envia para TTS streaming ElevenLabs.
- Áudio da ElevenLabs deve tocar sem salvar arquivo local e poder substituir a track de microfone enviada via WebRTC usando `MediaStreamAudioDestinationNode` + `RTCRtpSender.replaceTrack`.
- Adicionar modo fallback “Virtual Microphone Mode” explicando que chamadas externas precisam de dispositivo virtual de áudio do sistema operacional.
- Credenciais ficam somente no backend; frontend chama apenas proxy seguro.
- Banner de consentimento visível; não armazenar áudio/transcrição por padrão.

Layout obrigatório:
1. Top bar com sala, tempo de chamada, Live Translation ON/OFF, latência STT/LLM/TTS/total e status WebRTC.
2. Área central com grid de participantes, indicador de fala, badge de idioma detectado e badge `Real Mic`/`AI Voice`.
3. Barra inferior com microfone, câmera, compartilhar tela, tradução, voz clonada, alternar Real Mic/AI Voice, configurações e encerrar.
4. Painel lateral direito com abas Transcrição, Resposta, Configurações e Logs.

Arquitetura modular:
`RemoteAudioCaptureService`, `StreamingSTTService`, `StreamingTranslationService`, `PunctuationChunkerService`, `ElevenLabsStreamingTTSService`, `AudioPlaybackQueueService`, `WebRTCAudioInjectionService`, `LatencyMetricsService`, `TranscriptStore`, `SettingsStore`, `LLMAdapterFactory`, `OpenAIAdapter`, `OpenRouterAdapter`.

Testes:
- Vitest unitário para chunker, streaming translation, transcript store, audio queue, latency e replaceTrack.
- Integração com STT/LLM/TTS mockados validando pontuação, fila de áudio e volta ao microfone real.
- Playwright E2E abrindo a sala, ativando tradução, simulando fala remota em inglês, validando pt-BR, digitando “Olá, como você está?”, validando tradução EN, status ElevenLabs e alternância AI Voice/Real Mic.
