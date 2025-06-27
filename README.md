# MGA Projekt Portal

Ein maßgeschneidertes Projekt-Management-System für Marcel Gladbach Architektur, das Google Services (Sheets, Drive, Photos, Tasks, Calendar) unter einer einheitlichen Oberfläche vereint.

## Features

- 📊 Google Sheets als zentrale Datenbank
- 📁 Automatische Google Drive Ordner-Erstellung
- 📅 Google Calendar Integration
- ✅ Google Tasks für Aufgabenverwaltung
- 🤖 Google Gemini für OCR und Intelligenz
- 🎨 Modernes UI mit Tailwind CSS und shadcn-svelte

## Setup

1. **Google Cloud einrichten:**
   - Projekt in Google Cloud Console erstellen
   - APIs aktivieren (Sheets, Drive, Calendar, Tasks, Photos, Vertex AI)
   - Service Account erstellen und JSON-Key herunterladen

2. **Google Sheet vorbereiten:**
   - Neues Sheet "Projekt-Zentrale [ARCHITEKTUR]" erstellen
   - Tabellenblätter gemäß Dokumentation anlegen
   - Service Account Email zum Sheet hinzufügen (Editor-Rechte)

3. **Lokale Entwicklung:**
   ```bash
   # Dependencies installieren
   pnpm install

   # .env Datei erstellen und ausfüllen
   cp .env.example .env

   # Entwicklungsserver starten
   pnpm dev
   ```

4. **Umgebungsvariablen:**
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: Der komplette JSON-Key als String
   - `GOOGLE_SPREADSHEET_ID`: ID aus der Google Sheets URL
   - `API_TOKEN`: Optional für Apple Shortcuts

## Deployment

Das Projekt ist für Netlify optimiert:

1. Repository zu GitHub pushen
2. In Netlify mit GitHub verbinden
3. Umgebungsvariablen in Netlify setzen
4. Automatisches Deployment bei jedem Push

## Entwicklung

- Framework: SvelteKit
- Styling: Tailwind CSS
- UI Components: shadcn-svelte
- APIs: Google APIs, Google Gemini

## Lizenz

Privates Projekt für Marcel Gladbach Architektur
EOF < /dev/null