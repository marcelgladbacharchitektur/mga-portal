import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Erstelle Transporter nur einmal und wiederverwendbar
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

/**
 * Zentrale E-Mail-Versand-Funktion
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text, from } = options;
  
  try {
    const transporter = getTransporter();
    
    // Standard-Absender verwenden, falls nicht angegeben
    const fromAddress = from || process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Marcel Gladbach Architektur <noreply@marcelgladbach.com>';
    
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback: HTML-Tags entfernen
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✉️  E-Mail erfolgreich gesendet an: ${to}`);
  } catch (error) {
    console.error('❌ Fehler beim E-Mail-Versand:', error);
    throw error;
  }
}

/**
 * Spezielle Funktion für Terminbestätigungs-E-Mails
 */
export async function sendAppointmentConfirmation(
  to: string,
  name: string,
  startTime: Date,
  appointmentType: string,
  location?: string,
  isVideo?: boolean
): Promise<void> {
  const date = startTime.toLocaleDateString('de-AT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const time = startTime.toLocaleTimeString('de-AT', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const locationText = isVideo 
    ? 'Videogespräch (Link wird separat zugesendet)' 
    : location || 'Büro Marcel Gladbach Architektur';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #FAF9F7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 24px;
      font-weight: 400;
      color: #1a1a1a;
      text-decoration: none;
    }
    h1 {
      font-size: 32px;
      font-weight: 400;
      line-height: 1.2;
      margin: 0 0 20px 0;
    }
    .details {
      background: #ffffff;
      border: 1px solid #e5e5e5;
      padding: 30px;
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 500;
      width: 120px;
      color: #666666;
    }
    .detail-value {
      flex: 1;
      color: #1a1a1a;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://marcelgladbach.at" class="logo">Marcel Gladbach Architektur</a>
    </div>
    
    <h1>Terminbestätigung</h1>
    
    <p>Sehr geehrte/r ${name},</p>
    
    <p>vielen Dank für Ihre Terminbuchung. Hiermit bestätige ich Ihnen folgenden Termin:</p>
    
    <div class="details">
      <div class="detail-row">
        <div class="detail-label">Termintyp:</div>
        <div class="detail-value">${appointmentType}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Datum:</div>
        <div class="detail-value">${date}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Uhrzeit:</div>
        <div class="detail-value">${time}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Ort:</div>
        <div class="detail-value">${locationText}</div>
      </div>
    </div>
    
    <p>Ich freue mich auf unser Gespräch. Sollten Sie den Termin nicht wahrnehmen können, bitte ich um rechtzeitige Absage.</p>
    
    <p>Mit freundlichen Grüßen<br>
    DI Marcel Gladbach</p>
    
    <div class="footer">
      <p>Marcel Gladbach Architektur<br>
      Schloßhofer Straße 6/1/9<br>
      1210 Wien<br>
      +43 677 623 99 637<br>
      marcel@marcelgladbach.at</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Terminbestätigung

Sehr geehrte/r ${name},

vielen Dank für Ihre Terminbuchung. Hiermit bestätige ich Ihnen folgenden Termin:

Termintyp: ${appointmentType}
Datum: ${date}
Uhrzeit: ${time}
Ort: ${locationText}

Ich freue mich auf unser Gespräch. Sollten Sie den Termin nicht wahrnehmen können, bitte ich um rechtzeitige Absage.

Mit freundlichen Grüßen
DI Marcel Gladbach

--
Marcel Gladbach Architektur
Schloßhofer Straße 6/1/9
1210 Wien
+43 677 623 99 637
marcel@marcelgladbach.at
  `;

  try {
    await sendEmail({
      to,
      subject: `Terminbestätigung: ${appointmentType} - ${date} um ${time}`,
      html,
      text
    });
  } catch (error) {
    console.error('Fehler beim Versand der Terminbestätigung:', error);
    // Fehler nicht werfen, um die Terminbuchung nicht zu blockieren
  }
}

// E-Mail-Styles für konsistentes Design
export const emailStyles = {
  body: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: '1.6',
    color: '#1a1a1a',
    backgroundColor: '#FAF9F7',
    margin: '0',
    padding: '0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    borderBottom: '1px solid #e5e5e5',
    paddingBottom: '20px',
    marginBottom: '40px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '400',
    color: '#1a1a1a',
    textDecoration: 'none',
  },
  h1: {
    fontSize: '32px',
    fontWeight: '400',
    lineHeight: '1.2',
    margin: '0 0 20px 0',
  },
  h2: {
    fontSize: '24px',
    fontWeight: '400',
    lineHeight: '1.2',
    margin: '0 0 16px 0',
  },
  p: {
    margin: '0 0 16px 0',
  },
  button: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#1a1a1a',
    color: '#FAF9F7',
    textDecoration: 'none',
    borderRadius: '4px',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e5e5',
    fontSize: '14px',
    color: '#666666',
  },
};

/**
 * Funktion für Verifizierungs-E-Mails (für NextAuth)
 */
export async function sendVerificationRequest({
  identifier,
  url,
  provider,
}: {
  identifier: string;
  url: string;
  provider: any;
}): Promise<void> {
  const { host } = new URL(url);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${Object.entries(emailStyles).map(([selector, styles]) => 
      `.${selector} { ${Object.entries(styles).map(([prop, value]) => 
        `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
      ).join(' ')} }`
    ).join('\n')}
  </style>
</head>
<body class="body">
  <div class="container">
    <div class="header">
      <a href="https://marcelgladbach.at" class="logo">Marcel Gladbach Architektur</a>
    </div>
    
    <h1 class="h1">Anmeldung bestätigen</h1>
    
    <p class="p">Bitte klicken Sie auf den folgenden Link, um sich anzumelden:</p>
    
    <p class="p">
      <a href="${url}" class="button">Anmelden</a>
    </p>
    
    <p class="p">Falls Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
    
    <div class="footer">
      <p>Marcel Gladbach Architektur<br>
      Schloßhofer Straße 6/1/9<br>
      1210 Wien<br>
      +43 677 623 99 637<br>
      marcel@marcelgladbach.at</p>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: identifier,
    subject: `Anmeldung bei ${host}`,
    html,
  });
}

// Legacy-Export für Kompatibilität
export const emailService = {
  sendEmail,
  sendAppointmentConfirmation,
  sendVerificationRequest,
};