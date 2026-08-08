### `CHANGELOG.md`

```markdown
# Changelog - mpv-firefox-opener

O histórico completo de lançamentos simulados do ecossistema de desenvolvimento do projeto está detalhado abaixo.

## [v7.0.2] - 2026-08-07

## 🎯 Principais Novidades

* **Modo Picture-in-Picture (PiP) Inteligente e Multiplataforma:** O recurso de PiP foi completamente reformulado para oferecer uma experiência mais robusta e personalizável.
* **Posicionamento em Quatro Cantos:** Agora você pode escolher em qual canto da tela a janela do PiP deve aparecer: Superior Esquerdo, Superior Direito, Inferior Esquerdo ou Inferior Direito.
* **Controle de Tamanho Dinâmico:** Adicionada a opção para ajustar o tamanho da janela do PiP em porcentagem da tela (15%, 20%, 25%, 30%, 40%), permitindo um controle mais granular sobre o espaço ocupado.
* **Detecção Automática de Ambiente:** O wrapper (`mpv_wrapper.py`) agora detecta inteligentemente se você está usando Wayland ou X11, aplicando as configurações ideais para cada ambiente. Isso inclui o uso de `QT_QPA_PLATFORM=xcb` e opções específicas como `--x11-netwm=no` para garantir a compatibilidade.
* **Compatibilidade com Versões Modernas do MPV:** Removidas opções obsoletas (`--focus-on-open`, `--focus-on=no`, `--wid=0`) que causavam erros em versões recentes do MPV, substituindo-as por uma abordagem mais universal e estável.
* **Controle de Volume Inicial:** Adicionada uma opção na interface (popup e página de opções) para definir o volume inicial dos vídeos enviados ao mpv. Você pode escolher entre predefinições (Mudo, Baixo, Médio, Alto, Máximo) ou definir um valor personalizado (0-100%), garantindo que os vídeos iniciem sempre no nível de áudio desejado.

## 🛠️ Corrigido

* **Falha no Modo PiP em Wayland:** Corrigido o problema crítico onde o modo Picture-in-Picture não abria a janela do vídeo em sistemas com Wayland (como Fedora KDE). A correção envolveu a adaptação do comando de inicialização para usar `QT_QPA_PLATFORM=xcb` e a remoção de opções de geometria que não eram mais compatíveis.
* **Erro de Opção no MPV:** Corrigidos os erros *Error parsing option focus-on-open* e *Invalid value for option focus-on* que ocorriam em versões mais novas do MPV. O wrapper agora detecta a versão e aplica apenas as opções suportadas ou as omite para garantir a compatibilidade.
* **Mensagem de Erro Falsa no Native Host:** Resolvido o problema onde a extensão exibia a mensagem *"Failed to send to mpv. Check if Native Host is installed"* mesmo com o host instalado e funcionando. A correção estabilizou a comunicação e o parsing de mensagens JSON no wrapper.

## ✨ Adicionado

* **Internacionalização das Opções de PiP:** Adicionadas entradas de tradução para todos os novos termos relacionados ao PiP nos arquivos `messages.json` (`pipCorner`, `pipTopLeft`, `pipSizeSmall`, etc.), garantindo que a interface esteja totalmente traduzida para os idiomas suportados.
* **Opção de Volume no Popup:** Integrado um seletor de volume rápido diretamente no popup da extensão, permitindo ajustar o volume do próximo vídeo sem precisar abrir a página de configurações.
* **Configurações de PiP na Página de Opções:** As novas opções de canto e tamanho do PiP foram adicionadas à página principal de configurações (`options.html`), oferecendo um local central para personalização.

## ⚡ Alterado

* **Refatoração do mpv_wrapper.py:** O código do wrapper foi significativamente simplificado e estabilizado. A lógica de construção do comando MPV foi revisada para priorizar opções universais e seguras, removendo parâmetros problemáticos e adicionando detecção de ambiente para Wayland.
* **Atualização do popup.js e popup.css:** A interface do popup foi reorganizada para acomodar os novos controles de PiP e Volume, com um design mais limpo e intuitivo.
* **Atualização do background.js:** O script de background foi ajustado para carregar e passar as novas configurações (`pipCorner`, `pipSize`, `initialVolume`) para o wrapper, garantindo que as preferências do usuário sejam aplicadas.

---

## [v7.0.0] - 2026-07-29

### 🎯 Principais Novidades

* **Sistema de Fila Inteligente:** Introduzida uma fila de reprodução robusta com gerenciamento automático. O primeiro vídeo enviado inicia a reprodução imediatamente; todos os vídeos subsequentes são adicionados à fila, garantindo uma experiência contínua e sem duplicação.
* **Mini Player Controlador:** Adicionado um controlador de mídia compacto dentro do popup e do Gerenciador de Fila. Permite controlar a reprodução do mpv (Play/Pause, Próximo/Anterior, Volume, Barra de Progresso) diretamente da extensão, sem precisar alternar janelas.
* **Modo Pesca (Sniffer) Aprimorado:** A engine de captura de mídia foi completamente reescrita para ser mais robusta e silenciosa, incorporando múltiplos novos métodos de interceptação:
  * **Interceptação de WebSocket:** Captura URLs de mídia transmitidas via conexões WebSocket.
  * **Monitoramento de Service Workers:** Rastreia registros e mensagens de Service Workers para extrair streams.
  * **Interceptação de MediaSource/SourceBuffer:** Detecta a criação de buffers de mídia e tenta extrair as URLs fonte.
  * **Injeção em Players Nativos:** Intercepta eventos e carregamentos de players populares como HLS.js, DASH.js, Shaka Player e Clappr.
  * **Análise de Corpo de Respostas:** Lê o corpo de respostas Fetch para encontrar URLs de mídia escondidas em JSON ou JavaScript.
  * **Interceptação de Console:** Captura URLs impressas no console do navegador por scripts de players.
  * **Detecção de Drag & Drop e Clipboard:** Monitora a interação do usuário com a página para capturar links de mídia.
  * **Detecção de HTTP2 Push:** Identifica recursos de mídia enviados via Server Push.
  * **Reconstrução Dinâmica de Fragmentos:** Algoritmo aprimorado para reconstruir manifestos a partir de segmentos (`.ts`, `.m4s`, `/seg-`).
  * **Validação de Links:** Nova funcionalidade que testa a acessibilidade de cada link capturado, exibindo um status visual (Válido/Inválido) e o motivo.
  * **Agrupamento por Resolução:** Links capturados são automaticamente agrupados por qualidade (4K, 2K, FHD, HD, SD), facilitando a seleção.
  * **Filtro por Resolução:** Adicionado um seletor na interface do Sniffer para filtrar os links por qualidade.
* **Gerenciador de Fila Dedicado:** Nova página (`queue/queue.html`) com uma interface completa para gerenciar a fila de reprodução, incluindo o Mini Player integrado e todos os controles de navegação.
* **Internacionalização Completa (i18n):** A extensão agora possui suporte total a múltiplos idiomas. Todas as interfaces, incluindo popup, opções, sniffer, gerenciador de fila e scripts de instalação, são traduzidas dinamicamente com base no idioma do sistema.
  * **Scripts de Instalação Multilíngues:** Os scripts `install.sh` e `uninstall.sh` agora detectam e exibem mensagens no idioma do sistema (Inglês, Português, Espanhol, Francês, Alemão), com fallback se o arquivo de localização não for encontrado.

### 🛠️ Corrigido

* **Consistência do Modo Fila:** Corrigido o problema onde o primeiro vídeo era adicionado duplamente à fila. Agora, o primeiro vídeo sempre inicia a reprodução e os subsequentes são enfileirados corretamente.
* **Comunicação com o Player:** Melhorada a comunicação via IPC com o mpv para comandos de controle (play/pause, próximo, anterior, volume), garantindo maior confiabilidade.
* **Exibição de Status do Player:** Corrigida a lógica para exibir corretamente o status "Tocando", "Pausado" ou "Ocioso" no Mini Player.

### ✨ Adicionado

* **Suporte a Comandos IPC:** Adicionada a capacidade de enviar comandos diretamente ao mpv via socket IPC (`/tmp/mpv-socket`) para controle remoto.
* **Badge Dinâmico:** O ícone da extensão agora exibe um badge com o número total de itens na fila de reprodução.
* **Opção "Abrir Gerenciador de Fila":** Botão dedicado no popup para abrir a nova interface de gerenciamento da fila em uma aba separada.
* **Botões de Navegação na Fila:** Adicionados botões "Play Previous" e "Play Next" no Gerenciador de Fila para navegar pela playlist.
* **Notificações Aprimoradas:** Notificações do sistema agora informam claramente quando um vídeo é adicionado à fila ou quando a fila é iniciada.
* **Logs de Depuração:** Adicionados logs extensivos no console do background script para facilitar o diagnóstico de problemas no sistema de fila e sniffer.
* **Verificação de Dependências no Instalador:** O script `install.sh` agora verifica a presença de `python3`, `curl` e `socat`, além das dependências de mídia.

### ⚡ Alterado

* **Refatoração Completa do `background.js`:** O código do gerenciamento de fila foi totalmente reestruturado para maior estabilidade e clareza, com novas funções para lidar com IPC e status do player.
* **Atualização do `mpv_wrapper.py`:** O wrapper Python foi aprimorado para suportar comandos de status e controle do player via IPC, além de melhor tratamento de filas.
* **Interface do Popup:** Removidos botões de controle da fila duplicados e integrado o Mini Player, tornando a interface mais limpa e funcional.
* **Interface do Sniffer:** A UI do Sniffer foi modernizada com badges de resolução, indicadores de status de validação e botões para testar links individualmente ou em lote.
* **Estrutura de Localização:** Criado o arquivo `locale_loader.sh` para centralizar o carregamento de traduções nos scripts Bash.
* **Manifesto Atualizado:** Adicionadas novas permissões (`webRequestBlocking`) e recursos web acessíveis (`web_accessible_resources`).

### 🔒 Segurança

* **Remoção Total de `innerHTML`:** Toda a extensão foi revisada para garantir que nenhum `innerHTML` seja utilizado, seguindo rigorosamente as boas práticas de segurança da Mozilla. A manipulação do DOM é feita exclusivamente com `document.createElement` e `textContent`.

---

## [v6.0.2] - 2026-07-03

### 🛠️ Corrigido
* **Correção**: Ajuste pontual nas strings de tradução do arquivo pt_BR/messages.json.
 
### Corrigido
* **Conformidade de Segurança**: Removida completamente toda utilização de `innerHTML` nos arquivos `sniffer.js` e `welcome.js` para eliminar avisos de segurança e prevenir potenciais vetores de XSS.

---

## [v6.0.1] - 2026-07-03

### 🛠️ Atualização de Segurança e Compatibilidade (Correção)

### Corrigido
* **Conformidade de Segurança**: Removida completamente toda utilização de `innerHTML` nos arquivos `sniffer.js` e `welcome.js` para eliminar avisos de segurança e prevenir potenciais vetores de XSS.
* **Manipulação do DOM**: Migrada a injeção de texto internacionalizado contendo elementos de formatação para a criação segura e nativa de nós do DOM (`document.createElement`, `createTextNode` e `textContent`).
* **Correção de Formatação da Interface**: Resolvido um problema onde tags HTML brutas (como `<strong>`) eram exibidas como texto puro no painel de instruções do Media Link Sniffer.

---

## [v6.0.0] - 2026-07-02

### Adicionado
* **Modo Pesca (Media Link Sniffer):** Nova funcionalidade dedicada à captura avançada de mídias diretamente do tráfego de rede da aba ativa, com capacidade de interceptar manifestos ocultos (.m3u8) e fragmentos de transporte (.ts) em reprodutores web proprietários.
* **Reconstrução Dinâmica de Links:** Implementado algoritmo inteligente que reconstrói automaticamente streams quebrados nos formatos INDEX, MASTER e MP4, garantindo maior taxa de sucesso na extração.
* **Filtro Antimídia:** Sistema integrado de blacklist que remove anúncios e scripts de rastreamento (popads, doubleclick) antes da exibição dos links capturados.
* **Interface Dedicada (sniffer.css):** Nova tela com design premium escuro (estilo Catppuccin) e animações suaves em tempo real durante a detecção de novas mídias.
* **Internacionalização Completa (i18n):** Arquitetura unificada amarrando nativamente todo o ecossistema da extensão (incluindo Modo Pesca e atalhos) aos dicionários oficiais (_locales/).
* **Tela Welcome Inteligente:** Página de pós-instalação completamente reformulada com gerenciamento dinâmico de idiomas em tempo real e detecção automática do idioma padrão do sistema operacional.
* **Atalhos de Teclado Nativos:** Suporte à API commands do Firefox com três atalhos padrão:
  - `Ctrl+Alt+M`: Envia o vídeo da aba ativa
  - `Ctrl+Alt+P`: Envia apenas o áudio da aba ativa
  - `Ctrl+Alt+V`: Abre diretamente o Modo Pesca
* **Customização de Atalhos:** Usuários podem remapear livremente os atalhos através do menu nativo do Firefox (about:addons).

### Corrigido
* **Restauração de Notificações:** Corrigida a falha onde o balão de notificação nativa do sistema operacional ("Sending video to mpv...") desaparecia após o envio.
* **Sincronização dos Menus:** Resolvido problema de consistência onde o Modo Pesca sumia do menu de contexto (botão direito); agora opera em perfeita sincronia com o botão visual do popup.

### Alterado
* **Estrutura de Revisão:** Atualização completa das descrições contextuais ("description") nos arquivos messages.json para agilizar a validação automatizada e humana da Mozilla.
* **Código da Tela Welcome:** JavaScript refatorado e limpo para melhor manutenibilidade e performance na troca dinâmica de idiomas.

---

## [v5.0.1] - 2026-06-28

### Adicionado
* **Onboarding Interativo:** Introduzida uma página de boas-vindas dinâmica e bilíngue (`welcome.html`) com botões de cópia instantânea de comandos de terminal com um clique.
* **Verificação de Handshake de Dependência:** Programada uma rotina de detecção automática segura na instalação da extensão (`runtime.onInstalled`) para verificar o backend do sistema e a disponibilidade de mensagens nativas, evitando falhas de inicialização silenciosas para novos usuários.

---

## [v5.0.0] - Controle em Tempo Real & Persistência

* **Implementação de Servidor IPC estável via sockets UNIX independentes.
* **Adicionado botão "Adicionar à fila" gerenciando playlists ativas diretamente pelo navegador.
* **Controle remoto de mídia completo integrado no popup (Play/Pause, Slider de volume e Barra Seek).
* **Verificação automática do Native Messaging: Agora a extensão testa a comunicação com a ponte Python (`org.custom.mpv`) imediatamente após a instalação.
* **Página de Boas-Vindas (`welcome.html`): Caso o Native Messaging Host não seja detectado no computador do usuário, uma página de ajuda será aberta automaticamente para orientar na instalação.

### Modificado
* **Refatoração do `background.js`:** Centralização das rotinas do ciclo de vida da extensão e melhor organização na criação dos menus de contexto (`open-preferences`, `ctx-send-video` e `ctx-send-audio`).

---

## [v4.0.0] - Gerenciamento Inteligente de Legendas e Qualidade

* **Criação de menu de resoluções dinâmicas injetadas na propriedade `--ytdl-format`.
* **Suporte a injeção de legendas externas carregadas por arquivos locais e download automático via parâmetros.

---

## [v3.0.0] - Integração Nativa com Fedora & KDE Plasma

* **Integração total com o protocolo MPRIS do KDE Plasma. O reprodutor agora responde ao widget de mídia global do painel.
* **Bloqueio de suspensão automático integrado ao gerenciador de energia do SO durante streams.

---

## [v2.0.0] - Estética, Recursos de Tela e Áudio

* **Integração de parâmetro "Sempre no topo" habilitando multitarefa fluida.
* **Suporte a modo Picture-in-Picture (PiP) com redimensionamento geométrico exato.
* **Adicionado modo "Apenas Áudio" para redução drástica de consumo de CPU/RAM.

---

## [v1.0.0] - O MVP Funcional

* **Versão inicial do projeto fornecendo comunicação por Native Messaging via Stdio Python.
* **Suporte ao disparo de instâncias do player gerenciando links ativos das abas e opções iniciais de exibição.

---

*Para ver as mudanças de código e revisões de arquivos, acesse o painel comparativo:*
[Compare v1.0.0...v7.0.2](https://github.com/Lu15-F3/mpv-opener-for-firefox/compare/v1.0.0...v7.0.2)
