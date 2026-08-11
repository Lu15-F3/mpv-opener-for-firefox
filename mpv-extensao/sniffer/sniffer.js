// ============================================================
// sniffer.js - MPV Opener for Firefox v7.3
// COM SUPORTE COMPLETO A i18n E SEM innerHTML
// ============================================================

var urlParams = new URLSearchParams(window.location.search);
var targetTabId = parseInt(urlParams.get('tabId'));

// ============================================================
// Função de Tradução Centralizada
// ============================================================
function t(key, fallback) {
  try {
    var message = browser.i18n.getMessage(key);
    if (message) return message;
    return fallback || key;
  } catch (e) {
    return fallback || key;
  }
}

// ============================================================
// Aplicar traduções a todos os elementos com data-i18n
// ============================================================
function applyTranslations() {
  var elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var translation = t(key);
    if (translation) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.type === 'text' || el.type === 'password' || el.type === 'search') {
          el.placeholder = translation;
        } else {
          el.value = translation;
        }
      } else {
        el.textContent = translation;
      }
    }
  });
  
  var titleKey = document.querySelector('title')?.getAttribute('data-i18n');
  if (titleKey) {
    document.title = t(titleKey, document.title);
  }
  
  document.getElementById('txt-sniff-title').textContent = t('snifferTitle', 'Media Link Sniffer');
  document.getElementById('txt-sniff-subtitle').textContent = t('snifferSubtitle', 'Captured Streams');
  
  document.getElementById('export-btn').textContent = t('snifferExportAll', 'Export All');
  document.getElementById('clear-btn').textContent = t('snifferClearAll', 'Clear All');
  document.getElementById('send-all-btn').textContent = t('snifferSendAll', 'Send All');
}

// ============================================================
// Instruções - CORRIGIDO: SEM innerHTML EM QUALQUER LUGAR
// ============================================================
function renderInstructions() {
  var statusMsgEl = document.getElementById('status-msg');
  statusMsgEl.textContent = "";
  
  var instructionsKey = 'snifferInstructions';
  var instructions = t(instructionsKey, '');
  
  if (instructions) {
    // Parsear a string de instruções manualmente para criar nós DOM seguros
    // O formato esperado: "<strong>Instructions:</strong> Go back to the website tab, press <strong>PLAY</strong> on the video player..."
    
    var parts = instructions.split(/(<strong>|<\/strong>)/g);
    var currentStrong = null;
    
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      
      if (part === '<strong>') {
        // Início de tag strong
        currentStrong = document.createElement('strong');
        // O próximo elemento (que não é tag) será o conteúdo
        i++;
        if (i < parts.length && parts[i] !== '<\/strong>') {
          currentStrong.textContent = parts[i];
          statusMsgEl.appendChild(currentStrong);
        }
        // Pular a tag de fechamento no próximo loop
        i++;
      } else if (part === '</strong>') {
        // Ignorar, já processamos
        continue;
      } else if (part && part.trim() !== '') {
        // Texto normal
        statusMsgEl.appendChild(document.createTextNode(part));
      }
    }
  } else {
    // Fallback hardcoded para pt-BR ou en-US
    var currentUiLang = browser.i18n.getUILanguage().startsWith("pt") ? "pt" : "en";
    
    if (currentUiLang === "pt") {
      var strongInst = document.createElement("strong");
      strongInst.textContent = "Instruções:";
      statusMsgEl.appendChild(strongInst);
      statusMsgEl.appendChild(document.createTextNode(" Volte para a aba do site, pressione "));
      
      var strongPlay = document.createElement("strong");
      strongPlay.textContent = "PLAY";
      statusMsgEl.appendChild(strongPlay);
      statusMsgEl.appendChild(document.createTextNode(" no player de vídeo (e feche todos os pop-ups que aparecerem). Os fluxos reais ocultos serão preenchidos instantaneamente abaixo."));
    } else {
      var strongInst = document.createElement("strong");
      strongInst.textContent = "Instructions:";
      statusMsgEl.appendChild(strongInst);
      statusMsgEl.appendChild(document.createTextNode(" Go back to the website tab, press "));
      
      var strongPlay = document.createElement("strong");
      strongPlay.textContent = "PLAY";
      statusMsgEl.appendChild(strongPlay);
      statusMsgEl.appendChild(document.createTextNode(" on the video player (and close any popups that appear). Hidden actual streams will instantly populate below."));
    }
  }
}

