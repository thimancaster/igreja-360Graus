import React, { useState, useMemo } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  readSpreadsheet,
  MemberColumnMapping,
  MEMBER_FIELD_LABELS,
  REQUIRED_FIELDS,
  parseMemberRow,
  deduplicateMembers,
  downloadMemberTemplate,
} from '@/utils/memberImportHelpers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 1 | 2 | 3;

export function MemberImportDialog({ open, onOpenChange }: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<MemberColumnMapping>({ full_name: '' });
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; duplicates: number; errors: number } | null>(null);

  const reset = () => {
    setStep(1);
    setHeaders([]);
    setRows([]);
    setFileName('');
    setMapping({ full_name: '' });
    setImporting(false);
    setProgress(0);
    setResult(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readSpreadsheet(file);
      setHeaders(data.headers);
      setRows(data.rows);
      setFileName(file.name);

      // Auto-map by fuzzy matching
      const autoMap: Record<string, string> = {};
      const fieldHints: Record<string, string[]> = {
        full_name: ['nome', 'name', 'membro'],
        birth_date: ['nascimento', 'birth', 'nasc'],
        marital_status: ['estado civil', 'civil', 'marital'],
        phone: ['celular', 'telefone', 'phone', 'tel', 'fone'],
        email: ['email', 'e-mail'],
        address: ['rua', 'endereço', 'endereco', 'address', 'logradouro'],
        city: ['cidade', 'city'],
        state: ['estado', 'uf'],
        zip_code: ['cep', 'zip'],
        spouse_name: ['cônjuge', 'conjuge', 'spouse', 'esposo', 'esposa'],
        baptism_date: ['batismo', 'baptism'],
        baptism_church: ['igreja de batismo', 'igreja batismo', 'igreja de conversão', 'igreja conversão'],
        baptism_pastor: ['pastor'],
        previous_church: ['igreja anterior', 'convertido'],
        member_since: ['membro desde', 'data de entrada'],
        profession: ['profissão', 'profissao', 'profession'],
        notes: ['observ', 'obs', 'notes'],
      };

      for (const [field, hints] of Object.entries(fieldHints)) {
        const match = data.headers.find(h =>
          hints.some(hint => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(hint))
        );
        if (match) autoMap[field] = match;
      }

      setMapping({ full_name: autoMap.full_name || '', ...autoMap } as MemberColumnMapping);
      setStep(2);
    } catch {
      toast.error('Erro ao ler o arquivo');
    }
  };

  const mappingValid = !!mapping.full_name;

  const preview = useMemo(() => {
    if (!mappingValid) return [];
    return rows.slice(0, 5).map(row => parseMemberRow(row, headers, mapping));
  }, [rows, headers, mapping, mappingValid]);

  const handleImport = async () => {
    if (!profile?.church_id) return;
    setImporting(true);
    setProgress(0);

    try {
      const parsed = rows
        .map(row => parseMemberRow(row, headers, mapping))
        .filter(m => m.full_name);

      // Fetch existing member names
      const { data: existing } = await supabase
        .from('members')
        .select('full_name')
        .eq('church_id', profile.church_id);

      const existingNames = (existing || []).map(m => m.full_name);
      const { toImport, duplicates } = deduplicateMembers(parsed, existingNames);

      let imported = 0;
      let errors = 0;
      const batchSize = 50;

      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize).map(m => ({
          church_id: profile.church_id!,
          full_name: m.full_name!,
          birth_date: m.birth_date || null,
          marital_status: m.marital_status || null,
          phone: m.phone || null,
          email: m.email || null,
          address: m.address || null,
          city: m.city || null,
          state: m.state || null,
          zip_code: m.zip_code || null,
          spouse_name: m.spouse_name || null,
          baptism_date: m.baptism_date || null,
          baptism_church: m.baptism_church || null,
          baptism_pastor: m.baptism_pastor || null,
          previous_church: m.previous_church || null,
          member_since: m.member_since || null,
          profession: m.profession || null,
          notes: m.notes || null,
          status: 'active',
        }));

        const { error } = await supabase.from('members').insert(batch);
        if (error) {
          errors += batch.length;
        } else {
          imported += batch.length;
        }
        setProgress(Math.round(((i + batch.length) / toImport.length) * 100));
      }

      setResult({ imported, duplicates: duplicates.length, errors });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(`${imported} membros importados com sucesso!`);
    } catch {
      toast.error('Erro durante a importação');
    } finally {
      setImporting(false);
    }
  };

  const updateMapping = (field: keyof MemberColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value === '__none__' ? '' : value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Membros
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Selecione um arquivo .xlsx, .xls ou .csv'}
            {step === 2 && 'Mapeie as colunas da planilha para os campos do sistema'}
            {step === 3 && 'Revise os dados antes de importar'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-1 text-sm ${s === step ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                {s < step ? '✓' : s}
              </div>
              {s === 1 && 'Upload'}
              {s === 2 && 'Mapeamento'}
              {s === 3 && 'Importar'}
              {s < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground ml-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Arraste ou clique para selecionar</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="member-import-file"
              />
              <Button asChild variant="outline">
                <label htmlFor="member-import-file" className="cursor-pointer">Selecionar Arquivo</label>
              </Button>
            </div>
            <Button variant="ghost" className="gap-2 text-sm" onClick={downloadMemberTemplate}>
              <Download className="h-4 w-4" />
              Baixar Modelo de Planilha
            </Button>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              {fileName} — {rows.length} linhas, {headers.length} colunas
            </div>

            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {(Object.keys(MEMBER_FIELD_LABELS) as (keyof MemberColumnMapping)[]).map(field => (
                  <div key={field} className="flex items-center gap-3">
                    <div className="w-44 text-sm flex items-center gap-1">
                      {MEMBER_FIELD_LABELS[field]}
                      {REQUIRED_FIELDS.includes(field) && <span className="text-destructive">*</span>}
                    </div>
                    <Select
                      value={(mapping as unknown as Record<string, string>)[field] || '__none__'}
                      onValueChange={v => updateMapping(field, v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Não mapear" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Não mapear —</SelectItem>
                        {headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!mappingValid} className="gap-2">
                Preview <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview + Import */}
        {step === 3 && !result && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mostrando as primeiras {preview.length} linhas de {rows.length} total.
            </p>

            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nasc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.full_name || '—'}</TableCell>
                      <TableCell>{row.phone || '—'}</TableCell>
                      <TableCell>{row.email || '—'}</TableCell>
                      <TableCell>{row.birth_date || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}%</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={importing} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleImport} disabled={importing} className="gap-2">
                {importing ? 'Importando...' : `Importar ${rows.length} membros`}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Importação Concluída</h3>
            <div className="flex justify-center gap-4">
              <Badge variant="default" className="text-sm px-3 py-1">{result.imported} importados</Badge>
              {result.duplicates > 0 && (
                <Badge variant="secondary" className="text-sm px-3 py-1">{result.duplicates} duplicados</Badge>
              )}
              {result.errors > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1">{result.errors} erros</Badge>
              )}
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
