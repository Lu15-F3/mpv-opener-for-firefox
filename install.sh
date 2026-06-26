#!/bin/bash
# Script Instalador Dinâmico e Híbrido (Nativo + Flatpak)
set -e

# Caminhos universais baseados em variáveis de ambiente
BIN_DIR="$HOME/.local/bin"
NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"

echo "📦 Instalando binário e manifestos do Native Messaging Host..."

# 1. Certificar que as pastas de destino existam
mkdir -p "$BIN_DIR"
mkdir -p "$NATIVE_DIR_NATIVE"
mkdir -p "$NATIVE_DIR_FLATPAK"

# 2. Copiar script Python para o local de execução e torná-lo executável
cp native-host/mpv_wrapper.py "$BIN_DIR/mpv_wrapper.py"
chmod +x "$BIN_DIR/mpv_wrapper.py"

# 3. Gerar e injetar o caminho absoluto no manifesto temporário
TEMP_MANIFEST=$(mktemp)
cp native-host/$MANIFEST_NAME "$TEMP_MANIFEST"

# Escapar caminhos absolutos do $HOME para uso no sed
ESCAPED_BIN_PATH=$(echo "$BIN_DIR/mpv_wrapper.py" | sed 's/\//\\\//g')
sed -i "s/PLACEHOLDER_HOME\/\.local\/bin\/mpv_wrapper\.py/$ESCAPED_BIN_PATH/g" "$TEMP_MANIFEST"

# 4. Copiar o manifesto ajustado cirurgicamente aos caminhos Nativo e Flatpak
cp "$TEMP_MANIFEST" "$NATIVE_DIR_NATIVE/$MANIFEST_NAME"
cp "$TEMP_MANIFEST" "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME"

# Limpeza do arquivo temporário
rm -f "$TEMP_MANIFEST"

echo "✅ Instalação concluída com sucesso no ecossistema Firefox!"