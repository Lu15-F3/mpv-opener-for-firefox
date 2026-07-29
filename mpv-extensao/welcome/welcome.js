// ============================================================
// welcome.js - MPV Opener for Firefox v7.0
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
  var btnEn = document.getElementById("btn-en");
  var btnPt = document.getElementById("btn-pt");
  var statusCheck = document.getElementById("status-check");
  
  // ============================================================
  // Translation Dictionary
  // ============================================================
  var locales = {
    en: {
      title: "Almost Ready! Setup Required",
      intro: "The MPV Opener for Firefox has been added to your browser, but it cannot communicate with your system yet. Follow these two quick steps:",
      step1Title: "1. Install Dependencies",
      step1Desc: "Open your terminal and run this command to install the player, extractor engine, and media plugin:",
      step2Title: "2. Enable the Communication Bridge (Native Host)",
      step2Desc: "Now execute the official installer script to register the local integration manifests:",
      footer: "After running the commands, the extension will work instantly. No need to restart Firefox.",
      copy: "Copy",
      copied: "Copied!",
      checking: "Checking system status...",
      checkSuccess: "All dependencies are installed!",
      checkError: "Some dependencies are missing. Install them to use the extension.",
      checkErrorNative: "Native Host not installed. Run the installer script below."
    },
    pt: {
      title: "Quase Pronto! Configuração Necessária",
      intro: "O MPV Opener for Firefox foi adicionado ao seu navegador, mas ainda não consegue se comunicar com o seu sistema. Siga estes dois passos rápidos:",
      step1Title: "1. Instalar as Dependências",
      step1Desc: "Abra o seu terminal e rode o comando para instalar o player, o motor extrator e o plugin de mídia:",
      step2Title: "2. Ativar a Ponte de Comunicação (Native Host)",
      step2Desc: "Agora execute o script instalador oficial para registrar os manifestos de integração locais:",
      footer: "Após rodar os comandos, a extensão funcionará instantaneamente. Não é necessário reiniciar o Firefox.",
      copy: "Copiar",
      copied: "Copiado!",
      checking: "Verificando status do sistema...",
      checkSuccess: "Todas as dependências estão instaladas!",
      checkError: "Algumas dependências estão faltando. Instale-as para usar a extensão.",
      checkErrorNative: "Native Host não instalado. Execute o script instalador abaixo."
    }
  };
  
  // ============================================================
  // Update UI
  // ============================================================
  function updateUI(lang) {
    var data = locales[lang];
    document.getElementById("welcome-title").textContent = data.title;
    
    var introEl = document.getElementById("welcome-intro");
    introEl.textContent = "";
    
    if (lang === "en") {
      introEl.appendChild(document.createTextNode("The "));
      var strong = document.createElement("strong");
      strong.textContent = "MPV Opener for Firefox";
      introEl.appendChild(strong);
      introEl.appendChild(document.createTextNode(" has been added to your browser, but it cannot communicate with your system yet. Follow these two quick steps:"));
    } else {
      introEl.appendChild(document.createTextNode("O "));
      var strong = document.createElement("strong");
      strong.textContent = "MPV Opener for Firefox";
      introEl.appendChild(strong);
      introEl.appendChild(document.createTextNode(" foi adicionado ao seu navegador, mas ainda não consegue se comunicar com o seu sistema. Siga estes dois passos rápidos:"));
    }
    
    document.getElementById("step1-title").textContent = data.step1Title;
    document.getElementById("step1-desc").textContent = data.step1Desc;
    document.getElementById("step2-title").textContent = data.step2Title;
    document.getElementById("step2-desc").textContent = data.step2Desc;
    document.getElementById("welcome-footer").textContent = data.footer;
    
    document.querySelectorAll(".copy-btn").forEach(function(btn) {
      if (!btn.classList.contains("copied")) {
        btn.textContent = data.copy;
      }
    });
    
    if (lang === "pt") {
      btnPt.classList.add("active");
      btnEn.classList.remove("active");
    } else {
      btnEn.classList.add("active");
      btnPt.classList.remove("active");
    }
  }
  
  // ============================================================
  // System Status Check
  // ============================================================
  function checkSystemStatus() {
    var currentLang = btnPt.classList.contains("active") ? "pt" : "en";
    var data = locales[currentLang];
    statusCheck.textContent = "";
    statusCheck.className = 'status-check';
    
    var iconSpan = document.createElement('span');
    iconSpan.className = 'status-icon';
    iconSpan.textContent = '⏳';
    statusCheck.appendChild(iconSpan);
    
    var textSpan = document.createElement('span');
    textSpan.className = 'status-text';
    textSpan.textContent = data.checking;
    statusCheck.appendChild(textSpan);
    
    browser.runtime.sendNativeMessage("org.custom.mpv", { url: "" })
      .then(function(response) {
        statusCheck.textContent = "";
        statusCheck.className = 'status-check success';
        
        var iconSpan2 = document.createElement('span');
        iconSpan2.className = 'status-icon';
        iconSpan2.textContent = '✅';
        statusCheck.appendChild(iconSpan2);
        
        var textSpan2 = document.createElement('span');
        textSpan2.className = 'status-text';
        textSpan2.textContent = data.checkSuccess;
        statusCheck.appendChild(textSpan2);
      })
      .catch(function(error) {
        statusCheck.textContent = "";
        statusCheck.className = 'status-check error';
        
        var iconSpan2 = document.createElement('span');
        iconSpan2.className = 'status-icon';
        iconSpan2.textContent = '⚠️';
        statusCheck.appendChild(iconSpan2);
        
        var textSpan2 = document.createElement('span');
        textSpan2.className = 'status-text';
        textSpan2.textContent = data.checkErrorNative;
        statusCheck.appendChild(textSpan2);
      });
  }
  
  // ============================================================
  // Initialization
  // ============================================================
  var userLang = browser.i18n.getUILanguage().startsWith("pt") ? "pt" : "en";
  updateUI(userLang);
  setTimeout(checkSystemStatus, 500);
  
  // ============================================================
  // Event Listeners
  // ============================================================
  btnEn.addEventListener("click", function() {
    updateUI("en");
    setTimeout(checkSystemStatus, 300);
  });
  
  btnPt.addEventListener("click", function() {
    updateUI("pt");
    setTimeout(checkSystemStatus, 300);
  });
  
  document.querySelectorAll(".copy-btn").forEach(function(button) {
    button.addEventListener("click", function() {
      var targetId = button.getAttribute("data-target");
      var textToCopy = document.getElementById(targetId).textContent;
      var currentLang = btnPt.classList.contains("active") ? "pt" : "en";
      var data = locales[currentLang];
      
      navigator.clipboard.writeText(textToCopy).then(function() {
        button.textContent = data.copied;
        button.classList.add("copied");
        setTimeout(function() {
          button.textContent = data.copy;
          button.classList.remove("copied");
        }, 2000);
      });
    });
  });
});