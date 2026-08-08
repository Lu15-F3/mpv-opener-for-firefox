// ============================================================
// background.js - MPV Opener for Firefox v7.2
// ============================================================

// ============================================================
// Version Constants
// ============================================================
const EXTENSION_VERSION = "7.0.2";
const MIN_WRAPPER_VERSION = "7.0.2";

// ============================================================
// Version Check System
// ============================================================
function checkWrapperVersion() {
  browser.storage.local
    .get({
      wrapperVersion: null,
      versionCheckDone: false,
    })
    .then(function (data) {
      if (data.versionCheckDone) {
        return;
      }

      browser.runtime
        .sendNativeMessage("org.custom.mpv", {
          url: "",
          extension_version: EXTENSION_VERSION,
        })
        .then(function (response) {
          if (response && response.wrapper_version) {
            browser.storage.local.set({
              wrapperVersion: response.wrapper_version,
              wrapperCheckDate: Date.now(),
            });

            if (response.min_extension_version) {
              checkCompatibility(response);
            }

            if (response.update_url) {
              browser.storage.local.set({
                wrapperUpdateUrl: response.update_url,
              });
            }
          }
        })
        .catch(function (err) {
          console.log("MPV Opener: Failed to check wrapper version:", err);
        });
    });
}

function checkCompatibility(response) {
  const wrapperVer = response.wrapper_version;
  const minExtVer = response.min_extension_version;

  function compareVersions(v1, v2) {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  if (compareVersions(wrapperVer, minExtVer) < 0) {
    showUpdateNotification(wrapperVer, minExtVer);
  }
}

function showUpdateNotification(currentVer, requiredVer) {
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("icons/icon-48.png"),
    title: "⚠️ MPV Opener - Update Required",
    message: `Your native host (v${currentVer}) is outdated. Please update to v${requiredVer} or newer.`,
  });

  browser.browserAction.setBadgeText({ text: "!" });
  browser.browserAction.setBadgeBackgroundColor({ color: "#f7768e" });

  browser.storage.local.set({
    wrapperUpdatePending: true,
    wrapperCurrentVer: currentVer,
    wrapperRequiredVer: requiredVer,
  });
}

// ============================================================
// Verificação periódica de atualizações (a cada 7 dias)
// ============================================================
function scheduleVersionCheck() {
  const CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000;

  checkWrapperVersion();

  setInterval(function () {
    checkWrapperVersion();
  }, CHECK_INTERVAL);
}

scheduleVersionCheck();

// ============================================================
// History Cleanup System
// ============================================================

// Carregar configurações de limpeza
function loadCleanupSettings() {
  return browser.storage.local.get({
    historyCleanupMode: "manual",
    historyRetention: 10,
    lastCleanupDate: null
  }).catch(function(err) {
    console.error("MPV Opener: Failed to load cleanup settings:", err);
  });
}

// Função principal de limpeza
function cleanHistory() {
  return browser.storage.local.get({ history: [] }).then(function(data) {
    var history = data.history || [];
    var originalLength = history.length;
    
    // Carregar configurações
    return browser.storage.local.get({
      historyRetention: 10,
      historyCleanupMode: "manual"
    }).then(function(settings) {
      var retention = settings.historyRetention;
      
      // Se retention = 0, manter todos (sem limite)
      if (retention === 0) {
        return { removed: 0, kept: originalLength };
      }
      
      // Manter apenas os N mais recentes
      if (history.length > retention) {
        var removed = history.splice(retention);
        var removedCount = removed.length;
        
        // Salvar histórico atualizado e data
        return browser.storage.local.set({ history: history }).then(function() {
          browser.storage.local.set({ lastCleanupDate: Date.now() });
          console.log("MPV Opener: Cleaned " + removedCount + " old history entries");
          return { removed: removedCount, kept: history.length };
        });
      } else {
        return { removed: 0, kept: history.length };
      }
    });
  }).catch(function(err) {
    console.error("MPV Opener: Failed to clean history:", err);
    return { removed: 0, kept: 0 };
  });
}

