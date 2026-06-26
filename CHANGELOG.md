### `CHANGELOG.md`

```markdown
# Changelog - mpv-firefox-opener

O histórico completo de lançamentos simulados do ecossistema de desenvolvimento do projeto está detalhado abaixo.

## [v5.0.0] - Controle em Tempo Real & Persistência
- Implementação de Servidor IPC estável via sockets UNIX independentes.
- Adicionado botão "Adicionar à fila" gerenciando playlists ativas diretamente pelo navegador.
- Controle remoto de mídia completo integrado no popup (Play/Pause, Slider de volume e Barra Seek).

## [v4.0.0] - Gerenciamento Inteligente de Legendas e Qualidade
- Criação de menu de resoluções dinâmicas injetadas na propriedade `--ytdl-format`.
- Suporte a injeção de legendas externas carregadas por arquivos locais e download automático via parâmetros.

## [v3.0.0] - Integração Nativa com Fedora & KDE Plasma
- Integração total com o protocolo MPRIS do KDE Plasma. O reprodutor agora responde ao widget de mídia global do painel.
- Bloqueio de suspensão automático integrado ao gerenciador de energia do SO durante streams.

## [v2.0.0] - Estética, Recursos de Tela e Áudio
- Integração de parâmetro "Sempre no topo" habilitando multitarefa fluida.
- Suporte a modo Picture-in-Picture (PiP) com redimensionamento geométrico exato.
- Adicionado modo "Apenas Áudio" para redução drástica de consumo de CPU/RAM.

## [v1.0.0] - O MVP Funcional
- Versão inicial do projeto fornecendo comunicação por Native Messaging via Stdio Python.
- Suporte ao disparo de instâncias do player gerenciando links ativos das abas e opções iniciais de exibição.

---
*Para ver as mudanças de código e revisões de arquivos, acesse o painel comparativo:*
[Compare v1.0.0...v5.0.0](https://github.com/Lu15-F3/mpv-firefox-opener/compare/v1.0.0...v5.0.0)