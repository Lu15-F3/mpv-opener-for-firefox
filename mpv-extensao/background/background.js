// ============================================================
// background.js - MPV Opener for Firefox v7.0
// ============================================================

// ============================================================
// Queue Management System
// ============================================================
let queue = [];
let isQueueActive = false;
let isQueueModeEnabled = true;
let currentQueueIndex = 0;
let isProcessingQueue = false;
let queueCheckInterval = null;
let isFirstVideoProcessed = false;
let queueProcessingTimeout = null;
let maxQueueRetries = 3;

function loadQueueState() {
  browser.storage.local
    .get({
      queue: [],
      isQueueModeEnabled: true,
      isQueueActive: false,
      currentQueueIndex: 0,
      isFirstVideoProcessed: false,
    })
    .then(function (data) {
      queue = data.queue || [];
      isQueueModeEnabled =
        data.isQueueModeEnabled !== undefined ? data.isQueueModeEnabled : true;
      isQueueActive = data.isQueueActive || false;
      currentQueueIndex = data.currentQueueIndex || 0;
      isFirstVideoProcessed = data.isFirstVideoProcessed || false;
      updateQueueBadge();
    })
    .catch(function (err) {
      console.error("MPV Opener: Failed to load queue state:", err);
    });
}

function saveQueueState() {
  browser.storage.local
    .set({
      queue: queue,
      isQueueModeEnabled: isQueueModeEnabled,
      isQueueActive: isQueueActive,
      currentQueueIndex: currentQueueIndex,
      isFirstVideoProcessed: isFirstVideoProcessed,
    })
    .catch(function (err) {
      console.error("MPV Opener: Failed to save queue state:", err);
    });
}

function addToQueue(url, title) {
  if (!url) return queue.length;

  var exists = queue.some(function (item) {
    return item.url === url;
  });
  if (exists) {
    return queue.length;
  }

  queue.push({ url: url, title: title || url, addedAt: Date.now() });
  saveQueueState();
  updateQueueBadge();

  if (!isQueueActive && queue.length > 0) {
    startQueuePlayback();
  }

  return queue.length;
}

function removeFromQueue(index) {
  if (index >= 0 && index < queue.length) {
    var isCurrentItem = isQueueActive && index === currentQueueIndex;
    queue.splice(index, 1);
    if (isCurrentItem) {
      currentQueueIndex = Math.max(0, currentQueueIndex - 1);
    }
    saveQueueState();
    updateQueueBadge();
    return true;
  }
  return false;
}

function clearQueue() {
  queue = [];
  currentQueueIndex = 0;
  isQueueActive = false;
  isProcessingQueue = false;
  stopQueueMonitoring();
  saveQueueState();
  updateQueueBadge();
  isFirstVideoProcessed = false;
  saveQueueState();
}

function getNextInQueue() {
  if (currentQueueIndex < queue.length) {
    return queue[currentQueueIndex];
  }
  return null;
}

function advanceQueue() {
  currentQueueIndex++;
  saveQueueState();
  if (currentQueueIndex >= queue.length) {
    isQueueActive = false;
    isProcessingQueue = false;
    stopQueueMonitoring();
    saveQueueState();
    updateQueueBadge();
    return null;
  }
  return getNextInQueue();
}

