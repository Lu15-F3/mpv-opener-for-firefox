#!/bin/bash
# ============================================================
# install.sh - MPV Opener for Firefox v7.3
# Native Host Installer - Multi-Distro Support
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
# Detect Distribution
# ============================================================
detect_distro() {
    if command -v dnf &> /dev/null; then
        echo "fedora"
    elif command -v apt &> /dev/null; then
        if grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
            echo "ubuntu"
        else
            echo "debian"
        fi
    elif command -v pacman &> /dev/null; then
        echo "arch"
    elif command -v zypper &> /dev/null; then
        echo "opensuse"
    elif command -v apk &> /dev/null; then
        echo "alpine"
    elif command -v emerge &> /dev/null; then
        echo "gentoo"
    elif command -v nix-env &> /dev/null; then
        echo "nixos"
    else
        echo "unknown"
    fi
}

get_install_command() {
    local distro=$1
    case $distro in
        fedora)
            echo "sudo dnf install -y mpv yt-dlp mpv-mpris python3 curl socat"
            ;;
        ubuntu|debian)
            echo "sudo apt update && sudo apt install -y mpv yt-dlp python3 curl socat"
            ;;
        arch)
            echo "sudo pacman -S --needed mpv yt-dlp python curl socat"
            ;;
        opensuse)
            echo "sudo zypper install -y mpv yt-dlp python3 curl socat"
            ;;
        alpine)
            echo "sudo apk add mpv yt-dlp python3 curl socat"
            ;;
        gentoo)
            echo "sudo emerge --ask media-video/mpv net-misc/yt-dlp dev-lang/python net-misc/curl sys-apps/socat"
            ;;
        nixos)
            echo "nix-shell -p mpv yt-dlp python3 curl socat"
            ;;
        *)
            echo "mpv yt-dlp python3 curl socat"
            ;;
    esac
}

get_mpris_install_hint() {
    local distro=$1
    case $distro in
        fedora)
            echo "mpv-mpris is included in the command above."
            ;;
        ubuntu|debian)
            echo "mpv-mpris may not be available in official repositories. Try: sudo apt install mpv-mpris"
            ;;
        arch)
            echo "mpv-mpris is included in the command above."
            ;;
        opensuse)
            echo "mpv-mpris is included in the command above."
            ;;
        alpine)
            echo "mpv-mpris may need manual compilation: https://github.com/hoyon/mpv-mpris"
            ;;
        gentoo)
            echo "mpv-mpris may need manual installation."
            ;;
        nixos)
            echo "mpv-mpris is available in nixpkgs."
            ;;
        *)
            echo "For MPRIS controls, install mpv-mpris from: https://github.com/hoyon/mpv-mpris"
            ;;
    esac
}

# ============================================================
# Find mpv-mpris plugin
# ============================================================
find_mpv_mpris() {
    local paths=(
        "/usr/lib64/mpv/mpris.so"
        "/usr/lib/mpv/mpris.so"
        "/usr/lib/x86_64-linux-gnu/mpv/mpris.so"
        "/usr/lib/aarch64-linux-gnu/mpv/mpris.so"
        "/usr/lib64/mpv-mpris.so"
        "/usr/lib/mpv-mpris.so"
        "/usr/local/lib/mpv/mpris.so"
        "/usr/local/lib64/mpv/mpris.so"
        "/opt/mpv/lib/mpv/mpris.so"
    )
    
    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    
    # Tentar com find
    if command -v find &> /dev/null; then
        local found
        found=$(find /usr -name "mpris.so" 2>/dev/null | head -1)
        if [ -n "$found" ] && [ -f "$found" ]; then
            echo "$found"
            return 0
        fi
    fi
    
    return 1
}

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
        MSG_installer="MPV Opener for Firefox - Installer v7.0.1"
        MSG_checking_deps="Checking dependencies..."
        MSG_all_deps_installed="All dependencies installed."
        MSG_missing_deps="Missing dependencies:"
        MSG_install_command="Please install them first:"
        MSG_creating_dirs="Creating directories..."
        MSG_installing_wrapper="Installing native wrapper..."
        MSG_generating_manifest="Generating manifest..."
        MSG_verifying="Verifying installation..."
        MSG_verified="Verified successfully!"
        MSG_failed="Failed to install"
        MSG_testing="Testing Native Host communication..."
        MSG_test_passed="Native Host test passed"
        MSG_test_failed="Native Host test failed"
        MSG_complete="Installation completed successfully!"
        MSG_ready="MPV Opener for Firefox is ready to use!"
        MSG_restart="You may need to restart Firefox for changes to take effect."
        MSG_next_steps="Next steps:"
        MSG_click_icon="Click the extension icon to test"
        MSG_shortcut_video="Use Ctrl+Alt+M to send video to mpv"
        MSG_shortcut_sniffer="Use Ctrl+Alt+V to open the Media Sniffer"
        MSG_links="Links:"
        MSG_addon_store="Add-on Store"
        MSG_github="GitHub"
        MSG_already_installed="Native Host already appears to be installed."
        MSG_reinstall="Do you want to reinstall?"
        MSG_cancelled="Installation cancelled."
        MSG_error_source="Error: Required files not found in native-host folder"
        MSG_language="Language"
        MSG_checking_mpris="Checking mpv-mpris plugin..."
        MSG_mpris_found="mpv-mpris plugin found"
        MSG_mpris_not_found="mpv-mpris plugin not found - MPRIS controls will not work"
    }
fi

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
NATIVE_DIR_SNAP="$HOME/snap/firefox/common/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"
WRAPPER_NAME="mpv_wrapper.py"
VERSION_FILE="$HOME/.local/share/mpv-opener/version.txt"
VERSION_DIR="$(dirname "$VERSION_FILE")"