// ============================================================
// Sniffer Engine - Versão Aprimorada com Validação
// ============================================================
var linksContainer = document.getElementById('links-container');
var detectedUrls = new Set();
var reconstructedBases = new Set();
var captureCount = 0;
var urlSources = new Map();
var urlStatus = new Map();
var validatingUrls = new Set();

var adBlacklist = [
  'google-analytics', 'doubleclick', 'popads', 'exoclick', 
  'adsterra', 'juicyads', 'propellerads', 'onclickads', 
  'googlesyndication', 'facebook.com/tr', 'amazon-adsystem',
  'googletagmanager', 'gtm.js', 'analytics.js'
];

// ============================================================
// Novos métodos de captura via webRequest
// ============================================================
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.tabId !== targetTabId) return;
    processPotentialUrl(details.url, 'WebRequest');
  },
  { urls: ["<all_urls>"] }
);

browser.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (details.tabId !== targetTabId || !details.responseHeaders) return;
    
    var contentTypeHeader = details.responseHeaders.find(function(h) {
      return h.name.toLowerCase() === 'content-type';
    });
    if (contentTypeHeader) {
      var type = contentTypeHeader.value.toLowerCase();
      if (type.includes('video/') || type.includes('mpegurl') || type.includes('wavefront') ||
          type.includes('application/vnd.apple.mpegurl') || type.includes('application/dash+xml')) {
        processPotentialUrl(details.url, 'MIME-Type');
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Mensagens do content script
browser.runtime.onMessage.addListener(function(message) {
  if (message.action === "scrapedVideoUrl" && message.url) {
    processPotentialUrl(message.url, message.source || 'ContentScript');
  }
});

// ============================================================
// Funções de Detecção e Processamento
// ============================================================
function detectManifests(url) {
  var manifestPatterns = [
    /\.m3u8/i,
    /\.mpd/i,
    /master\.m3u8/i,
    /index\.m3u8/i,
    /manifest\.mpd/i,
    /playlist\.m3u8/i,
    /stream\.mpd/i,
    /manifest\.m3u8/i
  ];
  return manifestPatterns.some(function(pattern) { return pattern.test(url); });
}

function reconstructFragmentUrl(url) {
  if (url.includes('.ts') || url.includes('/seg-') || url.includes('/chunk-')) {
    var baseUrl = url;
    if (url.includes('/seg-')) {
      baseUrl = url.split('/seg-')[0];
    } else if (url.includes('/chunk-')) {
      baseUrl = url.split('/chunk-')[0];
    } else if (url.includes('/ts/')) {
      baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    } else {
      baseUrl = url.substring(0, url.lastIndexOf('/'));
    }
    if (reconstructedBases.has(baseUrl)) return null;
    reconstructedBases.add(baseUrl);
    return [
      baseUrl + '/index.m3u8',
      baseUrl + '/master.m3u8',
      baseUrl + '/manifest.mpd',
      baseUrl + '.m3u8',
      baseUrl + '/playlist.m3u8',
      baseUrl + '/stream.mpd',
      baseUrl + '/manifest.m3u8'
    ];
  }
  if (url.includes('m4s') || url.includes('/segment-')) {
    var baseUrl = url;
    if (url.includes('/segment-')) {
      baseUrl = url.split('/segment-')[0];
    } else if (url.includes('/init-')) {
      baseUrl = url.split('/init-')[0];
    } else if (url.includes('/m4s/')) {
      baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    } else {
      baseUrl = url.substring(0, url.lastIndexOf('/'));
    }
    if (reconstructedBases.has(baseUrl)) return null;
    reconstructedBases.add(baseUrl);
    return [
      baseUrl + '/manifest.mpd',
      baseUrl + '/index.mpd',
      baseUrl + '.mpd',
      baseUrl + '/stream.mpd',
      baseUrl + '/manifest.mpd'
    ];
  }
  return null;
}

function isVideoUrl(url) {
  var videoExtensions = [
    '.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv',
    '.flv', '.wmv', '.mpg', '.mpeg', '.3gp', '.m4v',
    '.ts', '.m3u8', '.mpd', '.m4s', '.m3u'
  ];
  var urlLower = url.toLowerCase();
  return videoExtensions.some(function(ext) { return urlLower.includes(ext); });
}

// ============================================================
// Detecção de Resolução Aprimorada
// ============================================================
function getQualityLabel(url) {
  var urlLower = url.toLowerCase();
  
  var qualityPatterns = {
    '2160p (4K)': /2160|3840x2160|4k|ultrahd|uhd|2160p/i,
    '1440p (2K)': /1440|2560x1440|2k|qhd|1440p/i,
    '1080p (FHD)': /1080|1920x1080|fullhd|fhd|1080p|1080/i,
    '720p (HD)': /720|1280x720|hd|720p/i,
    '480p (SD)': /480|854x480|sd|480p|640x480/i,
    '360p (Low)': /360|640x360|low|360p/i,
    '240p (Very Low)': /240|426x240|240p/i
  };
  
  for (var quality in qualityPatterns) {
    if (qualityPatterns[quality].test(urlLower)) {
      return quality;
    }
  }
  
  var bitrateMatch = urlLower.match(/(\d{3,4})k/i);
  if (bitrateMatch) {
    var bitrate = parseInt(bitrateMatch[1]);
    if (bitrate >= 5000) return '2160p (4K)';
    if (bitrate >= 2500) return '1080p (FHD)';
    if (bitrate >= 1500) return '720p (HD)';
    if (bitrate >= 800) return '480p (SD)';
    if (bitrate >= 400) return '360p (Low)';
    return '240p (Very Low)';
  }
  
  return null;
}

function getResolutionFromManifest(url) {
  var urlLower = url.toLowerCase();
  
  var manifestPatterns = [
    /_(1080|720|480|360|240)p?/i,
    /_(hd|fhd|sd|low|high|best)/i,
    /_(best|high|medium|low)/i,
    /quality[=_-](best|high|medium|low|1080|720|480|360|240)/i,
    /resolution[=_-](\d{3,4})x(\d{3,4})/i,
    /height[=_-](\d{3,4})/i,
    /width[=_-](\d{3,4})/i,
    /bitrate[=_-](\d{3,4})k/i
  ];
  
  for (var i = 0; i < manifestPatterns.length; i++) {
    var match = urlLower.match(manifestPatterns[i]);
    if (match) {
      if (match[1] && match[1].match(/^\d{3,4}$/)) {
        var height = parseInt(match[1]);
        if (height >= 2160) return '2160p (4K)';
        if (height >= 1440) return '1440p (2K)';
        if (height >= 1080) return '1080p (FHD)';
        if (height >= 720) return '720p (HD)';
        if (height >= 480) return '480p (SD)';
        if (height >= 360) return '360p (Low)';
        if (height >= 240) return '240p (Very Low)';
      }
      if (match[1] && match[2]) {
        var h = parseInt(match[2]);
        if (h >= 2160) return '2160p (4K)';
        if (h >= 1440) return '1440p (2K)';
        if (h >= 1080) return '1080p (FHD)';
        if (h >= 720) return '720p (HD)';
        if (h >= 480) return '480p (SD)';
        if (h >= 360) return '360p (Low)';
        if (h >= 240) return '240p (Very Low)';
      }
    }
  }
  
  return null;
}

// ============================================================
// Agrupamento por Resolução
// ============================================================
var qualityGroups = {
  '2160p (4K)': [],
  '1440p (2K)': [],
  '1080p (FHD)': [],
  '720p (HD)': [],
  '480p (SD)': [],
  '360p (Low)': [],
  '240p (Very Low)': [],
  'Unknown': []
};

function addToQualityGroup(url, resolution) {
  if (!resolution) resolution = 'Unknown';
  
  for (var group in qualityGroups) {
    if (qualityGroups[group].some(function(item) { return item.url === url; })) {
      return;
    }
  }
  
  qualityGroups[resolution].push({ url: url, resolution: resolution });
}

// ============================================================
// Validação de Links
// ============================================================
async function validateUrl(url) {
  if (url.startsWith('blob:')) {
    return { valid: false, reason: 'Blob URL (não acessível diretamente)' };
  }
  
  if (url.includes('expires=')) {
    var expiresMatch = url.match(/expires=(\d+)/);
    if (expiresMatch) {
      var expires = parseInt(expiresMatch[1]);
      var now = Math.floor(Date.now() / 1000);
      if (expires < now) {
        return { valid: false, reason: 'Token expirado' };
      }
    }
  }
  
  try {
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 5000);
    
    var response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': url,
        'Accept': '*/*'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      var contentType = response.headers.get('content-type') || '';
      var isVideo = contentType.includes('video') || 
                    contentType.includes('mpegurl') || 
                    contentType.includes('dash+xml') ||
                    contentType.includes('application/vnd.apple.mpegurl');
      
      return {
        valid: true,
        status: response.status,
        contentType: contentType,
        isVideo: isVideo,
        reason: 'OK'
      };
    } else {
      return {
        valid: false,
        status: response.status,
        reason: 'HTTP ' + response.status + ' ' + response.statusText
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { valid: false, reason: 'Timeout (5s)' };
    }
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return { valid: false, reason: 'CORS ou rede bloqueada' };
    }
    return { valid: false, reason: error.message || 'Erro desconhecido' };
  }
}

