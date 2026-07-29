// ============================================================
// popup.js - MPV Opener for Firefox v7.0
// COM REMOÇÃO DOS BOTÕES DUPLICADOS
// ============================================================

function applyPopupTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var translation = browser.i18n.getMessage(key);
    if (translation) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        if (el.type === 'text' || el.type === 'password' || el.type === 'search') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      } else if (el.tagName === 'OPTION') {
        el.textContent = translation;
      } else {
        el.textContent = translation;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  // ============================================================
  // Translations
  // ============================================================
  applyPopupTranslations();

  document.getElementById("tab-btn-main").textContent = browser.i18n.getMessage("tabMain");
  document.getElementById("tab-btn-queue").textContent = browser.i18n.getMessage("tabQueue");
  document.getElementById("tab-btn-history").textContent = browser.i18n.getMessage("tabHistory");
  document.getElementById("send-btn").innerHTML = '<span class="icon">▶</span> ' + browser.i18n.getMessage("sendToMpv");
  document.getElementById("send-audio-btn").innerHTML = '<span class="icon">♪</span> ' + browser.i18n.getMessage("sendAudioToMpv");
  document.getElementById("clear-history-btn").textContent = browser.i18n.getMessage("clearHistory");
  document.querySelector('.toggle-label').textContent = browser.i18n.getMessage("queueEnabled");
  
  // ============================================================
  // Load Settings
  // ============================================================
  browser.storage.local.get({
    maxResolution: "best",
    queueModeEnabled: true
  }).then(function(items) {
    document.getElementById("quickRes").value = items.maxResolution;
    document.getElementById("queue-toggle").checked = items.queueModeEnabled !== false;
  });
  
  document.getElementById("quickRes").addEventListener("change", function(e) {
    browser.storage.local.set({ maxResolution: e.target.value });
  });
  
  document.getElementById("queue-toggle").addEventListener("change", function(e) {
    browser.storage.local.set({ queueModeEnabled: e.target.checked });
    browser.runtime.sendMessage({ action: "toggleQueueMode", enabled: e.target.checked });
  });
  
  // ============================================================
  // Tabs
  // ============================================================
  var tabs = document.querySelectorAll(".tab-link");
  var contents = document.querySelectorAll(".tab-content");
  
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      tabs.forEach(function(t) { t.classList.remove("active"); });
      contents.forEach(function(c) { c.classList.remove("active"); });
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
  document.getElementById("send-btn").addEventListener("click", function() {
    sendActiveTab("sendToMpv");
  });
  
  document.getElementById("send-audio-btn").addEventListener("click", function() {
    sendActiveTab("sendAudioToMpv");
  });
  
  document.getElementById("sniff-btn").addEventListener("click", function() {
    browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
      if (tabs[0]) {
        browser.runtime.sendMessage({ action: "openSniffer", tabId: tabs[0].id });
        window.close();
      }
    });
  });
  
  document.getElementById("clear-history-btn").addEventListener("click", function() {
    browser.storage.local.set({ history: [] }).then(function() {
      renderHistory();
    });
  });

  // ============================================================
