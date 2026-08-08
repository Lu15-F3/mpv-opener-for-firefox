#!/bin/bash
# ============================================================
# locale_loader.sh - MPV Opener for Firefox v7.2
# Loader para mensagens localizadas - Multi-Distro
# ============================================================

# IMPORTANTE: SCRIPT_DIR deve ser definido ANTES de source este arquivo
if [ -z "$SCRIPT_DIR" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

# ============================================================
# Detectar idioma do sistema
# ============================================================
detect_language() {
    local lang="${LANG:-en_US}"
    
    # Remove encoding (.UTF-8, .utf8, etc)
    lang="${lang%%.*}"
    
    # Remove tudo depois de : (ex: pt_BR:en_US)
    lang="${lang%%:*}"
    
    # Converte _ para - para padronização
    lang="${lang//_/-}"
    
    # Mapeamento para compatibilidade com pastas
    case "$lang" in
        pt-BR|pt_BR)
            echo "pt_BR"
            return
            ;;
        pt-PT|pt_PT|pt*)
            echo "pt_PT"
            return
            ;;
        es-*|es_*|es)
            echo "es"
            return
            ;;
        fr-*|fr_*|fr)
            echo "fr"
            return
            ;;
        de-*|de_*|de)
            echo "de"
            return
            ;;
        it-*|it_*|it)
            echo "it"
            return
            ;;
        ja-*|ja_*|ja)
            echo "ja"
            return
            ;;
        ko-*|ko_*|ko)
            echo "ko"
            return
            ;;
        ru-*|ru_*|ru)
            echo "ru"
            return
            ;;
        uk-*|uk_*|uk)
            echo "uk"
            return
            ;;
        ar-*|ar_*|ar)
            echo "ar"
            return
            ;;
        hi-*|hi_*|hi)
            echo "hi"
            return
            ;;
        pl-*|pl_*|pl)
            echo "pl"
            return
            ;;
        zh-CN|zh_CN)
            echo "zh_CN"
            return
            ;;
        zh-TW|zh_TW)
            echo "zh_TW"
            return
            ;;
        *)
            # Tenta sem o sufixo do país
            local base="${lang%%-*}"
            if [ -n "$base" ] && [ -d "$SCRIPT_DIR/locales/${base}" ]; then
                echo "$base"
                return
            fi
            # Tenta no formato _locales (compatibilidade)
            if [ -n "$base" ] && [ -d "$SCRIPT_DIR/_locales/${base}" ]; then
                echo "$base"
                return
            fi
            # Fallback para inglês
            echo "en"
            return
            ;;
    esac
}

# ============================================================
# Carregar mensagens do arquivo JSON
# ============================================================
load_locale() {
    local lang="$1"
    
    # Tentar diferentes localizações possíveis
    local possible_paths=(
        "$SCRIPT_DIR/locales/${lang}/messages.json"
        "$SCRIPT_DIR/_locales/${lang}/messages.json"
        "$(dirname "$SCRIPT_DIR")/locales/${lang}/messages.json"
        "$(dirname "$SCRIPT_DIR")/_locales/${lang}/messages.json"
    )
    
    local locale_file=""
    for path in "${possible_paths[@]}"; do
        if [ -f "$path" ]; then
            locale_file="$path"
            break
        fi
    done
    
    # Se não encontrou, fallback para inglês
    if [ -z "$locale_file" ]; then
        for path in "${possible_paths[@]}"; do
            if [ -f "${path/en/${lang}/en}" ]; then
                locale_file="${path/en/${lang}/en}"
                break
            fi
        done
    fi
    
    # Se ainda não encontrou, tentar caminhos alternativos
    if [ -z "$locale_file" ]; then
        for path in "${possible_paths[@]}"; do
            local fallback="${path/${lang}/en}"
            if [ -f "$fallback" ]; then
                locale_file="$fallback"
                break
            fi
        done
    fi
    
    # Se ainda não encontrou, usar fallback hardcoded
    if [ ! -f "$locale_file" ]; then
        load_fallback_messages
        return
    fi
    
    # Tentar carregar com Python3
    if command -v python3 &> /dev/null; then
        local json_output
        json_output=$(python3 -c "
import json
import sys

try:
    with open('$locale_file', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Formato com message aninhado
    for key, value in data.items():
        if isinstance(value, dict) and 'message' in value:
            msg = value['message'].replace(\"'\", \"'\\\\''\")
            print(f\"MSG_{key}='{msg}'\")
        elif isinstance(value, str):
            msg = value.replace(\"'\", \"'\\\\''\")
            print(f\"MSG_{key}='{msg}'\")
except Exception as e:
    # Fallback silencioso
    pass
" 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$json_output" ]; then
            eval "$json_output"
            return
        fi
    fi
    
    # Fallback para mensagens hardcoded
    load_fallback_messages
}

# ============================================================
# Fallback messages (hardcoded em inglês)
# ============================================================
load_fallback_messages() {
    MSG_installer="MPV Opener for Firefox - Installer v7.2"
    MSG_uninstaller="MPV Opener for Firefox - Uninstaller"
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
    MSG_removing="Removing components..."
    MSG_removed="Removed:"
    MSG_not_found="Not found:"
    MSG_cleaning="Cleaning empty directories..."
    MSG_removed_empty="Removed empty:"
    MSG_dir_not_empty="Directory not empty or not found:"
    MSG_uninstall_complete="Uninstallation completed successfully!"
    MSG_uninstall_confirm="This will remove MPV Opener from your system."
    MSG_continue_prompt="Continue?"
    MSG_deps_mpv="mpv"
    MSG_deps_ytdlp="yt-dlp"
    MSG_deps_mpv_mpris="mpv-mpris"
    MSG_deps_python="python3"
    MSG_deps_curl="curl"
    MSG_deps_socat="socat"
    MSG_language="Language"
    MSG_checking_mpris="Checking mpv-mpris plugin..."
    MSG_mpris_found="mpv-mpris plugin found"
    MSG_mpris_not_found="mpv-mpris plugin not found - MPRIS controls will not work"
}