// ============================================================
// Processamento de URL (Principal)
// ============================================================
function processPotentialUrl(url, source) {
  if (!url || typeof url !== 'string') return;
  url = url.trim();
  
  if (adBlacklist.some(function(ad) { return url.toLowerCase().includes(ad); })) return;
  
  if (detectedUrls.has(url)) return;
  
  var resolution = getQualityLabel(url);
  if (!resolution) {
    resolution = getResolutionFromManifest(url);
  }
  
  if (url.includes('/seg-') || url.includes('/chunk-') || (url.includes('.ts') && !url.includes('m3u8'))) {
    var reconstructed = reconstructFragmentUrl(url);
    if (reconstructed) {
      reconstructed.forEach(function(reconUrl) {
        if (!detectedUrls.has(reconUrl) && !reconUrl.includes('/seg-') && !reconUrl.includes('/chunk-')) {
          var reconResolution = getQualityLabel(reconUrl) || getResolutionFromManifest(reconUrl);
          detectedUrls.add(reconUrl);
          var label = "🛠 Reconstructed";
          if (reconResolution) {
            label += " [" + reconResolution + "]";
          }
          addToQualityGroup(reconUrl, reconResolution || 'Unknown');
          urlSources.set(reconUrl, source || 'Reconstructed');
          renderVideoLink(reconUrl, label, reconResolution, source || 'Reconstructed');
        }
      });
    }
    return;
  }
  
  if (isVideoUrl(url) || detectManifests(url)) {
    detectedUrls.add(url);
    var label = "🎯 Detected";
    if (url.includes('.m3u8')) label = "📋 HLS Playlist";
    else if (url.includes('.mpd')) label = "📋 DASH Manifest";
    else if (url.includes('.mp4')) label = "🎬 Video";
    else if (url.includes('.webm')) label = "🎬 WebM Video";
    else if (url.includes('.ts')) label = "📦 TS Segment";
    else if (url.includes('.m4s')) label = "📦 M4S Segment";
    
    if (resolution) {
      label += " [" + resolution + "]";
    }
    
    if (source) {
      label += " via " + source;
    }
    
    addToQualityGroup(url, resolution || 'Unknown');
    urlSources.set(url, source || 'Detected');
    renderVideoLink(url, label, resolution, source || 'Detected');
  }
}

