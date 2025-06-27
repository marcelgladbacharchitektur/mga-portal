# MGA Portal - Setup Guide

## Überblick

Dieses Portal verwendet:
- **Supabase** für die Datenbank (kostenlos)
- **Google OAuth2** für Drive, Calendar und Tasks (umgeht die Firmen-Beschränkungen)

## Schritt 1: Supabase einrichten

1. Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie ein kostenloses Konto
2. Erstellen Sie ein neues Projekt:
   - Project name: `mga-portal`
   - Database Password: Gut merken!
   - Region: Frankfurt (eu-central-1)

3. Wenn das Projekt bereit ist:
   - Gehen Sie zu **Settings** → **API**
   - Kopieren Sie:
     - `URL` → in .env als `PUBLIC_SUPABASE_URL`
     - `anon public` key → in .env als `PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → in .env als `SUPABASE_SERVICE_KEY`

4. SQL ausführen:
   - Gehen Sie zu **SQL Editor**
   - Öffnen Sie die Datei `supabase/schema.sql` aus diesem Projekt
   - Kopieren Sie den gesamten Inhalt und führen Sie ihn aus

## Schritt 2: Google OAuth2 einrichten

1. Gehen Sie zu [console.cloud.google.com](https://console.cloud.google.com)
2. Erstellen Sie ein neues Projekt (oder nutzen Sie ein bestehendes)
3. Aktivieren Sie diese APIs:
   - Google Drive API
   - Google Calendar API
   - Google Tasks API

4. OAuth2 Client erstellen:
   - **APIs & Services** → **Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `MGA Portal`
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback` (für lokale Entwicklung)
     - `https://ihre-app.netlify.app/auth/callback` (für Produktion)
   - **CREATE**
   - Kopieren Sie:
     - `Client ID` → in .env als `GOOGLE_CLIENT_ID`
     - `Client secret` → in .env als `GOOGLE_CLIENT_SECRET`

## Schritt 3: Lokale Entwicklung

1. `.env` Datei erstellen:
   ```bash
   cp .env.example .env
   ```

2. Alle Werte in `.env` eintragen

3. Dependencies installieren und starten:
   ```bash
   npm install
   npm run dev
   ```

4. Öffnen Sie http://localhost:5173
5. Gehen Sie zu `/auth/setup` und verbinden Sie Ihr Google-Konto

## Schritt 4: Deployment auf Netlify

1. In Netlify alle Umgebungsvariablen aus `.env` hinzufügen
2. Wichtig: `GOOGLE_REDIRECT_URI` auf Ihre Netlify-URL anpassen
3. In Google Cloud Console die neue Redirect URI hinzufügen

## Troubleshooting

### "Dienstkontoschlüssel ist deaktiviert"
- Deshalb verwenden wir OAuth2 statt Service Accounts
- Stellen Sie sicher, dass Sie die OAuth2 Credentials verwenden

### "Supabase Connection Failed"
- Überprüfen Sie die Supabase URL und Keys
- Stellen Sie sicher, dass das Projekt aktiv ist

### "Google API Error"
- Überprüfen Sie, ob alle APIs aktiviert sind
- Stellen Sie sicher, dass Sie sich mit `/auth/setup` angemeldet haben