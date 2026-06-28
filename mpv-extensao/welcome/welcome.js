document.addEventListener("DOMContentLoaded", () => {
  const btnEn = document.getElementById("btn-en");
  const btnPt = document.getElementById("btn-pt");
  const langEn = document.getElementById("lang-en");
  const langPt = document.getElementById("lang-pt");

  // Alternador de Idioma
  btnEn.addEventListener("click", () => {
    btnEn.classList.add("active");
    btnPt.classList.remove("active");
    langEn.classList.add("active");
    langPt.classList.remove("active");
  });

  btnPt.addEventListener("click", () => {
    btnPt.classList.add("active");
    btnEn.classList.remove("active");
    langPt.classList.add("active");
    langEn.classList.remove("active");
  });

  // Gerenciador de Cópia para a Área de Transferência
  const copyButtons = document.querySelectorAll(".copy-btn");
  
  copyButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const textToCopy = document.getElementById(targetId).textContent;

      navigator.clipboard.writeText(textToCopy).then(() => {
        // Armazena o texto original do botão (pode ser "Copy" ou "Copiar")
        const originalText = button.textContent;
        
        button.textContent = originalText === "Copiar" ? "Copiado!" : "Copied!";
        button.classList.add("copied");

        // Reseta o estado do botão após 2 segundos
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("copied");
        }, 2000);
      }).catch(err => {
        console.error("Erro ao copiar o texto: ", err);
      });
    });
  });
});