// ============================================================
// Renderização com Indicadores de Status (traduzida)
// ============================================================
function renderVideoLink(url, tipo, resolution, source) {
  var item = document.createElement('div');
  item.className = 'video-item';
  item.dataset.url = url;
  
  var infoContainer = document.createElement('div');
  infoContainer.className = 'info-container';
  
  var badgeContainer = document.createElement('div');
  badgeContainer.style.display = 'flex';
  badgeContainer.style.gap = '6px';
  badgeContainer.style.alignItems = 'center';
  badgeContainer.style.flexWrap = 'wrap';
  
  var badge = document.createElement('span');
  badge.className = 'badge';
  
  if (tipo.includes('HLS') || tipo.includes('DASH')) {
    badge.style.backgroundColor = 'var(--accent-color)';
  } else if (tipo.includes('Video') || tipo.includes('WebM')) {
    badge.style.backgroundColor = 'var(--success-green)';
  } else if (tipo.includes('Reconstructed')) {
    badge.style.backgroundColor = 'var(--warning-yellow)';
  } else {
    badge.style.backgroundColor = 'var(--accent-pink)';
  }
  badge.style.color = '#1a1b26';
  badge.textContent = tipo;
  badgeContainer.appendChild(badge);
  
  if (resolution && resolution !== 'Unknown') {
    var resBadge = document.createElement('span');
    resBadge.className = 'badge';
    
    if (resolution.includes('4K') || resolution.includes('2160')) {
      resBadge.style.backgroundColor = '#ff6b6b';
    } else if (resolution.includes('2K') || resolution.includes('1440')) {
      resBadge.style.backgroundColor = '#ff9f43';
    } else if (resolution.includes('FHD') || resolution.includes('1080')) {
      resBadge.style.backgroundColor = '#feca57';
    } else if (resolution.includes('HD') || resolution.includes('720')) {
      resBadge.style.backgroundColor = '#54a0ff';
    } else if (resolution.includes('SD') || resolution.includes('480')) {
      resBadge.style.backgroundColor = '#5f27cd';
    } else {
      resBadge.style.backgroundColor = '#8395a7';
    }
    resBadge.style.color = '#1a1b26';
    resBadge.textContent = resolution;
    badgeContainer.appendChild(resBadge);
  }
  
  if (source && source !== 'Detected') {
    var sourceBadge = document.createElement('span');
    sourceBadge.className = 'badge';
    sourceBadge.style.backgroundColor = '#576574';
    sourceBadge.style.color = '#ffffff';
    sourceBadge.textContent = '📡 ' + source;
    badgeContainer.appendChild(sourceBadge);
  }
  
  var statusBadge = document.createElement('span');
  statusBadge.className = 'badge status-badge';
  statusBadge.style.backgroundColor = '#576574';
  statusBadge.style.color = '#ffffff';
  statusBadge.textContent = '⏳ ' + t('snifferChecking', 'Verificando...');
  statusBadge.dataset.status = 'checking';
  badgeContainer.appendChild(statusBadge);
  
  var urlSpan = document.createElement('span');
  urlSpan.className = 'video-url';
  urlSpan.textContent = url;
  
  infoContainer.appendChild(badgeContainer);
  infoContainer.appendChild(urlSpan);
  
  var btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '6px';
  btnContainer.style.alignItems = 'center';
  btnContainer.style.flexWrap = 'wrap';
  
  var btn = document.createElement('button');
  btn.className = 'mpv-btn';
  btn.textContent = t('sendToMpvBtnText', '▶ Play');
  btn.onclick = function() {
    browser.runtime.sendMessage({
      action: "sendToMpv",
      url: url,
      title: "Sniffed Stream" + (resolution ? " [" + resolution + "]" : ""),
      tabId: null,
      fromHistory: false
    });
  };
  btnContainer.appendChild(btn);
  
  var testBtn = document.createElement('button');
  testBtn.className = 'mpv-btn';
  testBtn.style.background = 'linear-gradient(135deg, #54a0ff, #565f89)';
  testBtn.textContent = '🔍 ' + t('snifferTestLink', 'Testar');
  testBtn.title = t('snifferTestLinkTooltip', 'Testar se este link é acessível');
  testBtn.onclick = function() {
    testLink(url, item, statusBadge);
  };
  btnContainer.appendChild(testBtn);
  
  var copyBtn = document.createElement('button');
  copyBtn.className = 'mpv-btn';
  copyBtn.style.background = 'linear-gradient(135deg, #8395a7, #565f89)';
  copyBtn.textContent = '📋';
  copyBtn.title = t('snifferCopyLink', 'Copiar');
  copyBtn.onclick = function() {
    navigator.clipboard.writeText(url).then(function() {
      copyBtn.textContent = '✅';
      setTimeout(function() {
        copyBtn.textContent = '📋';
      }, 2000);
    });
  };
  btnContainer.appendChild(copyBtn);
  
  item.appendChild(infoContainer);
  item.appendChild(btnContainer);
  linksContainer.appendChild(item);
  
  captureCount++;
  var subtitleText = t('snifferSubtitle', 'Captured Streams') + 
    " (" + captureCount + " " + t('snifferCapturedCount', 'capturados') + ")";
  document.getElementById('txt-sniff-subtitle').textContent = subtitleText;
  
  item.scrollIntoView({ behavior: 'smooth', block: 'end' });
  
  validateUrlAsync(url, item, statusBadge);
}

