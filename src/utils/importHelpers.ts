import ExcelJS from 'exceljs';
import { z } from 'zod';
import { transactionImportSchema, ProcessedTransaction } from '@/types/import';

/**
 * Normalizes a string for consistent comparison
 */
function normalizeForHash(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ');
}

/**
 * Creates a content-based hash from transaction data
 * This is the same algorithm used in the Edge Functions for consistency
 */
export function createContentHash(
  description: string,
  amount: number,
  dueDate: string | null,
  type: string
): string {
  const normalizedDesc = normalizeForHash(description);
  const normalizedAmount = Math.abs(Number(amount) || 0).toFixed(2);
  const normalizedDate = dueDate || '';
  const normalizedType = type.toLowerCase().trim();
  
  const content = `${normalizedDesc}|${normalizedAmount}|${normalizedDate}|${normalizedType}`;
  
  try {
    return btoa(unescape(encodeURIComponent(content)))
      .replace(/[+/=]/g, '')
      .substring(0, 20);
  } catch {
    return content.replace(/[^a-z0-9]/gi, '').substring(0, 20);
  }
}

/**
 * Creates an external_id for imported transactions
 * Format: import_{contentHash}
 */
export function createImportExternalId(
  description: string,
  amount: number,
  dueDate: string | null,
  type: string
): string {
  const hash = createContentHash(description, amount, dueDate, type);
  return `import_${hash}`;
}

/**
 * Checks if two amounts are effectively equal (handles floating point issues)
 */
