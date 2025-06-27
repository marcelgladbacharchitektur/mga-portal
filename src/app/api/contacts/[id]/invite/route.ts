import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTransport } from 'nodemailer';
// Remove unused imports

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Kunde zum Portal einladen
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // ContactGroup mit allen Details abrufen
    const contactGroup = await prisma.contactGroup.findUnique({
      where: { id },
      include: {
        Person: {
          include: {
            EmailAddress: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      }
    });

    if (!contactGroup) {
      return NextResponse.json(
        { error: 'Kontakt nicht gefunden' },
        { status: 404 }
      );
    }

    // Primäre Person und E-Mail finden
    const primaryPerson = contactGroup.Person.find(p => p.isPrimary);
    if (!primaryPerson || primaryPerson.EmailAddress.length === 0) {
      return NextResponse.json(
        { error: 'Keine primäre E-Mail-Adresse gefunden' },
        { status: 400 }
      );
    }

    const primaryEmail = primaryPerson.EmailAddress[0].email;
    const userName = `${primaryPerson.firstName} ${primaryPerson.lastName}`;

    // Prüfen ob User bereits existiert
    let user = await prisma.user.findUnique({
      where: { email: primaryEmail }
    });

    // User erstellen falls nicht vorhanden
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          name: userName,
          role: 'CLIENT',
          contactGroupId: contactGroup.id
        }
      });
    } else {
      // User aktualisieren falls vorhanden
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userName,
          role: 'CLIENT',
          contactGroupId: contactGroup.id
        }
      });
    }

    // Einladungs-E-Mail senden
    const transport = createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/login?email=${encodeURIComponent(primaryEmail)}&invite=true`;
    
    // Erstelle die E-Mail-Inhalte
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Einladung zum MGA Portal</h2>
        <p>Sie wurden eingeladen, auf das MGA Portal zuzugreifen.</p>
        <p>Klicken Sie auf den folgenden Link, um sich anzumelden:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Zum Portal</a>
        <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
        <p style="word-break: break-all;">${inviteUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Diese Einladung ist 7 Tage gültig.</p>
      </div>
    `;

    await transport.sendMail({
      to: primaryEmail,
      from: process.env.EMAIL_FROM!,
      subject: 'Einladung zum MGA Portal',
      html: emailHtml,
      text: `Sie wurden zum MGA Portal eingeladen.\n\nBitte klicken Sie auf folgenden Link um sich anzumelden:\n${inviteUrl}`
    });

    return NextResponse.json({
      message: 'Einladung erfolgreich versendet',
      email: primaryEmail,
      userName
    });
  } catch (error) {
    console.error('Fehler beim Versenden der Einladung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}