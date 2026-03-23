#!/bin/bash
# deploy.sh — Vokabeltrainer auf xenia.rabbarien.de deployen
# Ausfuehren aus dem Projektverzeichnis: bash deploy.sh
# Voraussetzung: PuTTY (pscp/plink) installiert

set -e

SERVER="xenia@xenia.rabbarien.de"
REMOTE_DIR="/var/www/xenia"
HOSTKEY="SHA256:6HJFU2Eg4RNjpRHVRrLtacsH694kpt3igVGi5C9SM00"
PW="ichbinxenia"

echo "=== 1. Frontend bauen ==="
npm run build

echo ""
echo "=== 2. Frontend hochladen (dist/) ==="
# HINWEIS: api/ wird NICHT hochgeladen, um config.local.php auf dem Server zu schuetzen!
pscp -pw "$PW" -hostkey "$HOSTKEY" -r dist/. "$SERVER:$REMOTE_DIR/"

echo ""
echo "=== Fertig! ==="
echo "App erreichbar unter: https://xenia.rabbarien.de"
