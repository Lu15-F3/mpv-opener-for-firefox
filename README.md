# MPV Opener for Firefox 🎬🎵 / MPV Opener para Firefox 🎬🎵

[![Versão](https://img.shields.io/amo/v/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) [![Usuários](https://img.shields.io/amo/users/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) [![Avaliações](https://img.shields.io/amo/rating/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) [![Estrelas](https://img.shields.io/amo/stars/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/)

A lightweight Firefox extension designed for Fedora Linux and KDE Plasma that allows you to seamlessly redirect video streams, audio tracks, and full playlists from your browser directly into your native local mpv media player.

> 🇧🇷 **BR:** Uma extensão leve para o Firefox projetada para o Fedora Linux e KDE Plasma que permite redirecionar perfeitamente transmissões de vídeo, faixas de áudio e playlists completas do seu navegador diretamente para o seu player de mídia local e nativo mpv.

Save system resources (CPU/RAM), bypass heavy web player scripts, and enjoy advanced hardware acceleration, custom shaders, and native desktop integration.

> 🇧🇷 **BR:** Economize recursos do sistema (CPU/RAM), ignore scripts pesados de players da web e desfrute de aceleração de hardware avançada, shaders personalizados e integração nativa com o desktop.

---

✨ Features / ✨ Recursos

• Smart and Cross-Platform Picture-in-Picture (PiP) Mode / Modo Picture-in-Picture (PiP) Inteligente e Multiplataforma: Completely redesigned PiP feature offering a more robust and customizable experience.

> 🇧🇷 BR: O recurso de PiP foi completamente reformulado para oferecer uma experiência mais robusta e personalizável.

• Four-Corner Positioning / Posicionamento em Quatro Cantos: Choose exactly which corner of the screen the PiP window appears: Top-Left, Top-Right, Bottom-Left, or Bottom-Right.

> 🇧🇷 BR: Escolha exatamente em qual canto da tela a janela do PiP deve aparecer: Superior Esquerdo, Superior Direito, Inferior Esquerdo ou Inferior Direito.

• Dynamic Size Control / Controle de Tamanho Dinâmico: Adjust the PiP window size using screen percentages (15%, 20%, 25%, 30%, 40%) for granular space management.

> 🇧🇷 BR: Ajuste o tamanho da janela do PiP em porcentagem da tela (15%, 20%, 25%, 30%, 40%) para um controle granular do espaço.

• Automatic Environment Detection / Detecção Automática de Ambiente: The wrapper (mpv_wrapper.py) intelligently detects Wayland or X11, automatically applying optimal compatibility settings like QT_QPA_PLATFORM=xcb and --x11-netwm=no.

> 🇧🇷 BR: O wrapper (mpv_wrapper.py) detecta inteligentemente se você está usando Wayland ou X11, aplicando automaticamente as configurações ideais como QT_QPA_PLATFORM=xcb e --x11-netwm=no.

• Modern MPV Compatibility / Compatibilidade com Versões Modernas do MPV: Removed obsolete options (--focus-on-open, --focus-on=no, --wid=0) that caused errors in recent MPV versions, replacing them with a stable, universal approach.

> 🇧🇷 BR: Remoção de opções obsoletas (--focus-on-open, --focus-on=no, --wid=0) que causavam erros em versões recentes do MPV, substituindo-as por uma abordagem universal e estável.

• Instant Dispatch / Envio Instantâneo: Send the active tab, video element, or any link to mpv via click or context menus.

> 🇧🇷 BR: Envie a aba ativa, elemento de vídeo ou qualquer link para o mpv por meio de cliques ou menus de contexto.

• Smart Queueing & Queue Manager / Fila Inteligente e Gerenciador de Fila: Clicking to send a new video while mpv is already active will automatically append it to your active playing queue (via IPC Socket). The first video always starts immediately; subsequent videos are queued automatically. Includes a dedicated Queue Manager page with full control over your playlist.

> 🇧🇷 BR: Clicar para enviar um novo vídeo enquanto o mpv já estiver ativo irá adicioná-lo automaticamente à sua fila de reprodução ativa (via IPC Socket). O primeiro vídeo sempre inicia imediatamente; os vídeos subsequentes são enfileirados automaticamente. Inclui uma página dedicada do Gerenciador de Fila com controle total sobre sua playlist.

• Queue Controls / Controles da Fila:

• Mini Player integrated into popup and Queue Manager with Play/Pause, Next/Previous, Volume control, and Seek bar.

> 🇧🇷 BR: Mini Player integrado ao popup e ao Gerenciador de Fila com Play/Pause, Próximo/Anterior, Controle de Volume e Barra de Progresso.

• Queue badge counter on the extension icon showing total items in queue.

> 🇧🇷 BR: Contador de badge no ícone da extensão mostrando o total de itens na fila.

• Toggle Queue Mode on/off (when disabled, videos open in separate windows instead of queueing).

> 🇧🇷 BR: Alternar Modo Fila ativado/desativado (quando desativado, os vídeos abrem em janelas separadas ao invés de enfileirar).

• Remove individual items from queue with a single click.

> 🇧🇷 BR: Remover itens individuais da fila com um clique.

• Clear All items from queue.

> 🇧🇷 BR: Limpar Toda a fila.

• Play Next / Play Previous to navigate through the playlist.

> 🇧🇷 BR: Próximo / Anterior para navegar pela playlist.

• Volume Up / Volume Down controls integrated into the Mini Player.

> 🇧🇷 BR: Aumentar / Diminuir Volume controles integrados ao Mini Player.

• Visual status indicators showing "Playing", "Paused", or "Idle" for each item.

> 🇧🇷 BR: Indicadores visuais de status mostrando "Tocando", "Pausado" ou "Ocioso" para cada item.

• Initial Volume Control / Controle de Volume Inicial: Set the starting volume for videos sent to mpv via the popup or options page using presets (Mute, Low, Medium, High, Max) or custom values (0-100%).

> 🇧🇷 BR: Defina o volume inicial dos vídeos enviados ao mpv pelo popup ou página de opções usando predefinições (Mudo, Baixo, Médio, Alto, Máximo) ou valores personalizados (0-100%).

• Quality Cap Control / Controle de Limite de Qualidade: Restrict maximum stream resolutions (1080p, 720p, 480p) dynamically from the extension popup.

> 🇧🇷 BR: Restrinja as resoluções máximas de transmissão (1080p, 720p, 480p) dinamicamente a partir do popup da extensão.

• Listen Only Mode / Modo Apenas Áudio: Play background streams with video track disabled. Completely hidden window controlled globally by your OS.

> 🇧🇷 BR: Reproduza transmissões em segundo plano com a faixa de vídeo desativada. Janela completamente oculta controlada globalmente pelo seu sistema operacional.

• Native Playlist Support / Suporte Nativo a Playlists: Real playlists (e.g., YouTube lists) are parsed automatically and play sequentially.

> 🇧🇷 BR: Playlists reais (ex: listas do YouTube) são analisadas automaticamente e reproduzidas sequencialmente.

• Keyboard Shortcuts / Atalhos de Teclado: Native support for the Firefox Commands API with three default shortcuts (Ctrl+Alt+M to send active tab video to MPV, Ctrl+Alt+P to listen to active tab audio in MPV, and Ctrl+Alt+V to open Media Sniffer Mode) and fully customizable remapping via the native Firefox menu (about:addons).

> 🇧🇷 BR: Suporte nativo à API Commands do Firefox com três atalhos padrão (Ctrl+Alt+M para enviar vídeo da aba ativa para o MPV, Ctrl+Alt+P para ouvir áudio da aba ativa no MPV e Ctrl+Alt+V para o Modo Pesca) e customização livre através do menu nativo do Firefox (about:addons).

• Media Link Sniffer / Modo Pesca (Enhanced): Advanced media capture directly from active tab network traffic with multiple intelligent interception methods.

> 🇧🇷 BR: Captura avançada de mídias diretamente do tráfego de rede da aba ativa com múltiplos métodos inteligentes de interceptação.

• Capture Methods / Métodos de Captura:

• WebSocket Interception – Captures media URLs transmitted via WebSocket connections.

> 🇧🇷 BR: Interceptação de WebSocket – Captura URLs de mídia transmitidas via conexões WebSocket.

• Service Worker Monitoring – Tracks Service Worker registrations and messages.

> 🇧🇷 BR: Monitoramento de Service Workers – Rastreia registros e mensagens de Service Workers.

• MediaSource/SourceBuffer Interception – Detects media buffer creation.

> 🇧🇷 BR: Interceptação de MediaSource/SourceBuffer – Detecta criação de buffers de mídia.

• Native Player Injection – Intercepts events from HLS.js, DASH.js, Shaka Player, Clappr, and more.

> 🇧🇷 BR: Injeção em Players Nativos – Intercepta eventos de HLS.js, DASH.js, Shaka Player, Clappr e mais.

• Response Body Analysis – Reads Fetch responses to find hidden media URLs.

> 🇧🇷 BR: Análise de Corpo de Respostas – Lê respostas Fetch para encontrar URLs de mídia ocultas.

• Console Interception – Captures URLs printed to browser console.

> 🇧🇷 BR: Interceptação de Console – Captura URLs impressas no console do navegador.

• Drag & Drop / Clipboard Monitoring – Captures media links from user interaction.

> 🇧🇷 BR: Detecção de Drag & Drop e Clipboard – Captura links de mídia da interação do usuário.

• HTTP2 Push Detection – Identifies media resources sent via Server Push.

> 🇧🇷 BR: Detecção de HTTP2 Push – Identifica recursos de mídia enviados via Server Push.

• Dynamic Fragment Reconstruction – Rebuilds manifests from segments (.ts, .m4s, /seg-).

> 🇧🇷 BR: Reconstrução Dinâmica de Fragmentos – Reconstrói manifestos a partir de segmentos.

• Sniffer Features / Recursos do Sniffer:

• Link Validation – Tests each captured link for accessibility with visual status badges.

> 🇧🇷 BR: Validação de Links – Testa cada link capturado com indicadores visuais de status.

• Quality Grouping – Automatically groups captured links by resolution (4K, 2K, FHD, HD, SD).

> 🇧🇷 BR: Agrupamento por Resolução – Agrupa automaticamente links por qualidade.

• Resolution Filter – Filter captured links by quality.

> 🇧🇷 BR: Filtro por Resolução – Filtra links capturados por qualidade.

• Test All Links – Batch validation of all captured streams.

> 🇧🇷 BR: Testar Todos os Links – Validação em lote de todos os streams capturados.

• Send All to MPV – Send all captured streams to mpv at once.

> 🇧🇷 BR: Enviar Todos para o MPV – Envia todos os streams capturados para o mpv de uma vez.

• Export All – Copy all captured URLs to clipboard.

> 🇧🇷 BR: Exportar Todos – Copia todas as URLs capturadas para a área de transferência.

• Advanced Features / Recursos Avançados: Anti-buffering aggressive network cache for smooth streaming, embedded/auto-generated subtitle loader with automatic subtitle tracks, automatic system screensaver/sleep inhibition during playback, custom audio device selection for advanced audio routing, auto-close tab option after sending video to mpv, and window behavior controls (Fullscreen, Picture-in-Picture, Always on Top).

> 🇧🇷 BR: Cache de rede agressivo anti-buffering para streaming suave, carregador de legendas embutidas/auto-geradas com faixas de legenda automáticas, inibição automática do protetor de tela/suspensão do sistema durante a reprodução, seleção personalizada de dispositivo de áudio para roteamento avançado de áudio, opção de fechar aba automaticamente após enviar vídeo para o mpv e controles de comportamento da janela (Tela Cheia, Picture-in-Picture, Sempre no Topo).

• KDE Plasma & MPRIS Integration / Integração com KDE Plasma & MPRIS: Fully integrates into the native system Media Widget (system tray) and obeys hardware multimedia keys (Play/Pause/Skip), even in Audio Only mode.

> 🇧🇷 BR: Integra-se totalmente ao Widget de Mídia nativo do sistema (bandeja do sistema) e obedece às teclas multimídia físicas (Play/Pause/Pular), mesmo no modo Apenas Áudio.

• Fedora & KDE Plasma Integration / Integração com Fedora & KDE Plasma: Native MPRIS plugin for full system media widget integration, hardware media keys support (Play/Pause/Skip), system sleep inhibition and screen saver prevention during playback, optimized for Fedora with automatic dependency detection.

> 🇧🇷 BR: Plugin MPRIS nativo para integração completa com o widget de mídia do sistema, suporte a teclas multimídia físicas (Play/Pause/Pular), inibição de suspensão do sistema e prevenção de protetor de tela enquanto a mídia está tocando, otimizado para Fedora com detecção automática de dependências.

• Smart Installer / Instalador Inteligente: Automatic dependency checking (mpv, yt-dlp, mpv-mpris, python3, curl, socat), multi-language installation messages, Flatpak Firefox support (installs manifests for both native and Flatpak Firefox), safe uninstall, and installation verification with Native Host communication test.

> 🇧🇷 BR: Verificação automática de dependências (mpv, yt-dlp, mpv-mpris, python3, curl, socat), mensagens de instalação multi-idioma, suporte a Firefox Flatpak (instala manifestos para Firefox nativo e Flatpak), desinstalação segura e verificação de instalação com teste de comunicação Native Host.

• Multi-Language Support / Suporte Multi-Idiomas: Full i18n support with dynamic language detection based on your system locale. All interfaces (popup, options, sniffer, queue manager, welcome page) are translated in real-time. Supported languages include English 🇬🇧, Portuguese (BR) 🇧🇷, Spanish 🇪🇸, French 🇫🇷, German 🇩🇪, Italian 🇮🇹, Japanese 🇯🇵, Korean 🇰🇷, Russian 🇷🇺, Ukrainian 🇺🇦, Arabic 🇸🇦, Hindi 🇮🇳, Polish 🇵🇱, and Chinese (Simplified) 🇨🇳.

> 🇧🇷 BR: Suporte completo a i18n com detecção dinâmica de idioma baseada na localidade do sistema. Todas as interfaces (popup, opções, sniffer, gerenciador de fila, página de boas-vindas) são traduzidas em tempo real. Idiomas suportados incluem Inglês 🇬🇧, Português (BR) 🇧🇷, Espanhol 🇪🇸, Francês 🇫🇷, Alemão 🇩🇪, Italiano 🇮🇹, Japonês 🇯🇵, Coreano 🇰🇷, Russo 🇷🇺, Ucraniano 🇺🇦, Árabe 🇸🇦, Hindi 🇮🇳, Polonês 🇵🇱 e Chinês (Simplificado) 🇨🇳.

• Security & Compliance / Segurança & Conformidade: No innerHTML usage (100% DOM-safe manipulation with createElement and textContent), Mozilla Store compliant, permission minimized, and data_collection_permissions properly configured.

> 🇧🇷 BR: Sem uso de innerHTML (100% manipulação DOM segura com createElement e textContent), em conformidade com a Mozilla Store, permissões minimizadas e data_collection_permissions configurada corretamente.

• Developer Tools / Ferramentas para Desenvolvedores: Comprehensive logging for debugging queue and sniffer systems, exposed sniffer API in console (window.__MPV_SNIFFER), well-commented code for easy maintenance, and modern ES5+ JavaScript with broad browser compatibility.

> 🇧🇷 BR: Logs abrangentes para depuração dos sistemas de fila e sniffer, API do sniffer exposta no console (window.__MPV_SNIFFER), código bem comentado para fácil manutenção e JavaScript ES5+ moderno com ampla compatibilidade de navegadores.

---

## 🛠️ Prerequisites (Fedora Linux) / 🛠️ Pré-requisitos (Fedora Linux)

Before installing the extension interface, you must ensure that your system has the media backend, the web extractor engine, and the D-Bus communication plugin installed.

> 🇧🇷 **BR:** Antes de instalar a interface da extensão, você deve garantir que seu sistema tenha o backend de mídia, o mecanismo de extração web e o plugin de comunicação D-Bus instalados.

Run the following command in your terminal:  
> 🇧🇷 **BR:** Execute o seguinte comando no seu terminal:

```bash
sudo dnf install mpv yt-dlp mpv-mpris
```

> ⚠️ **CRITICAL / CRÍTICO:** The `mpv-mpris` package is mandatory. Without it, the system Media Widget integration will fail, and background audio processes could get trapped in execution.
  
> 🇧🇷 **BR:** O pacote `mpv-mpris` é obrigatório. Sem ele, a integração com o Widget de Mídia do sistema falhará, e os processos de áudio em segundo plano podem ficar presos em execução.

---

## 🚀 Installation / 🚀 Instalação

### 1. Web Extension / 1. Extensão Web
Install the official extension front-end from the Mozilla Add-ons store:  
> 🇧🇷 **BR:** Instale o front-end oficial da extensão a partir da loja de Add-ons da Mozilla:

👉 [Get MPV Opener for Firefox](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) / [Baixar MPV Opener para Firefox](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/)

### 2. Native Messaging Host / 2. Host de Mensagens Nativo
Choose one of the methods below to configure the secure bridge between Firefox and your system's mpv player.  
> 🇧🇷 **BR:** Escolha um dos métodos abaixo para configurar a ponte segura entre o Firefox e o player mpv do seu sistema.

---

#### 🛠️ Method A: Automatic Installation (Recommended) / Método A: Instalação Automática (Recomendado)
Paste the following command into your terminal to download and run the automated script installer:  
> 🇧🇷 **BR:** Cole o seguinte comando no seu terminal para baixar e executar o instalador de script automatizado:

```bash
curl -sSL https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/install.sh | bash
```
---

#### 🛠️ Method B: Manual Installation / Método B: Instalação Manual
If you prefer to configure the bridge configuration files manually:  
> 🇧🇷 **BR:** Se você preferir configurar os arquivos de configuração da ponte manualmente:

Clone this repository:  
> 🇧🇷 **BR:** Clone este repositório:

```bash
git clone https://github.com/Lu15-F3/mpv-opener-for-firefox.git
cd mpv-opener-for-firefox
```

Copy the Python wrapper execution binary into your user bin folder:  
> 🇧🇷 **BR:** Copie o binário de execução do wrapper Python para a pasta bin do seu usuário:

```bash
mkdir -p ~/.local/bin
cp native-host/mpv_wrapper.py ~/.local/bin/mpv_wrapper.py
chmod +x ~/.local/bin/mpv_wrapper.py
```

Register the Native Messaging Manifest inside the Firefox target directory:  
> 🇧🇷 **BR:** Registre o Manifesto de Mensagens Nativo dentro do diretório de destino do Firefox:

```bash
mkdir -p ~/.mozilla/native-messaging-hosts
cp native-host/org.custom.mpv.json ~/.mozilla/native-messaging-hosts/org.custom.mpv.json
```

---

## 🗑️ Uninstallation / 🗑️ Desinstalação

Should you need to wipe out the local host integration configuration files completely from your user space:  
> 🇧🇷 **BR:** Caso você precise apagar completamente os arquivos de configuração de integração do host local do seu espaço de usuário:

### Automatic Removal / Remoção Automática

```bash
curl -sSL https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/uninstall.sh | bash
```

### Manual Removal / Remoção Manual

```bash
rm -f ~/.local/bin/mpv_wrapper.py
rm -f ~/.mozilla/native-messaging-hosts/org.custom.mpv.json
rm -f ~/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts/org.custom.mpv.json
```

---

## 📂 Repository Files / Arquivos deste Repositório

For backup purposes and transparency with the community, this repository contains:
> 🇧🇷 **BR:** Para fins de backup e transparência com a comunidade, este repositório contém:

* **mpv_wrapper.py** -> The Python script that runs on your Linux system. / O script Python que roda no seu Linux.
* **org.custom.mpv.json** -> The manifest file that you place inside Mozilla's hidden folder. / O manifesto que você coloca na pasta oculta do Mozilla.
* **manifest.json** e **background.js** -> The source code for the browser extension. / O código-fonte da extensão do navegador.

---

### 📦 Notes on Flatpak - Snap / Notas sobre Flatpak - Snap
This extension was originally designed for native (RPM/DEB) versions of Firefox and MPV. If you are using Flatpak versions, paths change and additional permissions are required due to system isolation:
> 🇧🇷 **BR:** Esta extensão foi projetada originalmente para as versões nativas (RPM/DEB) do Firefox e do MPV. Se você utiliza as versões em Flatpak, os caminhos mudam e permissões adicionais são necessárias devido ao isolamento do sistema:

* **Firefox in Flatpak:** The `org.custom.mpv.json` file must be moved to:
  `~/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts/`
  *(Note: Due to the sandbox, the JSON manifest must invoke the script using the `flatpak-spawn --host` command so it can execute outside the isolation).*

> 🇧🇷 **BR:** * **Firefox em Flatpak:** O arquivo `org.custom.mpv.json` deve ser movido para:
  `~/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts/`
  *(Nota: Por conta da sandbox, o manifesto JSON precisa invocar o script usando o comando `flatpak-spawn --host` para que ele seja executado fora do isolamento).*
  
* **MPV in Flatpak:** You must edit the `mpv_wrapper.py` script to call the player using the `flatpak run io.mpv.Mpv` command instead of just `mpv`.

> 🇧🇷 **BR:** * **MPV em Flatpak:** É necessário editar o script `mpv_wrapper.py` para chamar o player usando o comando `flatpak run io.mpv.Mpv` em vez de apenas `mpv`.

---

## 📄 License / 📄 Licença

This project is licensed under the MIT License - see the LICENSE file for details.  
> 🇧🇷 **BR:** Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para mais detalhes.
