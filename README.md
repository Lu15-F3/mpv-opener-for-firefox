# MPV Opener for Firefox 🎬🎵 / MPV Opener para Firefox 🎬🎵

A lightweight Firefox extension designed for Fedora Linux and KDE Plasma that allows you to seamlessly redirect video streams, audio tracks, and full playlists from your browser directly into your native local mpv media player.

> 🇧🇷 **BR:** Uma extensão leve para o Firefox projetada para o Fedora Linux e KDE Plasma que permite redirecionar perfeitamente transmissões de vídeo, faixas de áudio e playlists completas do seu navegador diretamente para o seu player de mídia local e nativo mpv.

Save system resources (CPU/RAM), bypass heavy web player scripts, and enjoy advanced hardware acceleration, custom shaders, and native desktop integration.

> 🇧🇷 **BR:** Economize recursos do sistema (CPU/RAM), ignore scripts pesados de players da web e desfrute de aceleração de hardware avançada, shaders personalizados e integração nativa com o desktop.

---

## ✨ Features / ✨ Recursos

* **Instant Disparage / Envio Instantâneo:** Send the active tab, video element, or any link to mpv via click or context menus. / Envie a aba ativa, elemento de vídeo ou qualquer link para o mpv por meio de cliques ou menus de contexto.

* **Listen Only Mode / Modo Apenas Áudio:** Play background streams with video track disabled. Completely hidden window controlled globally by your OS. / Reproduza transmissões em segundo plano com a faixa de vídeo desativada. Janela completamente oculta controlada globalmente pelo seu sistema operacional.

* **KDE Plasma & MPRIS Integration / Integração com KDE Plasma & MPRIS:** Fully integrates into the native system Media Widget (system tray) and obeys hardware multimedia keys (Play/Pause/Skip), even in Audio Only mode. / Integra-se totalmente ao Widget de Mídia nativo do sistema (bandeja do sistema) e obedece às teclas multimídia físicas (Play/Pause/Pular), mesmo no modo Apenas Áudio.

* **Smart Queueing / Fila Inteligente:** Clicking to send a new video while mpv is already active will automatically append it to your active playing queue (via IPC Socket). / Clicar para enviar um novo vídeo enquanto o mpv já estiver ativo irá adicioná-lo automaticamente à sua fila de reprodução ativa (via IPC Socket).

* **Native Playlist Support / Suporte Nativo a Playlists:** Real playlists (e.g., YouTube lists) are parsed automatically and play sequentially. / Playlists reais (ex: listas do YouTube) são analisadas automaticamente e reproduzidas sequencialmente.

* **Quality Cap Control / Controle de Limite de Qualidade:** Restricty maximum stream resolutions (1080p, 720p, 480p) dynamically from the extension popup. / Restrinja as resoluções máximas de transmissão (1080p, 720p, 480p) dinamicamente a partir do popup da extensão.

* **Advanced Features / Recursos Avançados:** Anti-buffering aggressive network cache, embedded/auto-generated subtitle loader, and automatic system screensaver/sleep inhibition during playback. / Cache de rede agressivo anti-buffering, carregador de legendas embutidas/auto-geradas e inibição automática do protetor de tela/suspensão do sistema durante a reprodução.

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

👉 [Get MPV Firefox Opener for Firefox (Replace with your real AMO link)](#) / [Baixar MPV Firefox Opener para Firefox (Substitua pelo seu link real da AMO)](#)

### 2. Native Messaging Host / 2. Host de Mensagens Nativo
Choose one of the methods below to configure the secure bridge between Firefox and your system's mpv player.  
> 🇧🇷 **BR:** Escolha um dos métodos abaixo para configurar a ponte segura entre o Firefox e o player mpv do seu sistema.

#### Method A: Automatic Installation (Recommended) / Método A: Instalação Automática (Recomendado)
Paste the following command into your terminal to download and run the automated script installer:  
> 🇧🇷 **BR:** Cole o seguinte comando no seu terminal para baixar e executar o instalador de script automatizado:

```bash
curl -sSL https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/install.sh | bash
```

#### Method B: Manual Installation / Método B: Instalação Manual
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
```

---

## 📄 License / 📄 Licença

This project is licensed under the MIT License - see the LICENSE file for details.  
> 🇧🇷 **BR:** Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para mais detalhes.