export function amountsAreEqual(a: number, b: number): boolean {
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

/**
 * Interface for existing transaction when checking duplicates
 */
export interface ExistingTransactionForDupe {
  id: string;
  description: string;
  amount: number;
  type: string;
  due_date: string | null;
  payment_date: string | null;
  external_id: string | null;
}

/**
 * Checks if an incoming transaction is a duplicate of an existing one
 * Uses content hash as the primary deduplication method
 */
export function isTransactionDuplicate(
  incoming: {
    description: string;
    amount: number;
    type: string;
    due_date: string | null;
  },
  existingHashes: Set<string>,
  existingByExternalId: Set<string>
): boolean {
  const hash = createContentHash(
    incoming.description,
    incoming.amount,
    incoming.due_date,
    incoming.type
  );
  
  const externalId = createImportExternalId(
    incoming.description,
    incoming.amount,
    incoming.due_date,
    incoming.type
  );
  
  return existingHashes.has(hash) || existingByExternalId.has(externalId);
}

/**
 * Builds lookup sets from existing transactions for efficient deduplication
 */
export function buildDeduplicationSets(
  existingTransactions: ExistingTransactionForDupe[]
): {
  existingHashes: Set<string>;
  existingByExternalId: Set<string>;
} {
  const existingHashes = new Set<string>();
  const existingByExternalId = new Set<string>();
  
  for (const tx of existingTransactions) {
    const hash = createContentHash(tx.description, tx.amount, tx.due_date, tx.type);
    existingHashes.add(hash);
    
    if (tx.external_id) {
      existingByExternalId.add(tx.external_id);
    }
  }
  
  return { existingHashes, existingByExternalId };
}

/**
 * Filters out duplicate transactions from import batch
 * Also detects intra-batch duplicates
 */
export function filterDuplicateTransactions<T extends {
  description: string;
  amount: number;
  type: string;
  due_date: string | null;
}>(
  incoming: T[],
  existingHashes: Set<string>,
  existingByExternalId: Set<string>
): {
  toImport: T[];
  duplicates: T[];
  batchDuplicates: T[];
} {
  const toImport: T[] = [];
  const duplicates: T[] = [];
  const batchDuplicates: T[] = [];
  const batchHashes = new Set<string>();
  
  for (const tx of incoming) {
    const hash = createContentHash(tx.description, tx.amount, tx.due_date, tx.type);
    const externalId = createImportExternalId(tx.description, tx.amount, tx.due_date, tx.type);
    
    // Check if already exists in database
    if (existingHashes.has(hash) || existingByExternalId.has(externalId)) {
      duplicates.push(tx);
      continue;
    }
    
    // Check if duplicate within this batch
    if (batchHashes.has(hash)) {
      batchDuplicates.push(tx);
      continue;
    }
    
    batchHashes.add(hash);
    toImport.push(tx);
  }
  
  return { toImport, duplicates, batchDuplicates };
}

/**
 * Reads an Excel or CSV file and returns its headers and rows.
 * @param file The file to read.
 * @returns A promise that resolves to an object with headers and rows.
 */
export const readSpreadsheet = (file: File): Promise<{ headers: string[]; rows: unknown[][] }> => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // CSV handling
  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) throw new Error('Empty file');
          const { headers, rows } = parseCSVText(text);
          resolve({ headers, rows });
        } catch {
          reject(new Error('Falha ao ler o arquivo CSV.'));
        }
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // XLS/XLSX handling
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
          throw new Error('Could not read file data.');
        }

        // Try xlsx first
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          const worksheet = workbook.worksheets[0];
          if (worksheet) {
            const rows: unknown[][] = [];
            worksheet.eachRow((row) => {
              const rowValues = row.values as unknown[];
              rows.push(rowValues.slice(1));
            });
            const headers = rows[0]?.map(h => String(h ?? '')) || [];
            const dataRows = rows.slice(1);
            resolve({ headers, rows: dataRows });
            return;
          }
        } catch {
          // Not a valid xlsx, try HTML table parsing (many .xls files are HTML)
        }

        // Fallback: parse as HTML table (.xls exported from web apps)
        const decoder = new TextDecoder('utf-8');
        let htmlText = decoder.decode(data);
        // Also try latin1 if utf-8 produces garbage
        if (htmlText.includes('�')) {
          const latin1Decoder = new TextDecoder('iso-8859-1');
          htmlText = latin1Decoder.decode(data);
        }

        if (htmlText.includes('<table') || htmlText.includes('<TABLE')) {
          const { headers, rows } = parseHTMLTable(htmlText);
          if (headers.length > 0) {
            resolve({ headers, rows });
            return;
          }
        }

        throw new Error('Formato de arquivo não reconhecido.');
      } catch (error) {
        reject(new Error('Falha ao ler a planilha. Verifique o formato do arquivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses CSV text into headers and rows.
 */
function parseCSVText(text: string): { headers: string[]; rows: unknown[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',' || ch === ';') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  // Detect if first rows are title/subtitle (fewer columns than data rows)
  const allParsed = lines.map(parseCSVLine);
  const maxCols = Math.max(...allParsed.map(r => r.length));

  // Skip rows that have significantly fewer columns (title rows)
  let headerIndex = 0;
  for (let i = 0; i < allParsed.length; i++) {
    if (allParsed[i].length >= maxCols - 1) {
      headerIndex = i;
      break;
    }
  }

  const headers = allParsed[headerIndex] || [];
  const rows = allParsed.slice(headerIndex + 1).filter(r => r.some(cell => cell !== ''));
  return { headers, rows };
}

/**
 * Parses an HTML table (common in .xls files exported from web apps).
 */
function parseHTMLTable(html: string): { headers: string[]; rows: unknown[][] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return { headers: [], rows: [] };

  const allRows: string[][] = [];
  table.querySelectorAll('tr').forEach(tr => {
    const cells: string[] = [];
    tr.querySelectorAll('th, td').forEach(cell => {
      cells.push((cell.textContent || '').trim());
    });
    if (cells.some(c => c !== '')) {
      allRows.push(cells);
    }
  });

  if (allRows.length === 0) return { headers: [], rows: [] };

  // Find the header row: the row with the most columns that contains typical header words
  const maxCols = Math.max(...allRows.map(r => r.length));
  let headerIndex = 0;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i].length >= maxCols - 1) {
      // Check if this looks like a header (has text, not just numbers)
      const hasText = allRows[i].some(c => c.length > 1 && isNaN(Number(c)));
      if (hasText) {
        headerIndex = i;
        break;
      }
    }
  }

  // Filter out the '#' column if present
  const rawHeaders = allRows[headerIndex];
  let skipFirstCol = false;
  if (rawHeaders[0] === '#' || rawHeaders[0] === 'Nº' || rawHeaders[0] === 'N°') {
    skipFirstCol = true;
  }

  const headers = skipFirstCol ? rawHeaders.slice(1) : rawHeaders;
  const dataRows = allRows.slice(headerIndex + 1).map(row => {
    const cells = skipFirstCol ? row.slice(1) : row;
    // Pad rows to match header length
    while (cells.length < headers.length) cells.push('');
    return cells;
  });

  return { headers, rows: dataRows };
}

