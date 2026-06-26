#!/bin/bash
# Script de Desinstalação Segura e Cirúrgica
set -e

BIN_DIR="$HOME/.local/bin"
NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"

echo "🗑️ Iniciando desinstalação segura do mpv-firefox-opener..."

# 1. Remoção cirúrgica dos binários específicos criados pela aplicação
if [ -f "$BIN_DIR/mpv_wrapper.py" ]; then
    rm "$BIN_DIR/mpv_wrapper.py"
    echo "• Binário mpv_wrapper.py removido."
fi

# 2. Remoção cirúrgica dos manifestos de integração
if [ -f "$NATIVE_DIR_NATIVE/$MANIFEST_NAME" ]; then
    rm "$NATIVE_DIR_NATIVE/$MANIFEST_NAME"
    echo "• Manifesto do Firefox Nativo removido."
fi

if [ -f "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME" ]; then
    rm "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME"
    echo "• Manifesto do Firefox Flatpak removido."
fi

# 3. Limpeza inteligente de pastas apenas se estiverem 100% vazias via rmdir
echo "• Verificando sanidade de diretórios raiz..."
rmdir "$NATIVE_DIR_NATIVE" 2>/dev/null && echo "• Pasta nativa vazia excluída." || echo "• Pasta nativa retida (contém outras extensões)."
rmdir "$NATIVE_DIR_FLATPAK" 2>/dev/null && echo "• Pasta Flatpak vazia excluída." || echo "• Pasta Flatpak retida (contém outras extensões)."

echo "✅ Desinstalação concluída de forma limpa e segura!"