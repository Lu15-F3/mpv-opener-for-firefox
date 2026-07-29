#!/bin/bash
# ============================================================
# MPV Opener for Firefox - Desinstalador Principal
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
echo -e "${CYAN}║${NC} ${BOLD}${RED}MPV Opener for Firefox - Desinstalador v7.3${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"

# ============================================================
# Download e execução do desinstalador nativo
# ============================================================
echo -e "\n${BLUE}▶ Baixando o desinstalador nativo...${NC}"

# Criar diretório temporário
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Baixar o desinstalador e o loader de localização
BASE_URL="https://raw.githubusercontent.com/Lu15-F3/mpv-opener-for-firefox/main/native-host"

echo -e "${BLUE}▶ Baixando arquivos...${NC}"
curl -sSL "${BASE_URL}/uninstall.sh" -o uninstall.sh
curl -sSL "${BASE_URL}/locale_loader.sh" -o locale_loader.sh
chmod +x uninstall.sh locale_loader.sh 2>/dev/null || true

# Baixar localizações
echo -e "${BLUE}▶ Baixando localizações...${NC}"

LANGUAGES=("en" "pt_BR" "es" "fr" "de" "it" "ja" "ko" "ru" "uk" "ar" "hi" "pl" "zh_CN" "pt_PT")

mkdir -p _locales
for lang in "${LANGUAGES[@]}"; do
    echo -e "  Baixando ${CYAN}${lang}${NC}..."
    mkdir -p "_locales/${lang}"
    curl -sSL "${BASE_URL}/_locales/${lang}/messages.json" -o "_locales/${lang}/messages.json"
done

# Executar o desinstalador
echo -e "\n${BLUE}▶ Executando desinstalador...${NC}\n"
./uninstall.sh

# Limpar
cd - > /dev/null
rm -rf "$TMP_DIR"

echo -e "\n${GREEN}✔ Desinstalação concluída!${NC}"
