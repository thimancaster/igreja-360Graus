

# Plano: Import/Export de Membros com mapeamento de colunas

## Resumo

Adicionar na pagina "Gestao de Membros" botoes para exportar todos os membros para Excel/CSV e importar membros a partir de planilhas com mapeamento de colunas adaptavel. Baseado nos 3 modelos enviados (Novos, Batizados, Convertidos) que compartilham colunas: Nome, Data de nascimento, Estado civil, CPF, Celular, Rua, Conjuge, Data de conversao, Igreja de conversao, Data de batismo.

## Alteracoes

### 1. `src/utils/memberImportHelpers.ts` -- Novo arquivo

Helpers especificos para importacao de membros:
- `readMemberSpreadsheet(file)` -- reutiliza `readSpreadsheet` existente
- `parseMemberRow(row, mapping)` -- mapeia colunas da planilha para campos do membro
- `MemberColumnMapping` -- interface com campos mapeaveiss: `full_name`, `birth_date`, `marital_status`, `cpf` (mapeado para `notes` ou campo custom), `phone`, `address`, `spouse_name`, `baptism_date`, `baptism_church`, `previous_church`
- `downloadMemberTemplate()` -- gera modelo .xlsx com colunas padronizadas baseadas nos modelos enviados
- `exportMembersToExcel(members)` -- exporta membros atuais com colunas legiveiss

### 2. `src/components/members/MemberImportDialog.tsx` -- Novo componente

Dialog modal com 3 steps (igual ao fluxo de importacao de transacoes):
- **Step 1**: Upload de arquivo (.xlsx, .xls, .csv) + botao baixar modelo
- **Step 2**: Mapeamento de colunas -- cada campo do membro pode ser associado a qualquer coluna da planilha. Campos obrigatorios: apenas `full_name`. Demais opcionais.
- **Step 3**: Preview dos dados mapeados + botao importar

Campos mapeaveiss (todos opcionais exceto nome):
| Campo Sistema | Label | Exemplo da planilha |
|---|---|---|
| full_name | Nome completo | "Nome" |
| birth_date | Data de nascimento | "Data de nascimento" |
| marital_status | Estado civil | "Estado civil" |
| phone | Telefone/Celular | "Celular 1" |
| address | Endereco | "Rua" |
| spouse_name | Nome do conjuge | "Nome do cônjuge" |
| baptism_date | Data de batismo | "Data de Batismo nas águas" |
| baptism_church | Igreja de conversao/batismo | "Igreja de conversão" |
| previous_church | Convertido na igreja | "Convertido em nossa Igreja" |
| notes | Observacoes | (qualquer coluna extra) |
| status | Status | (default: active) |

Deduplicacao: por `full_name` normalizado -- pula membros com nome identico ja existente.

Insercao: batch insert via Supabase, com progress bar e contadores (importados / duplicados / erros).

### 3. `src/pages/Membros.tsx` -- Adicionar botoes

No header, adicionar 2 botoes:
- **Exportar** (icone Download) -- chama `exportMembersToExcel(members)` gerando arquivo com todos os membros e colunas relevantes
- **Importar** (icone Upload) -- abre `MemberImportDialog`

### 4. Template padronizado baseado nos modelos

O modelo para download tera as colunas:
Nome, Data de Nascimento, Estado Civil, CPF, Celular, Endereco, Cidade, Estado, CEP, Conjuge, Membro Desde, Data de Batismo, Igreja de Batismo, Pastor de Batismo, Igreja Anterior, Observacoes

## Arquivos Afetados

| Arquivo | Acao |
|---|---|
| `src/utils/memberImportHelpers.ts` | Criar |
| `src/components/members/MemberImportDialog.tsx` | Criar |
| `src/pages/Membros.tsx` | Modificar -- botoes importar/exportar |

Nenhuma alteracao de banco necessaria -- usa a tabela `members` existente.