// ============================================================
// Validação Assíncrona (traduzida)
// ============================================================
async function validateUrlAsync(url, item, statusBadge) {
  if (validatingUrls.has(url)) return;
  validatingUrls.add(url);
  
  statusBadge.textContent = '⏳ ' + t('snifferChecking', 'Verificando...');
  statusBadge.style.backgroundColor = '#576574';
  statusBadge.dataset.status = 'checking';
  
  var result = await validateUrl(url);
  
  if (result.valid) {
    statusBadge.textContent = '✅ ' + t('snifferValid', 'Válido');
    statusBadge.style.backgroundColor = 'var(--success-green)';
    statusBadge.style.color = '#1a1b26';
    statusBadge.dataset.status = 'valid';
    
    if (result.contentType) {
      statusBadge.title = 'Status: ' + result.status + ' | Tipo: ' + result.contentType;
    } else {
      statusBadge.title = 'Status: ' + result.status;
    }
    
    if (result.isVideo) {
      item.style.borderColor = 'var(--success-green)';
      item.style.borderWidth = '2px';
    }
  } else {
    statusBadge.textContent = '❌ ' + (result.reason || t('snifferInvalid', 'Inválido'));
    statusBadge.style.backgroundColor = 'var(--danger-color)';
    statusBadge.style.color = '#ffffff';
    statusBadge.dataset.status = 'invalid';
    statusBadge.title = result.reason || t('snifferInvalidTooltip', 'Link inacessível');
    
    item.style.opacity = '0.7';
  }
  
  urlStatus.set(url, result);
  validatingUrls.delete(url);
}

