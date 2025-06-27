import { NextRequest, NextResponse } from "next/server";
import { NextcloudService } from "@/lib/nextcloud";
import { prisma } from "@/lib/prisma";

// Diese API ist nur im Test-Modus aktiv
export async function POST(request: NextRequest) {
  // Nur im Test-Modus erlauben
  if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test helpers are only available in test mode" },
      { status: 403 }
    );
  }

  try {
    const { projectNumber } = await request.json();

    if (!projectNumber) {
      return NextResponse.json(
        { error: "Project number is required" },
        { status: 400 }
      );
    }

    // Projekt aus der Datenbank holen
    const project = await prisma.project.findFirst({
      where: { projectNumber },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if Nextcloud is configured
    if (!process.env.NEXTCLOUD_URL || !process.env.NEXTCLOUD_USER || !process.env.NEXTCLOUD_APP_PASSWORD) {
      return NextResponse.json({
        exists: false,
        message: "Nextcloud is not configured. Skipping folder check.",
        skipped: true,
      });
    }

    try {
      // Nextcloud-Service initialisieren
      const nextcloud = new NextcloudService();

      // Prüfen ob der Ordner existiert
      const folderPath = `Projekte/${projectNumber}_${project.name}`;
      const exists = await nextcloud.checkFolderExists(folderPath);

      if (!exists) {
        return NextResponse.json({
          exists: false,
          message: `Folder ${folderPath} does not exist in Nextcloud`,
        });
      }

      // Prüfen ob die Standard-Unterordner existieren
      const expectedSubfolders = [
        "01_Admin",
        "02_Pläne",
        "03_Korrespondenz",
        "04_Fotos",
        "05_Berechnungen",
        "06_Ausschreibung",
        "07_Verträge",
        "08_Protokolle",
      ];

      const subfolderChecks = await Promise.all(
        expectedSubfolders.map(async (subfolder) => {
          const subfolderPath = `${folderPath}/${subfolder}`;
          const exists = await nextcloud.checkFolderExists(subfolderPath);
          return { subfolder, exists };
        })
      );

      const allSubfoldersExist = subfolderChecks.every((check) => check.exists);
      const missingSubfolders = subfolderChecks
        .filter((check) => !check.exists)
        .map((check) => check.subfolder);

      return NextResponse.json({
        exists: true,
        allSubfoldersExist,
        missingSubfolders,
        folderPath,
        subfolderChecks,
      });
    } catch (nextcloudError) {
      // If Nextcloud initialization fails, it's probably not configured
      return NextResponse.json({
        exists: false,
        message: "Nextcloud service initialization failed. Probably not configured.",
        skipped: true,
        error: nextcloudError.message,
      });
    }
  } catch (error) {
    console.error("Error checking Nextcloud folder:", error);
    return NextResponse.json(
      { error: "Failed to check Nextcloud folder", details: error.message },
      { status: 500 }
    );
  }
}