function startQueuePlayback() {
  if (queue.length === 0 || isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;
  isQueueActive = true;

  if (currentQueueIndex >= queue.length) {
    currentQueueIndex = 0;
  }

  saveQueueState();
  updateQueueBadge();
  startQueueMonitoring();

  setTimeout(function () {
    var item = getNextInQueue();
    if (item) {
      playQueueItem(item);
    } else {
      isQueueActive = false;
      isProcessingQueue = false;
      saveQueueState();
      updateQueueBadge();
    }
  }, 300);
}

function playQueueItem(item, retryCount) {
  retryCount = retryCount || 0;

  if (!item) {
    isQueueActive = false;
    isProcessingQueue = false;
    saveQueueState();
    updateQueueBadge();
    return;
  }

  triggerMpvExecutionForQueue(item.url, item.title, function (success) {
    if (success) {
      // Avançar para o próximo item após sucesso
      setTimeout(function () {
        if (isQueueActive) {
          var nextItem = advanceQueue();
          if (nextItem) {
            playQueueItem(nextItem);
          } else {
            isQueueActive = false;
            isProcessingQueue = false;
            saveQueueState();
            updateQueueBadge();
          }
        } else {
          isProcessingQueue = false;
          saveQueueState();
          updateQueueBadge();
        }
      }, 2000);
    } else if (retryCount < maxQueueRetries) {
      // Tentar novamente com backoff exponencial
      var delay = Math.pow(2, retryCount) * 1000;
      console.log(
        "MPV Opener: Queue item failed, retrying in " +
          delay +
          "ms (attempt " +
          (retryCount + 1) +
          "/" +
          maxQueueRetries +
          ")",
      );
      setTimeout(function () {
        playQueueItem(item, retryCount + 1);
      }, delay);
    } else {
      // Falha após todas as tentativas - pular para o próximo
      console.error(
        "MPV Opener: Queue item failed after " +
          maxQueueRetries +
          " attempts, skipping",
      );
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.png"),
        title: "MPV Opener",
        message: "Failed to play: " + (item.title || item.url),
      });

      setTimeout(function () {
        if (isQueueActive) {
          var nextItem = advanceQueue();
          if (nextItem) {
            playQueueItem(nextItem);
          } else {
            isQueueActive = false;
            isProcessingQueue = false;
            saveQueueState();
            updateQueueBadge();
          }
        } else {
          isProcessingQueue = false;
          saveQueueState();
          updateQueueBadge();
        }
      }, 3000);
    }
  });
}

function playNextInQueue() {
  if (isProcessingQueue) {
    return false;
  }

  if (isQueueActive && queue.length > 0 && currentQueueIndex >= queue.length) {
    currentQueueIndex = 0;
    saveQueueState();
  }

  startQueuePlayback();
  return true;
}

function stopQueue() {
  isQueueActive = false;
  isProcessingQueue = false;
  if (queueProcessingTimeout) {
    clearTimeout(queueProcessingTimeout);
    queueProcessingTimeout = null;
  }
  stopQueueMonitoring();
  saveQueueState();
  updateQueueBadge();
}

function startQueueMonitoring() {
  stopQueueMonitoring();
  queueCheckInterval = setInterval(function () {
    if (isQueueActive && queue.length > 0) {
      updateQueueBadge();
    }
  }, 10000);
}

function stopQueueMonitoring() {
  if (queueCheckInterval) {
    clearInterval(queueCheckInterval);
    queueCheckInterval = null;
  }
  if (queueProcessingTimeout) {
    clearTimeout(queueProcessingTimeout);
    queueProcessingTimeout = null;
  }
}

function triggerMpvExecutionForQueue(url, title, callback) {
  browser.storage.local
    .get({
      displayMode: "standard",
      initialState: "playing",
      alwaysOnTop: false,
      audioDevice: "",
      aggressiveCache: false,
      inhibitSleep: true,
      maxResolution: "best",
      autoSubtitles: false,
    })
    .then(function (prefs) {
      var payload = {
        url: url,
        fullscreen: prefs.displayMode === "fullscreen",
        pip: prefs.displayMode === "pip",
        paused: prefs.initialState === "paused",
        alwaysOnTop: prefs.alwaysOnTop,
        audioOnly: false,
        audioDevice: prefs.audioDevice,
        aggressiveCache: prefs.aggressiveCache,
        inhibitSleep: prefs.inhibitSleep,
        maxResolution: prefs.maxResolution,
        autoSubtitles: prefs.autoSubtitles,
        fromQueue: true,
      };

      browser.runtime
        .sendNativeMessage("org.custom.mpv", payload)
        .then(function (response) {
          if (callback) {
            callback(true);
          }
        })
        .catch(function (err) {
          console.error("MPV Opener: Queue native messaging error:", err);
          if (callback) {
            callback(false);
          }
        });
    })
    .catch(function (err) {
      console.error("MPV Opener: Queue prefs loading error:", err);
      if (callback) {
        callback(false);
      }
    });
}