// ============================================================
// Função de Teste Manual (traduzida)
// ============================================================
async function testLink(url, item, statusBadge) {
  if (!item) {
    var items = linksContainer.querySelectorAll('.video-item');
    for (var i = 0; i < items.length; i++) {
      if (items[i].dataset.url === url) {
        item = items[i];
        statusBadge = item.querySelector('.status-badge');
        break;
      }
    }
  }
  
  if (!item || !statusBadge) {
    alert(t('snifferTesting', 'Testando link: ') + url + '\n' + t('snifferWait', 'Aguarde...'));
  }
  
  if (statusBadge) {
    statusBadge.textContent = '⏳ ' + t('snifferTesting', 'Testando...');
    statusBadge.style.backgroundColor = '#576574';
    statusBadge.style.color = '#ffffff';
    statusBadge.dataset.status = 'testing';
  }
  
  var result = await validateUrl(url);
  
  if (statusBadge) {
    if (result.valid) {
      statusBadge.textContent = '✅ ' + t('snifferValid', 'Válido');
      statusBadge.style.backgroundColor = 'var(--success-green)';
      statusBadge.style.color = '#1a1b26';
      statusBadge.dataset.status = 'valid';
      if (result.contentType) {
        statusBadge.title = 'Status: ' + result.status + ' | Tipo: ' + result.contentType;
      }
      
      if (item) {
        item.style.borderColor = 'var(--success-green)';
        item.style.borderWidth = '2px';
        item.style.opacity = '1';
      }
    } else {
      statusBadge.textContent = '❌ ' + (result.reason || t('snifferInvalid', 'Inválido'));
      statusBadge.style.backgroundColor = 'var(--danger-color)';
      statusBadge.style.color = '#ffffff';
      statusBadge.dataset.status = 'invalid';
      statusBadge.title = result.reason || t('snifferInvalidTooltip', 'Link inacessível');
      
      if (item) {
        item.style.opacity = '0.7';
      }
    }
    
    urlStatus.set(url, result);
  }
  
  var details = '🔍 ' + t('snifferTestResult', 'Resultado do teste:') + '\n\n';
  details += '📎 URL: ' + url + '\n\n';
  details += '📊 ' + t('snifferStatus', 'Status') + ': ' + (result.valid ? '✅ ' + t('snifferValid', 'VÁLIDO') : '❌ ' + t('snifferInvalid', 'INVÁLIDO')) + '\n';
  if (result.status) {
    details += '📡 HTTP: ' + result.status + '\n';
  }
  if (result.contentType) {
    details += '📄 ' + t('snifferType', 'Tipo') + ': ' + result.contentType + '\n';
  }
  if (result.isVideo !== undefined) {
    details += '🎬 ' + t('snifferIsVideo', 'É vídeo') + ': ' + (result.isVideo ? t('snifferYes', 'Sim') : t('snifferNo', 'Não')) + '\n';
  }
  if (result.reason) {
    details += '💬 ' + t('snifferReason', 'Motivo') + ': ' + result.reason + '\n';
  }
  
  console.log('MPV Opener: Teste de link', result);
  alert(details);
}

