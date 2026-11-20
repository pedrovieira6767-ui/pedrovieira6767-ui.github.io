# Ampla

Seus exames, sua evolução. App para guardar exames laboratoriais, ver a saúde num personagem com
órgãos, acompanhar a evolução e comparar com quem você escolher.

- `docs/PRODUTO.md` — visão, fases, telas, privacidade
- `app/` — aplicativo (Expo / React Native, Android, iPhone e web)
- `supabase/schema.sql` — banco de dados com regras de privacidade (RLS)
- `supabase/functions/ler-laudo/` — leitura do laudo com a API do Claude

## Rodar o app (modo demonstração)

Funciona sem servidor, com pessoas e exames fictícios.

```bash
cd app
npm install
npx expo start
```

Abra o app **Expo Go** no celular e leia o QR code (celular e computador na mesma rede).

## Servidor (Supabase) — já configurado, plano gratuito

- Projeto `ampla` (região São Paulo), banco e regras de privacidade aplicados (`supabase/schema.sql`).
- As chaves públicas estão em `app/.env.producao`. Para usar: `cp app/.env.producao app/.env`.
- Login por e-mail e senha (o Supabase manda um link de confirmação).
- A leitura dos laudos é **gratuita**: o texto do PDF é lido no próprio aparelho (`app/src/lib/leitor.ts`).
  A função `ler-laudo` (API do Claude, paga) é opcional e não é usada por padrão.

## Verificações

```bash
cd app
npx tsc --noEmit     # tipos
npx eslint src       # lint
npx expo export -p web   # build web
```

## Publicar nas lojas

Use o EAS (`npx eas-cli@latest build`) — gera Android e iPhone na nuvem, sem precisar de Mac.
Antes do lançamento público: política de privacidade, termos e revisão jurídica (LGPD/Anvisa) — ver `docs/PRODUTO.md`.
