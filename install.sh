#!/bin/bash
# Script Instalador Dinâmico e Híbrido (Nativo + Flatpak) com Verificação de Dependências
set -e

# Configurações do Repositório (Altere se necessário)
REPO_RAW_URL="https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main"

# Caminhos universais baseados em variáveis de ambiente
BIN_DIR="$HOME/.local/bin"
NATIVE_DIR_NATIVE="$HOME/.mozilla/native-messaging-hosts"
NATIVE_DIR_FLATPAK="$HOME/.var/app/org.mozilla.firefox/.mozilla/native-messaging-hosts"
MANIFEST_NAME="org.custom.mpv.json"

echo "🔍 Verificando dependências do sistema..."

# Função para verificar se os comandos existem no sistema
check_dep() {
    command -v "$1" >/dev/null 2>&1
}

MISSING_DEPS=()
! check_dep mpv && MISSING_DEPS+=("mpv")
! check_dep yt-dlp && MISSING_DEPS+=("yt-dlp")

# mpv-mpris geralmente não expõe binários diretos, checaremos via rpm se dnf estiver disponível
if check_dep dnf; then
    if ! rpm -q mpv-mpris >/dev/null 2>&1; then
        MISSING_DEPS+=("mpv-mpris")
    fi
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo "⚠️  As seguintes dependências estão faltando: ${MISSING_DEPS[*]}"
    if check_dep dnf; then
        read -p "👉 Deseja que o script tente instalá-las automaticamente via DNF? (s/N): " -r response
        if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
            echo "🔐 Solicitando privilégios para instalar as dependências..."
            sudo dnf install -y "${MISSING_DEPS[@]}"
        else
            echo "❌ Instalação abortada. Por favor, instale as dependências manualmente e execute o script novamente."
            exit 1
        fi
    else
        echo "❌ Gerenciador DNF não encontrado. Por favor, instale manualmente: ${MISSING_DEPS[*]}"
        exit 1
    fi
fi

echo "📦 Instalando binário e manifestos do Native Messaging Host..."

# 1. Certificar que as pastas de destino existam
mkdir -p "$BIN_DIR"
mkdir -p "$NATIVE_DIR_NATIVE"
mkdir -p "$NATIVE_DIR_FLATPAK"

# Criação de arquivos temporários para download limpo
TEMP_WRAPPER=$(mktemp)
TEMP_MANIFEST=$(mktemp)

# 2. Baixar os arquivos necessários do repositório remoto de forma segura
echo "📥 Baixando arquivos do repositório..."
curl -sSL "$REPO_RAW_URL/native-host/mpv_wrapper.py" -o "$TEMP_WRAPPER"
curl -sSL "$REPO_RAW_URL/native-host/$MANIFEST_NAME" -o "$TEMP_MANIFEST"

# Validar se os downloads foram bem-sucedidos
if [ ! -s "$TEMP_WRAPPER" ] || [ ! -s "$TEMP_MANIFEST" ]; then
    echo "❌ Erro: Não foi possível baixar os arquivos do GitHub. Verifique sua conexão ou os caminhos do repositório."
    rm -f "$TEMP_WRAPPER" "$TEMP_MANIFEST"
    exit 1
fi

# Mover o wrapper para o destino e torná-lo executável
cp "$TEMP_WRAPPER" "$BIN_DIR/mpv_wrapper.py"
chmod +x "$BIN_DIR/mpv_wrapper.py"

# 3. Gerar e injetar o caminho absoluto no manifesto temporário
# Escapar caminhos absolutos do $HOME para uso seguro no sed
ESCAPED_BIN_PATH=$(echo "$BIN_DIR/mpv_wrapper.py" | sed 's/\//\\\//g')

if grep -q "PLACEHOLDER_HOME/\.local\/bin\/mpv_wrapper\.py" "$TEMP_MANIFEST"; then
    sed -i "s/PLACEHOLDER_HOME\/\.local\/bin\/mpv_wrapper\.py/$ESCAPED_BIN_PATH/g" "$TEMP_MANIFEST"
else
    # Fallback caso a string do placeholder mude sutilmente no JSON original
    sed -i "s|\"path\": \".*\"|\"path\": \"$BIN_DIR/mpv_wrapper.py\"|g" "$TEMP_MANIFEST"
fi

# 4. Copiar o manifesto ajustado cirurgicamente aos caminhos Nativo e Flatpak
cp "$TEMP_MANIFEST" "$NATIVE_DIR_NATIVE/$MANIFEST_NAME"
cp "$TEMP_MANIFEST" "$NATIVE_DIR_FLATPAK/$MANIFEST_NAME"

# Limpeza dos arquivos temporários
rm -f "$TEMP_WRAPPER" "$TEMP_MANIFEST"

echo "✅ Instalação concluída com sucesso no ecossistema Firefox!"
