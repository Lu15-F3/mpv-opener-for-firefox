// ============================================================
// popup.js - MPV Opener for Firefox v7.3
// COM SUPORTE A data-i18n-title, SUPORTE A PIP E SEM innerHTML
// ============================================================

// ============================================================
// Receber status de envio
// ============================================================
browser.runtime.onMessage.addListener(function(message) {
    if (message.action === "sendStatus") {
        updateSendStatus(message.status, message.message, message.errorType);
    }
});

function updateSendStatus(status, message, errorType) {
    var statusEl = document.getElementById('send-status');
    if (!statusEl) {
        // Criar elemento de status se não existir
        statusEl = document.createElement('div');
        statusEl.id = 'send-status';
        statusEl.style.cssText = `
            padding: 8px 12px;
            border-radius: var(--border-radius);
            font-size: 12px;
            font-weight: 500;
            margin-top: 8px;
            text-align: center;
            animation: fadeIn 0.3s ease;
            display: none;
        `;
        var container = document.querySelector('.container');
        var sendBtn = document.getElementById('send-btn');
        if (container && sendBtn) {
            container.insertBefore(statusEl, sendBtn.nextSibling);
        }
    }
    
    statusEl.style.display = 'block';
    
    if (status === 'sending') {
        statusEl.style.background = 'rgba(122, 162, 247, 0.15)';
        statusEl.style.border = '1px solid var(--accent-color)';
        statusEl.style.color = 'var(--accent-color)';
        statusEl.textContent = message || '⏳ Sending...';
    } else if (status === 'success') {
        statusEl.style.background = 'rgba(158, 206, 106, 0.15)';
        statusEl.style.border = '1px solid var(--success-green)';
        statusEl.style.color = 'var(--success-green)';
        statusEl.textContent = message || '✅ Video sent successfully!';
        
        // Limpar após 5 segundos
        setTimeout(function() {
            statusEl.style.display = 'none';
        }, 5000);
    } else if (status === 'error') {
        statusEl.style.background = 'rgba(247, 118, 142, 0.15)';
        statusEl.style.border = '1px solid var(--danger-color)';
        statusEl.style.color = 'var(--danger-color)';
        
        // Mostrar erro com detalhes
        var errorMsg = message || '❌ Failed to send video';
        
        // Adicionar sugestão se disponível
        var suggestion = '';
        if (errorType === 'ytdlp_failed') {
            suggestion = ' Try yt-dlp --verbose for details.';
        } else if (errorType === 'network_error') {
            suggestion = ' Check your internet connection.';
        } else if (errorType === 'native_host_failed') {
            suggestion = ' Run install.sh to fix native host.';
        } else if (errorType === 'timeout') {
            suggestion = ' Try a shorter video or check your connection.';
        }
        
        statusEl.textContent = errorMsg + suggestion;
        
        // Não limpar automaticamente para permitir que o usuário veja o erro
        // O usuário pode fechar o popup e reabrir
    }
}

