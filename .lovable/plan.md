

# Plano: Corrigir Camera e Completar Ministerio Infantil

## Problemas Identificados

1. **Camera nao funciona**: O `capture="user"` no `<input type="file">` nao abre camera em desktop/iframe. Precisa usar `navigator.mediaDevices.getUserMedia` para captura real via webcam/camera.

2. **Aba Equipe ausente**: Componentes `StaffList` e `StaffScheduler` existem prontos mas NAO estao integrados na pagina `MinisterioInfantil.tsx`. Falta uma aba "Equipe" com gestao de voluntarios e escalas.

3. **Aba Saude incompleta**: O componente `AnamnesisDialog` existe mas nao esta integrado (so Medicacao e Incidentes aparecem).

## Alteracoes

### 1. `src/components/children-ministry/PhotoUpload.tsx` -- Corrigir Camera

Substituir a abordagem `capture="user"` por um fluxo real com `getUserMedia`:
- Ao clicar "Tirar Foto", abrir um Dialog com stream de video da camera
- Botao para capturar frame do video em canvas
- Converter canvas para File e enviar pelo fluxo de upload existente
- Funciona em desktop (webcam) e mobile (camera frontal/traseira)
- Fallback: se `getUserMedia` nao disponivel, usar o input com capture como antes

### 2. `src/pages/MinisterioInfantil.tsx` -- Adicionar aba Equipe

- Adicionar 10a aba "Equipe" com icone `UserCog`
- Conteudo: `StaffList` + `StaffScheduler` (componentes ja prontos)
- Ajustar grid do TabsList de 9 para 10 colunas

### 3. `src/pages/MinisterioInfantil.tsx` -- Integrar Anamnese na aba Saude

- Adicionar `AnamnesisDialog` como parte da aba Saude (junto com Medicacao e Incidentes)
- Criar um mini painel de "Fichas de Anamnese" que lista criancas e permite abrir/editar ficha

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/children-ministry/PhotoUpload.tsx` | Reescrever captura de camera com getUserMedia |
| `src/pages/MinisterioInfantil.tsx` | Adicionar aba Equipe + Anamnese na Saude |

