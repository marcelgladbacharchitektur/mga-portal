import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';

export interface ReceiptAnalysis {
  vendor: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  amount?: number;
  currency?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  taxAmount?: number;
  totalAmount?: number;
  paymentMethod?: string;
  category?: string;
  confidence: number;
  isPaid?: boolean;
}

export async function analyzeReceipt(imageBuffer: ArrayBuffer, mimeType: string): Promise<ReceiptAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analysiere diesen Beleg/diese Rechnung und extrahiere folgende Informationen im JSON-Format:
  - vendor: Name des Geschäfts/Lieferanten
  - invoiceNumber: Rechnungs-/Belegnummer (falls vorhanden)
  - invoiceDate: Datum im Format YYYY-MM-DD
  - amount: Gesamtbetrag (nur Zahl, ohne Währung)
  - currency: Währung (z.B. EUR, CHF)
  - items: Array von Artikeln mit description, quantity, unitPrice, totalPrice
  - taxAmount: Steuerbetrag
  - totalAmount: Endbetrag
  - paymentMethod: Zahlungsmethode (falls erkennbar)
  - category: Kategorie (z.B. Büromaterial, Werkzeug, Verpflegung, Tanken, etc.)
  - confidence: Konfidenz der Analyse von 0-1
  - isPaid: Boolean - true wenn "bezahlt", "paid", Stempel oder ähnliche Markierung erkennbar ist

  Antworte NUR mit validem JSON, keine zusätzlichen Erklärungen.`;

  try {
    const image = {
      inlineData: {
        data: Buffer.from(imageBuffer).toString('base64'),
        mimeType
      }
    };

    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as ReceiptAnalysis;
    
    // Validate and clean data
    if (analysis.invoiceDate) {
      // Ensure date is in correct format
      const date = new Date(analysis.invoiceDate);
      if (!isNaN(date.getTime())) {
        analysis.invoiceDate = date.toISOString().split('T')[0];
      }
    }

    return analysis;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error('Failed to analyze receipt');
  }
}