// Verificar se deve limpar baseado no modo
function checkAndCleanHistory() {
  browser.storage.local.get({
    historyCleanupMode: "manual",
    historyRetention: 10,
    lastCleanupDate: null
  }).then(function(settings) {
    var mode = settings.historyCleanupMode;
    
    // Se for manual ou onClose, não fazer limpeza agendada
    if (mode === "manual" || mode === "onClose") {
      return;
    }
    
    // Verificar tempo decorrido
    var lastDate = settings.lastCleanupDate || 0;
    var now = Date.now();
    var shouldClean = false;
    
    switch(mode) {
      case "daily":
        shouldClean = (now - lastDate) > 24 * 60 * 60 * 1000;
        break;
      case "weekly":
        shouldClean = (now - lastDate) > 7 * 24 * 60 * 60 * 1000;
        break;
      case "monthly":
        shouldClean = (now - lastDate) > 30 * 24 * 60 * 60 * 1000;
        break;
    }
    
    if (shouldClean) {
      console.log("MPV Opener: Running scheduled history cleanup (" + mode + ")");
      cleanHistory();
    }
  }).catch(function(err) {
    console.error("MPV Opener: Failed to check cleanup:", err);
  });
}

// Limpeza manual (chamada pelo usuário)
function cleanHistoryNow() {
  return cleanHistory().then(function(result) {
    return result;
  });
}

// Agendar verificação periódica
function scheduleCleanupCheck() {
  setInterval(function() {
    checkAndCleanHistory();
  }, 60 * 60 * 1000); // 1 hora
}

scheduleCleanupCheck();

// Evento: Startup do Navegador
browser.runtime.onStartup.addListener(function() {
  console.log("MPV Opener: Browser started, checking history cleanup...");
  setTimeout(checkAndCleanHistory, 5000);
});

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
  isFirstVideoProcessed = false;
  saveQueueState();
  updateQueueBadge();
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
      initialVolume: 50,
      pipCorner: "bottomRight",
      pipSize: 25,
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
        extension_version: EXTENSION_VERSION,
        initialVolume: prefs.initialVolume || 50,
        pipCorner: prefs.pipCorner || "bottomRight",
        pipSize: prefs.pipSize || 25,
      };

      browser.runtime
        .sendNativeMessage("org.custom.mpv", payload)
        .then(function (response) {
          if (response && response.status === "incompatible") {
            showUpdateNotification(
              response.wrapper_version || "unknown",
              response.min_extension_version || "unknown",
            );
            if (callback) callback(false);
            return;
          }
          if (callback) callback(true);
        })
        .catch(function (err) {
          console.error("MPV Opener: Queue native messaging error:", err);
          if (callback) callback(false);
        });
    })
    .catch(function (err) {
      console.error("MPV Opener: Queue prefs loading error:", err);
      if (callback) callback(false);
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
      initialVolume: 50,
      pipCorner: "bottomRight",
      pipSize: 25,
    })
    .then(function (prefs) {
      var isAudioOnly = action === "sendAudioToMpv";
      var queueModeEnabled =
        prefs.queueModeEnabled !== undefined ? prefs.queueModeEnabled : true;

      if (fromHistory === "queue") {
        return;
      }

      if (!isFirstVideoProcessed) {
        isFirstVideoProcessed = true;
        saveQueueState();
        sendToMpv(url, prefs, isAudioOnly, tabId, title, fromHistory);
        return;
      }

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
    extension_version: EXTENSION_VERSION,
    initialVolume: prefs.initialVolume || 50,
    pipCorner: prefs.pipCorner || "bottomRight",
    pipSize: prefs.pipSize || 25,
  };

  browser.runtime
    .sendNativeMessage("org.custom.mpv", payload)
    .then(function (response) {
      if (response && response.status === "incompatible") {
        showUpdateNotification(
          response.wrapper_version || "unknown",
          response.min_extension_version || "unknown",
        );
        return;
      }

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
// Player Command Function
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
// Context Menus & Life Cycle
// ============================================================
browser.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    browser.runtime
      .sendNativeMessage("org.custom.mpv", {
        url: "",
        extension_version: EXTENSION_VERSION,
      })
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

      browser.contextMenus.create({
        id: "ctx-check-updates",
        title:
          "🔍 " +
          (browser.i18n.getMessage("checkUpdates") || "Check for Updates"),
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

  if (info.menuItemId === "ctx-check-updates") {
    browser.tabs.create({
      url: browser.runtime.getURL("check-update/check-update.html"),
    });
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
      if (message.url) {
        console.log(
          "MPV Opener: Scraped URL:",
          message.url,
          "Source:",
          message.source || "unknown",
        );
      }
      sendResponse({ success: true });
    } else if (message.action === "cleanHistoryNow") {
      cleanHistoryNow().then(function(result) {
        sendResponse({ success: true, removed: result.removed || 0 });
      }).catch(function(err) {
        sendResponse({ success: false, error: err.message });
      });
      return true;
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
setTimeout(checkAndCleanHistory, 3000);

console.log("MPV Opener v7.2 loaded");