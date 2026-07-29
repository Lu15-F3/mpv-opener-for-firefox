// ============================================================
// content-sniffer.js - MPV Opener for Firefox v7.0
// Content Script for DOM video extraction - Enhanced Version
// ============================================================

(function () {
  "use strict";

  console.log("MPV Opener: Content Sniffer v7.0 started");

  // ============================================================
  // Configuration
  // ============================================================
  var CONFIG = {
    scanInterval: 3000, // Periodic scan interval (ms)
    maxBlobReadSize: 1024 * 10, // Max bytes to read from blobs (10KB)
    consoleDebounce: 500, // Debounce time for console logs (ms)
    fetchDebounce: 300, // Debounce time for fetch intercept (ms)
  };

  var capturedUrls = new Set();
  var consoleLogBuffer = [];
  var consoleLogTimer = null;
  var fetchBuffer = [];
  var fetchTimer = null;

  // ============================================================
  // 1. WebSocket Interception
  // ============================================================
  function interceptWebSockets() {
    var originalWebSocket = window.WebSocket;

    window.WebSocket = function (url, protocols) {
      var ws = new originalWebSocket(url, protocols);

      // Monitorar mensagens recebidas
      ws.addEventListener("message", function (event) {
        if (event.data && typeof event.data === "string") {
          var videoUrls = event.data.match(
            /https?:\/\/[^\s]+\.(m3u8|mpd|mp4|webm|ts|m4s|m3u|mpeg)/gi,
          );
          if (videoUrls) {
            videoUrls.forEach(function (url) {
              sendVideoUrl(url, "WebSocket");
            });
          }

          // Tentar extrair URLs de objetos JSON
          try {
            var parsed = JSON.parse(event.data);
            extractUrlsFromObject(parsed, "WebSocket");
          } catch (e) {
            // Não é JSON, ignorar
          }
        }
      });

      // Monitorar envio de mensagens
      var originalSend = ws.send;
      ws.send = function (data) {
        if (typeof data === "string") {
          var videoUrls = data.match(
            /https?:\/\/[^\s]+\.(m3u8|mpd|mp4|webm|ts|m4s|m3u|mpeg)/gi,
          );
          if (videoUrls) {
            videoUrls.forEach(function (url) {
              sendVideoUrl(url, "WebSocket-Send");
            });
          }
        }
        return originalSend.call(this, data);
      };

      return ws;
    };

    window.WebSocket.prototype = originalWebSocket.prototype;
    console.log("MPV Opener: WebSocket interception enabled");
  }

  // ============================================================
  // 2. Service Worker Monitoring
  // ============================================================
  function monitorServiceWorkers() {
    if (!navigator.serviceWorker) return;

    // Interceptar mensagens do Service Worker
    navigator.serviceWorker.addEventListener("message", function (event) {
      if (event.data) {
        extractUrlsFromObject(event.data, "ServiceWorker");

        if (event.data.type === "videoUrl" || event.data.type === "streamUrl") {
          if (event.data.url) {
            sendVideoUrl(event.data.url, "ServiceWorker");
          }
        }
      }
    });

    // Interceptar registro de Service Workers
    if (navigator.serviceWorker.register) {
      var originalRegister = navigator.serviceWorker.register;
      navigator.serviceWorker.register = function (scriptURL, options) {
        console.log("MPV Opener: Service Worker registered:", scriptURL);

        // Tentar extrair URL do script do worker
        if (typeof scriptURL === "string") {
          var urls = scriptURL.match(
            /https?:\/\/[^\s"]+\.(js|m3u8|mpd|mp4|webm)/gi,
          );
          if (urls) {
            urls.forEach(function (url) {
              sendVideoUrl(url, "ServiceWorker-Register");
            });
          }
        }

        return originalRegister.call(this, scriptURL, options);
      };
    }

    console.log("MPV Opener: Service Worker monitoring enabled");
  }

  // ============================================================
  // 3. Canvas/WebGL/WebRTC Stream Capture
  // ============================================================
  function monitorCanvasCapture() {
    // Monitorar canvas.getContext
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      contextType,
      attributes,
    ) {
      var ctx = originalGetContext.call(this, contextType, attributes);

      // Se for um contexto de video, tentar extrair a fonte
      if (
        contextType === "webgl" ||
        contextType === "webgl2" ||
        contextType === "2d"
      ) {
        // Verificar se o canvas está sendo usado para renderizar video
        var videoElements = document.querySelectorAll("video");
        videoElements.forEach(function (video) {
          if (video.src && video.src.startsWith("http")) {
            sendVideoUrl(video.src, "Canvas");
          }
        });
      }
      return ctx;
    };

    // Monitorar WebRTC
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      var originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = function (constraints) {
        if (constraints.video || constraints.audio) {
          console.log("MPV Opener: WebRTC stream detected");

          // Tentar extrair URL da stream
          if (constraints.video && typeof constraints.video === "string") {
            sendVideoUrl(constraints.video, "WebRTC");
          }
        }
        return originalGetUserMedia.call(this, constraints);
      };
    }

    console.log("MPV Opener: Canvas/WebRTC monitoring enabled");
  }

  // ============================================================
  // 4. MediaSource / SourceBuffer Interception
  // ============================================================
  function interceptMediaSource() {
    // Interceptar URL.createObjectURL
    var originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function (obj) {
      if (obj instanceof MediaSource) {
        console.log("MPV Opener: MediaSource detected");
        // Tentar rastrear a fonte do MediaSource
        if (obj.url) {
          sendVideoUrl(obj.url, "MediaSource");
        }
      }
      return originalCreateObjectURL.call(this, obj);
    };

    // Interceptar MediaSource.addSourceBuffer
    if (window.MediaSource && MediaSource.prototype.addSourceBuffer) {
      var originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;
      MediaSource.prototype.addSourceBuffer = function (mimeType) {
        console.log("MPV Opener: SourceBuffer added:", mimeType);

        // Tentar extrair URLs dos segmentos
        if (
          mimeType &&
          (mimeType.includes("video") || mimeType.includes("audio"))
        ) {
          // Procurar por URLs na página que podem ser segmentos
          var allElements = document.querySelectorAll("*");
          allElements.forEach(function (el) {
            if (el.src && el.src.startsWith("http")) {
              var url = el.src;
              if (
                url.includes(".ts") ||
                url.includes(".m4s") ||
                url.includes("/segment-")
              ) {
                sendVideoUrl(url, "SourceBuffer");
              }
            }
          });
        }

        return originalAddSourceBuffer.call(this, mimeType);
      };
    }

    console.log("MPV Opener: MediaSource interception enabled");
  }

  // ============================================================
  // 5. Shaka Player / HLS.js / Dash.js Native Interception
  // ============================================================
  function interceptPlayerEvents() {
    // HLS.js
    if (window.Hls) {
      try {
        var originalHls = window.Hls;
        window.Hls = function (config) {
          var instance = new originalHls(config);

          // Interceptar eventos do HLS.js
          if (instance.on) {
            var originalOn = instance.on;
            instance.on = function (event, listener) {
              if (event === originalHls.Events.MANIFEST_PARSED) {
                var wrappedListener = function (event, data) {
                  console.log("MPV Opener: HLS.js manifest parsed");
                  if (data && data.levels) {
                    data.levels.forEach(function (level) {
                      if (level.url) {
                        sendVideoUrl(level.url, "HLS.js");
                      }
                      if (level.uri) {
                        sendVideoUrl(level.uri, "HLS.js");
                      }
                    });
                  }
                  return listener.call(this, event, data);
                };
                return originalOn.call(this, event, wrappedListener);
              }
              return originalOn.call(this, event, listener);
            };
          }

          return instance;
        };
        window.Hls.prototype = originalHls.prototype;
        console.log("MPV Opener: HLS.js interception enabled");
      } catch (e) {
        console.log("MPV Opener: HLS.js interception error:", e);
      }
    }

    // DASH.js
    if (window.dashjs && window.dashjs.MediaPlayer) {
      try {
        var originalDash = window.dashjs.MediaPlayer;
        window.dashjs.MediaPlayer = function () {
          var instance = new originalDash();

          var originalInitialize = instance.initialize;
          instance.initialize = function (view, config) {
            var result = originalInitialize.call(this, view, config);

            // Interceptar eventos do DASH.js
            if (this.on) {
              this.on("manifestLoaded", function (event) {
                console.log("MPV Opener: DASH.js manifest loaded");
                if (event && event.manifest) {
                  extractUrlsFromObject(event.manifest, "DASH.js");
                }
              });
            }

            return result;
          };

          return instance;
        };
        window.dashjs.MediaPlayer.prototype = originalDash.prototype;
        console.log("MPV Opener: DASH.js interception enabled");
      } catch (e) {
        console.log("MPV Opener: DASH.js interception error:", e);
      }
    }

    // Shaka Player
    if (window.shaka && window.shaka.Player) {
      try {
        var originalShaka = window.shaka.Player;
        window.shaka.Player = function () {
          var instance = new originalShaka();

          var originalLoad = instance.load;
          instance.load = function (
            manifestUri,
            startTime,
            manifestParserFactory,
          ) {
            console.log("MPV Opener: Shaka Player loading:", manifestUri);
            if (manifestUri && typeof manifestUri === "string") {
              sendVideoUrl(manifestUri, "Shaka");
            }
            return originalLoad.call(
              this,
              manifestUri,
              startTime,
              manifestParserFactory,
            );
          };

          return instance;
        };
        window.shaka.Player.prototype = originalShaka.prototype;
        console.log("MPV Opener: Shaka Player interception enabled");
      } catch (e) {
        console.log("MPV Opener: Shaka Player interception error:", e);
      }
    }

    // Clappr
    if (window.Clappr) {
      try {
        var originalClappr = window.Clappr.Player;
        window.Clappr.Player = function (options) {
          if (options && options.source) {
            sendVideoUrl(options.source, "Clappr");
          }
          return new originalClappr(options);
        };
        console.log("MPV Opener: Clappr Player interception enabled");
      } catch (e) {
        console.log("MPV Opener: Clappr interception error:", e);
      }
    }

    // MediaElement.js
    if (window.mejs) {
      try {
        var originalMejs = window.mejs.MediaElement;
        window.mejs.MediaElement = function () {
          var instance = new originalMejs();
          var originalSetSrc = instance.setSrc;
          instance.setSrc = function (src) {
            if (src && typeof src === "string") {
              sendVideoUrl(src, "MediaElement");
            }
            return originalSetSrc.call(this, src);
          };
          return instance;
        };
        console.log("MPV Opener: MediaElement.js interception enabled");
      } catch (e) {
        console.log("MPV Opener: MediaElement.js interception error:", e);
      }
    }

    console.log("MPV Opener: Player events interception enabled");
  }

  // ============================================================
  // 6. Network Response Body Analysis (Fetch Interception)
  // ============================================================
  function interceptFetchResponse() {
    if (!window.fetch) return;

    var originalFetch = window.fetch;
    window.fetch = function (resource, init) {
      return originalFetch.call(this, resource, init).then(function (response) {
        // Clonar a resposta para não consumir o body
        var clone = response.clone();

        // Verificar se é um tipo que pode conter URLs
        var contentType = clone.headers.get("content-type") || "";
        if (
          contentType.includes("json") ||
          contentType.includes("javascript") ||
          contentType.includes("text")
        ) {
          clone
            .text()
            .then(function (text) {
              // Procurar por URLs de mídia no corpo da resposta
              var videoUrls = text.match(
                /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s|m3u|mpeg)/gi,
              );
              if (videoUrls) {
                videoUrls.forEach(function (url) {
                  sendVideoUrl(url, "Fetch");
                });
              }

              // Tentar parsear JSON
              try {
                var parsed = JSON.parse(text);
                extractUrlsFromObject(parsed, "Fetch-JSON");
              } catch (e) {
                // Não é JSON, ignorar
              }
            })
            .catch(function (e) {
              // Ignorar erros (respostas binárias, etc)
            });
        }
        return response;
      });
    };

    console.log("MPV Opener: Fetch interception enabled");
  }

  // ============================================================
  // 7. Cookie/Session Token Extraction
  // ============================================================
  function extractStreamTokens() {
    // Monitorar cookies
    try {
      var cookieDescriptor = Object.getOwnPropertyDescriptor(
        document,
        "cookie",
      );
      if (cookieDescriptor) {
        var originalGetter = cookieDescriptor.get;
        var originalSetter = cookieDescriptor.set;

        Object.defineProperty(document, "cookie", {
          get: function () {
            var cookies = originalGetter.call(this);
            // Procurar por tokens de autenticação
            if (cookies) {
              var tokenMatches = cookies.match(
                /(token|auth|session|access)[=:][^;]+/gi,
              );
              if (tokenMatches) {
                tokenMatches.forEach(function (token) {
                  console.log("MPV Opener: Token found:", token);
                  // Tentar extrair URL com token
                  var urlMatch = token.match(/https?:\/\/[^\s;]+/i);
                  if (urlMatch) {
                    sendVideoUrl(urlMatch[0], "Token");
                  }
                });
              }
            }
            return cookies;
          },
          set: function (value) {
            console.log("MPV Opener: Cookie set:", value);
            // Tentar extrair URLs do cookie
            var urls = value.match(
              /https?:\/\/[^\s;"]+\.(m3u8|mpd|mp4|webm)/gi,
            );
            if (urls) {
              urls.forEach(function (url) {
                sendVideoUrl(url, "Cookie");
              });
            }
            return originalSetter.call(this, value);
          },
        });
      }
    } catch (e) {
      console.log("MPV Opener: Cookie interception error:", e);
    }

    console.log("MPV Opener: Token extraction enabled");
  }

  // ============================================================
  // 8. Console Log Interception
  // ============================================================
  function interceptConsoleLog() {
    var originalLog = console.log;
    var originalInfo = console.info;
    var originalDebug = console.debug;
    var originalWarn = console.warn;
    var originalError = console.error;

    function extractUrlsFromConsole(args) {
      var text = args.join(" ");
      if (text) {
        var urls = text.match(
          /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s|m3u|mpeg)/gi,
        );
        if (urls) {
          urls.forEach(function (url) {
            sendVideoUrl(url, "Console");
          });
        }

        // Tentar extrair URLs de objetos
        args.forEach(function (arg) {
          if (typeof arg === "object" && arg !== null) {
            extractUrlsFromObject(arg, "Console");
          }
        });
      }
    }

    function createConsoleInterceptor(originalFn, level) {
      return function () {
        originalFn.apply(this, arguments);
        var args = Array.prototype.slice.call(arguments);
        extractUrlsFromConsole(args);
      };
    }

    console.log = createConsoleInterceptor(originalLog, "log");
    console.info = createConsoleInterceptor(originalInfo, "info");
    console.debug = createConsoleInterceptor(originalDebug, "debug");
    console.warn = createConsoleInterceptor(originalWarn, "warn");
    console.error = createConsoleInterceptor(originalError, "error");

    console.log("MPV Opener: Console log interception enabled");
  }

  // ============================================================
  // 9. Drag & Drop / Clipboard Monitoring
  // ============================================================
  function monitorDragAndDrop() {
    // Monitorar drag
    document.addEventListener("dragstart", function (event) {
      if (event.dataTransfer && event.dataTransfer.getData) {
        try {
          var text = event.dataTransfer.getData("text/plain");
          if (text) {
            var urls = text.match(
              /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s)/gi,
            );
            if (urls) {
              urls.forEach(function (url) {
                sendVideoUrl(url, "DragDrop");
              });
            }
          }

          // Verificar se há URLs em outros formatos
          var html = event.dataTransfer.getData("text/html");
          if (html) {
            var urls = html.match(
              /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s)/gi,
            );
            if (urls) {
              urls.forEach(function (url) {
                sendVideoUrl(url, "DragDrop");
              });
            }
          }
        } catch (e) {
          // Ignorar erros de drag
        }
      }
    });

    // Monitorar copy (clipboard)
    document.addEventListener("copy", function (event) {
      try {
        var selection = window.getSelection().toString();
        if (selection) {
          var urls = selection.match(
            /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s)/gi,
          );
          if (urls) {
            urls.forEach(function (url) {
              sendVideoUrl(url, "Clipboard");
            });
          }
        }

        // Tentar acessar clipboard via API
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard
            .readText()
            .then(function (text) {
              var urls = text.match(
                /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s)/gi,
              );
              if (urls) {
                urls.forEach(function (url) {
                  sendVideoUrl(url, "Clipboard");
                });
              }
            })
            .catch(function () {
              // Sem permissão para ler clipboard
            });
        }
      } catch (e) {
        // Ignorar erros de clipboard
      }
    });

    console.log("MPV Opener: Drag & Drop / Clipboard monitoring enabled");
  }

  // ============================================================
  // 10. Visibility API / Page Lifecycle
  // ============================================================
  function monitorVisibilityChanges() {
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        console.log("MPV Opener: Page became visible, rescanning...");
        // Re-ativar todos os métodos de captura
        setTimeout(function () {
          scanVideoElements();
          extractUrlsFromScripts();
          extractUrlsFromAttributes();
          detectPlayers();
        }, 1000);
      }
    });

    // Monitorar pagehide / pageshow
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        console.log("MPV Opener: Page restored from BFCache, rescanning...");
        setTimeout(function () {
          scanVideoElements();
          extractUrlsFromScripts();
          extractUrlsFromAttributes();
        }, 500);
      }
    });

    console.log("MPV Opener: Visibility API monitoring enabled");
  }

  // ============================================================
  // 11. SPDY/HTTP2 Push Detection (via PerformanceObserver)
  // ============================================================
  function detectHTTP2Push() {
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.entryType === "resource") {
            // Verificar se o recurso foi iniciado pelo servidor
            // (initiatorType 'other' pode indicar push)
            if (entry.initiatorType === "other") {
              var url = entry.name;
              if (
                url &&
                (url.includes("m3u8") ||
                  url.includes("mpd") ||
                  url.includes(".mp4") ||
                  url.includes(".webm") ||
                  url.includes(".ts") ||
                  url.includes(".m4s"))
              ) {
                sendVideoUrl(url, "HTTP2-Push");
              }
            }

            // Verificar se o recurso foi carregado muito cedo (possível push)
            if (entry.startTime < 100 && entry.initiatorType !== "navigation") {
              var url = entry.name;
              if (
                url &&
                (url.includes("m3u8") ||
                  url.includes("mpd") ||
                  url.includes(".mp4") ||
                  url.includes(".webm") ||
                  url.includes(".ts") ||
                  url.includes(".m4s"))
              ) {
                sendVideoUrl(url, "HTTP2-Push");
              }
            }
          }
        });
      });
      observer.observe({ entryTypes: ["resource"] });
      console.log("MPV Opener: HTTP2 Push detection enabled");
    } catch (e) {
      console.log("MPV Opener: HTTP2 Push detection not supported");
    }
  }

  // ============================================================
  // 12. CSS Background Video Detection
  // ============================================================
  function detectCSSBackgroundVideos() {
    var allElements = document.querySelectorAll("*");
    allElements.forEach(function (el) {
      try {
        var styles = window.getComputedStyle(el);
        var bgImage =
          styles.backgroundImage || styles.getPropertyValue("background-image");
        if (bgImage && bgImage.startsWith("url")) {
          var urlMatch = bgImage.match(/url\(["']?([^"']+?)["']?\)/);
          if (urlMatch && urlMatch[1]) {
            var videoUrl = urlMatch[1];
            if (
              videoUrl &&
              (videoUrl.includes(".mp4") ||
                videoUrl.includes(".webm") ||
                videoUrl.includes(".m3u8") ||
                videoUrl.includes(".mpd") ||
                videoUrl.includes(".ts") ||
                videoUrl.includes(".m4s"))
            ) {
              sendVideoUrl(videoUrl, "CSS-Background");
            }
          }
        }
      } catch (e) {
        // Ignorar erros de estilo
      }
    });

    console.log("MPV Opener: CSS Background video detection enabled");
  }

  // ============================================================
  // 13. Object URL (blob:) Revocation Detection
  // ============================================================
  function interceptBlobURLs() {
    var originalCreateObjectURL = URL.createObjectURL;
    var originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = function (obj) {
      var url = originalCreateObjectURL.call(this, obj);
      console.log("MPV Opener: Blob URL created:", url);

      if (obj instanceof Blob && obj.type && obj.type.startsWith("video/")) {
        // Tentar ler o blob para extrair informações
        try {
          var reader = new FileReader();
          reader.onload = function () {
            var result = this.result;
            if (typeof result === "string") {
              var urls = result.match(/https?:\/\/[^\s"']+/gi);
              if (urls) {
                urls.forEach(function (foundUrl) {
                  if (
                    foundUrl.includes("m3u8") ||
                    foundUrl.includes("mpd") ||
                    foundUrl.includes(".mp4") ||
                    foundUrl.includes(".webm") ||
                    foundUrl.includes(".ts") ||
                    foundUrl.includes(".m4s")
                  ) {
                    sendVideoUrl(foundUrl, "Blob");
                  }
                });
              }
            }
          };
          // Ler apenas o início do blob para performance
          var slice = obj.slice(0, Math.min(obj.size, CONFIG.maxBlobReadSize));
          reader.readAsText(slice);
        } catch (e) {
          // Ignorar erros de leitura de blob
        }
      }

      return url;
    };

    URL.revokeObjectURL = function (url) {
      console.log("MPV Opener: Blob URL revoked:", url);
      // Verificar se o URL revogado continha uma URL de vídeo
      if (url && url.startsWith("blob:")) {
        sendVideoUrl(url, "Blob-Revoke");
      }
      return originalRevokeObjectURL.call(this, url);
    };

    console.log("MPV Opener: Blob URL interception enabled");
  }

  // ============================================================
  // 14. Ad-Blocker Bypass Detection
  // ============================================================
  function detectAdBlockerBypass() {
    var scripts = document.querySelectorAll("script");
    scripts.forEach(function (script) {
      var content = script.textContent || script.innerHTML;
      if (content) {
        // Detectar técnicas anti-adblock
        if (
          content.includes("adblock") ||
          content.includes("ad-block") ||
          content.includes("adblocker") ||
          content.includes("ad blocker")
        ) {
          console.log("MPV Opener: Adblock detection detected");

          // Tentar encontrar URLs alternativas
          var altUrls = content.match(
            /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s)/gi,
          );
          if (altUrls) {
            altUrls.forEach(function (url) {
              sendVideoUrl(url, "AdBypass");
            });
          }

          // Tentar extrair URLs de objetos
          try {
            var matches = content.match(/\{[^}]+\}/g);
            if (matches) {
              matches.forEach(function (match) {
                try {
                  var obj = JSON.parse(match);
                  extractUrlsFromObject(obj, "AdBypass");
                } catch (e) {
                  // Ignorar
                }
              });
            }
          } catch (e) {
            // Ignorar
          }
        }
      }
    });

    console.log("MPV Opener: Ad-blocker bypass detection enabled");
  }

  // ============================================================
  // 15. Encrypted Media Extensions (EME) Detection
  // ============================================================
  function detectEME() {
    var videoElements = document.querySelectorAll("video");
    videoElements.forEach(function (video) {
      if (video.mediaKeys) {
        console.log("MPV Opener: DRM protected video detected");
        if (video.src) {
          sendVideoUrl(video.src, "EME");
        }

        // Tentar extrair URL do licenciamento
        var allScripts = document.querySelectorAll("script");
        allScripts.forEach(function (script) {
          var content = script.textContent || script.innerHTML;
          if (
            content &&
            content.includes("license") &&
            content.includes("url")
          ) {
            var licenseUrls = content.match(
              /https?:\/\/[^\s"']+\.(lic|license|key|drm)/gi,
            );
            if (licenseUrls) {
              licenseUrls.forEach(function (url) {
                sendVideoUrl(url, "EME-License");
              });
            }
          }
        });
      }
    });

    console.log("MPV Opener: EME detection enabled");
  }

  // ============================================================
  // 16. Utilitário: Extrair URLs de Objetos Recursivamente
  // ============================================================
  function extractUrlsFromObject(obj, source) {
    if (!obj || typeof obj !== "object") return;

    var urlPattern =
      /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s|m3u|mpeg)/gi;

    function recursiveExtract(value) {
      if (typeof value === "string") {
        var urls = value.match(urlPattern);
        if (urls) {
          urls.forEach(function (url) {
            sendVideoUrl(url, source);
          });
        }
      } else if (Array.isArray(value)) {
        value.forEach(function (item) {
          recursiveExtract(item);
        });
      } else if (value && typeof value === "object") {
        Object.keys(value).forEach(function (key) {
          recursiveExtract(value[key]);
        });
      }
    }

    recursiveExtract(obj);
  }

  // ============================================================
  // 17. Função para enviar URLs (com deduplicação)
  // ============================================================
  function sendVideoUrl(url, source) {
    if (!url || typeof url !== "string") return;

    // Limpar URL
    url = url.trim();
    if (!url || url.length < 10) return;

    // Verificar se é uma URL válida
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("blob:")
    ) {
      return;
    }

    // Deduplicação
    if (capturedUrls.has(url)) return;
    capturedUrls.add(url);

    console.log("MPV Opener: Captured URL [" + source + "]:", url);

    // Enviar para o background
    browser.runtime
      .sendMessage({
        action: "scrapedVideoUrl",
        url: url,
        source: source,
      })
      .catch(function (err) {
        // Ignorar erros de comunicação (pode acontecer se o popup não estiver aberto)
      });
  }

  // ============================================================
  // 18. Métodos Existentes (Refatorados)
  // ============================================================

  // 18.1 Scan Video Elements
  function scanVideoElements() {
    var videoElements = document.querySelectorAll("video, source, audio");
    videoElements.forEach(function (el) {
      if (el.src && el.src.startsWith("http")) {
        sendVideoUrl(el.src, "Video-Element");
      }
      if (el.tagName === "VIDEO") {
        el.querySelectorAll("source").forEach(function (source) {
          if (source.src && source.src.startsWith("http")) {
            sendVideoUrl(source.src, "Video-Source");
          }
        });
      }
    });
  }

  // 18.2 Extract URLs from Scripts
  function extractUrlsFromScripts() {
    var scripts = document.querySelectorAll("script");
    var urlPattern =
      /https?:\/\/[^\s"']+\.(m3u8|mpd|mp4|webm|ts|m4s|m3u|mpeg)/gi;

    scripts.forEach(function (script) {
      var content = script.textContent || script.innerHTML;
      if (content) {
        var matches = content.match(urlPattern);
        if (matches) {
          matches.forEach(function (url) {
            sendVideoUrl(url, "Script");
          });
        }

        // Tentar extrair de objetos JSON no script
        try {
          var jsonMatches = content.match(
            /\{[^{}]*(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/g,
          );
          if (jsonMatches) {
            jsonMatches.forEach(function (match) {
              try {
                var obj = JSON.parse(match);
                extractUrlsFromObject(obj, "Script-JSON");
              } catch (e) {
                // Ignorar
              }
            });
          }
        } catch (e) {
          // Ignorar
        }
      }
    });
  }

  // 18.3 Extract URLs from Attributes
  function extractUrlsFromAttributes() {
    var elements = document.querySelectorAll(
      "[data-video-url], [data-src], [data-href], [data-url], [data-stream]",
    );
    elements.forEach(function (el) {
      var attrs = [
        "data-video-url",
        "data-src",
        "data-href",
        "data-url",
        "data-stream",
      ];
      attrs.forEach(function (attr) {
        var value = el.getAttribute(attr);
        if (
          value &&
          (value.startsWith("http://") || value.startsWith("https://"))
        ) {
          sendVideoUrl(value, "Attribute");
        }
      });
    });
  }

  // 18.4 Detect JavaScript Players
  function detectPlayers() {
    // HLS.js
    if (window.Hls) {
      console.log("MPV Opener: HLS.js detected");
      try {
        if (window.Hls.instances) {
          Object.values(window.Hls.instances).forEach(function (instance) {
            if (instance.url) {
              sendVideoUrl(instance.url, "HLS.js");
            }
            if (instance.config && instance.config.manifestLoading) {
              extractUrlsFromObject(instance.config, "HLS.js");
            }
          });
        }
      } catch (e) {}
    }

    // DASH.js
    if (window.dashjs) {
      console.log("MPV Opener: DASH.js detected");
    }

    // Video.js
    if (window.videojs) {
      console.log("MPV Opener: Video.js detected");
      try {
        var players = window.videojs.getAllPlayers
          ? window.videojs.getAllPlayers()
          : [];
        players.forEach(function (player) {
          if (player.currentSrc) {
            var src = player.currentSrc();
            if (src && src.startsWith("http")) {
              sendVideoUrl(src, "Video.js");
            }
          }
        });
      } catch (e) {}
    }

    // JW Player
    if (window.jwplayer) {
      console.log("MPV Opener: JW Player detected");
      try {
        var jwInstances = window.jwplayer().getPlaylist
          ? window.jwplayer()
          : null;
        if (jwInstances) {
          var playlist = jwInstances.getPlaylist();
          if (playlist) {
            playlist.forEach(function (item) {
              if (item.file) {
                sendVideoUrl(item.file, "JWPlayer");
              }
            });
          }
        }
      } catch (e) {}
    }

    // Plyr
    if (window.plyr) {
      console.log("MPV Opener: Plyr detected");
    }

    // Shaka Player
    if (window.shaka && window.shaka.Player) {
      console.log("MPV Opener: Shaka Player detected");
    }

    // Clappr
    if (window.Clappr) {
      console.log("MPV Opener: Clappr detected");
    }

    // MediaElement.js
    if (window.mejs) {
      console.log("MPV Opener: MediaElement.js detected");
    }
  }

  // 18.5 Monitor Network Requests (Performance API)
  function monitorNetworkRequests() {
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.entryType === "resource") {
            var url = entry.name;
            if (
              url &&
              (url.includes("m3u8") ||
                url.includes("mpd") ||
                url.includes(".mp4") ||
                url.includes(".webm") ||
                url.includes(".ts") ||
                url.includes(".m4s"))
            ) {
              sendVideoUrl(url, "Performance");
            }
          }
        });
      });
      observer.observe({ entryTypes: ["resource"] });
    } catch (e) {
      console.log("MPV Opener: PerformanceObserver not supported");
    }
  }

  // 18.6 MutationObserver
  function setupObservers() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // Verificar mudanças em elementos existentes
        if (
          mutation.target &&
          mutation.target.tagName === "VIDEO" &&
          mutation.attributeName === "src"
        ) {
          if (mutation.target.src && mutation.target.src.startsWith("http")) {
            sendVideoUrl(mutation.target.src, "Mutation");
          }
        }

        // Verificar nós adicionados
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Verificar o próprio elemento
              if (
                (node.tagName === "VIDEO" ||
                  node.tagName === "SOURCE" ||
                  node.tagName === "AUDIO") &&
                node.src &&
                node.src.startsWith("http")
              ) {
                sendVideoUrl(node.src, "Mutation");
              }

              // Verificar elementos filhos
              if (node.querySelectorAll) {
                node
                  .querySelectorAll("video, source, audio")
                  .forEach(function (el) {
                    if (el.src && el.src.startsWith("http")) {
                      sendVideoUrl(el.src, "Mutation");
                    }
                  });

                // Verificar atributos de data
                node
                  .querySelectorAll(
                    "[data-video-url], [data-src], [data-stream]",
                  )
                  .forEach(function (el) {
                    var attrs = ["data-video-url", "data-src", "data-stream"];
                    attrs.forEach(function (attr) {
                      var value = el.getAttribute(attr);
                      if (
                        value &&
                        (value.startsWith("http://") ||
                          value.startsWith("https://"))
                      ) {
                        sendVideoUrl(value, "Mutation");
                      }
                    });
                  });
              }
            }
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["src", "data-src", "data-video-url", "data-stream"],
    });

    console.log("MPV Opener: MutationObserver enabled");
  }

  // ============================================================
  // 19. Periodic Scanner (Refatorado)
  // ============================================================
  var scanInterval = null;

  function startPeriodicScan() {
    if (scanInterval) clearInterval(scanInterval);
    scanInterval = setInterval(function () {
      scanVideoElements();
      extractUrlsFromScripts();
      extractUrlsFromAttributes();
      detectCSSBackgroundVideos();
      detectAdBlockerBypass();
      detectEME();
    }, CONFIG.scanInterval);

    console.log(
      "MPV Opener: Periodic scanner enabled (interval: " +
        CONFIG.scanInterval +
        "ms)",
    );
  }

  // ============================================================
  // 20. Injeção de Script para capturar variáveis globais
  // ============================================================
  function injectCaptureScript() {
    var script = document.createElement("script");
    script.textContent = `
      (function() {
        // Capturar variáveis globais que podem conter URLs de vídeo
        var videoKeywords = ['video', 'stream', 'hls', 'dash', 'media', 'player', 'manifest', 'playlist'];
        var captured = {};
        
        function scanGlobalObject(obj, path) {
          if (!obj || typeof obj !== 'object') return;
          if (captured[path]) return;
          captured[path] = true;
          
          try {
            Object.keys(obj).forEach(function(key) {
              try {
                var value = obj[key];
                if (typeof value === 'string' && value.startsWith('http')) {
                  if (value.match(/\\.(m3u8|mpd|mp4|webm|ts|m4s)/i)) {
                    window.dispatchEvent(new CustomEvent('mpv-video-url', { 
                      detail: { url: value, source: 'GlobalVar' } 
                    }));
                  }
                } else if (typeof value === 'object' && value !== null) {
                  if (videoKeywords.some(function(k) { return key.toLowerCase().includes(k); })) {
                    scanGlobalObject(value, path + '.' + key);
                  }
                }
              } catch (e) {
                // Ignorar
              }
            });
          } catch (e) {
            // Ignorar
          }
        }
        
        // Escanear window periodicamente
        setInterval(function() {
          videoKeywords.forEach(function(keyword) {
            try {
              var value = window[keyword];
              if (value && typeof value === 'object') {
                scanGlobalObject(value, keyword);
              }
            } catch (e) {
              // Ignorar
            }
          });
        }, 3000);
        
        // Escutar eventos personalizados
        document.addEventListener('mpv-video-url', function(event) {
          if (event.detail && event.detail.url) {
            // Enviar para a extensão
            browser.runtime.sendMessage({ 
              action: "scrapedVideoUrl", 
              url: event.detail.url,
              source: event.detail.source || 'GlobalVar'
            }).catch(function() {});
          }
        });
        
        console.log('MPV Opener: Global variable scanner injected');
      })();
    `;

    document.documentElement.appendChild(script);
    script.remove();
    console.log("MPV Opener: Global variable capture script injected");
  }

  // ============================================================
  // 21. Initialization
  // ============================================================
  function init() {
    console.log("MPV Opener: Initializing content sniffer v7.0...");

    // Métodos existentes
    scanVideoElements();
    extractUrlsFromScripts();
    extractUrlsFromAttributes();
    detectPlayers();
    monitorNetworkRequests();
    setupObservers();

    // Novos métodos
    interceptWebSockets();
    monitorServiceWorkers();
    monitorCanvasCapture();
    interceptMediaSource();
    interceptPlayerEvents();
    interceptFetchResponse();
    extractStreamTokens();
    interceptConsoleLog();
    monitorDragAndDrop();
    monitorVisibilityChanges();
    detectHTTP2Push();
    detectCSSBackgroundVideos();
    interceptBlobURLs();
    detectAdBlockerBypass();
    detectEME();
    injectCaptureScript();

    // Scanner periódico
    startPeriodicScan();

    // Cleanup
    window.addEventListener("beforeunload", function () {
      if (scanInterval) clearInterval(scanInterval);
    });

    console.log("MPV Opener: Content sniffer v7.0 ready");
  }

  // ============================================================
  // 22. Debug Exposure
  // ============================================================
  window.__MPV_SNIFFER = {
    version: "7.1",
    config: CONFIG,
    capturedUrls: capturedUrls,
    scanVideoElements: scanVideoElements,
    extractUrlsFromScripts: extractUrlsFromScripts,
    extractUrlsFromAttributes: extractUrlsFromAttributes,
    detectPlayers: detectPlayers,
    monitorNetworkRequests: monitorNetworkRequests,
    interceptWebSockets: interceptWebSockets,
    monitorServiceWorkers: monitorServiceWorkers,
    monitorCanvasCapture: monitorCanvasCapture,
    interceptMediaSource: interceptMediaSource,
    interceptPlayerEvents: interceptPlayerEvents,
    interceptFetchResponse: interceptFetchResponse,
    extractStreamTokens: extractStreamTokens,
    interceptConsoleLog: interceptConsoleLog,
    monitorDragAndDrop: monitorDragAndDrop,
    monitorVisibilityChanges: monitorVisibilityChanges,
    detectHTTP2Push: detectHTTP2Push,
    detectCSSBackgroundVideos: detectCSSBackgroundVideos,
    interceptBlobURLs: interceptBlobURLs,
    detectAdBlockerBypass: detectAdBlockerBypass,
    detectEME: detectEME,
    injectCaptureScript: injectCaptureScript,
    extractUrlsFromObject: extractUrlsFromObject,
    sendVideoUrl: sendVideoUrl,
    scan: function () {
      scanVideoElements();
      extractUrlsFromScripts();
      extractUrlsFromAttributes();
      detectPlayers();
      detectCSSBackgroundVideos();
      detectAdBlockerBypass();
      detectEME();
    },
    clearCache: function () {
      capturedUrls.clear();
      console.log("MPV Opener: Cache cleared");
    },
  };

  // ============================================================
  // Start
  // ============================================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