function testAllLinks() {
  var items = linksContainer.querySelectorAll('.video-item');
  if (items.length === 0) {
    alert(t('snifferNoLinks', 'Nenhum link para testar'));
    return;
  }
  
  var confirmed = confirm(t('snifferTestAllConfirm', 'Testar todos os ') + items.length + ' ' + t('snifferLinks', 'links?'));
  if (!confirmed) return;
  
  items.forEach(function(item) {
    var url = item.dataset.url;
    var statusBadge = item.querySelector('.status-badge');
    if (url && statusBadge) {
      testLink(url, item, statusBadge);
    }
  });
}

// ============================================================
// Filtro por Resolução
// ============================================================
function filterByResolution(resolution) {
  var items = linksContainer.querySelectorAll('.video-item');
  items.forEach(function(item) {
    var badges = item.querySelectorAll('.badge');
    var found = false;
    badges.forEach(function(badge) {
      if (resolution === 'all') {
        found = true;
      } else if (badge.textContent === resolution) {
        found = true;
      }
    });
    item.style.display = found ? 'flex' : 'none';
  });
}

// ============================================================
// Adicionar UI de Filtro e Botões (traduzida)
// ============================================================
function addFilterUI() {
  var controls = document.querySelector('.sniffer-controls');
  
  var filterContainer = document.createElement('div');
  filterContainer.style.display = 'flex';
  filterContainer.style.alignItems = 'center';
  filterContainer.style.gap = '8px';
  filterContainer.style.flexWrap = 'wrap';
  filterContainer.style.marginBottom = '8px';
  filterContainer.style.width = '100%';
  
  var filterLabel = document.createElement('span');
  filterLabel.textContent = t('snifferFilter', 'Filtrar') + ':';
  filterLabel.style.fontSize = '12px';
  filterLabel.style.color = 'var(--text-muted)';
  filterContainer.appendChild(filterLabel);
  
  var filterSelect = document.createElement('select');
  filterSelect.id = 'quality-filter';
  filterSelect.style.backgroundColor = 'var(--bg-color)';
  filterSelect.style.color = 'var(--text-color)';
  filterSelect.style.border = '1px solid var(--border-color)';
  filterSelect.style.borderRadius = '4px';
  filterSelect.style.padding = '4px 8px';
  filterSelect.style.fontSize = '11px';
  filterSelect.style.flex = '1';
  filterSelect.style.minWidth = '120px';
  
  var options = [
    { value: 'all', label: t('snifferAllQualities', 'Todas as Qualidades') },
    { value: '2160p (4K)', label: '4K (2160p)' },
    { value: '1440p (2K)', label: '2K (1440p)' },
    { value: '1080p (FHD)', label: 'FHD (1080p)' },
    { value: '720p (HD)', label: 'HD (720p)' },
    { value: '480p (SD)', label: 'SD (480p)' },
    { value: '360p (Low)', label: 'Low (360p)' },
    { value: '240p (Very Low)', label: 'Very Low (240p)' },
    { value: 'Unknown', label: 'Unknown' }
  ];
  
  options.forEach(function(opt) {
    var option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    filterSelect.appendChild(option);
  });
  
  filterSelect.addEventListener('change', function() {
    filterByResolution(this.value);
  });
  
  filterContainer.appendChild(filterSelect);
  
  var testAllBtn = document.createElement('button');
  testAllBtn.className = 'mpv-btn';
  testAllBtn.style.background = 'linear-gradient(135deg, #54a0ff, #565f89)';
  testAllBtn.style.padding = '4px 12px';
  testAllBtn.style.fontSize = '11px';
  testAllBtn.textContent = '🔍 ' + t('snifferTestAll', 'Testar Todos');
  testAllBtn.title = t('snifferTestAllTooltip', 'Testar todos os links capturados');
  testAllBtn.onclick = testAllLinks;
  filterContainer.appendChild(testAllBtn);
  
  var actions = document.querySelector('.sniffer-actions');
  controls.insertBefore(filterContainer, actions);
}

