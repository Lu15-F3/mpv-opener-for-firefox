#!/bin/bash
# ============================================================
# uninstall.sh - MPV Opener for Firefox v7.2
# Native Host Uninstaller - Multi-Distro Support
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================
# Parse arguments
# ============================================================
FORCE=false
for arg in "$@"; do
    case $arg in
        --force|-y|--yes)
            FORCE=true
            ;;
    esac
done

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# Load locale system
# ============================================================
if [ -f "$SCRIPT_DIR/locale_loader.sh" ]; then
    source "$SCRIPT_DIR/locale_loader.sh"
elif [ -f "$(dirname "$SCRIPT_DIR")/locale_loader.sh" ]; then
    source "$(dirname "$SCRIPT_DIR")/locale_loader.sh"
else
    # Fallback functions
    detect_language() {
        local lang="${LANG:-en_US}"
        lang="${lang%%.*}"
        lang="${lang%%:*}"
        lang="${lang//_/-}"
        case "$lang" in pt-BR|pt_PT|pt*) echo "pt_BR" ;; es*) echo "es" ;; *) echo "en" ;; esac
    }
    load_locale() { load_fallback_messages; }
    load_fallback_messages() {
        MSG_uninstaller="MPV Opener for Firefox - Uninstaller"
        MSG_language="Language"
        MSG_uninstall_confirm="This will remove MPV Opener from your system."
        MSG_continue_prompt="Continue?"
        MSG_cancelled="Installation cancelled."
        MSG_removing="Removing components..."
        MSG_removed="Removed:"
        MSG_not_found="Not found:"
        MSG_cleaning="Cleaning empty directories..."
        MSG_removed_empty="Removed empty:"
        MSG_dir_not_empty="Directory not empty or not found:"
        MSG_uninstall_complete="Uninstallation completed successfully!"
        MSG_restart="You may need to restart Firefox for changes to take effect."
        MSG_removing_version="Removing version information..."
    }
fi

# Detect language
LANG_CODE="$(detect_language)"
load_locale "$LANG_CODE"

if [ -z "$MSG_uninstaller" ]; then
    load_fallback_messages
fi

# ============================================================
# Paths
# ============================================================
BIN_DIR="$HOME/.local/bin"
NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
NATIVE_DIR_SNAP="$HOME/snap/firefox/common/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"
WRAPPER_NAME="mpv_wrapper.py"
VERSION_FILE="$HOME/.local/share/mpv-opener/version.txt"
VERSION_DIR="$(dirname "$VERSION_FILE")"

# ============================================================
# Função para ler input do terminal
# ============================================================
confirm_uninstall() {
    # Se --force foi passado, pular confirmação
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    # Redirecionar stdin para o terminal real
    local answer
    if [ -t 0 ]; then
        # Estamos em um terminal interativo
        printf "${YELLOW}⚠ $MSG_uninstall_confirm ($MSG_continue_prompt) (y/N) ${NC}"
        read -r answer
    else
        # Não estamos em um terminal interativo (curl | bash)
        # Tentar abrir o terminal diretamente
        if [ -e /dev/tty ]; then
            printf "${YELLOW}⚠ $MSG_uninstall_confirm ($MSG_continue_prompt) (y/N) ${NC}" > /dev/tty
            read -r answer < /dev/tty
        else
            # Fallback: se não for interativo e não tiver --force, cancelar
            echo -e "${YELLOW}⚠ Non-interactive mode. Use --force to skip confirmation.${NC}"
            return 1
        fi
    fi

    [[ $answer =~ ^[Yy]$ ]]
}

# ============================================================
# Display header
# ============================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${MAGENTA}$MSG_uninstaller${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}  ${MSG_language:-Language}: ${BOLD}${LANG_CODE}${NC}\n"

echo -e "${YELLOW}⚠ $MSG_uninstall_confirm${NC}"

# ============================================================
# Confirmação de desinstalação
# ============================================================
if ! confirm_uninstall; then
    echo -e "${GREEN}✔ $MSG_cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}▶ $MSG_removing${NC}"

# ============================================================
# Remove version file
# ============================================================
echo -e "${BLUE}▶ $MSG_removing_version${NC}"
if [ -f "$VERSION_FILE" ]; then
    rm "$VERSION_FILE"
    echo -e "${GREEN}  ✔ $MSG_removed $VERSION_FILE${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_not_found $VERSION_FILE${NC}"
fi

# Tentar remover o diretório se estiver vazio
if [ -d "$VERSION_DIR" ] && [ -z "$(ls -A "$VERSION_DIR" 2>/dev/null)" ]; then
    rmdir "$VERSION_DIR" 2>/dev/null && echo -e "${GREEN}  ✔ $MSG_removed_empty $VERSION_DIR${NC}"
fi

# ============================================================
# Remove wrapper
# ============================================================
WRAPPER_PATH="$BIN_DIR/$WRAPPER_NAME"
if [ -f "$WRAPPER_PATH" ]; then
    rm "$WRAPPER_PATH"
    echo -e "${GREEN}  ✔ $MSG_removed $WRAPPER_PATH${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_not_found $WRAPPER_PATH${NC}"
fi

# ============================================================
# Remove manifest files
# ============================================================
for dir in "$NATIVE_DIR_NATIVE" "$NATIVE_DIR_FLATPAK" "$NATIVE_DIR_SNAP"; do
    MANIFEST_PATH="$dir/$MANIFEST_NAME"
    if [ -f "$MANIFEST_PATH" ]; then
        rm "$MANIFEST_PATH"
        echo -e "${GREEN}  ✔ $MSG_removed $MANIFEST_PATH${NC}"
    else
        echo -e "${YELLOW}  ⚠ $MSG_not_found $MANIFEST_PATH${NC}"
    fi
done

# ============================================================
# Clean empty directories
# ============================================================
echo -e "\n${BLUE}▶ $MSG_cleaning${NC}"

for dir in "$NATIVE_DIR_NATIVE" "$NATIVE_DIR_FLATPAK" "$NATIVE_DIR_SNAP"; do
    if [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
        rmdir "$dir" 2>/dev/null && echo -e "${GREEN}  ✔ $MSG_removed_empty $dir${NC}"
    else
        echo -e "${YELLOW}  ⚠ $MSG_dir_not_empty $dir${NC}"
    fi
done

# ============================================================
# Final message
# ============================================================
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${BOLD}✔ $MSG_uninstall_complete${NC} ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}⚠ $MSG_restart${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"