function updateQueueBadge() {
  var count = queue.length;
  if (count > 0 && isQueueActive) {
    browser.browserAction.setBadgeText({ text: String(count) });
    browser.browserAction.setBadgeBackgroundColor({ color: "#7aa2f7" });
  } else if (count > 0) {
    browser.browserAction.setBadgeText({ text: String(count) });
    browser.browserAction.setBadgeBackgroundColor({ color: "#565f89" });
  } else {
    browser.browserAction.setBadgeText({ text: "" });
  }
}

// ============================================================
// Native Messaging Handler
// ============================================================
function triggerMpvExecution(action, url, title, tabId, fromHistory) {
  browser.storage.local
    .get({
      displayMode: "standard",
      initialState: "playing",
      alwaysOnTop: false,
      audioDevice: "",
      closeTab: false,
      aggressiveCache: false,
      inhibitSleep: true,
      maxResolution: "best",
      autoSubtitles: false,
      queueModeEnabled: true,
    })
    .then(function (prefs) {
      var isAudioOnly = action === "sendAudioToMpv";
      var queueModeEnabled =
        prefs.queueModeEnabled !== undefined ? prefs.queueModeEnabled : true;

      if (fromHistory === "queue") {
        return;
      }

      // Primeiro vídeo: Sempre reproduzir diretamente, NUNCA adicionar à fila
      if (!isFirstVideoProcessed) {
        isFirstVideoProcessed = true;
        saveQueueState();

        sendToMpv(url, prefs, isAudioOnly, tabId, title, fromHistory);
        return;
      }

      // Vídeos subsequentes: Se o modo fila estiver ativado, adicionar à fila
      if (queueModeEnabled && isFirstVideoProcessed) {
        var count = addToQueue(url, title);
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon-48.png"),
          title: "MPV Opener",
          message: "Added to queue (" + count + " items)",
        });
        if (prefs.closeTab && tabId) {
          browser.tabs.remove(tabId);
        }
        return;
      }

      // Modo fila desativado - reproduzir diretamente
      sendToMpv(url, prefs, isAudioOnly, tabId, title, fromHistory);
    })
    .catch(function (err) {
      console.error("MPV Opener: Prefs loading error:", err);
      showErrorNotification("Failed to load preferences");
    });
}

function sendToMpv(url, prefs, isAudioOnly, tabId, title, fromHistory) {
  var payload = {
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
    autoSubtitles: prefs.autoSubtitles,
    fromQueue: false,
  };

  browser.runtime
    .sendNativeMessage("org.custom.mpv", payload)
    .then(function (response) {
      if (!fromHistory) {
        addToHistory(url, title);
      }
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.png"),
        title: "MPV Opener",
        message:
          browser.i18n.getMessage("sendingNotification") || "Sending to mpv...",
      });
      if (prefs.closeTab && tabId && !fromHistory) {
        browser.tabs.remove(tabId);
      }
    })
    .catch(function (err) {
      console.error("MPV Opener: Native Messaging Error:", err);
      showErrorNotification(
        "Failed to send to mpv. Check if Native Host is installed.",
      );
    });
}

function showErrorNotification(message) {
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("icons/icon-48.png"),
    title: "MPV Opener",
    message: message,
  });
}

// ============================================================
// History Management
// ============================================================
function addToHistory(url, title) {
  browser.storage.local
    .get({ history: [] })
    .then(function (data) {
      var history = data.history;
      // Remover duplicatas
      history = history.filter(function (item) {
        return item.url !== url;
      });
      history.unshift({ url: url, title: title || url, timestamp: Date.now() });
      if (history.length > 10) history.pop();
      browser.storage.local.set({ history: history });
    })
    .catch(function (err) {
      console.error("MPV Opener: Failed to add to history:", err);
    });
}

