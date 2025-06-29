import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

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
  console.log('analyzeReceipt called with:', {
    bufferSize: imageBuffer.byteLength,
    mimeType,
    hasApiKey: !!env.GEMINI_API_KEY,
    apiKeyLength: env.GEMINI_API_KEY?.length
  });
  
  if (!env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    throw new Error('Gemini API key not configured - please set GEMINI_API_KEY environment variable');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analysiere diesen Beleg/diese Rechnung SEHR GENAU und extrahiere folgende Informationen im JSON-Format:

  WICHTIG für invoiceNumber - Suche nach ALLEN folgenden Begriffen und extrahiere die Nummer:
  - "Rechnung", "Rechnungs-Nr", "Rg-Nr", "RG-NR"
  - "Invoice", "Invoice No", "Invoice Number", "Inv No"
  - "Beleg", "Belegnummer", "Beleg-Nr", "BLG"
  - "Quittung", "Quittungs-Nr", "Receipt", "Receipt No"
  - "Auftrag", "Auftrags-Nr", "Order", "Order No"
  - "Lieferschein", "Lieferschein-Nr", "Delivery Note"
  - "Kassennummer", "Kassen-Nr", "POS", "Bon-Nr"
  - Numerische Codes wie "Nr.", "#", "No."
  - QR-Codes oder Barcodes mit Nummern

  Extrahiere folgende Informationen:
  - vendor: Name des Geschäfts/Lieferanten (auch aus Logos/Stempeln)
  - invoiceNumber: Rechnungs-/Belegnummer - UNBEDINGT SUCHEN! Auch kurze Codes, Buchstaben-Zahlen-Kombinationen
  - invoiceDate: Datum im Format YYYY-MM-DD
  - amount: Gesamtbetrag (nur Zahl, ohne Währung)
  - currency: Währung (z.B. EUR, CHF, USD)
  - items: Array von Artikeln mit description, quantity, unitPrice, totalPrice
  - taxAmount: Steuerbetrag (Mehrwertsteuer, MwSt, VAT, USt)
  - totalAmount: Endbetrag inklusive Steuern
  - paymentMethod: Zahlungsmethode (Karte, Bar, Überweisung, PayPal, etc.)
  - category: Kategorie (z.B. Büromaterial, Werkzeug, Verpflegung, Tanken, Transport, Software, etc.)
  - confidence: Konfidenz der Analyse von 0-1
  - isPaid: Boolean - true wenn "bezahlt", "paid", Stempel oder ähnliche Markierung erkennbar ist

  BESONDERS WICHTIG: 
  - Schaue in ALLE Ecken des Belegs nach Nummern
  - Auch handschriftliche Notizen beachten
  - Selbst wenn die Nummer nur 3-4 Stellen hat, ist sie wichtig
  - Bei Kassenbons: Oft steht die Nummer oben oder unten
  - Bei Rechnungen: Meist oben rechts oder im Header

  Antworte NUR mit validem JSON, keine zusätzlichen Erklärungen.`;

  try {
    console.log('Converting image to base64...');
    const image = {
      inlineData: {
        data: Buffer.from(imageBuffer).toString('base64'),
        mimeType
      }
    };
    console.log('Base64 conversion complete, size:', image.inlineData.data.length);

    console.log('Calling Gemini API...');
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response received, length:', text.length);
    
    // Extract JSON from response
    console.log('Raw Gemini response:', text.substring(0, 500) + '...');
    
    // Try to extract JSON from markdown code blocks first
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Then try to extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('No valid JSON found in response');
    }

    console.log('Extracted JSON:', jsonMatch[0]);
    const analysis = JSON.parse(jsonMatch[0]) as ReceiptAnalysis;
    
    // Validate and clean data
    if (analysis.invoiceDate) {
      // Ensure date is in correct format
      const date = new Date(analysis.invoiceDate);
      if (!isNaN(date.getTime())) {
        analysis.invoiceDate = date.toISOString().split('T')[0];
      }
    }
    
    // Enhanced invoice number extraction - try fallback if empty
    if (!analysis.invoiceNumber || analysis.invoiceNumber.trim() === '') {
      console.log('No invoice number found, trying enhanced extraction...');
      
      // Try second pass with focused prompt on invoice numbers
      try {
        const focusedPrompt = `Schaue auf diesen Beleg und finde JEDE Nummer, die eine Belegnummer sein könnte:
        - Suche nach "Nr.", "No.", "#", "Rechnung", "Invoice", "Beleg", "Bon"
        - Auch kleine Nummern in Ecken oder am Rand
        - Handschriftliche Notizen
        - Stempel oder Codes
        - QR-Code Referenzen
        
        Antworte NUR mit der gefundenen Nummer oder "KEINE" wenn wirklich nichts da ist.`;
        
        const focusedResult = await model.generateContent([focusedPrompt, image]);
        const focusedResponse = await focusedResult.response;
        const focusedText = focusedResponse.text().trim();
        
        if (focusedText && focusedText !== 'KEINE' && focusedText.length > 0) {
          // Clean the response - remove common words and keep only the number part
          const cleanedNumber = focusedText
            .replace(/^(Nr\.|No\.|#|Rechnung|Invoice|Beleg|Bon):?\s*/i, '')
            .replace(/\s*$/g, '')
            .trim();
          
          if (cleanedNumber && cleanedNumber.length > 0) {
            analysis.invoiceNumber = cleanedNumber;
            console.log('Found invoice number in second pass:', cleanedNumber);
          }
        }
      } catch (fallbackError) {
        console.log('Fallback invoice number extraction failed:', fallbackError);
        // Continue with original analysis
      }
    }
    
    // Log the final analysis result
    console.log('Final analysis result:', {
      vendor: analysis.vendor,
      amount: analysis.amount,
      totalAmount: analysis.totalAmount,
      invoiceDate: analysis.invoiceDate,
      invoiceNumber: analysis.invoiceNumber,
      category: analysis.category
    });

    return analysis;
  } catch (error: any) {
    console.error('Gemini analysis error:', {
      error: error.message,
      stack: error.stack,
      apiKeyPresent: !!env.GEMINI_API_KEY,
      apiKeyLength: env.GEMINI_API_KEY?.length
    });
    throw new Error(`Failed to analyze receipt: ${error.message}`);
  }
}