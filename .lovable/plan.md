

# Plano: Adicionar envio de link do Portal do Membro na Gestao de Membros

## O que sera feito

Adicionar duas funcionalidades na pagina de Gestao de Membros:

1. **Botao global "Copiar Link do Portal"** no header da pagina -- gera e copia o link de cadastro/login do Portal do Membro vinculado a igreja do admin
2. **Opcao "Enviar Convite" no menu de cada membro** -- copia o link personalizado ou abre dialog com opcao de copiar/compartilhar o link para aquele membro especifico

## Como funciona

- O link gerado sera: `{window.location.origin}/portal/auth?church={profile.church_id}`
- Este link ja existe e funciona com a pagina `/portal/auth` criada anteriormente
- No dropdown de cada membro, adicionar opcao "Enviar Link do Portal" que copia o link e mostra toast de confirmacao
- No header, ao lado do botao "Novo Membro", adicionar botao "Link do Portal" com icone de compartilhar

## Alteracoes

### `src/pages/Membros.tsx`
- Importar `Link2, Share2, Copy` do lucide-react e `toast` do sonner
- Adicionar funcao `copyPortalLink()` que monta a URL e copia para clipboard
- Adicionar botao "Link do Portal" no header ao lado de "Novo Membro"
- Adicionar item "Enviar Link do Portal" no DropdownMenu de cada membro (entre Editar e Excluir)
- Quando clicado no contexto de um membro com email, copiar o link e exibir toast com instrucao para enviar ao membro

Nenhuma alteracao de backend necessaria -- o link e a edge function `portal-signup` ja existem.