// ============================================================
// Player Status via IPC
// ============================================================
function getPlayerStatus() {
  return new Promise(function (resolve) {
    browser.runtime
      .sendNativeMessage("org.custom.mpv", { command: "status" })
      .then(function (response) {
        if (response && response.status === "success" && response.data) {
          var status = {
            pause:
              response.data.pause !== undefined ? response.data.pause : true,
            timePos: response.data["time-pos"] || 0,
            duration: response.data.duration || 0,
            filename: response.data.filename || "",
            mediaTitle:
              response.data["media-title"] || response.data.filename || "",
            volume: response.data.volume || 100,
          };
          resolve({ success: true, status: status });
        } else {
          resolve({ success: false });
        }
      })
      .catch(function (err) {
        console.log("MPV Opener: Status error:", err);
        resolve({ success: false });
      });
  });
}

// ============================================================
// Função para enviar comandos ao player
// ============================================================
function sendPlayerCommand(command, params) {
  var payload = {
    command: "player",
    playerCommand: command,
    params: params || [],
  };

  browser.runtime
    .sendNativeMessage("org.custom.mpv", payload)
    .catch(function (err) {
      console.error("MPV Opener: Player command error:", err);
    });
}

// ============================================================
// Content Sniffer - Open Sniffer Mode
// ============================================================
function openSnifferPage(tabId) {
  browser.tabs.create({
    url: browser.runtime.getURL("sniffer/sniffer.html?tabId=" + tabId),
  });

  browser.tabs
    .executeScript(tabId, {
      file: "sniffer/content-sniffer.js",
    })
    .catch(function (err) {
      console.log("MPV Opener: Content script injection failed:", err);
    });
}

// ============================================================
// Context Menus
// ============================================================
browser.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    browser.runtime
      .sendNativeMessage("org.custom.mpv", { url: "" })
      .then(function (response) {
        console.log("MPV Opener: Native Messaging bridge detected.");
      })
      .catch(function (error) {
        console.warn(
          "MPV Opener: Native Messaging Host not installed. Opening help page...",
          error,
        );
        browser.tabs.create({
          url: browser.runtime.getURL("welcome/welcome.html"),
        });
      });
  }

  // Limpar menus antigos antes de criar novos
  browser.contextMenus
    .removeAll()
    .then(function () {
      browser.contextMenus.create({
        id: "open-preferences",
        title: browser.i18n.getMessage("contextMenuOptions") || "Options",
        contexts: ["browser_action"],
      });

      browser.contextMenus.create({
        id: "ctx-send-video",
        title: "🎬 " + (browser.i18n.getMessage("sendToMpv") || "Send to mpv"),
        contexts: ["page", "link", "video"],
      });

      browser.contextMenus.create({
        id: "ctx-send-audio",
        title:
          "🎵 " +
          (browser.i18n.getMessage("sendAudioToMpv") || "Send audio to mpv"),
        contexts: ["page", "link", "video"],
      });

      browser.contextMenus.create({
        id: "ctx-sniff-media",
        title: browser.i18n.getMessage("ctxSniffMedia") || "Sniff Media",
        contexts: ["page"],
      });

      browser.contextMenus.create({
        id: "ctx-view-queue",
        title: browser.i18n.getMessage("viewQueue") || "View Queue",
        contexts: ["browser_action"],
      });
    })
    .catch(function (err) {
      console.error("MPV Opener: Failed to create context menus:", err);
    });

  loadQueueState();
  updateQueueBadge();
});

browser.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "open-preferences") {
    browser.runtime.openOptionsPage();
    return;
  }

  if (info.menuItemId === "ctx-sniff-media" && tab) {
    openSnifferPage(tab.id);
    return;
  }

  if (info.menuItemId === "ctx-view-queue") {
    browser.tabs.create({
      url: browser.runtime.getURL("queue/queue.html"),
    });
    return;
  }

  var targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;

  if (info.menuItemId === "ctx-send-video") {
    triggerMpvExecution(
      "sendToMpv",
      targetUrl,
      tab ? tab.title : targetUrl,
      tab ? tab.id : null,
      false,
    );
  } else if (info.menuItemId === "ctx-send-audio") {
    triggerMpvExecution(
      "sendAudioToMpv",
      targetUrl,
      tab ? tab.title : targetUrl,
      tab ? tab.id : null,
      false,
    );
  }
});

