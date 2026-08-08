#!/bin/bash
# ============================================================
# MPV Opener for Firefox - Uninstaller v7.0.2
# ============================================================
# Usage: curl -sSL https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/uninstall.sh | bash
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
VERSION="7.0.2"

BASE_URL="https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/$BRANCH/native-host"

# ============================================================
# Functions
# ============================================================
download_uninstaller() {
    local dest=$1
    echo -e "${BLUE}  Downloading uninstaller...${NC}"

    if curl -sSL -o "$dest/uninstall.sh" "$BASE_URL/uninstall.sh" 2>/dev/null; then
        chmod +x "$dest/uninstall.sh"
        echo -e "${GREEN}  ✔ Downloaded uninstaller${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⚠ Using fallback uninstaller${NC}"
        return 1
    fi
}

# ============================================================
# Função para ler input do terminal (CORRIGIDA)
# ============================================================
confirm_uninstall() {
    # Redirecionar stdin para o terminal real
    local answer
    if [ -t 0 ]; then
        # Estamos em um terminal interativo
        printf "${YELLOW}⚠ Continue? (y/N) ${NC}"
        read -r answer
    else
        # Não estamos em um terminal interativo (curl | bash)
        # Tentar abrir o terminal diretamente
        if [ -e /dev/tty ]; then
            printf "${YELLOW}⚠ Continue? (y/N) ${NC}" > /dev/tty
            read -r answer < /dev/tty
        else
            # Fallback: assumir que o usuário quer continuar (non-interactive)
            echo -e "${YELLOW}⚠ Non-interactive mode - proceeding with uninstall${NC}"
            return 0
        fi
    fi

    [[ $answer =~ ^[Yy]$ ]]
}

# ============================================================
# Main Uninstallation
# ============================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${MAGENTA}MPV Opener for Firefox - Uninstaller v$VERSION${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⚠ This will remove MPV Opener from your system.${NC}"
echo -e "${YELLOW}⚠ This includes:${NC}"
echo -e "  ${CYAN}• ${BOLD}mpv_wrapper.py${NC} - Native messaging host"
echo -e "  ${CYAN}• ${BOLD}org.custom.mpv.json${NC} - Firefox manifest"
echo -e "  ${CYAN}• ${BOLD}version.txt${NC} - Version information"
echo -e "  ${CYAN}• ${BOLD}Empty directories${NC} - Cleaned up"
echo ""

# ============================================================
# Confirmação de desinstalação - CORRIGIDO
# ============================================================
if ! confirm_uninstall; then
    echo -e "${GREEN}✔ Uninstallation cancelled.${NC}"
    exit 0
fi

# ============================================================
# Criar diretório temporário
# ============================================================
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}▶ Creating temporary directory: $TEMP_DIR${NC}"

# ============================================================
# Tentar baixar o uninstaller nativo
# ============================================================
if download_uninstaller "$TEMP_DIR"; then
    echo -e "\n${BLUE}▶ Running native-host uninstaller...${NC}"
    cd "$TEMP_DIR"
    bash "$TEMP_DIR/uninstall.sh" --force
    cd - > /dev/null
else
    # ============================================================
    # Fallback: Remover manualmente
    # ============================================================
    echo -e "\n${BLUE}▶ Removing components manually...${NC}"

    BIN_DIR="$HOME/.local/bin"
    NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
    NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
    NATIVE_DIR_SNAP="$HOME/snap/firefox/common/.mozilla/native-messaging-hosts"
    MANIFEST_NAME="org.custom.mpv.json"
    WRAPPER_NAME="mpv_wrapper.py"
    VERSION_FILE="$HOME/.local/share/mpv-opener/version.txt"
    VERSION_DIR="$(dirname "$VERSION_FILE")"

    # Remover wrapper
    if [ -f "$BIN_DIR/$WRAPPER_NAME" ]; then
        rm "$BIN_DIR/$WRAPPER_NAME"
        echo -e "${GREEN}  ✔ Removed $BIN_DIR/$WRAPPER_NAME${NC}"
    else
        echo -e "${YELLOW}  ⚠ Not found: $BIN_DIR/$WRAPPER_NAME${NC}"
    fi

    # Remover manifests
    for dir in "$NATIVE_DIR_NATIVE" "$NATIVE_DIR_FLATPAK" "$NATIVE_DIR_SNAP"; do
        if [ -f "$dir/$MANIFEST_NAME" ]; then
            rm "$dir/$MANIFEST_NAME"
            echo -e "${GREEN}  ✔ Removed $dir/$MANIFEST_NAME${NC}"
        else
            echo -e "${YELLOW}  ⚠ Not found: $dir/$MANIFEST_NAME${NC}"
        fi
    done

    # Remover version file
    if [ -f "$VERSION_FILE" ]; then
        rm "$VERSION_FILE"
        echo -e "${GREEN}  ✔ Removed $VERSION_FILE${NC}"
    fi

    if [ -d "$VERSION_DIR" ] && [ -z "$(ls -A "$VERSION_DIR" 2>/dev/null)" ]; then
        rmdir "$VERSION_DIR" 2>/dev/null && echo -e "${GREEN}  ✔ Removed empty directory $VERSION_DIR${NC}"
    fi

    # Limpar diretórios vazios
    for dir in "$NATIVE_DIR_NATIVE" "$NATIVE_DIR_FLATPAK" "$NATIVE_DIR_SNAP"; do
        if [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
            rmdir "$dir" 2>/dev/null && echo -e "${GREEN}  ✔ Removed empty directory $dir${NC}"
        fi
    done
fi

# ============================================================
# Limpeza
# ============================================================
echo -e "\n${BLUE}▶ Cleaning up...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}  ✔ Temporary files removed${NC}"

# ============================================================
# Final message
# ============================================================
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${BOLD}✔ Uninstallation completed successfully!${NC} ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}⚠ You may need to restart Firefox for changes to take effect.${NC}"
