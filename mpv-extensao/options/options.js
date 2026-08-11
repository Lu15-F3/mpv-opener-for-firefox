// ============================================================
// options.js - MPV Opener for Firefox v7.3
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // ============================================================
  // Translations
  // ============================================================
  document.getElementById("title-settings").textContent =
    browser.i18n.getMessage("optionsTitle");
  document.getElementById("header-playback").textContent =
    browser.i18n.getMessage("playbackSettings");
  document.getElementById("label-display").textContent =
    browser.i18n.getMessage("displayMode") + ":";
  document.getElementById("opt-standard").textContent =
    browser.i18n.getMessage("standardWindow");
  document.getElementById("opt-fullscreen").textContent =
    browser.i18n.getMessage("fullscreen");
  document.getElementById("opt-pip").textContent =
    browser.i18n.getMessage("pipMode");
  document.getElementById("label-state").textContent =
    browser.i18n.getMessage("initialState") + ":";
  document.getElementById("opt-playing").textContent =
    browser.i18n.getMessage("statePlaying");
  document.getElementById("opt-paused").textContent =
    browser.i18n.getMessage("statePaused");

  document.getElementById("header-quality").textContent =
    browser.i18n.getMessage("qualitySettings");
  document.getElementById("label-maxResolution").textContent =
    browser.i18n.getMessage("maxResolutionLabel");
  document.getElementById("label-autoSubtitles").textContent =
    browser.i18n.getMessage("autoSubtitlesLabel");

  document.getElementById("header-fedora").textContent =
    browser.i18n.getMessage("fedoraSettings");
  document.getElementById("label-inhibitSleep").textContent =
    browser.i18n.getMessage("inhibitSleepLabel");
  document.getElementById("label-aggressiveCache").textContent =
    browser.i18n.getMessage("aggressiveCacheLabel");

  document.getElementById("header-window").textContent =
    browser.i18n.getMessage("windowBehavior");
  document.getElementById("label-alwaysOnTop").textContent =
    browser.i18n.getMessage("alwaysOnTopLabel");

  document.getElementById("header-audio").textContent =
    browser.i18n.getMessage("audioSettings");
  document.getElementById("label-audioDevice").textContent =
    browser.i18n.getMessage("audioDeviceLabel");
  document.getElementById("audioDevice").placeholder = browser.i18n.getMessage(
    "audioDevicePlaceholder",
  );

  document.getElementById("header-tab").textContent =
    browser.i18n.getMessage("tabBehavior");
  document.getElementById("label-close").textContent =
    browser.i18n.getMessage("closeTabLabel");

  // ============================================================
  // Automatic data-i18n Translations (Processa PiP e outros)
  // ============================================================
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    var msg = browser.i18n.getMessage(key);
    if (msg) {
      if (el.tagName === "LABEL") {
        el.textContent = msg.endsWith(":") ? msg : msg + ":";
      } else {
        el.textContent = msg;
      }
    }
  });

  // ============================================================
  // Volume Translations
  // ============================================================
  document.getElementById("header-volume").textContent =
    browser.i18n.getMessage("volumeSettings") || "Volume Settings";
  document.getElementById("label-initialVolume").textContent =
    browser.i18n.getMessage("initialVolumeLabel") + ":";
  document.getElementById("opt-volumeMuted").textContent =
    browser.i18n.getMessage("volumeMuted") || "Muted (0%)";
  document.getElementById("opt-volumeLow").textContent =
    browser.i18n.getMessage("volumeLow") || "Low (20%)";
  document.getElementById("opt-volumeMedium").textContent =
    browser.i18n.getMessage("volumeMedium") || "Medium (50%)";
  document.getElementById("opt-volumeHigh").textContent =
    browser.i18n.getMessage("volumeHigh") || "High (80%)";
  document.getElementById("opt-volumeFull").textContent =
    browser.i18n.getMessage("volumeFull") || "Full (100%)";
  document.getElementById("opt-volumeCustom").textContent =
    browser.i18n.getMessage("volumeCustom") || "Custom (%)";
  document.getElementById("customVolume").placeholder =
    browser.i18n.getMessage("volumePlaceholder") || "e.g., 30";

  // ============================================================
  // Queue Settings (fallback)
  // ============================================================
  var queueHeader = document.getElementById("header-queue");
  var queueTranslation = browser.i18n.getMessage("queueSettings");
  if (queueTranslation) {
    queueHeader.textContent = queueTranslation;
  } else {
    queueHeader.textContent = "Queue Settings";
  }

  var queueLabel = document.getElementById("label-queueMode");
  var queueLabelTranslation = browser.i18n.getMessage("queueEnabled");
  if (queueLabelTranslation) {
    queueLabel.textContent = queueLabelTranslation;
  }

  // ============================================================
  // History Cleanup Translations
  // ============================================================
  document.getElementById("header-history").textContent =
    browser.i18n.getMessage("historyCleanup") || "History Settings";
  document.getElementById("label-historyCleanup").textContent =
    browser.i18n.getMessage("historyCleanupLabel") + ":";
  document.getElementById("opt-cleanupManual").textContent =
    browser.i18n.getMessage("historyCleanupManual") || "Manual (Disabled)";
  document.getElementById("opt-cleanupDaily").textContent =
    browser.i18n.getMessage("historyCleanupDaily") || "Every Day";
  document.getElementById("opt-cleanupWeekly").textContent =
    browser.i18n.getMessage("historyCleanupWeekly") || "Every Week";
  document.getElementById("opt-cleanupMonthly").textContent =
    browser.i18n.getMessage("historyCleanupMonthly") || "Every Month";
  document.getElementById("opt-cleanupOnClose").textContent =
    browser.i18n.getMessage("historyCleanupOnClose") || "On Browser Close";
  document.getElementById("label-historyRetention").textContent =
    browser.i18n.getMessage("historyCleanupRetention") + ":";

  // Traduções das opções de retenção
  document.getElementById("opt-retentionAll").textContent =
    browser.i18n.getMessage("historyCleanupRetentionAll") ||
    "Clear All (0 items)";
  document.getElementById("opt-retention5").textContent =
    browser.i18n.getMessage("historyCleanupRetention5") || "5 items";
  document.getElementById("opt-retention10").textContent =
    browser.i18n.getMessage("historyCleanupRetention10") || "10 items";
  document.getElementById("opt-retention20").textContent =
    browser.i18n.getMessage("historyCleanupRetention20") || "20 items";
  document.getElementById("opt-retention50").textContent =
    browser.i18n.getMessage("historyCleanupRetention50") || "50 items";
  document.getElementById("opt-retention100").textContent =
    browser.i18n.getMessage("historyCleanupRetention100") || "100 items";
  document.getElementById("opt-retentionNoLimit").textContent =
    browser.i18n.getMessage("historyCleanupRetentionNoLimit") ||
    "No Limit (Keep All)";

  document.getElementById("save-btn").textContent =
    browser.i18n.getMessage("saveButton");

  // ============================================================
  // PiP Toggle Logic
  // ============================================================
  var displayModeSelect = document.getElementById("displayMode");
  var pipSettingsDiv = document.getElementById("pip-settings-options");

  if (displayModeSelect && pipSettingsDiv) {
    displayModeSelect.addEventListener("change", function () {
      if (this.value === "pip") {
        pipSettingsDiv.style.display = "block";
      } else {
        pipSettingsDiv.style.display = "none";
      }
    });
  }

  // ============================================================
  // Volume Custom Logic
  // ============================================================
  var initialVolumeSelect = document.getElementById("initialVolume");
  var customVolumeGroup = document.getElementById("custom-volume-group");

  if (initialVolumeSelect && customVolumeGroup) {
    initialVolumeSelect.addEventListener("change", function () {
      if (this.value === "custom") {
        customVolumeGroup.style.display = "flex";
      } else {
        customVolumeGroup.style.display = "none";
      }
    });
  }

  // ============================================================
  // Load Saved Data
  // ============================================================
  browser.storage.local
    .get({
      displayMode: "standard",
      initialState: "playing",
      maxResolution: "best",
      autoSubtitles: false,
      alwaysOnTop: false,
      audioDevice: "",
      closeTab: false,
      aggressiveCache: false,
      inhibitSleep: true,
      queueModeEnabled: true,
      initialVolume: 50,
      pipCorner: "bottomRight",
      pipSize: 25,
      historyCleanupMode: "manual",
      historyRetention: 10,
      lastCleanupDate: null,
    })
    .then(function (items) {
      // Display Mode
      if (displayModeSelect) {
        displayModeSelect.value = items.displayMode;
        if (items.displayMode === "pip" && pipSettingsDiv) {
          pipSettingsDiv.style.display = "block";
        }
      }

      document.getElementById("initialState").value = items.initialState;
      document.getElementById("maxResolution").value = items.maxResolution;
      document.getElementById("autoSubtitles").checked = items.autoSubtitles;
      document.getElementById("alwaysOnTop").checked = items.alwaysOnTop;
      document.getElementById("audioDevice").value = items.audioDevice;
      document.getElementById("closeTab").checked = items.closeTab;
      document.getElementById("aggressiveCache").checked =
        items.aggressiveCache;
      document.getElementById("inhibitSleep").checked = items.inhibitSleep;
      document.getElementById("queueModeEnabled").checked =
        items.queueModeEnabled !== false;

      // History Settings
      document.getElementById("historyCleanupMode").value =
        items.historyCleanupMode;
      document.getElementById("historyRetention").value =
        items.historyRetention;

      // PiP Settings
      var pipCornerEl = document.getElementById("pipCorner");
      if (pipCornerEl) pipCornerEl.value = items.pipCorner;

      var pipSizeEl = document.getElementById("pipSize");
      if (pipSizeEl) pipSizeEl.value = items.pipSize.toString();

      // Volume
      if (initialVolumeSelect) {
        var volume = items.initialVolume;
        if (volume !== undefined) {
          var predefined = [0, 20, 50, 80, 100];
          if (predefined.includes(volume)) {
            initialVolumeSelect.value = volume.toString();
            if (customVolumeGroup) customVolumeGroup.style.display = "none";
          } else {
            initialVolumeSelect.value = "custom";
            if (customVolumeGroup) customVolumeGroup.style.display = "flex";
            var customVolEl = document.getElementById("customVolume");
            if (customVolEl) customVolEl.value = volume;
          }
        }
      }
    });

  // ============================================================
  // Clean Now Button
  // ============================================================
  document.getElementById("cleanup-now-btn").addEventListener("click", function() {
    var btn = this;
    var status = document.getElementById("cleanup-status");
    
    btn.disabled = true;
    btn.textContent = "⏳ Cleaning...";
    status.textContent = "Cleaning history...";
    
    browser.runtime.sendMessage({ action: "cleanHistoryNow" }, function(response) {
      if (response && response.success) {
        var msg = browser.i18n.getMessage("historyCleanupCount");
        if (msg) {
          status.textContent = msg.replace("{count}", response.removed || 0);
        } else {
          status.textContent = "🧹 Removed " + (response.removed || 0) + " old entries";
        }
        status.style.color = "var(--success-green)";
      } else {
        status.textContent = "❌ " + (browser.i18n.getMessage("historyCleanupFailed") || "Failed to clean history");
        status.style.color = "var(--danger-color)";
      }
      
      btn.disabled = false;
      btn.textContent = "🧹 " + (browser.i18n.getMessage("cleanNow") || "Clean Now");
      
      setTimeout(function() {
        status.textContent = "";
        status.style.color = "";
      }, 5000);
    });
  });

  // ============================================================
  // Save Settings
  // ============================================================
  document.getElementById("save-btn").addEventListener("click", function () {
    // Volume
    var initialVolume = document.getElementById("initialVolume").value;
    if (initialVolume === "custom") {
      initialVolume =
        parseInt(document.getElementById("customVolume").value) || 30;
    } else {
      initialVolume = parseInt(initialVolume);
    }

    // PiP
    var pipCornerEl = document.getElementById("pipCorner");
    var pipSizeEl = document.getElementById("pipSize");

    var settings = {
      displayMode: document.getElementById("displayMode").value,
      initialState: document.getElementById("initialState").value,
      maxResolution: document.getElementById("maxResolution").value,
      autoSubtitles: document.getElementById("autoSubtitles").checked,
      alwaysOnTop: document.getElementById("alwaysOnTop").checked,
      audioDevice: document.getElementById("audioDevice").value.trim(),
      closeTab: document.getElementById("closeTab").checked,
      aggressiveCache: document.getElementById("aggressiveCache").checked,
      inhibitSleep: document.getElementById("inhibitSleep").checked,
      queueModeEnabled: document.getElementById("queueModeEnabled").checked,
      initialVolume: initialVolume,
      pipCorner: pipCornerEl ? pipCornerEl.value : "bottomRight",
      pipSize: pipSizeEl ? parseInt(pipSizeEl.value, 10) : 25,
      historyCleanupMode: document.getElementById("historyCleanupMode").value,
      historyRetention: parseInt(
        document.getElementById("historyRetention").value,
        10,
      ),
    };

    browser.storage.local.set(settings).then(function () {
      var status = document.getElementById("status");
      status.textContent = browser.i18n.getMessage("saveSuccess");
      status.style.color = "var(--success-green)";
      setTimeout(function () {
        status.textContent = "";
        status.style.color = "";
      }, 3000);
    });
  });
});