/**
 * Parses a currency string (e.g., "R$ 1.234,56" or "1234.56") into a number.
 * @param value The value to parse.
 * @returns The parsed number or null if invalid.
 */
export const parseAmount = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Math.abs(value);
  }
  if (typeof value !== 'string') {
    return null;
  }
  
  // Remove currency symbols and spaces
  let cleaned = value.replace(/[R$\s]/g, '').trim();
  
  // Handle Brazilian format (1.234,56 -> 1234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  
  const number = parseFloat(cleaned);
  return isNaN(number) ? null : Math.abs(number);
};

/**
 * Parses a date from various formats (DD/MM/YYYY, YYYY-MM-DD, Excel serial) into an ISO string (YYYY-MM-DD).
 * @param value The value to parse.
 * @returns The ISO date string or null if invalid.
 */
export const parseDate = (value: unknown): string | null => {
  if (!value) return null;

  // Handle ExcelJS Date objects
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
  }

  if (typeof value === 'number') {
    // Handle Excel serial date
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  if (typeof value === 'string') {
    // Try DD/MM/YYYY format first
    const brMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try YYYY-MM-DD format
    const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Fallback to Date constructor
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
};

/**
 * Normalizes a string value to "Receita" or "Despesa".
 * @param value The string to normalize.
 * @returns The normalized type or null.
 */
export const normalizeType = (value: string): 'Receita' | 'Despesa' | null => {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase().trim();
  
  const receitaTerms = ['receita', 'entrada', 'crédito', 'credito', 'credit', 'income', 'revenue'];
  const despesaTerms = ['despesa', 'saída', 'saida', 'débito', 'debito', 'debit', 'gasto', 'pagamento', 'expense'];
  
  for (const term of receitaTerms) {
    if (lower.includes(term)) return 'Receita';
  }
  
  for (const term of despesaTerms) {
    if (lower.includes(term)) return 'Despesa';
  }
  
  return null;
};

/**
 * Normalizes a string value to "Pendente", "Pago", or "Vencido".
 * @param value The string to normalize.
 * @returns The normalized status or null.
 */
export const normalizeStatus = (value: string): 'Pendente' | 'Pago' | 'Vencido' | null => {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase().trim();
  
  if (['pendente', 'pending', 'aberto', 'a pagar', 'a receber'].includes(lower)) {
    return 'Pendente';
  }
  if (['pago', 'paid', 'concluído', 'concluido', 'recebido', 'quitado'].includes(lower)) {
    return 'Pago';
  }
  if (['vencido', 'overdue', 'atrasado', 'em atraso'].includes(lower)) {
    return 'Vencido';
  }
  return null;
};

/**
 * Validates a processed transaction object against the Zod schema.
 * @param transaction The transaction object to validate.
 * @returns An object with the validation result and potential errors.
 */
export const validateTransaction = (transaction: Partial<ProcessedTransaction>): z.SafeParseReturnType<Partial<ProcessedTransaction>, ProcessedTransaction> => {
  return transactionImportSchema.safeParse(transaction);
};
