#!/bin/bash
# ============================================================
# uninstall.sh - MPV Opener for Firefox v7.0
# Native Host Uninstaller - Multilingual
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

echo "DEBUG: Script directory: $SCRIPT_DIR" >&2

# ============================================================
# Load locale system
# ============================================================
source "$SCRIPT_DIR/locale_loader.sh"

# Detect language
LANG_CODE="$(detect_language)"
echo "DEBUG: Detected language: $LANG_CODE" >&2

# Load all messages
load_locale "$LANG_CODE"

# Verificar se as mensagens foram carregadas
if [ -z "$MSG_uninstaller" ]; then
    echo "WARNING: Messages not loaded, using fallback" >&2
    load_fallback_messages
fi

# Debug: Mostrar mensagem carregada
echo "DEBUG: MSG_uninstaller = ${MSG_uninstaller}" >&2
echo "DEBUG: MSG_language = ${MSG_language}" >&2

BIN_DIR="$HOME/.local/bin"
NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"
WRAPPER_NAME="mpv_wrapper.py"

# ============================================================
# Display header
# ============================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${MAGENTA}$MSG_uninstaller${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}  ${MSG_language:-Language}: ${BOLD}${LANG_CODE}${NC}\n"

echo -e "${YELLOW}⚠ $MSG_uninstall_confirm${NC}"
read -p "$MSG_continue_prompt (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✔ $MSG_cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}▶ $MSG_removing${NC}"

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
if [ -f "$NATIVE_DIR_NATIVE/$MANIFEST_NAME" ]; then
    rm "$NATIVE_DIR_NATIVE/$MANIFEST_NAME"
    echo -e "${GREEN}  ✔ $MSG_removed $NATIVE_DIR_NATIVE/$MANIFEST_NAME${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_not_found $NATIVE_DIR_NATIVE/$MANIFEST_NAME${NC}"
fi

if [ -f "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME" ]; then
    rm "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME"
    echo -e "${GREEN}  ✔ $MSG_removed $NATIVE_DIR_FLATPAK/$MANIFEST_NAME${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_not_found $NATIVE_DIR_FLATPAK/$MANIFEST_NAME${NC}"
fi

# ============================================================
# Clean empty directories
# ============================================================
echo -e "\n${BLUE}▶ $MSG_cleaning${NC}"

if [ -d "$NATIVE_DIR_NATIVE" ] && [ -z "$(ls -A "$NATIVE_DIR_NATIVE" 2>/dev/null)" ]; then
    rmdir "$NATIVE_DIR_NATIVE" 2>/dev/null && echo -e "${GREEN}  ✔ $MSG_removed_empty $NATIVE_DIR_NATIVE${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_dir_not_empty $NATIVE_DIR_NATIVE${NC}"
fi

if [ -d "$NATIVE_DIR_FLATPAK" ] && [ -z "$(ls -A "$NATIVE_DIR_FLATPAK" 2>/dev/null)" ]; then
    rmdir "$NATIVE_DIR_FLATPAK" 2>/dev/null && echo -e "${GREEN}  ✔ $MSG_removed_empty $NATIVE_DIR_FLATPAK${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_dir_not_empty $NATIVE_DIR_FLATPAK${NC}"
fi

# ============================================================
# Final message
# ============================================================
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${BOLD}✔ $MSG_uninstall_complete${NC} ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}⚠ $MSG_restart${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"