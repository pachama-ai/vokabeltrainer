# Vokabeltrainer (React + PHP + MySQL)

## 1. Voraussetzungen

- Node.js (Frontend)
- XAMPP oder anderer Webserver mit PHP + MySQL (Backend)

Hinweis: In diesem Workspace sind `php` und `mysql` nicht als CLI im PATH verfuegbar. Das ist lokal mit XAMPP normal.

## 2. Datenbank einrichten

1. `http://localhost/phpmyadmin` oeffnen.
2. Datenbank `vocab_app` anlegen (falls nicht vorhanden).
3. `database.sql` importieren.

Dadurch wird auch die Tabelle `password_resets` fuer "Forgot Password" angelegt.

## 3. Backend bereitstellen

1. Den Ordner `api/` so ablegen, dass er unter folgender URL erreichbar ist:
`http://localhost/vocab-app/api`
2. XAMPP starten: `Apache` und `MySQL`.
3. Testen: `http://localhost/vocab-app/api/health.php`

Erwartet wird JSON mit `status: "ok"`.

## 4. Frontend starten

```bash
npm install
npm run dev -- --host
```

Danach im Browser:
`http://localhost:5173/`

## 5. Forgot Password testen

1. Auf Login-Seite `Forgot Password?` klicken.
2. E-Mail eingeben und "SEND RESET LINK" klicken.
3. Link aus E-Mail oeffnen.
4. Neues Passwort setzen.
5. Mit neuem Passwort einloggen.

## 6. Lokale Konfiguration (einfachster Weg)

1. Datei `api/config.local.php.example` nach `api/config.local.php` kopieren.
2. In `api/config.local.php` diese Werte setzen:
- `APP_BASE_URL` auf deine aktuelle Frontend-URL (z. B. `http://localhost:5174`)
- SMTP-Daten (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- `SMTP_ENABLED` auf `'1'`

## 7. Wichtige Konfiguration (`api/db.php`)

Diese Werte koennen ueber `api/config.local.php` oder Umgebungsvariablen gesetzt werden:

- `DB_HOST` (default: `localhost`)
- `DB_NAME` (default: `vocab_app`)
- `DB_NAME_FALLBACK` (default: `vokabeltrainer`)
- `DB_USER` (default: `root`)
- `DB_PASS` (default: leer)
- `APP_BASE_URL` (default: `http://localhost:5173`)
- `MAIL_FROM_ADDRESS` (default: `no-reply@localhost`)
- `MAIL_FROM_NAME` (default: `Vokabeltrainer`)
- `SMTP_ENABLED` (`1` oder `0`)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`tls`, `ssl`, `none`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_TIMEOUT_SECONDS`
- `SMTP_EHLO_HOST`

## 8. E-Mail Versand (wichtig)

Der Passwort-Reset nutzt jetzt SMTP (wenn `SMTP_ENABLED = '1'`).

Wenn SMTP deaktiviert ist, wird als Fallback PHP `mail()` genutzt.

Lokal unter Windows/XAMPP ist SMTP die zuverlaessigste Option.

## 9. Deployment auf eigenen Server

Vor dem Go-Live:

1. `APP_BASE_URL` auf die echte Domain setzen.
2. SMTP sauber konfigurieren (kein lokales `mail()`-Setup).
3. Eine echte `MAIL_FROM_ADDRESS` der eigenen Domain verwenden.
4. `JWT_SECRET` in `api/db.php` durch einen langen zufaelligen Key ersetzen.
