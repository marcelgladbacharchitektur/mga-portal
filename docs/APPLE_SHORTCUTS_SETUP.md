# Apple Shortcuts Integration für MGA Portal

## Übersicht
Diese Anleitung zeigt, wie Sie Ihren bestehenden "Stundenaufzeichnung" Shortcut mit dem MGA Portal verbinden.

## API-Endpunkt
```
https://portal.marcelgladbach.at/api/shortcuts
```

Für lokale Tests:
```
http://localhost:5173/api/shortcuts
```

## Authentifizierung
Fügen Sie einen API-Token zu Ihrer `.env` Datei hinzu:
```env
API_TOKEN=ihr-sicherer-token-hier
```

## Shortcut-Konfiguration

### 1. Zeit erfassen (Stundenaufzeichnung)

**HTTP-Request in Shortcuts:**
- **URL**: `https://portal.marcelgladbach.at/api/shortcuts`
- **Methode**: POST
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer ihr-api-token
  ```
- **Body**:
  ```json
  {
    "action": "log_time",
    "project_name": "Projekt auswählen",
    "duration_minutes": 30,
    "description": "Beschreibung eingeben"
  }
  ```

### 2. Shortcuts-Aktionen

#### Zeit mit Projekt-ID erfassen
```json
{
  "action": "log_time",
  "project_id": "25-001",
  "duration_minutes": 60,
  "description": "Planung Erdgeschoss"
}
```

#### Zeit mit Projekt-Namen erfassen
```json
{
  "action": "log_time",
  "project_name": "EFH Bailom",
  "duration_minutes": 45,
  "description": "Besprechung Bauherr"
}
```

#### Notiz erstellen
```json
{
  "action": "create_note",
  "project_name": "EFH Bailom",
  "note": "Fenster müssen größer geplant werden"
}
```

#### Aktive Projekte abrufen
```json
{
  "action": "list_projects"
}
```

**Antwort:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "25-001",
      "name": "EFH Bailom Vils",
      "display": "25-001 - EFH Bailom Vils"
    },
    {
      "id": "25-002",
      "name": "Spritzenhaus Kaisers Fügel",
      "display": "25-002 - Spritzenhaus Kaisers Fügel"
    }
  ]
}
```

#### Tageszusammenfassung
```json
{
  "action": "today_summary"
}
```

**Antwort:**
```json
{
  "success": true,
  "date": "2025-06-27",
  "total": "4:30",
  "totalMinutes": 270,
  "projects": [
    {
      "id": "25-001",
      "name": "EFH Bailom Vils",
      "time": "2:00",
      "tasks": ["Planung", "Besprechung"]
    }
  ]
}
```

## Beispiel-Shortcut Aufbau

### Schritt 1: Projekt auswählen
1. **Text-Aktion**: API-Request für Projektliste
2. **JSON parsen**: Projekte extrahieren
3. **Aus Liste wählen**: Projekt auswählen lassen

### Schritt 2: Zeit eingeben
1. **Text eingeben**: Minuten abfragen
2. **Text eingeben**: Beschreibung abfragen

### Schritt 3: API-Call
1. **URL-Inhalt abrufen**:
   - URL: `https://portal.marcelgladbach.at/api/shortcuts`
   - Methode: POST
   - Headers: Authorization und Content-Type
   - Body: JSON mit den gesammelten Daten

### Schritt 4: Bestätigung
1. **Mitteilung anzeigen**: Erfolgsmeldung oder Fehler

## Variablen im Shortcut

- `SelectedProject`: Das ausgewählte Projekt
- `Minutes`: Eingegebene Minuten
- `Description`: Beschreibung der Tätigkeit
- `APIToken`: Ihr API-Token (als Text-Aktion gespeichert)

## Fehlerbehandlung

Der API-Endpunkt gibt immer JSON zurück:
- Bei Erfolg: `{"success": true, "message": "...", ...}`
- Bei Fehler: `{"error": "Fehlerbeschreibung"}`

## Sicherheit

1. Speichern Sie den API-Token sicher in Shortcuts
2. Verwenden Sie HTTPS in Produktion
3. Der Token kann auch als URL-Parameter übergeben werden: `?token=ihr-token`

## Testen

1. Testen Sie zuerst mit der lokalen URL
2. Verwenden Sie die Shortcuts-App "URL-Inhalt abrufen" Aktion
3. Prüfen Sie die Antwort mit "Schnellansicht"

## Beispiel für bestehenden Shortcut anpassen

Wenn Ihr Shortcut bereits Daten sammelt, müssen Sie nur:
1. Die URL ändern zu `/api/shortcuts`
2. Den JSON-Body anpassen
3. Authorization-Header hinzufügen