// Inicializar os menus de contexto e testar a ponte Native Messaging na instalação
browser.runtime.onInstalled.addListener((details) => {
  // Executa o teste apenas na primeira instalação
  if (details.reason === "install") {
    
    // Envia uma mensagem vazia de ping para testar o host Python
    browser.runtime.sendNativeMessage("org.custom.mpv", { url: "" })
      .then((response) => {
        // Se responder (mesmo que com status error por falta de URL), significa que a ponte existe!
        console.log("Ponte Native Messaging detectada com sucesso.");
      })
      .catch((error) => {
        // Se cair aqui, o manifest JSON ou o script python não existem no PC do usuário
        console.warn("Native Messaging Host não instalado. Abrindo página de ajuda...", error);
        
        // Abre a página welcome.html em uma nova aba para guiar o usuário
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

  // Menu de Contexto 2: Na página/links/mídias (Enviar Vídeo)
  browser.contextMenus.create({
    id: "ctx-send-video",
    title: "🎬 Enviar Vídeo para mpv",
    contexts: ["page", "link", "video"]
  });

  // Menu de Contexto 3: Na página/links/mídias (Enviar Áudio)
  browser.contextMenus.create({
    id: "ctx-send-audio",
    title: "🎵 Enviar Áudio para mpv",
    contexts: ["page", "link", "video"]
  });
});

// Processar cliques em TODOS os menus de contexto
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-preferences") {
    browser.runtime.openOptionsPage();
    return;
  }

  // Determinar a URL alvo baseada em onde o usuário clicou
  let targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;
  
  if (info.menuItemId === "ctx-send-video") {
    triggerMpvExecution("sendToMpv", targetUrl, tab ? tab.title : targetUrl, tab ? tab.id : null, false);
  } else if (info.menuItemId === "ctx-send-audio") {
    triggerMpvExecution("sendAudioToMpv", targetUrl, tab ? tab.title : targetUrl, tab ? tab.id : null, false);
  }
});

function addToHistory(url, title) {
  browser.storage.local.get({ history: [] }).then((data) => {
    let history = data.history.filter(item => item.url !== url);
    history.unshift({ url: url, title: title || url, timestamp: Date.now() });
    if (history.length > 10) history.pop();
    browser.storage.local.set({ history: history });
  });
}

// Escuta requisições vindas do Popup da extensão
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendToMpv" || message.action === "sendAudioToMpv") {
    triggerMpvExecution(message.action, message.url, message.title, message.tabId, message.fromHistory);
  }
});

// Função centralizada de disparo que unifica cliques no popup e menus de contexto
function triggerMpvExecution(action, url, title, tabId, fromHistory) {
  browser.storage.local.get({
    displayMode: "standard",
    initialState: "playing",
    alwaysOnTop: false,
    audioDevice: "",
    closeTab: false,
    aggressiveCache: false,
    inhibitSleep: true,
    maxResolution: "best",      // Nova pref v4.0
    autoSubtitles: false        // Nova pref v4.0
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

    browser.runtime.sendNativeMessage("org.custom.mpv", payload).then((response) => {
      addToHistory(url, title);

      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.png"),
        title: "MPV Opener",
        message: browser.i18n.getMessage("sendingNotification")
      });

      if (prefs.closeTab && tabId && !fromHistory) {
        browser.tabs.remove(tabId);
      }
    }).catch((error) => {
      console.error("Native Messaging Error:", error);
    });
  });
}