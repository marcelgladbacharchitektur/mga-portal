import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  counterparty?: string;
}

export interface BankStatementAnalysis {
  accountNumber?: string;
  iban?: string;
  period?: {
    start: string;
    end: string;
  };
  transactions: BankTransaction[];
  totalDebits: number;
  totalCredits: number;
  endingBalance?: number;
  confidence: number;
}

export async function analyzeBankStatement(fileBuffer: ArrayBuffer, mimeType: string): Promise<BankStatementAnalysis> {
  console.log('analyzeBankStatement called with:', {
    bufferSize: fileBuffer.byteLength,
    mimeType,
    hasApiKey: !!env.GEMINI_API_KEY,
    apiKeyLength: env.GEMINI_API_KEY?.length
  });
  
  if (!env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analysiere diesen Kontoauszug und extrahiere alle Transaktionen im JSON-Format:
  - accountNumber: Kontonummer
  - iban: IBAN
  - period: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
  - transactions: Array von Transaktionen mit:
    - date: Buchungsdatum im Format YYYY-MM-DD
    - description: Verwendungszweck/Beschreibung
    - amount: Betrag (positiv für Gutschriften, negativ für Belastungen)
    - type: "debit" oder "credit"
    - reference: Referenznummer falls vorhanden
    - counterparty: Empfänger/Absender falls erkennbar
  - totalDebits: Summe aller Belastungen (positiver Wert)
  - totalCredits: Summe aller Gutschriften (positiver Wert)
  - endingBalance: Endsaldo falls vorhanden
  - confidence: Konfidenz der Analyse von 0-1

  WICHTIG: 
  - Extrahiere ALLE Transaktionen, auch kleine Beträge
  - Achte auf korrekte Vorzeichen bei Beträgen
  - Sortiere Transaktionen nach Datum
  
  Antworte NUR mit validem JSON, keine zusätzlichen Erklärungen.`;

  try {
    const image = {
      inlineData: {
        data: Buffer.from(fileBuffer).toString('base64'),
        mimeType
      }
    };

    console.log('Calling Gemini API...');
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response received, length:', text.length);
    console.log('First 500 chars of response:', text.substring(0, 500));
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('No valid JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as BankStatementAnalysis;
    
    // Validate and clean data
    analysis.transactions = analysis.transactions || [];
    analysis.transactions.forEach(transaction => {
      if (transaction.date) {
        // Ensure date is in correct format
        const date = new Date(transaction.date);
        if (!isNaN(date.getTime())) {
          transaction.date = date.toISOString().split('T')[0];
        }
      }
    });

    return analysis;
  } catch (error: any) {
    console.error('Bank statement analysis error:', {
      error: error.message,
      stack: error.stack,
      apiKeyPresent: !!env.GEMINI_API_KEY,
      apiKeyLength: env.GEMINI_API_KEY?.length
    });
    throw new Error(`Failed to analyze bank statement: ${error.message}`);
  }
}