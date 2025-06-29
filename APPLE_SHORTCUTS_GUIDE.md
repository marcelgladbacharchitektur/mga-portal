# Apple Kurzbefehle für MGA Portal - Zeiterfassung

## Voraussetzungen
- API Token aus der `.env` Datei
- Domain URL (z.B. `https://mga-portal.netlify.app` oder `http://localhost:5173`)

## 1. Timer starten

### Kurzbefehl erstellen:
1. Öffne Kurzbefehle App
2. Neuer Kurzbefehl → "Web-Anfrage"
3. Konfiguration:
   - **URL**: `https://DEINE-DOMAIN/api/shortcuts/timer/start`
   - **Methode**: POST
   - **Header**: 
     - `Authorization`: `Bearer DEIN_API_TOKEN`
     - `Content-Type`: `application/json`
   - **Body** (JSON):
     ```json
     {
       "project_id": "PROJEKT-UUID"
     }
     ```

### Projekt-IDs abrufen:
```
GET https://DEINE-DOMAIN/api/shortcuts/projects
Header: Authorization: Bearer DEIN_API_TOKEN
```

## 2. Timer stoppen

### Kurzbefehl:
- **URL**: `https://DEINE-DOMAIN/api/shortcuts/timer/stop`
- **Methode**: POST
- **Header**: 
  - `Authorization`: `Bearer DEIN_API_TOKEN`

## 3. Manuelle Zeiterfassung (Quick Entry)

### Kurzbefehl für 1 Stunde:
- **URL**: `https://DEINE-DOMAIN/api/shortcuts/time`
- **Methode**: POST
- **Header**: 
  - `Authorization`: `Bearer DEIN_API_TOKEN`
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "project_id": "PROJEKT-UUID",
    "duration_minutes": 60,
    "description": "Meeting"
  }
  ```

### Kurzbefehl für 30 Minuten:
```json
{
  "project_id": "PROJEKT-UUID",
  "duration_minutes": 30,
  "description": "Telefonat"
}
```

### Kurzbefehl für 2 Stunden:
```json
{
  "project_id": "PROJEKT-UUID",
  "duration_minutes": 120,
  "description": "Planung"
}
```

## 4. Mit Siri-Integration

### "Hey Siri, Timer für Projekt X starten"
1. Kurzbefehl umbenennen zu "Timer für Projekt X starten"
2. Projekt-ID fest eintragen
3. Zu Siri hinzufügen

### "Hey Siri, 1 Stunde Projekt X"
1. Kurzbefehl für manuelle Erfassung
2. Projekt-ID und 60 Minuten fest eintragen
3. Als Siri-Phrase hinzufügen

## 5. Widget-Kurzbefehle

### Favoriten-Projekte Widget:
Erstelle für jedes Hauptprojekt einen eigenen Kurzbefehl:
- Projekt A - Timer Start
- Projekt A - 1h erfassen
- Projekt A - 2h erfassen
- Projekt B - Timer Start
- etc.

## 6. Erweiterte Kurzbefehle

### Zeit mit Eingabe:
1. Text-Eingabe für Minuten
2. Text-Eingabe für Beschreibung
3. Liste zur Projekt-Auswahl
4. Web-Anfrage mit Variablen

### Heute zusammenfassen:
```
GET https://DEINE-DOMAIN/api/shortcuts/today
Header: Authorization: Bearer DEIN_API_TOKEN
```

## Beispiel-Projekt-IDs abrufen:

```bash
curl -X GET https://DEINE-DOMAIN/api/shortcuts/projects \
  -H "Authorization: Bearer DEIN_API_TOKEN"
```

Antwort:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Haus Müller",
    "project_id": "2024-001"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001", 
    "name": "Büro Schmidt",
    "project_id": "2024-002"
  }
]
```

## Fehlerbehandlung

Wenn Fehler auftreten:
1. API Token prüfen
2. Domain URL prüfen (mit/ohne trailing slash)
3. Projekt-ID prüfen
4. In Browser testen: `https://DEINE-DOMAIN/api/shortcuts/projects`

## Tipps

1. **Feste Projekt-IDs**: Für häufig genutzte Projekte die UUID fest im Kurzbefehl speichern
2. **Beschreibungen**: Vordefinierte Beschreibungen wie "Meeting", "Planung", "Baustellenbesuch"
3. **Zeiten**: Häufige Zeitintervalle als separate Kurzbefehle (15, 30, 45, 60, 90, 120 Min)
4. **Ordner**: Kurzbefehle in Ordnern organisieren nach Projekt oder Typ