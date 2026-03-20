

# Plano: QR Code PIX customizado + Personalizacao da Igreja

## Alteracoes

### 1. Migration: Novos campos na tabela `churches`

```sql
ALTER TABLE churches ADD COLUMN pix_qr_image_url text;
ALTER TABLE churches ADD COLUMN logo_url text; -- ja existe, verificar
ALTER TABLE churches ADD COLUMN primary_color text;
ALTER TABLE churches ADD COLUMN secondary_color text;
ALTER TABLE churches ADD COLUMN accent_color text;
```

`logo_url` ja existe na tabela. Adicionar: `pix_qr_image_url`, `primary_color`, `secondary_color`, `accent_color`.

### 2. `GerenciarIgreja.tsx` -- Upload de arte QR Code PIX

Na aba "Financeiro", apos os campos de chave PIX, adicionar:
- Secao "Arte QR Code PIX" com preview da imagem atual
- Botao para upload de imagem (usando Supabase Storage bucket `photos` que ja e publico)
- Botao para remover imagem
- Texto explicativo: "Suba a arte com o QR Code valido do seu PIX. Esta imagem sera exibida no Portal do Membro."

### 3. `GerenciarIgreja.tsx` -- Nova aba "Personalizar"

Adicionar 4a aba ao Tabs com:
- Upload de logo da igreja (usa `logo_url` existente)
- Seletores de cor: Cor Primaria, Cor Secundaria, Cor de Destaque
- Preview ao vivo das cores selecionadas
- Salvar cores no banco

### 4. `PortalContributions.tsx` -- Exibir arte PIX customizada

Na query, incluir `pix_qr_image_url`. No card PIX:
- Se `pix_qr_image_url` existe: exibir a imagem uploadada em vez do `QRCodeSVG` gerado
- Se nao existe: manter o `QRCodeSVG` como fallback

### 5. Aplicacao das cores da igreja

Criar hook `useChurchTheme` que:
- Busca `primary_color`, `secondary_color`, `accent_color` da igreja
- Aplica como CSS custom properties (`--primary`, `--secondary`, `--accent`) no `:root`
- Integrar no `App.tsx` ou `AuthContext` para aplicar globalmente

### 6. `handleChurchSubmit` -- Incluir novos campos

Adicionar `pix_qr_image_url`, `primary_color`, `secondary_color`, `accent_color` ao payload de update.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar -- `pix_qr_image_url`, cores |
| `src/pages/admin/GerenciarIgreja.tsx` | Modificar -- upload QR, aba personalizar |
| `src/pages/portal/PortalContributions.tsx` | Modificar -- exibir imagem customizada |
| `src/hooks/useChurchTheme.tsx` | Criar -- aplicar cores da igreja |
| `src/App.tsx` | Modificar -- integrar useChurchTheme |

