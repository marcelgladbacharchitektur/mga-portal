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