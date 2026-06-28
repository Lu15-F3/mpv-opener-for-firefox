document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tab-btn-main").textContent = browser.i18n.getMessage("tabMain");
  document.getElementById("tab-btn-history").textContent = browser.i18n.getMessage("tabHistory");
  document.getElementById("send-btn").textContent = "⚡ " + browser.i18n.getMessage("sendToMpv");
  document.getElementById("send-audio-btn").textContent = "🎵 " + browser.i18n.getMessage("sendAudioToMpv");
  document.getElementById("clear-history-btn").textContent = browser.i18n.getMessage("clearHistory");

  // Carregar resolução padrão salva do usuário no dropdown
  browser.storage.local.get({ maxResolution: "best" }).then((items) => {
    document.getElementById("quickRes").value = items.maxResolution;
  });

  // Salva dinamicamente caso mude no popup
  document.getElementById("quickRes").addEventListener("change", (e) => {
    browser.storage.local.set({ maxResolution: e.target.value });
  });

  const tabs = document.querySelectorAll(".tab-link");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      if(tab.id === "tab-btn-main") document.getElementById("tab-main").classList.add("active");
      if(tab.id === "tab-btn-history") {
        document.getElementById("tab-history").classList.add("active");
        renderHistory();
      }
    });
  });

  document.getElementById("send-btn").addEventListener("click", () => { sendActiveTab("sendToMpv"); });
  document.getElementById("send-audio-btn").addEventListener("click", () => { sendActiveTab("sendAudioToMpv"); });
  document.getElementById("clear-history-btn").addEventListener("click", () => {
    browser.storage.local.set({ history: [] }).then(() => renderHistory());
  });

  function sendActiveTab(actionName) {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0] && tabs[0].url) {
        browser.runtime.sendMessage({
          action: actionName,
          url: tabs[0].url,
          title: tabs[0].title,
          tabId: tabs[0].id
        });
        window.close();
      }
    });
  }

  function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    browser.storage.local.get({ history: [] }).then((data) => {
      if (data.history.length === 0) {
        const noHistoryDiv = document.createElement("div");
        noHistoryDiv.className = "no-history";
        noHistoryDiv.textContent = browser.i18n.getMessage("emptyHistory");
        list.appendChild(noHistoryDiv);
        
        document.getElementById("clear-history-btn").style.display = "none";
        return;
      }
      document.getElementById("clear-history-btn").style.display = "block";
      data.history.forEach(item => {
        const li = document.createElement("li");
        li.className = "history-item";
        li.textContent = item.title;
        li.title = item.url;
        li.addEventListener("click", () => {
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
});