// ============================================================
// Botões de Ação (traduzidos)
// ============================================================
document.getElementById('export-btn').addEventListener('click', function() {
  var urls = [];
  var items = linksContainer.querySelectorAll('.video-item');
  items.forEach(function(item) {
    var urlSpan = item.querySelector('.video-url');
    if (urlSpan) {
      urls.push(urlSpan.textContent);
    }
  });
  
  if (urls.length === 0) {
    alert(t('snifferNoUrls', 'Nenhuma URL para exportar'));
    return;
  }
  
  var text = urls.join('\n');
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('export-btn');
    var originalText = btn.textContent;
    btn.textContent = '✅ ' + t('snifferCopied', 'Copiado!');
    setTimeout(function() {
      btn.textContent = originalText;
    }, 2000);
  });
});

document.getElementById('clear-btn').addEventListener('click', function() {
  if (captureCount === 0) return;
  if (confirm(t('snifferClearConfirm', 'Limpar todos os streams capturados?'))) {
    linksContainer.textContent = '';
    captureCount = 0;
    detectedUrls.clear();
    reconstructedBases.clear();
    urlSources.clear();
    urlStatus.clear();
    validatingUrls.clear();
    for (var group in qualityGroups) {
      qualityGroups[group] = [];
    }
    document.getElementById('txt-sniff-subtitle').textContent = 
      t('snifferSubtitle', 'Captured Streams') + " (0 " + t('snifferCapturedCount', 'capturados') + ")";
  }
});

document.getElementById('send-all-btn').addEventListener('click', function() {
  var items = linksContainer.querySelectorAll('.video-item');
  if (items.length === 0) {
    alert(t('snifferNoStreams', 'Nenhum stream para enviar'));
    return;
  }
  
  var confirmed = confirm(t('snifferSendAllConfirm', 'Enviar todos os ') + items.length + ' ' + t('snifferStreams', 'streams para o mpv?'));
  if (!confirmed) return;
  
  items.forEach(function(item) {
    var urlSpan = item.querySelector('.video-url');
    if (urlSpan) {
      var url = urlSpan.textContent;
      browser.runtime.sendMessage({
        action: "sendToMpv",
        url: url,
        title: "Sniffed Stream",
        tabId: null,
        fromHistory: false
      });
    }
  });
});

// ============================================================
// Inicialização
// ============================================================
// Aplicar traduções primeiro
applyTranslations();

// Renderizar instruções com DOM seguro (SEM innerHTML)
renderInstructions();

// Depois adicionar UI de filtro
setTimeout(addFilterUI, 100);

// ============================================================
// Exportar funções para debug
// ============================================================
window.__MPV_SNIFFER = {
  version: '7.1',
  qualityGroups: qualityGroups,
  detectedUrls: detectedUrls,
  urlSources: urlSources,
  urlStatus: urlStatus,
  filterByResolution: filterByResolution,
  processPotentialUrl: processPotentialUrl,
  getQualityLabel: getQualityLabel,
  getResolutionFromManifest: getResolutionFromManifest,
  validateUrl: validateUrl,
  validateUrlAsync: validateUrlAsync,
  testLink: testLink,
  testAllLinks: testAllLinks,
  t: t,
  applyTranslations: applyTranslations,
  renderInstructions: renderInstructions,
  scan: function() {
    browser.tabs.executeScript(targetTabId, {
      code: 'window.__MPV_SNIFFER && window.__MPV_SNIFFER.scan();'
    });
  },
  clearCache: function() {
    detectedUrls.clear();
    reconstructedBases.clear();
    urlSources.clear();
    urlStatus.clear();
    validatingUrls.clear();
    for (var group in qualityGroups) {
      qualityGroups[group] = [];
    }
    console.log('MPV Opener Sniffer: Cache cleared');
  }
};

console.log('MPV Opener Sniffer v7.3 loaded with i18n support');