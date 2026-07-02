document.addEventListener("DOMContentLoaded", () => {
  const btnEn = document.getElementById("btn-en");
  const btnPt = document.getElementById("btn-pt");

  // Dicionário em tempo real para alternar via botões manuais
  const locales = {
    en: {
      title: "Almost Ready! Setup Required 🐧",
      step1Title: "1. Install Fedora Dependencies",
      step1Desc: "Open your terminal and run this command to install the player, extractor engine, and media plugin:",
      step2Title: "2. Enable the Communication Bridge (Native Host)",
      step2Desc: "Now execute the official installer script to register the local integration manifests:",
      footer: "After running the commands, the extension will work instantly. No need to restart Firefox.",
      copy: "Copy",
      copied: "Copied!"
    },
    pt: {
      title: "Quase Pronto! Configuração Necessária 🐧",
      step1Title: "1. Instalar as Dependências do Fedora",
      step1Desc: "Abra o seu terminal e rode o comando para instalar o player, o motor extrator e o plugin de mídia:",
      step2Title: "2. Ativar a Ponte de Comunicação (Native Host)",
      step2Desc: "Agora execute o script instalador oficial para registrar os manifestos de integração locais:",
      footer: "Após rodar os comandos, a extensão funcionará instantaneamente. Não é necessário reiniciar o Firefox.",
      copy: "Copiar",
      copied: "Copiado!"
    }
  };

  function updateUI(lang) {
    const data = locales[lang];
    document.getElementById("welcome-title").textContent = data.title;
    
    // Correção segura para o innerHTML do welcome-intro usando nós DOM nativos
    const introEl = document.getElementById("welcome-intro");
    introEl.textContent = "";
    if (lang === "en") {
      introEl.appendChild(document.createTextNode("The "));
      const strong = document.createElement("strong");
      strong.textContent = "MPV Opener for Firefox";
      introEl.appendChild(strong);
      introEl.appendChild(document.createTextNode(" has been added to your browser, but it cannot communicate with your Fedora system yet. Follow these two quick steps:"));
    } else {
      introEl.appendChild(document.createTextNode("O "));
      const strong = document.createElement("strong");
      strong.textContent = "MPV Opener for Firefox";
      introEl.appendChild(strong);
      introEl.appendChild(document.createTextNode(" foi adicionado ao seu navegador, mas ainda não consegue se comunicar com o seu sistema Fedora. Siga estes dois passos rápidos:"));
    }

    document.getElementById("step1-title").textContent = data.step1Title;
    document.getElementById("step1-desc").textContent = data.step1Desc;
    document.getElementById("step2-title").textContent = data.step2Title;
    document.getElementById("step2-desc").textContent = data.step2Desc;
    document.getElementById("welcome-footer").textContent = data.footer;
    
    // Atualiza botões de cópia se não estiverem no estado 'Copiado'
    document.querySelectorAll(".copy-btn").forEach(btn => {
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

  // Detecção inteligente inicial
  const userLang = browser.i18n.getUILanguage().startsWith("pt") ? "pt" : "en";
  updateUI(userLang);

  // Escutas dos seletores manuais
  btnEn.addEventListener("click", () => updateUI("en"));
  btnPt.addEventListener("click", () => updateUI("pt"));

  // Gerenciador de Área de transferência
  document.querySelectorAll(".copy-btn").forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const textToCopy = document.getElementById(targetId).textContent;
      const currentLang = btnPt.classList.contains("active") ? "pt" : "en";

      navigator.clipboard.writeText(textToCopy).then(() => {
        button.textContent = locales[currentLang].copied;
        button.classList.add("copied");

        setTimeout(() => {
          button.textContent = locales[currentLang].copy;
          button.classList.remove("copied");
        }, 2000);
      });
    });
  });
});