function applyPopupTranslations() {
  // ============================================================
  // 1. Tradução de CONTEÚDO via data-i18n
  // ============================================================
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    var translation = browser.i18n.getMessage(key);
    if (translation) {
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT"
      ) {
        if (
          el.type === "text" ||
          el.type === "password" ||
          el.type === "search"
        ) {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      } else if (el.tagName === "OPTION") {
        el.textContent = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // ============================================================
  // 2. Tradução de TOOLTIPS via data-i18n-title
  // ============================================================
  document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
    var key = el.getAttribute("data-i18n-title");
    var translation = browser.i18n.getMessage(key);
    if (translation) {
      el.title = translation;
    }
  });

  // Tooltips específicos dos controles do mini player
  var tooltipMap = {
    "mp-play-pause": "playPause",
    "mp-prev": "playerPrevious",
    "mp-next": "playerNext",
    "mp-volume-up": "volumeUp",
    "mp-volume-down": "volumeDown",
  };

  Object.keys(tooltipMap).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      var key = tooltipMap[id];
      var translation = browser.i18n.getMessage(key);
      if (translation) {
        el.title = translation;
      }
    }
  });

  // ============================================================
  // 3. Tradução de TÍTULOS das abas
  // ============================================================
  var tabMain = document.getElementById("tab-btn-main");
  if (tabMain) tabMain.textContent = browser.i18n.getMessage("tabMain");

  var tabQueue = document.getElementById("tab-btn-queue");
  if (tabQueue) tabQueue.textContent = browser.i18n.getMessage("tabQueue");

  var tabHistory = document.getElementById("tab-btn-history");
  if (tabHistory)
    tabHistory.textContent = browser.i18n.getMessage("tabHistory");

  // ============================================================
  // 4. Tradução de BOTÕES PRINCIPAIS (com ícones)
  // ============================================================
  // Send to mpv
  var sendBtn = document.getElementById("send-btn");
  if (sendBtn) {
    var sendText = browser.i18n.getMessage("sendToMpv");
    if (sendText) {
      sendBtn.textContent = "";
      var sendIcon = document.createElement("span");
      sendIcon.className = "icon";
      sendIcon.textContent = "▶";
      sendBtn.appendChild(sendIcon);
      sendBtn.appendChild(document.createTextNode(" " + sendText));
    }
  }

  // Listen Only
  var audioBtn = document.getElementById("send-audio-btn");
  if (audioBtn) {
    var audioText = browser.i18n.getMessage("sendAudioToMpv");
    if (audioText) {
      audioBtn.textContent = "";
      var audioIcon = document.createElement("span");
      audioIcon.className = "icon";
      audioIcon.textContent = "♪";
      audioBtn.appendChild(audioIcon);
      audioBtn.appendChild(document.createTextNode(" " + audioText));
    }
  }

  // Sniffer
  var sniffBtn = document.getElementById("sniff-btn");
  if (sniffBtn) {
    var sniffText =
      browser.i18n.getMessage("ctxSniffMedia") || "🎣 Start Media Sniffer Mode";
    sniffBtn.textContent = "";
    var sniffIcon = document.createElement("span");
    sniffIcon.className = "icon";
    sniffIcon.textContent = "🎣";
    sniffBtn.appendChild(sniffIcon);
    sniffBtn.appendChild(document.createTextNode(" " + sniffText));
  }

  // ============================================================
  // 5. Tradução de BOTÕES SECUNDÁRIOS
  // ============================================================
  // Clear History
  var clearHistoryBtn = document.getElementById("clear-history-btn");
  if (clearHistoryBtn) {
    var clearHistoryText = browser.i18n.getMessage("clearHistory");
    if (clearHistoryText) {
      clearHistoryBtn.textContent = clearHistoryText;
    }
  }

  // Clear Queue
  var clearQueueBtn = document.getElementById("clear-queue-btn");
  if (clearQueueBtn) {
    var clearQueueText = browser.i18n.getMessage("clearQueue");
    if (clearQueueText) {
      var icon = clearQueueBtn.textContent.match(/^[✕]+/);
      if (icon) {
        clearQueueBtn.textContent = icon[0] + " " + clearQueueText;
      } else {
        clearQueueBtn.textContent = "✕ " + clearQueueText;
      }
    }
  }

  // Open Queue Manager
  var openQueueBtn = document.getElementById("open-queue-manager-btn");
  if (openQueueBtn) {
    var queueManagerText = browser.i18n.getMessage("openQueueManager");
    if (queueManagerText) {
      openQueueBtn.textContent = queueManagerText;
    }
  }

  // ============================================================
  // 6. Tradução de LABELS
  // ============================================================
  var toggleLabel = document.querySelector(".toggle-label");
  if (toggleLabel) {
    var queueEnabledText = browser.i18n.getMessage("queueEnabled");
    if (queueEnabledText) {
      toggleLabel.textContent = queueEnabledText;
    }
  }

  // ============================================================
  // 7. PiP Settings Translations (forçando se necessário)
  // ============================================================
  var pipCornerLabel = document.querySelector('label[for="pipCorner"]');
  if (pipCornerLabel) {
    var translation = browser.i18n.getMessage("pipCorner");
    if (translation) pipCornerLabel.textContent = translation;
  }

  var pipSizeLabel = document.querySelector('label[for="pipSize"]');
  if (pipSizeLabel) {
    var translation = browser.i18n.getMessage("pipSize");
    if (translation) pipSizeLabel.textContent = translation;
  }

  // Traduzir opções do select de cantos
  var cornerSelect = document.getElementById("pipCorner");
  if (cornerSelect) {
    var cornerOptions = cornerSelect.options;
    var cornerMap = {
      topLeft: "pipTopLeft",
      topRight: "pipTopRight",
      bottomLeft: "pipBottomLeft",
      bottomRight: "pipBottomRight",
    };
    for (var i = 0; i < cornerOptions.length; i++) {
      var key = cornerMap[cornerOptions[i].value];
      if (key) {
        var translation = browser.i18n.getMessage(key);
        if (translation) cornerOptions[i].textContent = translation;
      }
    }
  }

  // Traduzir opções do select de tamanho
  var sizeSelect = document.getElementById("pipSize");
  if (sizeSelect) {
    var sizeOptions = sizeSelect.options;
    var sizeMap = {
      15: "pipSizeSmall",
      20: "pipSizeMedium",
      25: "pipSizeDefault",
      30: "pipSizeLarge",
      40: "pipSizeXL",
    };
    for (var i = 0; i < sizeOptions.length; i++) {
      var key = sizeMap[sizeOptions[i].value];
      if (key) {
        var translation = browser.i18n.getMessage(key);
        if (translation) sizeOptions[i].textContent = translation;
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // ============================================================
  // Translations
  // ============================================================
  applyPopupTranslations();

  // ============================================================
  // Load Settings - Adicionar volume
  // ============================================================
  browser.storage.local
    .get({
      maxResolution: "best",
      queueModeEnabled: true,
      displayMode: "standard",
      pipCorner: "bottomRight",
      pipSize: 25,
      initialVolume: 50,
    })
    .then(function (items) {
      var quickRes = document.getElementById("quickRes");
      if (quickRes) quickRes.value = items.maxResolution;

      var queueToggle = document.getElementById("queue-toggle");
      if (queueToggle) queueToggle.checked = items.queueModeEnabled !== false;

      var displayMode = document.getElementById("displayMode");
      if (displayMode) {
        displayMode.value = items.displayMode;
        var pipSettings = document.getElementById("pip-settings");
        if (pipSettings) {
          pipSettings.style.display =
            items.displayMode === "pip" ? "block" : "none";
        }
      }

      var pipCorner = document.getElementById("pipCorner");
      if (pipCorner) pipCorner.value = items.pipCorner;

      var pipSize = document.getElementById("pipSize");
      if (pipSize) pipSize.value = items.pipSize.toString();

      // Carregar volume
      var quickVolume = document.getElementById("quickVolume");
      if (quickVolume && items.initialVolume !== undefined) {
        var predefined = [0, 20, 50, 80, 100];
        if (predefined.includes(items.initialVolume)) {
          quickVolume.value = items.initialVolume.toString();
        } else {
          var closest = predefined.reduce(function (prev, curr) {
            return Math.abs(curr - items.initialVolume) <
              Math.abs(prev - items.initialVolume)
              ? curr
              : prev;
          });
          quickVolume.value = closest.toString();
        }
      }
    });

  var quickResEl = document.getElementById("quickRes");
  if (quickResEl) {
    quickResEl.addEventListener("change", function (e) {
      browser.storage.local.set({ maxResolution: e.target.value });
    });
  }

  // ============================================================
  // Salvar Volume Rápido
  // ============================================================
  var quickVolumeEl = document.getElementById("quickVolume");
  if (quickVolumeEl) {
    quickVolumeEl.addEventListener("change", function (e) {
      var volume = parseInt(e.target.value);
      browser.storage.local.set({ initialVolume: volume });
    });
  }

  var queueToggleEl = document.getElementById("queue-toggle");
  if (queueToggleEl) {
    queueToggleEl.addEventListener("change", function (e) {
      browser.storage.local.set({ queueModeEnabled: e.target.checked });
      browser.runtime.sendMessage({
        action: "toggleQueueMode",
        enabled: e.target.checked,
      });
    });
  }

  // ============================================================
  // PiP Settings Controls
  // ============================================================
  var displayModeEl = document.getElementById("displayMode");
  if (displayModeEl) {
    displayModeEl.addEventListener("change", function () {
      var pipSettings = document.getElementById("pip-settings");
      if (pipSettings) {
        if (this.value === "pip") {
          pipSettings.style.display = "block";
        } else {
          pipSettings.style.display = "none";
        }
      }
      browser.storage.local.set({ displayMode: this.value });
    });
  }

  function savePipSettings() {
    var pipCornerEl = document.getElementById("pipCorner");
    var pipSizeEl = document.getElementById("pipSize");

    if (pipCornerEl && pipSizeEl) {
      var settings = {
        pipCorner: pipCornerEl.value,
        pipSize: parseInt(pipSizeEl.value, 10),
      };
      browser.storage.local.set(settings);
    }
  }

  var pipCornerEl = document.getElementById("pipCorner");
  if (pipCornerEl) {
    pipCornerEl.addEventListener("change", savePipSettings);
  }

  var pipSizeEl = document.getElementById("pipSize");
  if (pipSizeEl) {
    pipSizeEl.addEventListener("change", savePipSettings);
  }

  // ============================================================
  // Tabs
  // ============================================================
  var tabs = document.querySelectorAll(".tab-link");
  var contents = document.querySelectorAll(".tab-content");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("active");
      });
      contents.forEach(function (c) {
        c.classList.remove("active");
      });
      tab.classList.add("active");

      var targetId = tab.id.replace("tab-btn-", "tab-");
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.classList.add("active");
      }

      if (targetId === "tab-queue") {
        renderQueue();
        fetchPlayerStatus();
      }
      if (targetId === "tab-history") {
        renderHistory();
      }
    });
  });

  // ============================================================
  // Action Buttons
  // ============================================================
  var sendBtnEl = document.getElementById("send-btn");
  if (sendBtnEl) {
    sendBtnEl.addEventListener("click", function () {
      sendActiveTab("sendToMpv");
    });
  }

  var audioBtnEl = document.getElementById("send-audio-btn");
  if (audioBtnEl) {
    audioBtnEl.addEventListener("click", function () {
      sendActiveTab("sendAudioToMpv");
    });
  }

  var sniffBtnEl = document.getElementById("sniff-btn");
  if (sniffBtnEl) {
    sniffBtnEl.addEventListener("click", function () {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(function (tabs) {
          if (tabs[0]) {
            browser.runtime.sendMessage({
              action: "openSniffer",
              tabId: tabs[0].id,
            });
            window.close();
          }
        });
    });
  }

  var clearHistoryBtnEl = document.getElementById("clear-history-btn");
  if (clearHistoryBtnEl) {
    clearHistoryBtnEl.addEventListener("click", function () {
      browser.storage.local.set({ history: [] }).then(function () {
        renderHistory();
      });
    });
  }

  // ============================================================
  // Clean Old History Button
  // ============================================================
  var cleanupHistoryBtnEl = document.getElementById("cleanup-history-btn");
  if (cleanupHistoryBtnEl) {
    cleanupHistoryBtnEl.addEventListener("click", function () {
      var btn = this;
      var info = document.getElementById("cleanup-info");

      btn.disabled = true;
      btn.textContent = "⏳...";
      if (info) info.textContent = "Cleaning...";

      browser.runtime.sendMessage(
        { action: "cleanHistoryNow" },
        function (response) {
          if (response && response.success) {
            var msg = browser.i18n.getMessage("historyCleanupCount");
            if (info) {
              if (msg) {
                info.textContent = msg.replace(
                  "{count}",
                  response.removed || 0,
                );
              } else {
                info.textContent =
                  "🧹 Removed " + (response.removed || 0) + " old entries";
              }
              info.style.color = "var(--success-green)";
            }
            renderHistory();
          } else {
            if (info) {
              info.textContent = "❌ Failed to clean history";
              info.style.color = "var(--danger-color)";
            }
          }

          btn.disabled = false;
          btn.textContent = "🧹 Clean Old";

          setTimeout(function () {
            if (info) {
              info.textContent = "";
              info.style.color = "";
            }
          }, 5000);
        },
      );
    });
  }

  // ============================================================
  // Botão de Preferências
  // ============================================================
  var settingsBtnEl = document.getElementById("settings-btn");
  if (settingsBtnEl) {
    settingsBtnEl.addEventListener("click", function () {
      browser.runtime.openOptionsPage();
      window.close();
    });
  }

  // ============================================================
  // Queue - Apenas Clear
  // ============================================================
  var clearQueueBtnEl = document.getElementById("clear-queue-btn");
  if (clearQueueBtnEl) {
    clearQueueBtnEl.addEventListener("click", function () {
      if (confirm("Clear all items from queue?")) {
        browser.runtime.sendMessage({ action: "clearQueue" }, function () {
          renderQueue();
        });
      }
    });
  }

  var openQueueBtnEl = document.getElementById("open-queue-manager-btn");
  if (openQueueBtnEl) {
    openQueueBtnEl.addEventListener("click", function () {
      browser.tabs.create({
        url: browser.runtime.getURL("queue/queue.html"),
      });
    });
  }

  // ============================================================
  // Mini Player Controls
  // ============================================================
  function sendPlayerCommand(command, params) {
    browser.runtime.sendMessage({
      action: "playerCommand",
      command: command,
      params: params || [],
    });
  }

  var mpPlayPauseEl = document.getElementById("mp-play-pause");
  if (mpPlayPauseEl) {
    mpPlayPauseEl.addEventListener("click", function () {
      sendPlayerCommand("cycle", ["pause"]);
      this.style.transform = "scale(0.9)";
      setTimeout(function () {
        var el = document.getElementById("mp-play-pause");
        if (el) el.style.transform = "scale(1)";
      }, 150);
    });
  }

  var mpPrevEl = document.getElementById("mp-prev");
  if (mpPrevEl) {
    mpPrevEl.addEventListener("click", function () {
      sendPlayerCommand("playlist-prev", []);
      this.style.transform = "scale(0.9)";
      setTimeout(function () {
        var el = document.getElementById("mp-prev");
        if (el) el.style.transform = "scale(1)";
      }, 150);
    });
  }

  var mpNextEl = document.getElementById("mp-next");
  if (mpNextEl) {
    mpNextEl.addEventListener("click", function () {
      sendPlayerCommand("playlist-next", []);
      this.style.transform = "scale(0.9)";
      setTimeout(function () {
        var el = document.getElementById("mp-next");
        if (el) el.style.transform = "scale(1)";
      }, 150);
    });
  }

  var mpVolUpEl = document.getElementById("mp-volume-up");
  if (mpVolUpEl) {
    mpVolUpEl.addEventListener("click", function () {
      sendPlayerCommand("add", ["volume", "5"]);
      this.style.transform = "scale(0.9)";
      setTimeout(function () {
        var el = document.getElementById("mp-volume-up");
        if (el) el.style.transform = "scale(1)";
      }, 150);
    });
  }

  var mpVolDownEl = document.getElementById("mp-volume-down");
  if (mpVolDownEl) {
    mpVolDownEl.addEventListener("click", function () {
      sendPlayerCommand("add", ["volume", "-5"]);
      this.style.transform = "scale(0.9)";
      setTimeout(function () {
        var el = document.getElementById("mp-volume-down");
        if (el) el.style.transform = "scale(1)";
      }, 150);
    });
  }

  // ============================================================
  // Timeline Seek
  // ============================================================
  var mpTimeline = document.getElementById("mp-timeline");
  var isSeeking = false;

  if (mpTimeline) {
    mpTimeline.addEventListener("input", function (e) {
      isSeeking = true;
      var progress = parseFloat(e.target.value);
      var totalTime = parseFloat(this.dataset.duration || 0);
      if (totalTime > 0) {
        var time = (progress / 100) * totalTime;
        var mpTimeEl = document.getElementById("mp-time");
        if (mpTimeEl) {
          mpTimeEl.textContent =
            formatTime(time) + " / " + formatTime(totalTime);
        }
        this.style.background =
          "linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) " +
          progress +
          "%, var(--warning-yellow) " +
          progress +
          "%, var(--warning-yellow) 100%)";
      }
    });

    mpTimeline.addEventListener("change", function (e) {
      var progress = parseFloat(e.target.value);
      var totalTime = parseFloat(this.dataset.duration || 0);
      if (totalTime > 0) {
        var time = (progress / 100) * totalTime;
        sendPlayerCommand("seek", [time, "absolute"]);
      }
      isSeeking = false;
    });
  }

  // ============================================================
  // Player Status Polling
  // ============================================================
  var playerPollInterval = null;

  function fetchPlayerStatus() {
    browser.runtime.sendMessage(
      { action: "getPlayerStatus" },
      function (response) {
        if (response && response.success && response.status) {
          updatePlayerUI(response.status);
        } else {
          updatePlayerUI(null);
        }
      },
    );
  }

  function updatePlayerUI(status) {
    var isPlaying = status && status.pause === false;
    var hasVideo = status && status.duration > 0 && status.duration !== null;

    // Title
    var titleEl = document.getElementById("mp-title");
    if (titleEl) {
      var title = status?.mediaTitle || status?.filename || "No video playing";
      titleEl.textContent = title;
      titleEl.className = "mini-player-title-text" + (hasVideo ? "" : " empty");
    }

    // Status text
    var statusText = document.getElementById("mp-status-text");
    if (statusText) {
      if (isPlaying) {
        statusText.textContent = "▶ Playing";
        statusText.className = "mini-player-status playing";
      } else if (hasVideo) {
        statusText.textContent = "⏸ Paused";
        statusText.className = "mini-player-status paused";
      } else {
        statusText.textContent = "⏹ Idle";
        statusText.className = "mini-player-status";
      }
    }

    // Play button
    var playBtn = document.getElementById("mp-play-pause");
    if (playBtn) {
      if (isPlaying) {
        playBtn.textContent = "⏸";
        playBtn.className = "mp-btn mp-play-btn playing";
      } else {
        playBtn.textContent = "▶";
        playBtn.className = "mp-btn mp-play-btn";
      }
    }

    // Timeline
    var timeline = document.getElementById("mp-timeline");
    if (timeline) {
      if (hasVideo && !isSeeking && status.duration > 0) {
        var progress = Math.min(
          Math.max((status.timePos / status.duration) * 100, 0),
          100,
        );
        timeline.value = progress;
        timeline.dataset.duration = status.duration;
        timeline.disabled = false;
        timeline.style.background =
          "linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) " +
          progress +
          "%, var(--border-color) " +
          progress +
          "%, var(--border-color) 100%)";
      } else if (!hasVideo) {
        timeline.value = 0;
        timeline.dataset.duration = 0;
        timeline.disabled = true;
        timeline.style.background = "var(--border-color)";
      }
    }

    // Time display
    var timeEl = document.getElementById("mp-time");
    if (timeEl) {
      if (hasVideo && status.duration > 0) {
        timeEl.textContent =
          formatTime(status.timePos || 0) + " / " + formatTime(status.duration);
      } else {
        timeEl.textContent = "00:00 / 00:00";
      }
    }

    // Overlay
    var overlay = document.getElementById("mp-play-status");
    if (overlay) {
      if (isPlaying) {
        overlay.textContent = "▶";
        overlay.style.opacity = "1";
      } else if (hasVideo) {
        overlay.textContent = "⏸";
        overlay.style.opacity = "0.7";
      } else {
        overlay.textContent = "▶";
        overlay.style.opacity = "0.3";
      }
    }

    // Volume
    if (status && status.volume !== undefined) {
      var volume = Math.min(Math.max(status.volume, 0), 100);
      var volLevel = document.getElementById("volume-level");
      if (volLevel) volLevel.style.width = volume + "%";
      var volPercent = document.getElementById("volume-percent");
      if (volPercent) volPercent.textContent = Math.round(volume) + "%";
    }
  }

  function formatTime(seconds) {
    if (!seconds || seconds < 0) return "00:00";
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function startPlayerPolling() {
    if (playerPollInterval) {
      clearInterval(playerPollInterval);
    }
    fetchPlayerStatus();
    playerPollInterval = setInterval(fetchPlayerStatus, 1000);
  }

  function stopPlayerPolling() {
    if (playerPollInterval) {
      clearInterval(playerPollInterval);
      playerPollInterval = null;
    }
  }

  // ============================================================
  // Helper Functions
  // ============================================================
  function sendActiveTab(actionName) {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(function (tabs) {
        if (tabs[0] && tabs[0].url) {
          browser.runtime.sendMessage({
            action: actionName,
            url: tabs[0].url,
            title: tabs[0].title,
            tabId: tabs[0].id,
            fromHistory: false,
          });
        }
      });
  }

  // ============================================================
  // Mostrar informação de limpeza no histórico (traduzida)
  // ============================================================
  function renderHistory() {
    var list = document.getElementById("history-list");
    if (!list) return;
    list.textContent = "";

    browser.storage.local
      .get({ history: [], historyRetention: 10, historyCleanupMode: "manual" })
      .then(function (data) {
        var clearBtn = document.getElementById("clear-history-btn");
        var info = document.getElementById("cleanup-info");

        // ============================================================
        // CORREÇÃO: Mostrar informação de limpeza corretamente
        // ============================================================
        if (info) {
          var mode = data.historyCleanupMode || "manual";
          var retention = (typeof data.historyRetention !== "undefined") ? Number(data.historyRetention) : 10;

          if (mode === "manual") {
            info.textContent =
              browser.i18n.getMessage("historyCleanupManual") ||
              "🔄 Auto-clean: Manual (disabled)";
          } else {
            // Traduzir o modo
            var modeMap = {
              daily: "historyCleanupModeDaily",
              weekly: "historyCleanupModeWeekly",
              monthly: "historyCleanupModeMonthly",
              onClose: "historyCleanupModeOnClose",
            };
            var modeKey = modeMap[mode] || "historyCleanupModeDaily";
            var modeText = browser.i18n.getMessage(modeKey) || mode;

            // Traduzir a ação baseado no valor de retention
            var actionText = "";
            if (retention === 0) {
              // 0 = Clear All (zerar histórico)
              actionText =
                browser.i18n.getMessage("historyCleanupActionClearing") ||
                "clearing all";
            } else if (retention === -1) {
              // -1 = No Limit (Keep All)
              actionText =
                browser.i18n.getMessage("historyCleanupActionKeepingAll") ||
                "keeping all";
            } else {
              // retention > 0 = Manter N itens mais recentes
              var actionTemplate =
                browser.i18n.getMessage("historyCleanupActionKeeping") ||
                "keeping last {count}";
              actionText = actionTemplate.replace("{count}", retention);
            }

            // Montar a mensagem final
            var template =
              browser.i18n.getMessage("historyCleanupAutoLabel") ||
              "🔄 Auto-clean: {mode} ({action})";
            var finalText = template
              .replace("{mode}", modeText)
              .replace("{action}", actionText);

            info.textContent = finalText;
          }
        }

        // Renderizar lista de histórico
        if (!data.history || data.history.length === 0) {
          var noHistoryDiv = document.createElement("div");
          noHistoryDiv.className = "no-history";
          noHistoryDiv.textContent =
            browser.i18n.getMessage("emptyHistory") || "No history entries";
          list.appendChild(noHistoryDiv);
          if (clearBtn) clearBtn.style.display = "none";
          return;
        }

        if (clearBtn) clearBtn.style.display = "block";

        data.history.forEach(function (item) {
          var li = document.createElement("li");
          li.className = "history-item";
          li.textContent = item.title || item.url;
          li.title = item.url;
          li.addEventListener("click", function () {
            browser.runtime.sendMessage({
              action: "sendToMpv",
              url: item.url,
              title: item.title,
              fromHistory: true,
            });
            window.close();
          });
          list.appendChild(li);
        });
      });
  }

  function renderQueue() {
    browser.runtime.sendMessage({ action: "queueStatus" }, function (response) {
      var list = document.getElementById("queue-list");
      var countEl = document.getElementById("queue-count");

      if (!list) return;

      if (!response || !response.queue || response.queue.length === 0) {
        list.textContent = "";
        var emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-queue";
        emptyDiv.textContent = browser.i18n.getMessage("emptyQueue");
        list.appendChild(emptyDiv);
        if (countEl) countEl.textContent = "0 items in queue";
        return;
      }

      var queueData = response.queue;
      var isActive = response.isQueueActive;
      var currentIndex = response.currentQueueIndex || 0;

      if (countEl) countEl.textContent = queueData.length + " items in queue";
      list.textContent = "";

      queueData.forEach(function (item, index) {
        var li = document.createElement("li");
        li.className = "queue-item";

        if (isActive && index === currentIndex) {
          li.classList.add("queue-item-active");
        } else if (index < currentIndex) {
          li.style.opacity = "0.5";
        }

        var info = document.createElement("div");
        info.className = "queue-item-info";

        var titleSpan = document.createElement("span");
        titleSpan.className = "queue-item-title";
        titleSpan.textContent = index + 1 + ". " + (item.title || item.url);

        var statusSpan = document.createElement("span");
        statusSpan.className = "queue-item-status-badge";
        if (isActive && index === currentIndex) {
          statusSpan.textContent = "▶ Playing";
          statusSpan.className = "queue-item-status-badge playing";
        } else if (index < currentIndex) {
          statusSpan.textContent = "✓ Played";
          statusSpan.className = "queue-item-status-badge played";
        } else {
          statusSpan.textContent = "⏳ Waiting";
          statusSpan.className = "queue-item-status-badge waiting";
        }

        info.appendChild(titleSpan);
        info.appendChild(statusSpan);

        var removeBtn = document.createElement("button");
        removeBtn.className = "queue-item-remove";
        removeBtn.textContent = "✕";
        removeBtn.title = browser.i18n.getMessage("removeItem");
        removeBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          browser.runtime.sendMessage(
            {
              action: "removeFromQueue",
              index: index,
            },
            function () {
              renderQueue();
            },
          );
        });

        li.appendChild(info);
        li.appendChild(removeBtn);
        list.appendChild(li);
      });
    });
  }

  // ============================================================
  // Initialization
  // ============================================================
  renderQueue();
  renderHistory();
  startPlayerPolling();

  window.addEventListener("beforeunload", function () {
    stopPlayerPolling();
  });
});