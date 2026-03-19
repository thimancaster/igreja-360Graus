

# Plano: Restringir acesso de membros ao app principal

## Problema
Atualmente, um usuario com role `membro` consegue acessar qualquer rota `/app/*` se navegar diretamente pela URL. O `AuthRedirect` redireciona corretamente na raiz `/`, mas nao ha bloqueio nas rotas `/app/*`.

## Solucao

Criar um componente `AppRoute` que envolve todas as rotas `/app/*` e verifica se o usuario tem apenas a role `membro`. Se sim, redireciona para `/portal`.

### Alteracoes

**1. Criar `src/components/AppRoute.tsx`**
- Componente wrapper que usa `useRole()` para verificar roles
- Se o usuario tem apenas `membro` (sem admin, tesoureiro, pastor, lider), redireciona para `/portal` com toast de aviso
- Se tem qualquer role privilegiada, renderiza normalmente

**2. Atualizar `src/App.tsx`**
- Envolver todas as rotas `/app/*` com `<AppRoute>` dentro do `<ProtectedRoute>`
- Formato: `<ProtectedRoute><AppRoute><AppLayout>...</AppLayout></AppRoute></ProtectedRoute>`

**3. Atualizar `src/components/AuthRedirect.tsx`**
- Tambem considerar usuarios com role `membro` combinada com `parent` como "apenas portal"
- Usuarios sem nenhuma role tambem devem ir para o portal (nao para o dashboard)

### Logica de decisao
```text
Usuario tem role admin/tesoureiro/pastor/lider? → Acesso ao /app/*
Usuario tem apenas membro/parent (ou nenhuma role)? → Redireciona para /portal
```

Nenhuma alteracao de backend necessaria.