// Botão de Preferências
// ============================================================
document.getElementById('settings-btn').addEventListener('click', function() {
  browser.runtime.openOptionsPage();
  window.close(); // Fecha o popup após abrir as configurações
});
  
  // ============================================================
  // Queue - Apenas Clear (botões de controle removidos)
  // ============================================================
  document.getElementById("clear-queue-btn").addEventListener("click", function() {
    if (confirm("Clear all items from queue?")) {
      browser.runtime.sendMessage({ action: "clearQueue" }, function() {
        renderQueue();
      });
    }
  });
  
  document.getElementById("open-queue-manager-btn").addEventListener("click", function() {
    browser.tabs.create({
      url: browser.runtime.getURL("queue/queue.html")
    });
  });
  
  // ============================================================
  // Mini Player Controls (Controlador Definitivo)
  // ============================================================
  function sendPlayerCommand(command, params) {
    browser.runtime.sendMessage({
      action: "playerCommand",
      command: command,
      params: params || []
    });
  }
  
  document.getElementById("mp-play-pause").addEventListener("click", function() {
    sendPlayerCommand("cycle", ["pause"]);
    this.style.transform = "scale(0.9)";
    setTimeout(function() {
      document.getElementById("mp-play-pause").style.transform = "scale(1)";
    }, 150);
  });
  
  document.getElementById("mp-prev").addEventListener("click", function() {
    sendPlayerCommand("playlist-prev", []);
    this.style.transform = "scale(0.9)";
    setTimeout(function() {
      document.getElementById("mp-prev").style.transform = "scale(1)";
    }, 150);
  });
  
  document.getElementById("mp-next").addEventListener("click", function() {
    sendPlayerCommand("playlist-next", []);
    this.style.transform = "scale(0.9)";
    setTimeout(function() {
      document.getElementById("mp-next").style.transform = "scale(1)";
    }, 150);
  });
  
  document.getElementById("mp-volume-up").addEventListener("click", function() {
    sendPlayerCommand("add", ["volume", "5"]);
    this.style.transform = "scale(0.9)";
    setTimeout(function() {
      document.getElementById("mp-volume-up").style.transform = "scale(1)";
    }, 150);
  });
  
  document.getElementById("mp-volume-down").addEventListener("click", function() {
    sendPlayerCommand("add", ["volume", "-5"]);
    this.style.transform = "scale(0.9)";
    setTimeout(function() {
      document.getElementById("mp-volume-down").style.transform = "scale(1)";
    }, 150);
  });
  
  // ============================================================
  // Timeline Seek
  // ============================================================
  var mpTimeline = document.getElementById("mp-timeline");
  var isSeeking = false;
  
  mpTimeline.addEventListener("input", function(e) {
    isSeeking = true;
    var progress = parseFloat(e.target.value);
    var totalTime = parseFloat(this.dataset.duration || 0);
    if (totalTime > 0) {
      var time = (progress / 100) * totalTime;
      document.getElementById("mp-time").textContent = formatTime(time) + " / " + formatTime(totalTime);
      this.style.background = 'linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ' + progress + '%, var(--warning-yellow) ' + progress + '%, var(--warning-yellow) 100%)';
    }
  });
  
  mpTimeline.addEventListener("change", function(e) {
    var progress = parseFloat(e.target.value);
    var totalTime = parseFloat(this.dataset.duration || 0);
    if (totalTime > 0) {
      var time = (progress / 100) * totalTime;
      sendPlayerCommand("seek", [time, "absolute"]);
    }
    isSeeking = false;
  });
  
  // ============================================================
  // Player Status Polling
  // ============================================================
  var playerPollInterval = null;
  
  function fetchPlayerStatus() {
    browser.runtime.sendMessage({ action: "getPlayerStatus" }, function(response) {
      if (response && response.success && response.status) {
        updatePlayerUI(response.status);
      } else {
        updatePlayerUI(null);
      }
    });
  }
  
  function updatePlayerUI(status) {
    var isPlaying = status && status.pause === false;
    var hasVideo = status && status.duration > 0 && status.duration !== null;
    
    // Title
    var titleEl = document.getElementById("mp-title");
    var title = status?.mediaTitle || status?.filename || "No video playing";
    titleEl.textContent = title;
    titleEl.className = "mini-player-title-text" + (hasVideo ? "" : " empty");
    
    // Status text
    var statusText = document.getElementById("mp-status-text");
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
    
    // Play button
    var playBtn = document.getElementById("mp-play-pause");
    if (isPlaying) {
      playBtn.innerHTML = "⏸";
      playBtn.className = "mp-btn mp-play-btn playing";
    } else {
      playBtn.innerHTML = "▶";
      playBtn.className = "mp-btn mp-play-btn";
    }
    
    // Timeline
    var timeline = document.getElementById("mp-timeline");
    if (hasVideo && !isSeeking && status.duration > 0) {
      var progress = Math.min(Math.max((status.timePos / status.duration) * 100, 0), 100);
      timeline.value = progress;
      timeline.dataset.duration = status.duration;
      timeline.disabled = false;
      timeline.style.background = 'linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ' + progress + '%, var(--border-color) ' + progress + '%, var(--border-color) 100%)';
    } else if (!hasVideo) {
      timeline.value = 0;
      timeline.dataset.duration = 0;
      timeline.disabled = true;
      timeline.style.background = 'var(--border-color)';
    }
    
    // Time display
    var timeEl = document.getElementById("mp-time");
    if (hasVideo && status.duration > 0) {
      timeEl.textContent = formatTime(status.timePos || 0) + " / " + formatTime(status.duration);
    } else {
      timeEl.textContent = "00:00 / 00:00";
    }
    
    // Overlay
    var overlay = document.getElementById("mp-play-status");
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
    
    // Volume
    if (status && status.volume !== undefined) {
      var volume = Math.min(Math.max(status.volume, 0), 100);
      document.getElementById("volume-level").style.width = volume + "%";
      document.getElementById("volume-percent").textContent = Math.round(volume) + "%";
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
    browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
      if (tabs[0] && tabs[0].url) {
        browser.runtime.sendMessage({
          action: actionName,
          url: tabs[0].url,
          title: tabs[0].title,
          tabId: tabs[0].id,
          fromHistory: false
        });
        window.close();
      }
    });
  }
  
  function renderHistory() {
    var list = document.getElementById("history-list");
    list.textContent = "";
    
    browser.storage.local.get({ history: [] }).then(function(data) {
      if (data.history.length === 0) {
        var noHistoryDiv = document.createElement("div");
        noHistoryDiv.className = "no-history";
        noHistoryDiv.textContent = browser.i18n.getMessage("emptyHistory");
        list.appendChild(noHistoryDiv);
        document.getElementById("clear-history-btn").style.display = "none";
        return;
      }
      
      document.getElementById("clear-history-btn").style.display = "block";
      
      data.history.forEach(function(item) {
        var li = document.createElement("li");
        li.className = "history-item";
        li.textContent = item.title || item.url;
        li.title = item.url;
        li.addEventListener("click", function() {
          browser.runtime.sendMessage({
            action: "sendToMpv",
            url: item.url,
            title: item.title,
            fromHistory: true
          });
          window.close();
        });
        list.appendChild(li);
      });
    });
  }
  
  function renderQueue() {
    browser.runtime.sendMessage({ action: "queueStatus" }, function(response) {
      var list = document.getElementById("queue-list");
      var countEl = document.getElementById("queue-count");
      
      if (!response || !response.queue || response.queue.length === 0) {
        list.textContent = "";
        var emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-queue";
        emptyDiv.textContent = browser.i18n.getMessage("emptyQueue");
        list.appendChild(emptyDiv);
        countEl.textContent = '0 items in queue';
        return;
      }
      
      var queueData = response.queue;
      var isActive = response.isQueueActive;
      var currentIndex = response.currentQueueIndex || 0;
      
      countEl.textContent = queueData.length + ' items in queue';
      list.textContent = "";
      
      queueData.forEach(function(item, index) {
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
        titleSpan.textContent = (index + 1) + '. ' + (item.title || item.url);
        
        var statusSpan = document.createElement("span");
        statusSpan.className = "queue-item-status-badge";
        if (isActive && index === currentIndex) {
          statusSpan.textContent = '▶ Playing';
          statusSpan.className = "queue-item-status-badge playing";
        } else if (index < currentIndex) {
          statusSpan.textContent = '✓ Played';
          statusSpan.className = "queue-item-status-badge played";
        } else {
          statusSpan.textContent = '⏳ Waiting';
          statusSpan.className = "queue-item-status-badge waiting";
        }
        
        info.appendChild(titleSpan);
        info.appendChild(statusSpan);
        
        var removeBtn = document.createElement("button");
        removeBtn.className = "queue-item-remove";
        removeBtn.textContent = "✕";
        removeBtn.title = browser.i18n.getMessage("removeItem");
        removeBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          browser.runtime.sendMessage({
            action: "removeFromQueue",
            index: index
          }, function() {
            renderQueue();
          });
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
  
  window.addEventListener("beforeunload", function() {
    stopPlayerPolling();
  });
});