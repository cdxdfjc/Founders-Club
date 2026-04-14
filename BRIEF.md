# Founders Club — Brief di progetto

> Nome ufficiale: **Founders Club** · Dominio: **foundersclub.it**

Documento di handoff per riprendere il progetto in una nuova conversazione.
Data: 2026-04-13

---

## Visione

Piattaforma web social per la community startup italiana. Luogo dove founder, aspiranti founder e persone con skill specifiche possono: chiedere aiuto, pubblicare idee/progetti, trovare mentor, condividere risorse ed esperienze, organizzare meetup fisici.

**Leva di lancio:** Startup Lab (già disponibile all'utente) verrà usato per popolare velocemente la piattaforma con utenti reali e mentor di qualità.

**Target:** Community italiana. Solo lingua italiana all'MVP.

---

## Stack tecnico

- **Frontend:** Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (Postgres + Auth + Storage + Row Level Security)
- **Deploy:** Vercel (frontend) + Supabase cloud (backend)
- **Auth:** Supabase Auth — email/password + Google OAuth

---

## Le 5 sezioni principali

### 1. Annunci / Richieste di aiuto
Bacheca con **richieste + offerte** di skill.
- Tipo annuncio: "cerco" oppure "offro"
- Tag skill (React, Marketing, Legal, Design, ecc.) + filtri per categoria
- Ricerca full-text

### 2. Idee & Progetti
Gli utenti pubblicano le proprie idee/progetti. Gli altri possono:
- **Like / follow** — interesse leggero, ricevono aggiornamenti
- **Join request** — chiedono di entrare nel team, il fondatore approva/rifiuta, chi entra appare come team member
- **Commenti** — discussione pubblica sotto il progetto

### 3. Mentor
Founder esperti con cui si può avere una conversazione.
- **Invite-only**: solo utenti esplicitamente invitati possono diventare mentor. Nessuna auto-candidatura.
- La conversazione parte dalla messaggistica interna semplice (vedi sezione Messaggistica).

### 4. Risorse condivise
Tool, risorse, esperienze con funzione di ricerca.
- **Link esterni** (titolo, descrizione, tag, categoria)
- **Post testuali lunghi** scritti dai membri (es. "la mia esperienza con il pricing")
- Niente upload file, niente wiki collaborativa

### 5. Meetup locali
Incontri fisici tra founder (caffè, birra, ecc.).
- **Eventi pubblici**: un utente crea evento ("Caffè martedì 18:00 a Milano, Bar X"), altri cliccano "partecipo"
- Niente matchmaking geografico automatico, niente richieste 1-a-1 private

---

## Profilo utente

Ogni utente ha un profilo pubblico che contiene:
- Bio, foto, città
- **Startup / progetti** fatti o in corso
- **Guadagni** — campo libero opzionale (l'utente scrive quello che vuole: "10k MRR", "bootstrap", "pre-revenue", ecc.). Massima flessibilità, niente range o campi strutturati.
- **Contatti esterni** (email, Telegram, LinkedIn, X/Twitter, sito) — visibili sul profilo per contatto fuori piattaforma

---

## Messaggistica

**Modello ibrido:**
- **Contatti esterni** sul profilo (principale canale di contatto per la maggior parte dei casi)
- **Messaggi interni semplici** stile email (inbox, niente realtime, niente chat live) **solo per**:
  - Conversazioni con i mentor
  - Join requests sui progetti

Niente chat realtime, niente thread complessi, niente notifiche push all'MVP.

---

## Architettura applicazione (alto livello)

```
app/
  (public)/          → landing, login, signup
  (app)/             → area autenticata
    feed/            → dashboard home
    annunci/         → bacheca richieste/offerte skill
    progetti/        → idee e progetti
    mentor/          → lista mentor (invite-only)
    risorse/         → link + post community
    eventi/          → meetup locali
    profilo/[id]/    → profilo pubblico utente
    messaggi/        → inbox messaggi semplici
    impostazioni/    → profilo privato, contatti esterni
```

**Principi:**
- Ogni sezione è un modulo isolato (pagine, componenti, query DB separate)
- Row Level Security su Supabase per ogni tabella (sicurezza lato DB, non solo UI)
- Server Components di default, Client Components solo dove serve interattività

---

## Decisioni esplicite di scope (cosa NON facciamo all'MVP)

- Niente chat realtime
- Niente upload file nelle risorse
- Niente wiki collaborativa
- Niente matchmaking geografico automatico per meetup
- Niente auto-candidatura come mentor
- Niente campi guadagni strutturati/range
- Niente internazionalizzazione (solo italiano)
- Niente notifiche push / mobile app

---

## Stato attuale del progetto

- **Cartella progetto:** `/Users/federico/Desktop/startup community/`
- **App scaffolding:** `web/` contiene il progetto Next.js 16 (App Router, TypeScript, Tailwind) con build pulita.
- **Fatto:**
  - Scaffold Next.js + Supabase clients (`@supabase/ssr`)
  - Proxy auth guard (`src/proxy.ts`) che protegge tutte le route `(app)/`
  - Schema DB completo + RLS policies in `web/supabase/migrations/0001_init.sql`
  - Landing page pubblica
  - Login + Signup con Server Actions (email/password)
  - OAuth callback route (`/auth/callback`)
  - Layout area autenticata con navbar e navigazione alle 5 sezioni
  - Stub pagine: feed, annunci, progetti, mentor, risorse, eventi, messaggi, impostazioni
  - Pagina profilo pubblica `/profilo/[username]` che legge da `profiles` + `user_projects`
- **Da fare (in ordine suggerito):**
  1. Impostazioni profilo (edit profilo + contatti + user_projects)
  2. Annunci — CRUD completo con tag/filtri
  3. Progetti — CRUD + likes + join requests + commenti
  4. Eventi — CRUD + partecipazioni
  5. Risorse — CRUD + ricerca full-text
  6. Mentor + messaggistica interna
- **Setup necessario prima di far girare l'app:**
  1. Creare progetto su supabase.com
  2. Mettere URL + anon key in `web/.env.local`
  3. Eseguire `web/supabase/migrations/0001_init.sql` nel SQL Editor di Supabase
  4. `cd web && npm run dev`

---

## Come usare questo documento in una nuova chat

Apri una nuova conversazione con Claude Code nella cartella del progetto e dì:

> "Leggi BRIEF.md per capire il contesto del progetto, poi continuiamo da [dove vuoi ripartire]."

Le decisioni qui dentro sono già state approvate: non serve rifare brainstorming sulle scelte elencate, a meno che tu non voglia cambiarle esplicitamente.
