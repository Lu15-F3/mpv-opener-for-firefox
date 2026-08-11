// ============================================================
// welcome.js - MPV Opener for Firefox v7.3
// Multi-Distro Support
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
  var btnEn = document.getElementById("btn-en");
  var btnPt = document.getElementById("btn-pt");
  var statusCheck = document.getElementById("status-check");
  var distroSelect = document.getElementById("distro-select");
  var cmdDeps = document.getElementById("cmd-deps");
  var mprisHint = document.getElementById("mpris-hint");
  var mprisHintText = document.getElementById("mpris-hint-text");
  
  // ============================================================
  // Translation Dictionary com Comandos por Distribuição
  // ============================================================
  var locales = {
    en: {
      title: "Almost Ready! Setup Required",
      intro: "The MPV Opener for Firefox has been added to your browser, but it cannot communicate with your system yet. Follow these two quick steps:",
      step1Title: "1. Install Dependencies",
      step1Desc: "Open your terminal and run the command for your distribution:",
      step2Title: "2. Enable the Communication Bridge (Native Host)",
      step2Desc: "Now execute the official installer script to register the local integration manifests:",
      footer: "After running the commands, the extension will work instantly. No need to restart Firefox.",
      copy: "Copy",
      copied: "Copied!",
      checking: "Checking system status...",
      checkSuccess: "All dependencies are installed!",
      checkError: "Some dependencies are missing. Install them to use the extension.",
      checkErrorNative: "Native Host not installed. Run the installer script below.",
      labelDistro: "Your Distribution:",
      // Comandos por distribuição
      commands: {
        fedora: "sudo dnf install mpv yt-dlp mpv-mpris python3 curl socat",
        ubuntu: "sudo apt update && sudo apt install mpv yt-dlp python3 curl socat",
        debian: "sudo apt update && sudo apt install mpv yt-dlp python3 curl socat",
        arch: "sudo pacman -S --needed mpv yt-dlp python curl socat",
        opensuse: "sudo zypper install mpv yt-dlp python3 curl socat",
        alpine: "sudo apk add mpv yt-dlp python3 curl socat",
        gentoo: "sudo emerge --ask media-video/mpv net-misc/yt-dlp dev-lang/python net-misc/curl sys-apps/socat",
        nixos: "nix-shell -p mpv yt-dlp python3 curl socat",
        other: "# Please install mpv, yt-dlp, python3, curl and socat manually"
      },
      // Dicas para mpv-mpris
      mprisHints: {
        fedora: "mpv-mpris is included in the command above.",
        ubuntu: "mpv-mpris may not be available in official repositories. Try: sudo apt install mpv-mpris",
        debian: "mpv-mpris may not be available in official repositories. Try: sudo apt install mpv-mpris",
        arch: "mpv-mpris is included in the command above.",
        opensuse: "mpv-mpris is included in the command above.",
        alpine: "mpv-mpris may need manual compilation: https://github.com/hoyon/mpv-mpris",
        gentoo: "mpv-mpris may need manual installation.",
        nixos: "mpv-mpris is available in nixpkgs.",
        other: "For MPRIS controls, install mpv-mpris from: https://github.com/hoyon/mpv-mpris"
      }
    },
    pt: {
      title: "Quase Pronto! Configuração Necessária",
      intro: "O MPV Opener for Firefox foi adicionado ao seu navegador, mas ainda não consegue se comunicar com o seu sistema. Siga estes dois passos rápidos:",
      step1Title: "1. Instalar as Dependências",
      step1Desc: "Abra o seu terminal e rode o comando para a sua distribuição:",
      step2Title: "2. Ativar a Ponte de Comunicação (Native Host)",
      step2Desc: "Agora execute o script instalador oficial para registrar os manifestos de integração locais:",
      footer: "Após rodar os comandos, a extensão funcionará instantaneamente. Não é necessário reiniciar o Firefox.",
      copy: "Copiar",
      copied: "Copiado!",
      checking: "Verificando status do sistema...",
      checkSuccess: "Todas as dependências estão instaladas!",
      checkError: "Algumas dependências estão faltando. Instale-as para usar a extensão.",
      checkErrorNative: "Native Host não instalado. Execute o script instalador abaixo.",
      labelDistro: "Sua Distribuição:",
      commands: {
        fedora: "sudo dnf install mpv yt-dlp mpv-mpris python3 curl socat",
        ubuntu: "sudo apt update && sudo apt install mpv yt-dlp python3 curl socat",
        debian: "sudo apt update && sudo apt install mpv yt-dlp python3 curl socat",
        arch: "sudo pacman -S --needed mpv yt-dlp python curl socat",
        opensuse: "sudo zypper install mpv yt-dlp python3 curl socat",
        alpine: "sudo apk add mpv yt-dlp python3 curl socat",
        gentoo: "sudo emerge --ask media-video/mpv net-misc/yt-dlp dev-lang/python net-misc/curl sys-apps/socat",
        nixos: "nix-shell -p mpv yt-dlp python3 curl socat",
        other: "# Por favor instale mpv, yt-dlp, python3, curl e socat manualmente"
      },
      mprisHints: {
        fedora: "mpv-mpris está incluído no comando acima.",
        ubuntu: "mpv-mpris pode não estar disponível nos repositórios oficiais. Tente: sudo apt install mpv-mpris",
        debian: "mpv-mpris pode não estar disponível nos repositórios oficiais. Tente: sudo apt install mpv-mpris",
        arch: "mpv-mpris está incluído no comando acima.",
        opensuse: "mpv-mpris está incluído no comando acima.",
        alpine: "mpv-mpris pode precisar de compilação manual: https://github.com/hoyon/mpv-mpris",
        gentoo: "mpv-mpris pode precisar de instalação manual.",
        nixos: "mpv-mpris está disponível no nixpkgs.",
        other: "Para controles MPRIS, instale mpv-mpris de: https://github.com/hoyon/mpv-mpris"
      }
    }
  };
  
  // ============================================================
  // Nomes das distribuições para exibição
  // ============================================================
  var distroNames = {
    fedora: "Fedora / RHEL",
    ubuntu: "Ubuntu / Debian",
    arch: "Arch Linux",
    opensuse: "openSUSE",
    alpine: "Alpine Linux",
    gentoo: "Gentoo",
    nixos: "NixOS",
    other: "Other (Manual)"
  };
  
  // ============================================================
  // Update UI
  // ============================================================
  function updateUI(lang) {
    var data = locales[lang];
    if (!data) return;
    
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
    document.getElementById("label-distro").textContent = data.labelDistro;
    
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
    
    // Atualizar comando baseado na distribuição selecionada
    updateDistroCommand(lang);
  }
  
  // ============================================================
  // Atualizar comando baseado na distribuição selecionada
  // ============================================================
  function updateDistroCommand(lang) {
    var data = locales[lang];
    if (!data) return;
    
    var distro = distroSelect.value;
    var command = data.commands[distro] || data.commands.other;
    cmdDeps.textContent = command;
    
    // Atualizar dica do mpv-mpris
    var hint = data.mprisHints[distro] || data.mprisHints.other;
    if (hint && distro !== 'fedora' && distro !== 'arch' && distro !== 'opensuse') {
      mprisHint.style.display = 'flex';
      mprisHintText.textContent = hint;
    } else if (hint) {
      mprisHint.style.display = 'flex';
      mprisHintText.textContent = hint;
    } else {
      mprisHint.style.display = 'none';
    }
  }
  
  // ============================================================
  // Detectar distribuição atual (tenta identificar)
  // ============================================================
  function detectCurrentDistro() {
    // Tentar detectar via user agent ou outras heurísticas
    // Como estamos no Firefox, podemos usar navigator
    
    // Verificar se é Linux
    if (navigator.platform && navigator.platform.toLowerCase().includes('linux')) {
      // Tentar detectar via pacotes instalados (só funciona se o usuário tiver)
      // Vamos usar uma abordagem mais simples: verificar comandos disponíveis
      
      // Para simplificar, vamos usar uma lista de distribuições comuns
      // O usuário pode selecionar manualmente se a detecção falhar
      
      // Verificar se temos informações do sistema via User-Agent
      var ua = navigator.userAgent.toLowerCase();
      
      if (ua.includes('fedora')) return 'fedora';
      if (ua.includes('ubuntu')) return 'ubuntu';
      if (ua.includes('debian')) return 'debian';
      if (ua.includes('arch')) return 'arch';
      if (ua.includes('opensuse') || ua.includes('suse')) return 'opensuse';
      if (ua.includes('alpine')) return 'alpine';
      if (ua.includes('gentoo')) return 'gentoo';
      if (ua.includes('nixos')) return 'nixos';
    }
    
    // Tentar detectar via navigator.platform
    var platform = navigator.platform || '';
    if (platform.toLowerCase().includes('linux')) {
      // Se não conseguiu detectar, deixar o usuário escolher
      return 'fedora'; // Fallback padrão (o mais comum)
    }
    
    return 'fedora'; // Fallback
  }
  
  // ============================================================
  // System Status Check (melhorado)
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
  
  // Detectar distribuição
  var detectedDistro = detectCurrentDistro();
  var distroOptions = distroSelect.options;
  for (var i = 0; i < distroOptions.length; i++) {
    if (distroOptions[i].value === detectedDistro) {
      distroSelect.selectedIndex = i;
      break;
    }
  }
  
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
  
  distroSelect.addEventListener("change", function() {
    var currentLang = btnPt.classList.contains("active") ? "pt" : "en";
    updateDistroCommand(currentLang);
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