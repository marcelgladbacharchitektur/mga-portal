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
    
    // Try to extract and fix JSON from response
    let jsonStr = text;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('No valid JSON found in response');
    }
    
    let rawJson = jsonMatch[0];
    
    // Try to fix common JSON issues
    try {
      // First attempt - parse as is
      const analysis = JSON.parse(rawJson) as BankStatementAnalysis;
      console.log('JSON parsed successfully on first attempt');
      return processAnalysis(analysis);
    } catch (firstError: any) {
      console.log('First JSON parse failed, attempting to fix:', firstError.message);
      
      // Try to fix incomplete JSON by adding missing closing brackets
      let fixedJson = rawJson;
      
      // Count opening and closing brackets
      const openBrackets = (fixedJson.match(/\{/g) || []).length;
      const closeBrackets = (fixedJson.match(/\}/g) || []).length;
      const openArrays = (fixedJson.match(/\[/g) || []).length;
      const closeArrays = (fixedJson.match(/\]/g) || []).length;
      
      // Add missing closing brackets
      for (let i = 0; i < openArrays - closeArrays; i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += '}';
      }
      
      // Try to remove trailing comma before closing brackets
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      try {
        const analysis = JSON.parse(fixedJson) as BankStatementAnalysis;
        console.log('JSON parsed successfully after fixing');
        return processAnalysis(analysis);
      } catch (secondError: any) {
        console.error('Failed to parse even after fixes:', secondError.message);
        console.error('Original JSON:', rawJson.substring(0, 1000));
        console.error('Fixed JSON:', fixedJson.substring(0, 1000));
        throw new Error(`Failed to parse JSON response: ${secondError.message}`);
      }
    }
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

function processAnalysis(analysis: BankStatementAnalysis): BankStatementAnalysis {
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
}