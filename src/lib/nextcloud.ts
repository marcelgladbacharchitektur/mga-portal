import { createClient, WebDAVClient } from 'webdav';

interface NextcloudConfig {
  url: string;
  username: string;
  password: string;
}

export class NextcloudService {
  private client: WebDAVClient;
  private baseProjectPath: string = '/Projekte';

  constructor(config: NextcloudConfig) {
    // Ensure the URL includes the WebDAV endpoint
    const webdavUrl = config.url.endsWith('/remote.php/dav/files/' + config.username) 
      ? config.url 
      : `${config.url}/remote.php/dav/files/${config.username}`;
      
    this.client = createClient(webdavUrl, {
      username: config.username,
      password: config.password
    });
  }

  /**
   * Erstellt einen Projekt-Ordner mit Unterstruktur
   */
  async createProjectFolder(projectNumber: string, projectName: string): Promise<string> {
    // Sanitize folder name
    const folderName = this.sanitizeFolderName(`${projectNumber}_${projectName}`);
    const projectPath = `${this.baseProjectPath}/${folderName}`;

    try {
      // Hauptprojektordner erstellen
      await this.createDirectory(projectPath);

      // Unterordner-Struktur erstellen
      const subfolders = [
        '01_Admin',
        '02_Pläne',
        '03_Korrespondenz',
        '04_Fotos',
        '05_Berechnungen',
        '06_Ausschreibung',
        '07_Verträge',
        '08_Protokolle'
      ];

      for (const subfolder of subfolders) {
        await this.createDirectory(`${projectPath}/${subfolder}`);
      }

      // README.md erstellen mit Projektinformationen
      const readmeContent = `# ${projectName}

Projektnummer: ${projectNumber}
Erstellt am: ${new Date().toLocaleDateString('de-DE')}

## Ordnerstruktur

- **01_Admin**: Administrative Dokumente, Projektdaten
- **02_Pläne**: Alle Planunterlagen (Entwurf, Ausführung, Details)
- **03_Korrespondenz**: E-Mails, Briefe, Kommunikation
- **04_Fotos**: Baustellenfotos, Bestandsaufnahmen
- **05_Berechnungen**: Statik, Energieausweis, etc.
- **06_Ausschreibung**: Leistungsverzeichnisse, Angebote
- **07_Verträge**: Bauverträge, Nachträge
- **08_Protokolle**: Besprechungsprotokolle, Baustellenprotokolle
`;

      await this.client.putFileContents(
        `${projectPath}/README.md`,
        readmeContent,
        { overwrite: false }
      );

      return projectPath;
    } catch (error) {
      console.error('Fehler beim Erstellen der Nextcloud-Ordner:', error);
      throw new Error(`Fehler beim Erstellen der Projektordner: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Erstellt einen einzelnen Ordner
   */
  private async createDirectory(path: string): Promise<void> {
    try {
      // Prüfen ob Ordner bereits existiert
      const exists = await this.client.exists(path);
      if (!exists) {
        await this.client.createDirectory(path);
        console.log(`Ordner erstellt: ${path}`);
      } else {
        console.log(`Ordner existiert bereits: ${path}`);
      }
    } catch (error) {
      console.error(`Fehler beim Erstellen von ${path}:`, error);
      throw error;
    }
  }

  /**
   * Bereinigt Ordnernamen für Dateisystem-Kompatibilität
   */
  private sanitizeFolderName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_') // Ungültige Zeichen ersetzen
      .replace(/\s+/g, '_') // Leerzeichen durch Unterstriche ersetzen
      .replace(/_+/g, '_') // Mehrfache Unterstriche reduzieren
      .replace(/^_|_$/g, ''); // Führende/abschließende Unterstriche entfernen
  }

  /**
   * Prüft die Verbindung zum Nextcloud-Server
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.getDirectoryContents('/');
      return true;
    } catch (error) {
      console.error('Nextcloud-Verbindung fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Listet alle Projektordner auf
   */
  async listProjectFolders(): Promise<string[]> {
    try {
      const contents = await this.client.getDirectoryContents(this.baseProjectPath);
      if (Array.isArray(contents)) {
        return contents
          .filter(item => item.type === 'directory')
          .map(item => item.basename);
      }
      return [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Projektordner:', error);
      return [];
    }
  }

  /**
   * Prüft ob ein Ordner existiert
   */
  async checkFolderExists(path: string): Promise<boolean> {
    try {
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      await this.client.getDirectoryContents(fullPath);
      return true;
    } catch (error) {
      // Wenn 404 Fehler, dann existiert der Ordner nicht
      if (error.status === 404) {
        return false;
      }
      // Bei anderen Fehlern werfen wir den Fehler weiter
      throw error;
    }
  }

  /**
   * Lädt eine Datei zu Nextcloud hoch
   */
  async uploadFile(path: string, content: Buffer): Promise<void> {
    try {
      // Sicherstellen, dass der Ordner existiert
      const dirPath = path.substring(0, path.lastIndexOf('/'));
      await this.ensureDirectoryExists(dirPath);
      
      // Datei hochladen
      await this.client.putFileContents(path, content, {
        overwrite: true
      });
      
      console.log(`Datei hochgeladen: ${path}`);
    } catch (error) {
      console.error(`Fehler beim Hochladen der Datei ${path}:`, error);
      throw new Error(`Fehler beim Hochladen der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Stellt sicher, dass ein Verzeichnispfad existiert
   */
  private async ensureDirectoryExists(path: string): Promise<void> {
    const parts = path.split('/').filter(p => p);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath += `/${part}`;
      try {
        const exists = await this.client.exists(currentPath);
        if (!exists) {
          await this.client.createDirectory(currentPath);
          console.log(`Ordner erstellt: ${currentPath}`);
        }
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${currentPath}:`, error);
        throw error;
      }
    }
  }

  /**
   * Lädt eine Datei von Nextcloud herunter
   */
  async downloadFile(path: string): Promise<Buffer> {
    try {
      const fileContent = await this.client.getFileContents(path) as Buffer | ArrayBuffer | string;
      
      // Konvertiere zu Buffer falls nötig
      if (Buffer.isBuffer(fileContent)) {
        return fileContent;
      } else if (fileContent instanceof ArrayBuffer) {
        return Buffer.from(fileContent);
      } else if (typeof fileContent === 'string') {
        return Buffer.from(fileContent);
      } else {
        throw new Error('Unerwarteter Dateityp');
      }
    } catch (error) {
      console.error(`Fehler beim Herunterladen der Datei ${path}:`, error);
      throw new Error(`Fehler beim Herunterladen der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Listet den Inhalt eines Ordners auf
   */
  async listFolder(path: string): Promise<{
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    lastModified: Date;
    mimeType?: string;
  }[]> {
    try {
      const contents = await this.client.getDirectoryContents(path) as Array<{
        basename: string;
        filename: string;
        type: string;
        size?: number;
        lastmod: string;
        mime?: string;
      }>;
      
      return contents.map(item => ({
        name: item.basename,
        path: item.filename,
        type: item.type === 'directory' ? 'directory' : 'file',
        size: item.size || 0,
        lastModified: new Date(item.lastmod),
        mimeType: item.mime
      }));
    } catch (error) {
      console.error('Fehler beim Auflisten des Ordners:', error);
      // Wenn der Ordner nicht existiert, geben wir ein leeres Array zurück
      if ((error as { status?: number }).status === 404) {
        return [];
      }
      throw error;
    }
  }
}

// Singleton-Instanz
let nextcloudService: NextcloudService | null = null;

export function getNextcloudService(): NextcloudService {
  if (!nextcloudService) {
    const url = process.env.NEXTCLOUD_URL;
    const username = process.env.NEXTCLOUD_USER;
    const password = process.env.NEXTCLOUD_APP_PASSWORD;

    if (!url || !username || !password) {
      throw new Error('Nextcloud-Konfiguration fehlt. Bitte setzen Sie NEXTCLOUD_URL, NEXTCLOUD_USER und NEXTCLOUD_APP_PASSWORD in der .env-Datei.');
    }

    nextcloudService = new NextcloudService({
      url,
      username,
      password
    });
  }

  return nextcloudService;
}