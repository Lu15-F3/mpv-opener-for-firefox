#!/bin/bash
# ============================================================
# MPV Opener for Firefox - Instalador Principal
# ============================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}${GREEN}MPV Opener for Firefox - Instalador v7.3${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"

# ============================================================
# Download e execução do instalador nativo
# ============================================================
echo -e "\n${BLUE}▶ Baixando o instalador nativo...${NC}"

# Criar diretório temporário
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Baixar todos os arquivos necessários
echo -e "${BLUE}▶ Baixando arquivos...${NC}"

# URLs dos arquivos (ajuste para seu repositório)
BASE_URL="https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/native-host"

# Lista de arquivos necessários
FILES=(
    "install.sh"
    "uninstall.sh"
    "locale_loader.sh"
    "mpv_wrapper.py"
    "org.custom.mpv.json"
)

# Baixar cada arquivo
for file in "${FILES[@]}"; do
    echo -e "  Baixando ${CYAN}$file${NC}..."
    curl -sSL "${BASE_URL}/${file}" -o "$file"
    chmod +x "$file" 2>/dev/null || true
done

# Baixar as localizações
echo -e "${BLUE}▶ Baixando localizações...${NC}"

# Lista de idiomas
LANGUAGES=("en" "pt_BR" "es" "fr" "de" "it" "ja" "ko" "ru" "uk" "ar" "hi" "pl" "zh_CN" "pt_PT")

mkdir -p _locales
for lang in "${LANGUAGES[@]}"; do
    echo -e "  Baixando ${CYAN}${lang}${NC}..."
    mkdir -p "_locales/${lang}"
    curl -sSL "${BASE_URL}/_locales/${lang}/messages.json" -o "_locales/${lang}/messages.json"
done

# Executar o instalador
echo -e "\n${BLUE}▶ Executando instalador...${NC}\n"
./install.sh

# Limpar
cd - > /dev/null
rm -rf "$TMP_DIR"

echo -e "\n${GREEN}✔ Instalação concluída!${NC}"
