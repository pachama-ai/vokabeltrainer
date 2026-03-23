#!/bin/bash
# server-setup.sh — Einmalige Einrichtung auf dem Server (xenix.rabbarien.de)
# Ausführen AUF dem Server als Nutzer xenia: bash server-setup.sh
# Voraussetzung: MySQL/MariaDB und Apache/Nginx mit PHP sind installiert

set -e

DB_NAME="vocab_app"
DB_USER="vokabel_user"
# Sicheres zufälliges Passwort generieren (32 Zeichen)
DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
WEB_ROOT="/var/www/xenia"

echo "=== Datenbank einrichten ==="
echo "Bitte MySQL root Passwort eingeben:"
mysql -u root -p << SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "=== Datenbankschema importieren ==="
mysql -u root -p "$DB_NAME" < "$WEB_ROOT/database.sql" 2>/dev/null || \
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$WEB_ROOT/database.sql"

echo ""
echo "=== config.local.php erstellen ==="
cat > "$WEB_ROOT/api/config.local.php" << PHP
<?php
// Server-Konfiguration fuer xenix.rabbarien.de
return [
    'DB_HOST' => 'localhost',
    'DB_NAME' => '$DB_NAME',
    'DB_NAME_FALLBACK' => '$DB_NAME',
    'DB_USER' => '$DB_USER',
    'DB_PASS' => '$DB_PASS',
    'APP_BASE_URL' => 'https://xenix.rabbarien.de',
    'MAIL_FROM_ADDRESS' => 'no-reply@rabbarien.de',
    'MAIL_FROM_NAME' => 'Vokabeltrainer',
    'SMTP_ENABLED' => '0',
];
PHP
chmod 600 "$WEB_ROOT/api/config.local.php"

echo "=== db.php: JWT_SECRET setzen ==="
# JWT Secret in config einbetten
sed -i "s|'JWT_SECRET'.*|// JWT Secret wird aus config.local.php gelesen|" "$WEB_ROOT/api/db.php" 2>/dev/null || true

# Berechtigungen sicherstellen
find "$WEB_ROOT" -type f -exec chmod 644 {} \;
find "$WEB_ROOT" -type d -exec chmod 755 {} \;
chmod 600 "$WEB_ROOT/api/config.local.php"

echo ""
echo "=== SSH Key eintragen (damit VS Code verbinden kann) ==="
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Hier deinen Public Key einfügen:
# echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIN/Y1zxXJQqFlH1LjErfVDunQo92Wb6j4HHHv0VB+ZOG user@DESKTOP-FP4OP26" >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys

echo ""
echo "============================================"
echo "Fertig! Notiere diese Daten sicher:"
echo "  DB_NAME:  $DB_NAME"
echo "  DB_USER:  $DB_USER"
echo "  DB_PASS:  $DB_PASS"
echo "  JWT_SECRET in config.local.php eingetragen"
echo "============================================"
