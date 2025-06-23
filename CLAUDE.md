# MGA Portal - Projekt-Dokumentation für Claude

## Projekt-Übersicht

**Name**: MGA Portal  
**Zweck**: Schusselfestes Portal für Marcel Gladbach Architektur  
**Status**: Stage 1 ("Das schusselfeste Portal") abgeschlossen  

## Technologie-Stack

- **Framework**: Next.js 14 mit App Router
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS mit Dark Mode
- **Datenbank**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentifizierung**: NextAuth.js mit Credentials Provider
- **UI-Komponenten**: Headless UI
- **Icons**: Lucide React
- **Externe Dienste**: Nextcloud (WebDAV)

## Wichtige Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Datenbank-Migrationen
npx prisma migrate dev
npx prisma db push
npx prisma studio

# Type-Checking
npm run typecheck

# Linting
npm run lint

# Build für Produktion
npm run build
```

## Projekt-Struktur

```
/src
├── app/
│   ├── (auth)/          # Authentifizierungs-Routes
│   ├── (portal)/        # Geschützte Portal-Routes
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── contacts/
│   └── api/             # API-Routes
├── components/          # React-Komponenten
├── lib/                 # Utilities und Konfiguration
│   ├── auth.ts         # NextAuth-Konfiguration
│   ├── prisma.ts       # Prisma-Client
│   ├── dashboard.ts    # Dashboard-Logik
│   └── nextcloud.ts    # Nextcloud-Service
└── styles/             # Globale Styles

/prisma
└── schema.prisma       # Datenbank-Schema
```

## Kern-Features

### 1. Authentifizierung
- Admin-Login: admin@marcelgladbach.at / MGA-Portal2024!
- JWT-basierte Sessions
- Geschützte Routes mit Middleware

### 2. Dashboard
- **Focus Points**: Intelligente Priorisierung von Aufgaben
- Berechnet Dringlichkeit basierend auf Fälligkeitsdaten
- Zeigt überfällige und anstehende Aufgaben

### 3. Projektverwaltung
- Automatische Projektnummer-Generierung (YY-NNN Format)
- Status-Tracking (ACTIVE, ON_HOLD, COMPLETED, ARCHIVED)
- Nextcloud-Integration für automatische Ordnererstellung

### 4. Aufgabenverwaltung
- Prioritäten (NIEDRIG, MITTEL, HOCH)
- Status (TODO, IN_PROGRESS, DONE)
- Fälligkeitsdaten mit intelligenter Sortierung

### 5. Kontaktverwaltung
- Gruppierung nach Typen (Bauherr, Planer, Handwerker, etc.)
- Detaillierte Kontaktinformationen
- Notizen-Funktion

### 6. Omni-Create Menü
- Zentraler "+" Button für schnelles Erstellen
- Dropdown mit Optionen für Aufgaben, Projekte, Kontakte
- Modal-Dialoge für Dateneingabe

### 7. Nextcloud-Integration
- Automatische Ordnererstellung bei Projekterstellung
- Vordefinierte Ordnerstruktur:
  - 01_Admin
  - 02_Pläne
  - 03_Korrespondenz
  - 04_Fotos
  - 05_Berechnungen
  - 06_Ausschreibung
  - 07_Verträge
  - 08_Protokolle
- README.md mit Projektinformationen
- Status-Anzeige mit Verbindungstest

## Umgebungsvariablen

```env
# Authentifizierung
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-please-change-in-production

# Datenbank (Supabase)
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...
DATABASE_URL_DIRECT=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Nextcloud
NEXTCLOUD_URL=https://nextcloud.example.com
NEXTCLOUD_USER=your-nextcloud-username
NEXTCLOUD_APP_PASSWORD=your-nextcloud-app-password
```

## Design-Prinzipien

1. **Schusselfest**: ADHD-optimiert, minimale Friktion
2. **Intelligent**: Proaktive Priorisierung und Fokus-Unterstützung
3. **Integriert**: Nahtlose Verbindung mit externen Diensten
4. **Responsiv**: Desktop-Sidebar, Mobile Bottom-Navigation
5. **Dark Mode**: Vollständige Unterstützung für dunkles Theme

## Wichtige Dateien

### API-Endpoints
- `/api/auth/*` - NextAuth-Endpoints
- `/api/projects` - Projektverwaltung
- `/api/tasks` - Aufgabenverwaltung
- `/api/contacts` - Kontaktverwaltung
- `/api/nextcloud/test` - Nextcloud-Verbindungstest

### Komponenten
- `omni-create.tsx` - Zentrales Erstellungsmenü
- `nextcloud-status.tsx` - Nextcloud-Verbindungsstatus
- `focus-dashboard.tsx` - Intelligentes Dashboard

### Utilities
- `getFocusPoints()` - Berechnet Aufgaben-Priorisierung
- `generateProjectNumber()` - Erstellt Projektnummern
- `NextcloudService` - WebDAV-Integration

## Bekannte Einschränkungen

1. Direkte Supabase-Verbindung erfordert manuelle SQL-Ausführung
2. Nextcloud-Konfiguration muss manuell in .env eingetragen werden
3. Keine Push-Benachrichtigungen implementiert

## Server-Infrastruktur

### Hetzner Server
- **IP**: 157.90.232.184
- **SSH-Zugang**:
  - User: deploy
  - Port: 22
  - SSH Key: (siehe unten)

### Services
- **Portal**: https://portal.marcelgladbach.at
- **Nextcloud**: https://cloud.marcelgladbach.at
  - Admin: admin / tazqoP-2rapsa-vyhsyr
- **Analytics**: https://analytics.marcelgladbach.at
- **Status**: https://status.marcelgladbach.at

### SSH Private Key
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCJrn1h7i5VTY0BcRoe44csC/OQ76EZzsvz1Syo1TsD6gAAAJjwQaa/8EGm
vwAAAAtzc2gtZWQyNTUxOQAAACCJrn1h7i5VTY0BcRoe44csC/OQ76EZzsvz1Syo1TsD6g
AAAEC9e3aVmBycKMDoC7neCoQMldF4wGMNLh+vE5UZQyw3uYmufWHuLlVNjQFxGh7jhywL
85DvoRnOy/PVLKjVOwPqAAAADmdpdGh1Yi1hY3Rpb25zAQIDBAUGBw==
-----END OPENSSH PRIVATE KEY-----
```

## Nächste Schritte (Stage 2)

Potenzielle Erweiterungen:
- Dokumenten-Upload und -Verwaltung
- Zeiterfassung
- Rechnungsstellung
- E-Mail-Integration
- Kalender-Synchronisation
- Mobile App

## Philosophie

"Das Portal ist wie ein guter Assistent: Es denkt mit, erinnert zur richtigen Zeit, und macht die richtigen Dinge einfach. Es ist der digitale Komplize, der Chaos in Ordnung verwandelt."

## Deployment

Das Portal wird automatisch über GitHub Actions deployed. Jeder Push auf den `main` Branch triggert eine automatische Bereitstellung auf dem Produktionsserver.

Letztes Update: 23.06.2025 09:52