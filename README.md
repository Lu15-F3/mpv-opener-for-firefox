# MPV Opener for Firefox 🎬🎵 / MPV Opener para Firefox 🎬🎵

[![Versão](https://img.shields.io/amo/v/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) [![Usuários](https://img.shields.io/amo/users/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) [![Avaliações](https://img.shields.io/amo/rating/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/) [![Estrelas](https://img.shields.io/amo/stars/mpv-opener%40lu15-f3-dev.org?style=flat-square&color=ff4500&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/)

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