// ============================================================
// Message Listener
// ============================================================
browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  try {
    if (message.action === "sendToMpv" || message.action === "sendAudioToMpv") {
      triggerMpvExecution(
        message.action,
        message.url,
        message.title,
        message.tabId,
        message.fromHistory,
      );
      sendResponse({ success: true });
    } else if (message.action === "openSniffer" && message.tabId) {
      openSnifferPage(message.tabId);
      sendResponse({ success: true });
    } else if (message.action === "getQueue") {
      sendResponse({
        queue: queue,
        isQueueActive: isQueueActive,
        isQueueModeEnabled: isQueueModeEnabled,
        currentQueueIndex: currentQueueIndex,
      });
    } else if (
      message.action === "removeFromQueue" &&
      message.index !== undefined
    ) {
      removeFromQueue(message.index);
      sendResponse({ success: true });
    } else if (message.action === "clearQueue") {
      clearQueue();
      isFirstVideoProcessed = false;
      saveQueueState();
      sendResponse({ success: true });
    } else if (message.action === "toggleQueueMode") {
      isQueueModeEnabled = !isQueueModeEnabled;
      if (!isQueueModeEnabled && isQueueActive) {
        stopQueue();
      }
      if (!isQueueModeEnabled) {
        isFirstVideoProcessed = false;
      }
      saveQueueState();
      sendResponse({ isQueueModeEnabled: isQueueModeEnabled });
    } else if (message.action === "stopQueue") {
      stopQueue();
      sendResponse({ success: true });
    } else if (message.action === "playNext") {
      var result = playNextInQueue();
      sendResponse({ success: result });
    } else if (message.action === "playPrev") {
      if (currentQueueIndex > 0) {
        currentQueueIndex--;
        saveQueueState();
        if (isQueueActive) {
          stopQueue();
          startQueuePlayback();
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    } else if (message.action === "queueStatus") {
      sendResponse({
        queue: queue,
        isQueueActive: isQueueActive,
        isQueueModeEnabled: isQueueModeEnabled,
        currentQueueIndex: currentQueueIndex,
        count: queue.length,
        isFirstVideoProcessed: isFirstVideoProcessed,
      });
    } else if (message.action === "getPlayerStatus") {
      getPlayerStatus().then(function (result) {
        sendResponse(result);
      });
      return true;
    } else if (message.action === "playerCommand") {
      sendPlayerCommand(message.command, message.params);
      sendResponse({ success: true });
    } else if (message.action === "scrapedVideoUrl") {
      // Recebido do content-sniffer.js
      if (message.url) {
        // Mostrar no console para debug
        console.log(
          "MPV Opener: Scraped URL:",
          message.url,
          "Source:",
          message.source || "unknown",
        );
        // Opcional: Adicionar à fila ou reproduzir diretamente
        // Por enquanto, apenas registrar
      }
      sendResponse({ success: true });
    }
  } catch (err) {
    console.error("MPV Opener: Message handling error:", err);
    sendResponse({ success: false, error: err.message });
  }

  return true;
});

// ============================================================
// Keyboard Shortcuts
// ============================================================
browser.commands.onCommand.addListener(function (command) {
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(function (tabs) {
      var activeTab = tabs[0];
      if (!activeTab) return;

      if (command === "shortcut-send-video") {
        triggerMpvExecution(
          "sendToMpv",
          activeTab.url,
          activeTab.title,
          activeTab.id,
          false,
        );
      } else if (command === "shortcut-send-audio") {
        triggerMpvExecution(
          "sendAudioToMpv",
          activeTab.url,
          activeTab.title,
          activeTab.id,
          false,
        );
      } else if (command === "shortcut-open-sniffer") {
        openSnifferPage(activeTab.id);
      }
    })
    .catch(function (err) {
      console.error("MPV Opener: Command error:", err);
    });
});

// ============================================================
// Initialization
// ============================================================
loadQueueState();
updateQueueBadge();

console.log("MPV Opener v7.0 loaded");
