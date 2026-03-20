import ExcelJS from 'exceljs';
import { readSpreadsheet, parseDate } from './importHelpers';

export interface MemberColumnMapping {
  full_name: string;
  birth_date?: string;
  marital_status?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  email?: string;
  spouse_name?: string;
  baptism_date?: string;
  baptism_church?: string;
  baptism_pastor?: string;
  previous_church?: string;
  member_since?: string;
  profession?: string;
  notes?: string;
}

export const MEMBER_FIELD_LABELS: Record<keyof MemberColumnMapping, string> = {
  full_name: 'Nome Completo',
  birth_date: 'Data de Nascimento',
  marital_status: 'Estado Civil',
  phone: 'Telefone / Celular',
  address: 'Endereço',
  city: 'Cidade',
  state: 'Estado',
  zip_code: 'CEP',
  email: 'E-mail',
  spouse_name: 'Cônjuge',
  baptism_date: 'Data de Batismo',
  baptism_church: 'Igreja de Batismo',
  baptism_pastor: 'Pastor de Batismo',
  previous_church: 'Igreja Anterior',
  member_since: 'Membro Desde',
  profession: 'Profissão',
  notes: 'Observações',
};

export const REQUIRED_FIELDS: (keyof MemberColumnMapping)[] = ['full_name'];

function normalizeName(name: string): string {
  return name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

export function parseMemberRow(
  row: unknown[],
  headers: string[],
  mapping: MemberColumnMapping
): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  for (const [field, header] of Object.entries(mapping)) {
    if (!header) continue;
    const colIndex = headers.indexOf(header);
    if (colIndex === -1) continue;

    const raw = row[colIndex];
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      result[field] = null;
      continue;
    }

    if (field === 'birth_date' || field === 'baptism_date' || field === 'member_since') {
      result[field] = parseDate(raw);
    } else {
      result[field] = String(raw).trim();
    }
  }

  return result;
}

export function deduplicateMembers(
  incoming: Record<string, string | null>[],
  existingNames: string[]
): { toImport: Record<string, string | null>[]; duplicates: Record<string, string | null>[] } {
  const existingSet = new Set(existingNames.map(normalizeName));
  const batchSet = new Set<string>();
  const toImport: Record<string, string | null>[] = [];
  const duplicates: Record<string, string | null>[] = [];

  for (const member of incoming) {
    const name = member.full_name;
    if (!name) continue;
    const normalized = normalizeName(name);

    if (existingSet.has(normalized) || batchSet.has(normalized)) {
      duplicates.push(member);
    } else {
      batchSet.add(normalized);
      toImport.push(member);
    }
  }

  return { toImport, duplicates };
}

const TEMPLATE_COLUMNS = [
  'Nome', 'Data de Nascimento', 'Estado Civil', 'Telefone', 'E-mail',
  'Endereço', 'Cidade', 'Estado', 'CEP', 'Cônjuge', 'Profissão',
  'Membro Desde', 'Data de Batismo', 'Igreja de Batismo', 'Pastor de Batismo',
  'Igreja Anterior', 'Observações',
];

export async function downloadMemberTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Membros');

  sheet.columns = TEMPLATE_COLUMNS.map(name => ({ header: name, key: name, width: 20 }));
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_membros.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportMembersToExcel(members: Array<Record<string, unknown>>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Membros');

  const fields: { key: string; header: string }[] = [
    { key: 'full_name', header: 'Nome' },
    { key: 'birth_date', header: 'Data de Nascimento' },
    { key: 'marital_status', header: 'Estado Civil' },
    { key: 'phone', header: 'Telefone' },
    { key: 'email', header: 'E-mail' },
    { key: 'address', header: 'Endereço' },
    { key: 'city', header: 'Cidade' },
    { key: 'state', header: 'Estado' },
    { key: 'zip_code', header: 'CEP' },
    { key: 'spouse_name', header: 'Cônjuge' },
    { key: 'profession', header: 'Profissão' },
    { key: 'member_since', header: 'Membro Desde' },
    { key: 'baptism_date', header: 'Data de Batismo' },
    { key: 'baptism_church', header: 'Igreja de Batismo' },
    { key: 'baptism_pastor', header: 'Pastor de Batismo' },
    { key: 'previous_church', header: 'Igreja Anterior' },
    { key: 'status', header: 'Status' },
    { key: 'notes', header: 'Observações' },
  ];

  sheet.columns = fields.map(f => ({ header: f.header, key: f.key, width: 20 }));
  sheet.getRow(1).font = { bold: true };

  for (const m of members) {
    const row: Record<string, unknown> = {};
    for (const f of fields) {
      row[f.key] = m[f.key] ?? '';
    }
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `membros_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export { readSpreadsheet };
