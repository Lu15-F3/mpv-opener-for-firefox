const urlParams = new URLSearchParams(window.location.search);
const targetTabId = parseInt(urlParams.get('tabId'));

// Tradução nativa do Título e Subtítulo (Seguros via textContent)
document.getElementById('txt-sniff-title').textContent = "🎣 " + browser.i18n.getMessage("snifferTitle");
document.getElementById('txt-sniff-subtitle').textContent = browser.i18n.getMessage("snifferSubtitle");

// --- SOLUÇÃO SEGURA DA MOZILLA PARA AS INSTRUÇÕES DO PESCADOR ---
const statusMsgEl = document.getElementById('status-msg');
statusMsgEl.textContent = ""; // Limpa o elemento de forma segura

// Detecta o idioma ativo para injetar os nós DOM adequados textualmente
const currentUiLang = browser.i18n.getUILanguage().startsWith("pt") ? "pt" : "en";

if (currentUiLang === "pt") {
  const strongInst = document.createElement("strong");
  strongInst.textContent = "Instruções:";
  statusMsgEl.appendChild(strongInst);
  statusMsgEl.appendChild(document.createTextNode(" Volte para a aba do site, pressione "));
  
  const strongPlay = document.createElement("strong");
  strongPlay.textContent = "PLAY";
  statusMsgEl.appendChild(strongPlay);
  statusMsgEl.appendChild(document.createTextNode(" no player de vídeo (e feche todos os pop-ups que aparecerem). Os fluxos reais ocultos serão preenchidos instantaneamente abaixo."));
} else {
  // Fallback padrão em Inglês
  const strongInst = document.createElement("strong");
  strongInst.textContent = "Instructions:";
  statusMsgEl.appendChild(strongInst);
  statusMsgEl.appendChild(document.createTextNode(" Go back to the website tab, press "));
  
  const strongPlay = document.createElement("strong");
  strongPlay.textContent = "PLAY";
  statusMsgEl.appendChild(strongPlay);
  statusMsgEl.appendChild(document.createTextNode(" on the video player (and close any popups that appear). Hidden actual streams will instantly populate below."));
}

const linksContainer = document.getElementById('links-container');
const detectedUrls = new Set();
const reconstructedBases = new Set();

const adBlacklist = ['google-analytics', 'doubleclick', 'popads', 'exoclick', 'adsterra', 'juicyads', 'propellerads', 'onclickads'];

// --- MÉTODO 1: CAPTURA POR CORRESPONDÊNCIA DE URL (Antes de carregar) ---
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.tabId !== targetTabId) return;
    processPotentialUrl(details.url);
  },
  { urls: ["<all_urls>"] }
);

// --- MÉTODO 2: CAPTURA POR MIME-TYPE ---
// Pega vídeos mesmo se a URL for criptografada ou sem extensão aparente
browser.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (details.tabId !== targetTabId || !details.responseHeaders) return;

    // Procura o cabeçalho "Content-Type" enviado pelo servidor
    const contentTypeHeader = details.responseHeaders.find(h => h.name.toLowerCase() === 'content-type');
    if (contentTypeHeader) {
      const type = contentTypeHeader.value.toLowerCase();
      // Se for um tipo de streaming ou vídeo nativo, capturamos imediatamente
      if (type.includes('video/') || type.includes('mpegurl') || type.includes('wavefront')) {
        processPotentialUrl(details.url);
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// --- MÉTODO 3: RECEBER CAPTURAS DIRETAS DA TAG <VIDEO> (Content Script) ---
browser.runtime.onMessage.addListener((message) => {
  // Se recebermos um link extraído direto do player da página, processa
  if (message.action === "scrapedVideoUrl" && message.url) {
    processPotentialUrl(message.url);
  }
});

function processPotentialUrl(url) {
  if (adBlacklist.some(ad => url.toLowerCase().includes(ad))) return;

  // Se capturarmos o .m3u8 ou .mp4 limpo pelo Content-Type ou URL
  if ((url.includes('.m3u8') || url.includes('.mp4')) && !detectedUrls.has(url) && !url.includes('/seg-') && !url.includes('.ts')) {
    detectedUrls.add(url);
    renderVideoLink(url, "🎯 DETECTADO (ALTA PRECISÃO)");
    return;
  }

  // Engenharia Reversa de fragmentos (HLS)
  if ((url.includes('.ts') || url.includes('/seg-')) && !url.includes('google')) {
    let baseUrl = url.includes('/seg-') ? url.split('/seg-')[0] : url.substring(0, url.lastIndexOf('/'));
    
    if (reconstructedBases.has(baseUrl)) return;
    reconstructedBases.add(baseUrl);

    const urlMontadaIndex = `${baseUrl}/index.m3u8`;
    const urlMontadaMaster = `${baseUrl}/master.m3u8`;

    if (baseUrl.endsWith('.mp4') && !detectedUrls.has(baseUrl)) {
      detectedUrls.add(baseUrl);
      renderVideoLink(baseUrl, "🛠️ LINK RECONSTRUÍDO (MP4)");
    }
    if (!detectedUrls.has(urlMontadaIndex)) {
      detectedUrls.add(urlMontadaIndex);
      renderVideoLink(urlMontadaIndex, "🛠️ LINK RECONSTRUÍDO (INDEX)");
    }
    if (!detectedUrls.has(urlMontadaMaster)) {
      detectedUrls.add(urlMontadaMaster);
      renderVideoLink(urlMontadaMaster, "🛠️ LINK RECONSTRUÍDO (MASTER)");
    }
  }
}

function renderVideoLink(url, tipo) {
  const item = document.createElement('div');
  item.className = 'video-item';

  const infoContainer = document.createElement('div');
  infoContainer.className = 'info-container'; // Reaproveita a classe do sniffer.css original

  const badge = document.createElement('span');
  badge.className = 'badge';
  // Define a cor de fundo dinamicamente mas respeitando o tema do CSS original
  badge.style.backgroundColor = tipo.includes('🎯') ? 'var(--success-green)' : 'var(--warning-yellow)';
  badge.textContent = tipo;

  const urlSpan = document.createElement('span');
  urlSpan.className = 'video-url';
  urlSpan.textContent = url;

  infoContainer.appendChild(badge);
  infoContainer.appendChild(urlSpan);

  const btn = document.createElement('button');
  btn.className = 'mpv-btn'; // Reaproveita o estilo do sniffer.css original
  btn.textContent = browser.i18n.getMessage("sendToMpvBtnText"); // Mantém a tradução nativa
  btn.onclick = function() {
    browser.runtime.sendMessage({
      action: "sendToMpv",
      url: url,
      title: "Stream Sniffed", // Mantido o fallback original do background.js
      tabId: null,
      fromHistory: true
    });
  };

  item.appendChild(infoContainer);
  item.appendChild(btn);
  linksContainer.appendChild(item);
}