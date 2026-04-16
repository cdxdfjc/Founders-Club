# Founders Club — Brief di progetto

> Nome ufficiale: **Founders Club** · Dominio: **foundersclub.it**

Documento di handoff per riprendere il progetto in una nuova conversazione.
Aggiornato: 2026-04-16

---

## Visione

Piattaforma web social per la community startup italiana. Luogo dove founder, aspiranti founder e persone con skill specifiche possono: chiedere aiuto, pubblicare idee/progetti, trovare mentor, condividere risorse ed esperienze, organizzare meetup fisici, e chiacchierare al "bar".

**Leva di lancio:** Dock Startup Lab — molti dei membri fondatori vengono da lì. Il sito integra visibilità per Dock (sezione landing, badge profilo, credit footer) in ottica partnership.

**Target:** Community italiana. Solo lingua italiana.

---

## Stack tecnico

- **Frontend:** Next.js 16 (App Router) + React + TypeScript + Tailwind CSS v4
- **Backend/DB:** Supabase (Postgres + Auth + Storage + Row Level Security)
- **Deploy:** Vercel (frontend) + Supabase cloud (backend)
- **Auth:** Supabase Auth — email/password
- **Font:** Bricolage Grotesque (display), Plus Jakarta Sans (body), JetBrains Mono (mono)
- **Estetica:** Glassmorphism, gradient pastello (sky-aqua, wisteria, plum, petal), card arrotondate, animazioni rise/float

---

## Le 7 sezioni

### 1. Feed (`/feed`)
Dashboard home. Saluto personalizzato, griglia di accesso rapido a tutte le sezioni, banner completamento profilo.

### 2. Progetti (`/progetti`)
Idee e progetti pubblicati dalla community. CRUD completo con:
- Categorie e stage (idea, MVP, crescita, ecc.)
- Like, commenti, join request
- Inviti al team (owner/membro possono invitare altri)
- Filtri per categoria e stage + ricerca testuale

### 3. Aiuto (`/aiuto`)
Richieste di aiuto alla community. Categorie (tech, marketing, legal, ecc.), urgenza, stato aperta/risolta. Risposte in thread.

### 4. Mentor (`/mentor`)
Founder esperti. Invite-only, sezione coming soon.

### 5. Risorse (`/risorse`)
Tool, link, esperienze condivise. Link esterni con preview (immagine, site_name) + post testuali. Categorie + ricerca.

### 6. Meetup (`/eventi`)
Incontri fisici tra founder. Evento con città, luogo, data/ora, max partecipanti. Join/leave. Filtro per città.

### 7. Bar (`/bar`)
Forum informale. Thread con risposte. Ordinamento per ultima attività.

---

## Profilo utente (`/profilo/[username]`)

- Nome, bio, foto (avatar iniziale gradient), città, età, professione
- Startup/progetti fatti o in corso (con status, anno, note revenue)
- Contatti esterni (email, Telegram, LinkedIn, X, Instagram, sito)
- Badge: **Mentor** (invite-only), **Dock Alumni** (self-service toggle)

---

## Messaggistica (`/messaggi`)

Inbox con inviti ai progetti (accetta/rifiuta). Messaggi privati: placeholder, non ancora implementati.

---

## Integrazione Dock Startup Lab

- **Landing page:** sezione dedicata "Nata dall'ecosistema Dock Startup Lab" con logo e testo
- **Landing page hero:** "Popolata da [logo Dock]"
- **Badge profilo:** "Dock Alumni" attivabile dalle impostazioni (campo `is_dock_alumni`)
- **Footer app:** "Nata in [logo Dock]" fisso

---

## Struttura file

```
src/
  app/
    layout.tsx              → root layout (font, metadata, favicon)
    page.tsx                → landing page pubblica
    globals.css             → variabili, glass, card, bottoni, animazioni
    icon.png                → favicon 32x32
    favicon.ico             → favicon classico (in public/)
    (public)/
      login/page.tsx        → login
      signup/page.tsx        → registrazione
    (app)/
      layout.tsx            → layout autenticato (header, footer, bottom nav)
      feed/page.tsx
      progetti/page.tsx, [id]/page.tsx, nuovo/page.tsx
      aiuto/page.tsx, [id]/page.tsx, nuovo/page.tsx
      mentor/page.tsx
      risorse/page.tsx, [id]/page.tsx, nuovo/page.tsx
      eventi/page.tsx, [id]/page.tsx, nuovo/page.tsx
      bar/page.tsx, [id]/page.tsx, nuovo/page.tsx
      community/page.tsx
      profilo/[username]/page.tsx
      messaggi/page.tsx
      impostazioni/page.tsx
  components/
    Logo.tsx, ComingSoon.tsx, BackToFeed.tsx
    HeaderUserMenu.tsx      → menu profilo dropdown (portal)
    MobileBottomNav.tsx     → bottom nav mobile (Home, Progetti, Aiuto, Meetup, Bar)
    ProfileCompletionBanner.tsx
    ProfileForm.tsx, ContactsForm.tsx
    ProjectCard.tsx, NewUserProjectForm.tsx
    InviteTeamBox.tsx, SubmitButton.tsx, DeleteButton.tsx
    DeleteAccountButton.tsx
    DockAlumniToggle.tsx    → toggle Dock Alumni nelle impostazioni
  lib/
    supabase/server.ts, client.ts
    actions/auth.ts, profile.ts, projects.ts, invites.ts, help.ts, bar.ts, events.ts, resources.ts
    projects.ts, help.ts, resources.ts  → costanti e helper
public/
    unicorn-v2.png          → mascotte unicorno
    dock-logo.png           → logo Dock Startup Lab
    favicon.ico             → favicon 16+32px
supabase/
    migrations/0001-0011    → schema DB completo
```

---

## Ottimizzazione mobile (implementata)

- **Header compatto:** padding ridotto, nav items più stretti, inbox sempre visibile
- **Bottom navigation:** barra fissa con 5 sezioni principali (solo mobile)
- **Titoli responsivi:** `text-3xl` su mobile vs `text-5xl`/`text-6xl` su desktop
- **Card:** `border-radius: 20px` su mobile (28px desktop), padding `p-4` (vs `p-6`)
- **Bottoni:** padding e font ridotti su mobile
- **Feed grid:** 2 colonne su mobile
- **Landing page:** hero, features, manifesto tutti ottimizzati per schermi piccoli
- **Body padding-bottom:** 72px su mobile per la bottom nav

---

## Migrazioni DB pendenti

```sql
-- 0011_dock_alumni.sql (eseguire dal SQL Editor di Supabase)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_dock_alumni boolean NOT NULL DEFAULT false;
```

---

## Come usare questo documento

Apri una nuova conversazione con Claude Code nella cartella del progetto e dì:

> "Leggi BRIEF.md per capire il contesto del progetto, poi continuiamo da [dove vuoi ripartire]."

Le decisioni qui dentro sono già state approvate.
