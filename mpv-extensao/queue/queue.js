// ============================================================
// queue.js - MPV Opener for Firefox v7.3
// SIMPLIFICADO - Removidos botões duplicados
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
  // ============================================================
  // Elements
  // ============================================================
  var queueList = document.getElementById("queue-list");
  var queueCount = document.getElementById("queue-count");
  var queueStatusText = document.getElementById("queue-status-text");
  var clearQueueBtn = document.getElementById("clear-queue-btn");
  
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
    
    var titleEl = document.getElementById("mp-title");
    var title = status?.mediaTitle || status?.filename || "No video playing";
    titleEl.textContent = title;
    titleEl.className = "mini-player-title-text" + (hasVideo ? "" : " empty");
    
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
    
    var playBtn = document.getElementById("mp-play-pause");
    if (isPlaying) {
      playBtn.innerHTML = "⏸";
      playBtn.className = "mp-btn mp-play-btn playing";
    } else {
      playBtn.innerHTML = "▶";
      playBtn.className = "mp-btn mp-play-btn";
    }
    
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
    
    var timeEl = document.getElementById("mp-time");
    if (hasVideo && status.duration > 0) {
      timeEl.textContent = formatTime(status.timePos || 0) + " / " + formatTime(status.duration);
    } else {
      timeEl.textContent = "00:00 / 00:00";
    }
    
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
  // Load and Render Queue
  // ============================================================
  function loadQueue() {
    browser.runtime.sendMessage({ action: "queueStatus" }, function(response) {
      if (!response || !response.queue || response.queue.length === 0) {
        renderEmptyQueue();
        return;
      }
      renderQueue(response);
    });
  }
  
  function renderQueue(data) {
    var queue = data.queue;
    var isActive = data.isQueueActive;
    var currentIndex = data.currentQueueIndex || 0;
    
    queueCount.textContent = queue.length + ' items';
    
    if (isActive && queue.length > 0) {
      var remaining = queue.length - currentIndex;
      queueStatusText.textContent = browser.i18n.getMessage("queueStatusPlaying")
        .replace("{remaining}", remaining);
      queueStatusText.className = 'active';
    } else if (queue.length > 0 && currentIndex > 0) {
      queueStatusText.textContent = browser.i18n.getMessage("queueStatusCompleted")
        .replace("{current}", currentIndex).replace("{total}", queue.length);
      queueStatusText.className = 'idle';
    } else if (queue.length > 0) {
      queueStatusText.textContent = browser.i18n.getMessage("queueStatusPaused")
        .replace("{count}", queue.length);
      queueStatusText.className = 'idle';
    } else {
      queueStatusText.textContent = browser.i18n.getMessage("queueStatusIdle");
      queueStatusText.className = 'idle';
    }
    
    if (queue.length === 0) {
      renderEmptyQueue();
      return;
    }
    
    queueList.textContent = "";
    
    queue.forEach(function(item, index) {
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
      statusSpan.className = "queue-item-status";
      if (isActive && index === currentIndex) {
        statusSpan.textContent = '▶ ' + browser.i18n.getMessage("queuePlaying");
        statusSpan.className = "queue-item-status playing";
      } else if (index < currentIndex) {
        statusSpan.textContent = '✓ ' + browser.i18n.getMessage("queueCompleted");
        statusSpan.className = "queue-item-status played";
      } else {
        statusSpan.textContent = '⏳ ' + browser.i18n.getMessage("queueWaiting");
        statusSpan.className = "queue-item-status waiting";
      }
      
      info.appendChild(titleSpan);
      info.appendChild(statusSpan);
      
      var removeBtn = document.createElement("button");
      removeBtn.className = "queue-item-remove";
      removeBtn.textContent = "✕";
      removeBtn.title = "Remove from queue";
      removeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        browser.runtime.sendMessage({
          action: "removeFromQueue",
          index: index
        }, function() {
          loadQueue();
        });
      });
      
      li.appendChild(info);
      li.appendChild(removeBtn);
      queueList.appendChild(li);
    });
  }
  
  function renderEmptyQueue() {
    queueList.textContent = "";
    var emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-queue";
    emptyDiv.textContent = browser.i18n.getMessage("queueEmptyStatus");
    queueList.appendChild(emptyDiv);
    queueCount.textContent = '0 ' + browser.i18n.getMessage("queueItemsLabel");
    queueStatusText.textContent = browser.i18n.getMessage("queueStatusIdle");
    queueStatusText.className = 'idle';
  }
  
  // ============================================================
  // Event Listeners
  // ============================================================
  clearQueueBtn.addEventListener("click", function() {
    if (confirm("Clear all items from queue?")) {
      browser.runtime.sendMessage({ action: "clearQueue" }, function() {
        loadQueue();
      });
    }
  });
  
  // ============================================================
  // Initialization
  // ============================================================
  loadQueue();
  startPlayerPolling();
  
  window.addEventListener("beforeunload", function() {
    stopPlayerPolling();
  });
});