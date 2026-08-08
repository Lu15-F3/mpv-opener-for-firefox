// ============================================================
// check-update.js - MPV Opener Update Check
// ============================================================

const EXTENSION_VERSION = "7.0.2";
const MIN_WRAPPER_VERSION = "7.0.2";

document.addEventListener("DOMContentLoaded", function() {
    const statusContainer = document.getElementById("status-container");
    const statusIcon = document.getElementById("status-icon");
    const statusText = document.getElementById("status-text");
    const extVersion = document.getElementById("ext-version");
    const wrapperVersion = document.getElementById("wrapper-version");
    const requiredVersion = document.getElementById("required-version");
    const updateActions = document.getElementById("update-actions");
    const updateBtn = document.getElementById("update-btn");
    const checkBtn = document.getElementById("check-btn");
    
    // ============================================================
    // Função para comparar versões
    // ============================================================
    function compareVersions(v1, v2) {
        if (!v1 || !v2) return 0;
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }
    
    // ============================================================
    // Verificar versões
    // ============================================================
    function checkVersions() {
        statusContainer.className = "update-status";
        statusIcon.textContent = "⏳";
        statusText.textContent = "Checking versions...";
        
        extVersion.textContent = EXTENSION_VERSION;
        requiredVersion.textContent = MIN_WRAPPER_VERSION;
        
        // Verificar wrapper via Native Messaging
        browser.runtime.sendNativeMessage("org.custom.mpv", {
            url: "",
            extension_version: EXTENSION_VERSION
        }).then(function(response) {
            console.log("Version check response:", response);
            
            if (response && response.wrapper_version) {
                const wrapperVer = response.wrapper_version;
                wrapperVersion.textContent = wrapperVer;
                
                // Verificar compatibilidade
                const compat = compareVersions(wrapperVer, MIN_WRAPPER_VERSION);
                
                if (compat < 0) {
                    // Wrapper desatualizado
                    statusContainer.className = "update-status error";
                    statusIcon.textContent = "❌";
                    statusText.textContent = `Wrapper v${wrapperVer} is outdated!`;
                    wrapperVersion.className = "version-value outdated";
                    updateActions.style.display = "block";
                    updateBtn.textContent = "🔄 Update Native Host";
                } else if (compat === 0) {
                    statusContainer.className = "update-status ok";
                    statusIcon.textContent = "✅";
                    statusText.textContent = "Versions are compatible!";
                    wrapperVersion.className = "version-value current";
                    updateActions.style.display = "none";
                } else {
                    statusContainer.className = "update-status ok";
                    statusIcon.textContent = "✅";
                    statusText.textContent = `Wrapper v${wrapperVer} is newer than required!`;
                    wrapperVersion.className = "version-value current";
                    updateActions.style.display = "none";
                }
            } else {
                statusContainer.className = "update-status error";
                statusIcon.textContent = "⚠️";
                statusText.textContent = "Failed to get wrapper version. Is Native Host installed?";
                wrapperVersion.textContent = "Not installed";
                wrapperVersion.className = "version-value outdated";
                updateActions.style.display = "block";
                updateBtn.textContent = "🔧 Install Native Host";
            }
        }).catch(function(error) {
            console.error("Version check error:", error);
            statusContainer.className = "update-status error";
            statusIcon.textContent = "⚠️";
            statusText.textContent = "Failed to communicate with Native Host. Please check installation.";
            wrapperVersion.textContent = "Not detected";
            wrapperVersion.className = "version-value outdated";
            updateActions.style.display = "block";
            updateBtn.textContent = "🔧 Install Native Host";
        });
    }
    
    // ============================================================
    // Abrir URL de atualização
    // ============================================================
    function openUpdateUrl() {
        const updateUrl = "https://github.com/Lu15-F3/mpv-opener-for-firefox/releases";
        browser.tabs.create({ url: updateUrl });
    }
    
    // ============================================================
    // Event Listeners
    // ============================================================
    updateBtn.addEventListener("click", openUpdateUrl);
    checkBtn.addEventListener("click", checkVersions);
    
    // ============================================================
    // Verificar na inicialização
    // ============================================================
    checkVersions();
});