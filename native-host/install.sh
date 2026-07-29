#!/bin/bash
# ============================================================
# install.sh - MPV Opener for Firefox v7.0
# Native Host Installer - Multilingual
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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# Load locale system
# ============================================================
source "$SCRIPT_DIR/locale_loader.sh"

# Detect language
LANG_CODE="$(detect_language)"

# Load all messages
load_locale "$LANG_CODE"

# Verificar se as mensagens foram carregadas
if [ -z "$MSG_installer" ]; then
    load_fallback_messages
fi

# ============================================================
# Paths
# ============================================================
BIN_DIR="$HOME/.local/bin"
NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"
WRAPPER_NAME="mpv_wrapper.py"

SOURCE_DIR="$SCRIPT_DIR"
WRAPPER_SOURCE="$SOURCE_DIR/$WRAPPER_NAME"
MANIFEST_SOURCE="$SOURCE_DIR/$MANIFEST_NAME"

# ============================================================
# Display header
# ============================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${MAGENTA}$MSG_installer${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}  ${MSG_language:-Language}: ${BOLD}${LANG_CODE}${NC}\n"

# ============================================================
# Check if source files exist
# ============================================================
if [ ! -f "$WRAPPER_SOURCE" ]; then
    echo -e "${RED}✖ Error: $WRAPPER_NAME not found in $SOURCE_DIR${NC}"
    echo -e "${YELLOW}⚠ $MSG_error_source${NC}"
    exit 1
fi

if [ ! -f "$MANIFEST_SOURCE" ]; then
    echo -e "${RED}✖ Error: $MANIFEST_NAME not found in $SOURCE_DIR${NC}"
    echo -e "${YELLOW}⚠ $MSG_error_source${NC}"
    exit 1
fi

# ============================================================
# Check dependencies
# ============================================================
echo -e "${BLUE}▶ $MSG_checking_deps${NC}"

MISSING_DEPS=""

# Verificar dependências
for dep in mpv yt-dlp python3 curl socat; do
    if ! command -v "$dep" &> /dev/null; then
        if [ -z "$MISSING_DEPS" ]; then
            MISSING_DEPS="$dep"
        else
            MISSING_DEPS="$MISSING_DEPS, $dep"
        fi
    fi
done

# Check mpv-mpris
if [ ! -f "/usr/lib64/mpv/mpris.so" ] && [ ! -f "/usr/lib/mpv/mpris.so" ]; then
    if [ -z "$MISSING_DEPS" ]; then
        MISSING_DEPS="mpv-mpris"
    else
        MISSING_DEPS="$MISSING_DEPS, mpv-mpris"
    fi
fi

if [ -n "$MISSING_DEPS" ]; then
    echo -e "${YELLOW}⚠ $MSG_missing_deps${NC}"
    echo -e "  ${RED}$MISSING_DEPS${NC}"
    echo -e "\n${YELLOW}$MSG_install_command${NC}"
    echo -e "  ${CYAN}sudo dnf install mpv yt-dlp mpv-mpris python3 curl socat${NC}"
    echo -e "\n${RED}✖ $MSG_failed${NC}"
    exit 1
fi

echo -e "${GREEN}✔ $MSG_all_deps_installed${NC}"

# ============================================================
# Check if already installed
# ============================================================
if [ -f "$NATIVE_DIR_NATIVE/$MANIFEST_NAME" ] || [ -f "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME" ]; then
    echo -e "\n${YELLOW}⚠ $MSG_already_installed${NC}"
    read -p "$MSG_reinstall (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✔ $MSG_cancelled${NC}"
        exit 0
    fi
fi

# ============================================================
# Create directories
# ============================================================
echo -e "\n${BLUE}▶ $MSG_creating_dirs${NC}"
mkdir -p "$BIN_DIR"
mkdir -p "$NATIVE_DIR_NATIVE"
mkdir -p "$NATIVE_DIR_FLATPAK"

