import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getNextcloudService } from '@/lib/nextcloud';

// Rate limiting: Cache the result for 60 seconds
let lastCheck: { time: number; result: any } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Check cache first
    if (lastCheck && Date.now() - lastCheck.time < CACHE_DURATION) {
      return NextResponse.json(lastCheck.result);
    }

    try {
      const nextcloud = getNextcloudService();
      const connected = await nextcloud.testConnection();
      
      if (connected) {
        const folders = await nextcloud.listProjectFolders();
        const result = {
          status: 'connected',
          message: 'Nextcloud-Verbindung erfolgreich',
          projectFoldersCount: folders.length
        };
        
        // Cache the successful result
        lastCheck = { time: Date.now(), result };
        
        return NextResponse.json(result);
      } else {
        const result = {
          status: 'error',
          message: 'Nextcloud-Verbindung fehlgeschlagen'
        };
        
        // Cache the error result too
        lastCheck = { time: Date.now(), result };
        
        return NextResponse.json(result, { status: 503 });
      }
    } catch (error) {
      const result = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        hint: 'Bitte überprüfen Sie die Nextcloud-Konfiguration in der .env-Datei'
      };
      
      // Cache error results for shorter duration (10 seconds)
      lastCheck = { time: Date.now() - (CACHE_DURATION - 10000), result };
      
      return NextResponse.json(result, { status: 503 });
    }
  } catch (error) {
    console.error('Fehler beim Testen der Nextcloud-Verbindung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}