// Inicializar os menus de contexto e testar a ponte Native Messaging na instalação
browser.runtime.onInstalled.addListener((details) => {
  // Executa o teste apenas na primeira instalação
  if (details.reason === "install") {
    browser.runtime.sendNativeMessage("org.custom.mpv", { url: "" })
      .then((response) => {
        console.log("Ponte Native Messaging detectada com sucesso.");
      })
      .catch((error) => {
        console.warn("Native Messaging Host não instalado. Abrindo página de ajuda...", error);
        browser.tabs.create({
          url: browser.runtime.getURL("welcome/welcome.html")
        });
      });
  }

  // Menu de Contexto 1: No ícone da extensão (Preferências)
  browser.contextMenus.create({
    id: "open-preferences",
    title: browser.i18n.getMessage("contextMenuOptions"),
    contexts: ["browser_action"]
  });

  // Menu de Contexto 2: Enviar Vídeo Direto
  browser.contextMenus.create({
    id: "ctx-send-video",
    title: "🎬 Enviar Vídeo para mpv",
    contexts: ["page", "link", "video"]
  });

  // Menu de Contexto 3: Enviar Apenas Áudio
  browser.contextMenus.create({
    id: "ctx-send-audio",
    title: "🎵 Enviar Áudio para mpv",
    contexts: ["page", "link", "video"]
  });

  // Menu de Contexto 4: MODO PESCA
  browser.contextMenus.create({
    id: "ctx-sniff-media",
    title: browser.i18n.getMessage("ctxSniffMedia"),
    contexts: ["page"]
  });
});

// NOVA FUNÇÃO ATUALIZADA: Abre a aba do pescador e injeta o extrator local (Content Script)
function openSnifferPage(tabId) {
  // 1. Abre a tela do Modo Pesca
  browser.tabs.create({
    url: browser.runtime.getURL(`sniffer/sniffer.html?tabId=${tabId}`)
  });

  // 2. Injeta um scanner em tempo real na página do vídeo para ler o DOM (HTML)
  browser.tabs.executeScript(tabId, {
    code: `
      (function() {
        // Varre a página procurando tags de vídeo ativas
        document.querySelectorAll('video, source').forEach(el => {
          if (el.src) {
            browser.runtime.sendMessage({ action: "scrapedVideoUrl", url: el.src });
          }
        });

        // Monitora dinamicamente caso o player mude o link na memória enquanto roda
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.target.tagName === 'VIDEO' && mutation.attributeName === 'src') {
              browser.runtime.sendMessage({ action: "scrapedVideoUrl", url: mutation.target.src });
            }
          });
        });
        
        document.querySelectorAll('video').forEach(video => {
          observer.observe(video, { attributes: true });
        });
      })();
    `
  }).catch(err => console.log("Aba não suporta injeção de script direto (ex: páginas internas do Firefox):", err));
}

// Escuta cliques nos Menus de Contexto do botão direito
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-preferences") {
    browser.runtime.openOptionsPage();
    return;
  }
  
  // Ativa o modo pesca quando clicado via botão direito na página
  if (info.menuItemId === "ctx-sniff-media" && tab) {
    openSnifferPage(tab.id);
    return;
  }

  let targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;
  
  if (info.menuItemId === "ctx-send-video") {
    triggerMpvExecution("sendToMpv", targetUrl, tab ? tab.title : targetUrl, tab ? tab.id : null, false);
  } else if (info.menuItemId === "ctx-send-audio") {
    triggerMpvExecution("sendAudioToMpv", targetUrl, tab ? tab.title : targetUrl, tab ? tab.id : null, false);
  }
});

// Escuta requisições vindas dos Popups ou Scripts internos da Extensão
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendToMpv" || message.action === "sendAudioToMpv") {
    triggerMpvExecution(message.action, message.url, message.title, message.tabId, message.fromHistory);
  } else if (message.action === "openSniffer" && message.tabId) {
    openSnifferPage(message.tabId);
  }
});

// Função interna de histórico
function addToHistory(url, title) {
  browser.storage.local.get({ history: [] }).then((data) => {
    let history = data.history;
    history.unshift({ url, title, timestamp: Date.now() });
    if (history.length > 10) history.pop(); // Limita em 10 itens
    browser.storage.local.set({ history });
  });
}

// Executora principal conectada com Native Host e Notificações operacionais
function triggerMpvExecution(action, url, title, tabId, fromHistory) {
  browser.storage.local.get({
    displayMode: "standard",
    initialState: "playing",
    alwaysOnTop: false,
    audioDevice: "",
    closeTab: false,
    aggressiveCache: false,
    inhibitSleep: true,
    maxResolution: "best",
    autoSubtitles: false
  }).then((prefs) => {
    
    const isAudioOnly = (action === "sendAudioToMpv");

    const payload = {
      url: url,
      fullscreen: prefs.displayMode === "fullscreen",
      pip: prefs.displayMode === "pip",
      paused: prefs.initialState === "paused",
      alwaysOnTop: prefs.alwaysOnTop,
      audioOnly: isAudioOnly,
      audioDevice: prefs.audioDevice,
      aggressiveCache: prefs.aggressiveCache,
      inhibitSleep: prefs.inhibitSleep,
      maxResolution: prefs.maxResolution,
      autoSubtitles: prefs.autoSubtitles
    };

    browser.runtime.sendNativeMessage("org.custom.mpv", payload)
      .then((response) => {
        // Notificação Nativa do Sistema
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon-48.png"),
          title: "MPV Opener",
          message: browser.i18n.getMessage("sendingNotification")
        });

        addToHistory(url, title);

        if (prefs.closeTab && tabId) {
          browser.tabs.remove(tabId);
        }
      })
      .catch((err) => {
        console.error("Native Messaging Error:", err);
      });
  });
}

// --- ESCUTA DE ATALHOS DE TECLADO (COMMANDS API) ---
browser.commands.onCommand.addListener((command) => {
  // Pega a aba que está atualmente ativa e focada pelo usuário
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) return;

    if (command === "shortcut-send-video") {
      // Dispara o envio do vídeo usando a URL da página principal
      triggerMpvExecution("sendToMpv", activeTab.url, activeTab.title, activeTab.id, false);
    } 
    else if (command === "shortcut-send-audio") {
      // Dispara o envio do áudio usando a URL da página principal
      triggerMpvExecution("sendAudioToMpv", activeTab.url, activeTab.title, activeTab.id, false);
    } 
    else if (command === "shortcut-open-sniffer") {
      // Abre a página do Modo Pesca passando o ID da aba ativa
      openSnifferPage(activeTab.id);
    }
  }).catch((err) => {
    console.error("Erro ao processar comando de atalho:", err);
  });
});