SOURCE_DIR="$SCRIPT_DIR"
WRAPPER_SOURCE="$SOURCE_DIR/$WRAPPER_NAME"
MANIFEST_SOURCE="$SOURCE_DIR/$MANIFEST_NAME"

# ============================================================
# Detect Firefox installation type
# ============================================================
detect_firefox_type() {
    if flatpak list 2>/dev/null | grep -q "org.mozilla.firefox"; then
        echo "flatpak"
    elif snap list 2>/dev/null | grep -q "firefox"; then
        echo "snap"
    else
        echo "native"
    fi
}

# ============================================================
# Display header
# ============================================================
DISTRO=$(detect_distro)
INSTALL_CMD=$(get_install_command "$DISTRO")

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${MAGENTA}$MSG_installer${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}  ${MSG_language:-Language}: ${BOLD}${LANG_CODE}${NC}"
echo -e "${CYAN}  Distribution: ${BOLD}${DISTRO}${NC}\n"

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

# Verificar dependências principais
for dep in mpv yt-dlp python3 curl socat; do
    if ! command -v "$dep" &> /dev/null; then
        if [ -z "$MISSING_DEPS" ]; then
            MISSING_DEPS="$dep"
        else
            MISSING_DEPS="$MISSING_DEPS, $dep"
        fi
    fi
done

if [ -n "$MISSING_DEPS" ]; then
    echo -e "${YELLOW}⚠ $MSG_missing_deps${NC}"
    echo -e "  ${RED}$MISSING_DEPS${NC}"
    echo -e "\n${YELLOW}$MSG_install_command${NC}"
    echo -e "  ${CYAN}$INSTALL_CMD${NC}"
    
    # Dica específica para mpv-mpris
    MPRIS_HINT=$(get_mpris_install_hint "$DISTRO")
    if [ -n "$MPRIS_HINT" ]; then
        echo -e "\n${YELLOW}⚠ $MSG_checking_mpris${NC}"
        echo -e "  ${CYAN}$MPRIS_HINT${NC}"
    fi
    
    echo -e "\n${RED}✖ $MSG_failed${NC}"
    exit 1
fi

echo -e "${GREEN}✔ $MSG_all_deps_installed${NC}"

# ============================================================
# Check mpv-mpris
# ============================================================
echo -e "${BLUE}▶ $MSG_checking_mpris${NC}"

MPRIS_PATH=$(find_mpv_mpris)
if [ -n "$MPRIS_PATH" ]; then
    echo -e "${GREEN}  ✔ $MSG_mpris_found: $MPRIS_PATH${NC}"
else
    echo -e "${YELLOW}  ⚠ $MSG_mpris_not_found${NC}"
    MPRIS_HINT=$(get_mpris_install_hint "$DISTRO")
    echo -e "${YELLOW}  ⚠ $MPRIS_HINT${NC}"
fi

# ============================================================
# Check if already installed
# ============================================================
if [ -f "$NATIVE_DIR_NATIVE/$MANIFEST_NAME" ] || \
   [ -f "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME" ] || \
   [ -f "$NATIVE_DIR_SNAP/$MANIFEST_NAME" ]; then
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

# Determinar o caminho correto do wrapper
WRAPPER_PATH="$BIN_DIR/$WRAPPER_NAME"
ESCAPED_PATH=$(echo "$WRAPPER_PATH" | sed 's/\//\\\//g')

# Criar manifest temporário
TEMP_MANIFEST=$(mktemp)

# Verificar se o manifesto tem o placeholder correto
if grep -q "PLACEHOLDER_HOME" "$MANIFEST_SOURCE"; then
    sed "s|PLACEHOLDER_HOME/\.local/bin/mpv_wrapper\.py|$ESCAPED_PATH|g" \
        "$MANIFEST_SOURCE" > "$TEMP_MANIFEST"
else
    # Tentar substituir o caminho diretamente
    sed "s|\"path\": \".*\"|\"path\": \"$ESCAPED_PATH\"|g" \
        "$MANIFEST_SOURCE" > "$TEMP_MANIFEST"
fi

# ============================================================
# Install manifests
# ============================================================
# Native Firefox
cp "$TEMP_MANIFEST" "$NATIVE_DIR_NATIVE/$MANIFEST_NAME"
echo -e "${GREEN}  ✔ $MSG_verified: $NATIVE_DIR_NATIVE/$MANIFEST_NAME${NC}"

# Flatpak Firefox
if [ -d "$(dirname "$NATIVE_DIR_FLATPAK")" ]; then
    mkdir -p "$NATIVE_DIR_FLATPAK"
    cp "$TEMP_MANIFEST" "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME"
    echo -e "${GREEN}  ✔ $MSG_verified: $NATIVE_DIR_FLATPAK/$MANIFEST_NAME${NC}"
fi

# Snap Firefox
if [ -d "$(dirname "$NATIVE_DIR_SNAP")" ]; then
    mkdir -p "$NATIVE_DIR_SNAP"
    cp "$TEMP_MANIFEST" "$NATIVE_DIR_SNAP/$MANIFEST_NAME"
    echo -e "${GREEN}  ✔ $MSG_verified: $NATIVE_DIR_SNAP/$MANIFEST_NAME${NC}"
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
# Register version
# ============================================================
echo -e "\n${BLUE}▶ Registering version...${NC}"
mkdir -p "$VERSION_DIR"
echo "7.0.3" > "$VERSION_FILE"
echo -e "${GREEN}  ✔ Version registered: $(cat "$VERSION_FILE")${NC}"

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