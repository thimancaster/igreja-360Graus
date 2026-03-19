

# Plano: Melhorias de Performance no Reconhecimento Facial

## Problemas Identificados

1. **Descritores calculados sequencialmente** -- cada foto e processada uma por uma, bloqueando tudo
2. **Cache perdido entre sessoes** -- ao clonar candidatos (`map(c => ({...c}))`), os descritores em cache nao sao reaproveitados
3. **Sem escaneamento automatico** -- usuario precisa clicar "Escanear Rosto" manualmente toda vez
4. **Canvas em resolucao total** -- processa frame na resolucao completa da camera, desnecessariamente pesado
5. **TinyFaceDetector com opcoes padrao** -- pode ser ajustado para velocidade

## Melhorias

### 1. `faceRecognition.ts` -- Processamento paralelo + otimizacoes

- `precomputeDescriptors`: processar em lotes paralelos de 3 (em vez de 1 por vez) -- reduz tempo em ~3x
- Adicionar opcao `inputSize` menor no `TinyFaceDetectorOptions` (160 em vez de 416) para scans ao vivo
- Nova funcao `computeDescriptorFast` que redimensiona o canvas para 320px antes de processar
- Manter cache global persistente entre sessoes do componente

### 2. `FaceCheckInMode.tsx` -- Auto-scan + fluidez

- **Auto-scan continuo**: ao ativar camera, escanear automaticamente a cada 2.5s sem precisar clicar botao
- **Nao clonar candidatos**: passar `rawCandidates` direto para `precomputeDescriptors` para aproveitar cache
- **Redimensionar frame** para 320px de largura antes de processar (muito mais rapido)
- **Indicador visual de scan** sutil (borda pulsando) em vez de overlay bloqueante
- **Botao "Parar Camera"** visivel para controle
- Remover estado `noMatch` intermediario que trava -- manter camera rodando e mostrar feedback inline

### 3. Corrigir warning do console

- `FaceCheckInMode` recebe ref indevidamente do `CheckInPanel` -- nao e necessario ref, apenas remover

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/lib/faceRecognition.ts` | Modificar -- paralelo, fast descriptor, inputSize |
| `src/components/children-ministry/FaceCheckInMode.tsx` | Modificar -- auto-scan, cache, resize, UX |