# ============================================================
# Copy and configure wrapper
# ============================================================
echo -e "${BLUE}▶ $MSG_installing_wrapper${NC}"
cp "$WRAPPER_SOURCE" "$BIN_DIR/$WRAPPER_NAME"
chmod +x "$BIN_DIR/$WRAPPER_NAME"
echo -e "${GREEN}  ✔ $MSG_verified: $BIN_DIR/$WRAPPER_NAME${NC}"

# ============================================================
# Generate manifest with correct path
# ============================================================
echo -e "${BLUE}▶ $MSG_generating_manifest${NC}"
TEMP_MANIFEST=$(mktemp)
ESCAPED_BIN_PATH=$(echo "$BIN_DIR/$WRAPPER_NAME" | sed 's/\//\\\//g')
sed "s/PLACEHOLDER_HOME\/\.local\/bin\/mpv_wrapper\.py/$ESCAPED_BIN_PATH/g" \
    "$MANIFEST_SOURCE" > "$TEMP_MANIFEST"

# ============================================================
# Install manifests
# ============================================================
cp "$TEMP_MANIFEST" "$NATIVE_DIR_NATIVE/$MANIFEST_NAME"
echo -e "${GREEN}  ✔ $MSG_verified: $NATIVE_DIR_NATIVE/$MANIFEST_NAME${NC}"

if [ -d "$NATIVE_DIR_FLATPAK" ] || [ -d "$(dirname "$NATIVE_DIR_FLATPAK")" ]; then
    cp "$TEMP_MANIFEST" "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME"
    echo -e "${GREEN}  ✔ $MSG_verified: $NATIVE_DIR_FLATPAK/$MANIFEST_NAME${NC}"
else
    echo -e "${YELLOW}  ⚠ Flatpak Firefox not detected, skipping Flatpak installation${NC}"
fi

rm -f "$TEMP_MANIFEST"

# ============================================================
# Verify installation
# ============================================================
echo -e "\n${BLUE}▶ $MSG_verifying${NC}"

if [ -f "$NATIVE_DIR_NATIVE/$MANIFEST_NAME" ]; then
    echo -e "${GREEN}  ✔ $MSG_verified${NC}"
else
    echo -e "${RED}  ✖ $MSG_failed${NC}"
    exit 1
fi

if [ -f "$BIN_DIR/$WRAPPER_NAME" ]; then
    echo -e "${GREEN}  ✔ $MSG_verified${NC}"
else
    echo -e "${RED}  ✖ $MSG_failed${NC}"
    exit 1
fi

# ============================================================
# Test Native Host communication
# ============================================================
echo -e "\n${BLUE}▶ $MSG_testing${NC}"
if python3 "$BIN_DIR/$WRAPPER_NAME" < /dev/null 2>/dev/null; then
    echo -e "${GREEN}  ✔ $MSG_test_passed${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_test_failed${NC}"
fi

# ============================================================
# Final message
# ============================================================
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${BOLD}✔ $MSG_complete${NC} ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${BOLD}${GREEN}$MSG_ready${NC}"
echo -e ""
echo -e "${YELLOW}▶ $MSG_next_steps${NC}"
echo -e "  ${CYAN}1.${NC} $MSG_restart"
echo -e "  ${CYAN}2.${NC} $MSG_click_icon"
echo -e "  ${CYAN}3.${NC} $MSG_shortcut_video"
echo -e "  ${CYAN}4.${NC} $MSG_shortcut_sniffer"
echo -e ""
echo -e "${BLUE}▶ $MSG_links${NC}"
echo -e "  ${CYAN}🔗${NC} $MSG_addon_store: https://addons.mozilla.org/pt-BR/firefox/addon/mpv-opener-for-firefox/"
echo -e "  ${CYAN}🔗${NC} $MSG_github: https://github.com/Lu15-F3/mpv-opener-for-firefox"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"