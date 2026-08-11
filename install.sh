#!/bin/bash
# ============================================================
# MPV Opener for Firefox - Installer v7.0.3 via Curl
# ============================================================
# Usage: curl -sSL https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/install.sh | bash
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================
# Configuration
# ============================================================
REPO_OWNER="Lu15-F3"
REPO_NAME="mpv-opener-for-firefox"
BRANCH="main"
VERSION="7.0.3"

# URLs dos arquivos
BASE_URL="https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/$BRANCH/native-host"

FILES=(
    "mpv_wrapper.py"
    "org.custom.mpv.json"
    "locale_loader.sh"
)

# ============================================================
# Functions
# ============================================================
download_file() {
    local file=$1
    local dest=$2
    local url="$BASE_URL/$file"
    
    echo -e "${BLUE}  Downloading $file...${NC}"
    if curl -sSL -o "$dest/$file" "$url"; then
        echo -e "${GREEN}  ✔ Downloaded $file${NC}"
        return 0
    else
        echo -e "${RED}  ✖ Failed to download $file${NC}"
        return 1
    fi
}

download_locales() {
    local dest=$1
    local locales_dir="$dest/_locales"
    
    echo -e "${BLUE}  Downloading locale files...${NC}"
    
    # Lista de locales (baseada na sua estrutura)
    local locales=(
        "en"
        "pt_BR"
        "pt_PT"
        "es"
        "fr"
        "de"
        "it"
        "ja"
        "ko"
        "ru"
        "uk"
        "ar"
        "hi"
        "pl"
        "zh_CN"
    )
    
    mkdir -p "$locales_dir"
    
    for locale in "${locales[@]}"; do
        local locale_url="$BASE_URL/_locales/$locale/messages.json"
        local locale_path="$locales_dir/$locale"
        mkdir -p "$locale_path"
        
        if curl -sSL -o "$locale_path/messages.json" "$locale_url" 2>/dev/null; then
            echo -e "${GREEN}    ✔ $locale${NC}"
        else
            echo -e "${YELLOW}    ⚠ $locale not found, skipping${NC}"
        fi
    done
    
    echo -e "${GREEN}  ✔ Locale files downloaded${NC}"
}

# ============================================================
# Main Installation
# ============================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${MAGENTA}MPV Opener for Firefox - Installer v$VERSION${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}▶ Creating temporary directory: $TEMP_DIR${NC}"

# Download dos arquivos
echo -e "\n${BLUE}▶ Downloading native-host files...${NC}"

for file in "${FILES[@]}"; do
    if ! download_file "$file" "$TEMP_DIR"; then
        echo -e "${RED}✖ Failed to download required files${NC}"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
done

# Download das locales
download_locales "$TEMP_DIR"

# Tornar scripts executáveis
chmod +x "$TEMP_DIR/locale_loader.sh" 2>/dev/null || true

# Executar o instalador principal
echo -e "\n${BLUE}▶ Running native-host installer...${NC}"
cd "$TEMP_DIR"

# Verificar se o install.sh existe no repositório
if curl -sSL -o "$TEMP_DIR/install.sh" "$BASE_URL/install.sh" 2>/dev/null; then
    chmod +x "$TEMP_DIR/install.sh"
    bash "$TEMP_DIR/install.sh"
else
    # Fallback: executar diretamente o mpv_wrapper.py como instalador
    echo -e "${YELLOW}⚠ Using fallback installation method${NC}"
    bash -c "$(curl -sSL "$BASE_URL/install.sh")"
fi

# Limpeza
echo -e "\n${BLUE}▶ Cleaning up...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}  ✔ Temporary files removed${NC}"

echo -e "\n${GREEN}✅ Installation completed!${NC}"
echo -e "${YELLOW}ℹ️  You may need to restart Firefox for changes to take effect.${NC}"
