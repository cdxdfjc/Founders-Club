# Founders Club — Web

Next.js 16 (App Router) + Supabase + Tailwind.

## Setup

### 1. Variabili d'ambiente

Copia `.env.local.example` in `.env.local` e riempi con i valori del tuo progetto Supabase:

```bash
cp .env.local.example .env.local
```

Ottieni le chiavi da: **Supabase Dashboard → Project Settings → API**
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key

### 2. Database

Esegui lo schema iniziale una volta sola. Due opzioni:

**Opzione A — SQL Editor del dashboard Supabase:**
1. Apri il progetto su supabase.com
2. Vai su SQL Editor
3. Copia e incolla il contenuto di `supabase/migrations/0001_init.sql`
4. Esegui

**Opzione B — Supabase CLI:**
```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

### 3. Google OAuth (opzionale)

In Supabase Dashboard → Authentication → Providers → Google, abilita e configura client ID/secret. Imposta come redirect URL: `https://<tuo-dominio>/auth/callback` (e `http://localhost:3000/auth/callback` per dev).

### 4. Dev server

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Struttura

```
src/
  app/
    (public)/        # login, signup (fuori area autenticata)
    (app)/           # layout autenticato + 5 sezioni
      feed/          # home dashboard
      annunci/       # bacheca skill (stub)
      progetti/      # idee & progetti (stub)
      mentor/        # mentor invite-only (stub)
      risorse/       # link + post community (stub)
      eventi/        # meetup locali (stub)
      profilo/[username]/
      messaggi/      # inbox (stub)
      impostazioni/  # profilo e contatti (stub)
    auth/callback/   # OAuth callback
  lib/
    supabase/        # client, server, proxy helpers
    actions/         # server actions condivise
  components/
  proxy.ts           # auth guard per route protette
supabase/
  migrations/
    0001_init.sql    # schema DB + RLS policies
```

## Prossimi step

Le sezioni con `ComingSoon` vanno implementate una alla volta. L'ordine suggerito:
1. **Impostazioni profilo** — senza questo gli utenti non possono completare il profilo
2. **Annunci** — CRUD più semplice, validazione del modello dati
3. **Progetti** — più complesso (likes, join requests, comments)
4. **Eventi** — CRUD simile ad annunci ma con partecipazioni
5. **Risorse** — con ricerca full-text
6. **Mentor + messaggi** — più delicati (invite-only, messaggistica interna)
