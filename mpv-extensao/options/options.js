// ============================================================
// options.js - MPV Opener for Firefox v7.0
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
  // ============================================================
  // Translations
  // ============================================================
  document.getElementById("title-settings").textContent = browser.i18n.getMessage("optionsTitle");
  document.getElementById("header-playback").textContent = browser.i18n.getMessage("playbackSettings");
  document.getElementById("label-display").textContent = browser.i18n.getMessage("displayMode") + ":";
  document.getElementById("opt-standard").textContent = browser.i18n.getMessage("standardWindow");
  document.getElementById("opt-fullscreen").textContent = browser.i18n.getMessage("fullscreen");
  document.getElementById("opt-pip").textContent = browser.i18n.getMessage("pipMode");
  document.getElementById("label-state").textContent = browser.i18n.getMessage("initialState") + ":";
  document.getElementById("opt-playing").textContent = browser.i18n.getMessage("statePlaying");
  document.getElementById("opt-paused").textContent = browser.i18n.getMessage("statePaused");
  
  document.getElementById("header-quality").textContent = browser.i18n.getMessage("qualitySettings");
  document.getElementById("label-maxResolution").textContent = browser.i18n.getMessage("maxResolutionLabel");
  document.getElementById("label-autoSubtitles").textContent = browser.i18n.getMessage("autoSubtitlesLabel");
  
  document.getElementById("header-fedora").textContent = browser.i18n.getMessage("fedoraSettings");
  document.getElementById("label-inhibitSleep").textContent = browser.i18n.getMessage("inhibitSleepLabel");
  document.getElementById("label-aggressiveCache").textContent = browser.i18n.getMessage("aggressiveCacheLabel");
  
  document.getElementById("header-window").textContent = browser.i18n.getMessage("windowBehavior");
  document.getElementById("label-alwaysOnTop").textContent = browser.i18n.getMessage("alwaysOnTopLabel");
  
  document.getElementById("header-audio").textContent = browser.i18n.getMessage("audioSettings");
  document.getElementById("label-audioDevice").textContent = browser.i18n.getMessage("audioDeviceLabel");
  document.getElementById("audioDevice").placeholder = browser.i18n.getMessage("audioDevicePlaceholder");
  
  document.getElementById("header-tab").textContent = browser.i18n.getMessage("tabBehavior");
  document.getElementById("label-close").textContent = browser.i18n.getMessage("closeTabLabel");
  
  document.getElementById("header-queue").textContent = "Queue Settings";
  document.getElementById("label-queueMode").textContent = browser.i18n.getMessage("queueEnabled");
  
  document.getElementById("save-btn").textContent = browser.i18n.getMessage("saveButton");
  
  // ============================================================
  // Load Saved Data
  // ============================================================
  browser.storage.local.get({
    displayMode: "standard",
    initialState: "playing",
    maxResolution: "best",
    autoSubtitles: false,
    alwaysOnTop: false,
    audioDevice: "",
    closeTab: false,
    aggressiveCache: false,
    inhibitSleep: true,
    queueModeEnabled: true
  }).then(function(items) {
    document.getElementById("displayMode").value = items.displayMode;
    document.getElementById("initialState").value = items.initialState;
    document.getElementById("maxResolution").value = items.maxResolution;
    document.getElementById("autoSubtitles").checked = items.autoSubtitles;
    document.getElementById("alwaysOnTop").checked = items.alwaysOnTop;
    document.getElementById("audioDevice").value = items.audioDevice;
    document.getElementById("closeTab").checked = items.closeTab;
    document.getElementById("aggressiveCache").checked = items.aggressiveCache;
    document.getElementById("inhibitSleep").checked = items.inhibitSleep;
    document.getElementById("queueModeEnabled").checked = items.queueModeEnabled !== false;
  });
  
  // ============================================================
  // Save Settings
  // ============================================================
  document.getElementById("save-btn").addEventListener("click", function() {
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
      queueModeEnabled: document.getElementById("queueModeEnabled").checked
    };
    
    browser.storage.local.set(settings).then(function() {
      var status = document.getElementById("status");
      status.textContent = browser.i18n.getMessage("saveSuccess");
      status.style.color = "var(--success-green)";
      setTimeout(function() {
        status.textContent = "";
        status.style.color = "";
      }, 3000);
    });
  });
});