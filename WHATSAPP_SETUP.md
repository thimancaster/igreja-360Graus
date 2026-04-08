# Configuração do WhatsApp - Evolution API (Fase 3)

O sistema de lembretes automáticos para as escalas usa a **Evolution API** via Edge Functions no Supabase.

## 1. Supabase Edge Functions

Acesse o Dashboard da sua conta Supabase, vá em **Edge Functions** e você verá a função `check-unconfirmed-schedules`. Ela deve ser executada (via trigger do `pg_cron` no Supabase ou via agendador externo).

## 2. Configurando as Variáveis de Ambiente

Para que a conexão autentique corretamente com seu número de envio (Evolution API), você precisa injetar as seguintes variáveis de ambiente no Supabase:

```bash
npx supabase secrets set EVOLUTION_API_URL="https://sua-instancia-evolution.com"
npx supabase secrets set EVOLUTION_API_KEY="seu-global-apikey-aqui"
npx supabase secrets set EVOLUTION_INSTANCE="nome_da_instancia"
```

*Obs: a variável de ambiente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` devem ficar acessíveis pela função.*

## 3. Disparo (CronJob Automático)

Por padrão, essa API HTTP precisa ser visitada uma vez ao dia, preferencialmente cedo.

Quando disparada, ela iterará sobre a tabela `volunteer_schedules` verificando `confirmed = false` e `whatsapp_reminder_sent = false`. Após o disparo para a API, os logs do sucesso ou falhas ficam registrados na tabela `whatsapp_logs` e a notificação da escala recebe `whatsapp_reminder_sent = true`.
