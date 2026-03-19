

# Plano: Check-in por Reconhecimento Facial

## Conceito

Adicionar um novo modo de check-in ao `CheckInPanel` com 3 formas de entrada:
1. **Busca manual** (atual) -- buscar por nome e clicar check-in
2. **Reconhecimento facial da crianca** -- camera identifica a crianca, check-in automatico
3. **Reconhecimento facial do responsavel** -- camera identifica o responsavel, exibe lista de filhos vinculados para o operador confirmar

O operador alterna entre os modos via segmented toggle no topo do painel.

## Fluxo de Cada Modo

### Modo "Face da Crianca"
1. Camera ao vivo no painel principal
2. Ao clicar "Escanear", captura frame e compara face contra TODAS as criancas com foto cadastrada (que ainda nao fizeram check-in)
3. Se match encontrado: exibe card da crianca com nome, turma e foto lado a lado + botao "Confirmar Check-in"
4. Se nenhum match: "Nenhuma crianca reconhecida. Tente novamente ou use busca manual."
5. Check-in automatico ao confirmar

### Modo "Face do Responsavel"
1. Camera ao vivo
2. Ao clicar "Escanear", compara face contra todos os responsaveis com foto
3. Se match: exibe nome do responsavel + lista de filhos vinculados (que ainda nao fizeram check-in)
4. Operador seleciona quais criancas fazer check-in e confirma
5. Check-in em lote dos selecionados

## Arquitetura Tecnica

### Componente novo: `FaceCheckInMode.tsx`
- Reutiliza a infraestrutura de `FaceVerificationStep` (lazy-load face-api, `loadModelsOnce`, `loadImageWithCORS`)
- Extrai a logica de carregamento de modelos para um utilitario compartilhado (`src/lib/faceRecognition.ts`)
- Recebe lista de criancas e responsaveis com fotos
- Pre-computa descritores faciais na primeira carga (cache em memoria)
- Compara frame capturado contra banco de descritores

### Utilitario: `src/lib/faceRecognition.ts`
- Exporta `loadModelsOnce()`, `loadImageWithCORS()`, `computeDescriptor(imageSource)`, `findBestMatch(descriptor, candidates[])`
- Cache de descritores por URL para evitar reprocessamento
- Constantes de threshold compartilhadas

### Alteracoes no `CheckInPanel.tsx`
- Adicionar toggle: "Manual" | "Face Crianca" | "Face Responsavel"
- Quando modo facial ativo, renderizar `FaceCheckInMode` no lugar da lista de busca
- Manter dialog de QR code pos check-in

### Query adicional no `useChildrenMinistry.tsx`
- Hook `useGuardiansWithChildren()`: busca responsaveis + filhos vinculados via `child_guardians` join, para o modo "Face do Responsavel"

## Melhorias Adicionais Incluidas

1. **Cache de descritores faciais** -- pre-computa ao entrar no modo facial, mostra barra de progresso
2. **Feedback visual em tempo real** -- moldura verde/vermelha ao redor do video quando detecta/nao detecta rosto
3. **Historico de reconhecimento** -- registra no campo `notes` do check-in o metodo usado ("check-in por reconhecimento facial")
4. **Modo continuo** -- apos confirmar um check-in, camera volta automaticamente para escanear o proximo

## Ideias Futuras (nao implementadas agora)

- **Check-in em fila** -- camera fixa reconhece criancas em sequencia sem interacao do operador
- **Notificacao push ao responsavel** -- enviar notificacao quando o filho faz check-in
- **Temperatura corporal** -- integrar leitura de temperatura no fluxo de check-in
- **Totem de auto-atendimento** -- tela dedicada onde o responsavel faz check-in sozinho via face

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/lib/faceRecognition.ts` | Criar -- utilitario compartilhado de face-api |
| `src/components/children-ministry/FaceCheckInMode.tsx` | Criar -- componente de check-in facial |
| `src/components/children-ministry/CheckInPanel.tsx` | Modificar -- adicionar toggle de modos |
| `src/components/children-ministry/FaceVerificationStep.tsx` | Modificar -- usar utilitario compartilhado |
| `src/hooks/useChildrenMinistry.tsx` | Modificar -- adicionar hook de responsaveis com filhos |

