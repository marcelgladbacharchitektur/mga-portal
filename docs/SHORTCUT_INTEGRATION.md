# Stundenaufzeichnung Shortcut Integration

## Schnellstart

### 1. API-Token setzen
Fügen Sie zu Ihrer `.env` Datei hinzu:
```
API_TOKEN=mga-portal-2025-secure-token
```

### 2. Shortcut anpassen

Öffnen Sie Ihren "Stundenaufzeichnung" Shortcut und ändern Sie folgende Teile:

#### URL ändern
**Alt:** Google Sheets API oder andere URL
**Neu:** 
```
http://localhost:5173/api/shortcuts
```
oder für Produktion:
```
https://portal.marcelgladbach.at/api/shortcuts
```

#### Request-Format

**Headers hinzufügen:**
```
Content-Type: application/json
Authorization: Bearer mga-portal-2025-secure-token
```

**Body-Format:**
```json
{
  "action": "log_time",
  "project_name": "[Ihre Projekt-Variable]",
  "duration_minutes": [Ihre Minuten-Variable],
  "description": "[Ihre Beschreibung-Variable]"
}
```

## Vollständiges Beispiel

### Variante 1: Mit Projektauswahl

1. **Projekte abrufen:**
   - URL: `https://portal.marcelgladbach.at/api/shortcuts`
   - Methode: POST
   - Body: `{"action": "list_projects"}`
   - Speichern als Variable: `ProjectList`

2. **Projekt auswählen:**
   - "Aus Liste wählen" mit `ProjectList.projects`
   - Anzeigen: `display` Feld
   - Speichern als: `SelectedProject`

3. **Zeit eingeben:**
   - "Nach Text fragen": "Wie viele Minuten?"
   - Speichern als: `Minutes`

4. **Beschreibung eingeben:**
   - "Nach Text fragen": "Was wurde gemacht?"
   - Speichern als: `Description`

5. **Zeit erfassen:**
   - URL: `https://portal.marcelgladbach.at/api/shortcuts`
   - Methode: POST
   - Headers: wie oben
   - Body:
   ```json
   {
     "action": "log_time",
     "project_id": "[SelectedProject.id]",
     "duration_minutes": [Minutes],
     "description": "[Description]"
   }
   ```

### Variante 2: Schnellerfassung (30 Min Standard)

1. **Direkt erfassen:**
   - URL: `https://portal.marcelgladbach.at/api/shortcuts`
   - Methode: POST
   - Body:
   ```json
   {
     "action": "log_time",
     "project_name": "Bailom",
     "duration_minutes": 30,
     "description": "Shortcuts-Erfassung"
   }
   ```

## Weitere Aktionen

### Tageszusammenfassung abrufen
```json
{
  "action": "today_summary"
}
```

Gibt zurück:
- Gesamtstunden heute
- Stunden pro Projekt
- Liste der Tätigkeiten

### Notiz erstellen
```json
{
  "action": "create_note",
  "project_name": "Bailom",
  "note": "Wichtig: Fenster vergrößern"
}
```

## Fehlerbehandlung

Prüfen Sie die Antwort mit "Wenn"-Bedingung:
- Wenn `success` = true → Erfolgsmeldung
- Wenn `error` vorhanden → Fehlermeldung anzeigen

## Widget-Integration

Sie können auch ein Widget erstellen, das die Tageszusammenfassung anzeigt:

1. Neues Widget-Shortcut erstellen
2. API-Call für `today_summary`
3. Text formatieren mit den Daten
4. Als Widget-Output setzen

## Tipps

1. **Projekt-Favoriten**: Erstellen Sie mehrere Shortcuts für häufige Projekte
2. **Quick Actions**: 15 Min, 30 Min, 60 Min Buttons
3. **Siri-Integration**: "Hey Siri, 30 Minuten Bailom"
4. **Automation**: Täglich um 17:00 nach Zeiterfassung fragen

## Beispiel-Shortcut Export

Sie können diesen Basis-Shortcut importieren und anpassen:

### Basis-Struktur:
1. Text (API Token): `mga-portal-2025-secure-token`
2. Text (Base URL): `https://portal.marcelgladbach.at/api/shortcuts`
3. Dictionary:
   - action: `log_time`
   - project_name: `[Auswahl]`
   - duration_minutes: `[Eingabe]`
   - description: `[Eingabe]`
4. URL-Inhalt abrufen:
   - URL: `[Base URL]`
   - Methode: POST
   - Headers: Authorization: Bearer `[API Token]`
   - Body: `[Dictionary]`
5. Wenn (success = true):
   - Mitteilung: "✅ Zeit erfasst"
6. Sonst:
   - Mitteilung: "❌ Fehler: [error]"