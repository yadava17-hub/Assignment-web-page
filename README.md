# Fleet Catalog — Equipment Management System

> Construction equipment inventory management for office admins at contracting companies. Track owned and rented fleet, maintenance logs, lease expiry alerts, and billing rates.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · localStorage

---

## Quick start

```bash
npm install
npm run dev
```

Opens at **http://localhost:3000** — no database, no environment variables, no other setup.

---

## How this was built — AI-assisted workflow

This project was built using a deliberate multi-tool AI workflow where each tool handled what it's actually good at. The research, domain understanding, and all final decisions were mine. The AI tools were used to accelerate execution, not replace judgement.

### Phase 1 — Understanding the domain (NotebookLM)

Before writing a single line of code, I used **Google NotebookLM** to go deep on the problem space. I uploaded:
- The assignment PDF
- Construction industry equipment management articles
- A sample contractor equipment list I found publicly

I then used NotebookLM's Q&A to stress-test my assumptions:

> *"What fields does a construction office admin actually care about when looking up a piece of equipment quickly?"*

> *"What's the difference between how a company treats owned vs rented equipment administratively?"*

> *"What are the most common reasons an equipment item would be unavailable?"*

This surfaced things I wouldn't have thought of from the spec alone — like the fact that rented equipment needs lease expiry tracking (different workflow entirely from owned), that contractors use location-based nicknames rather than model names, and that the status "Out for Repair" is genuinely different from "Retired" in how it affects billing and availability.

**Output from this phase:** A clear picture of the real user (office admin, not a technician), the four equipment states that matter (Available / In Use / Out for Repair / Retired), and the decision to include lease expiry as a first-class field rather than burying it in notes.

---

### Phase 2 — Equipment research and pricing (manual + Perplexity)

The seed data needed to be realistic — generic placeholder data would undermine the whole point. I researched actual equipment specs and market rates myself, then used **Perplexity AI** to help cross-reference and verify data across sources quickly.

**My research process:**

1. Identified the 7 equipment categories that make sense for a mid-size commercial contractor
2. Picked real models for each: Cat 320 (excavator), Genie GS-3232 (scissor lift), Honda EU7000iS (generator), Atlas Copco XAS 185 (compressor), Hilti DD 200-W (core drill), 2022 Ford F-350 (site truck), International HX615 (dump truck)
3. Pulled specs from manufacturer pages, auction results, and dealer listings

**Perplexity prompts I used for cross-referencing:**

> *"What is the current used market value range for a 2019–2022 Caterpillar 320 excavator in good condition?"*

> *"What hourly and daily rental rates does a contractor typically charge clients for a Genie GS-3232 scissor lift — not what they pay to rent it, what they bill out?"*

> *"Atlas Copco XAS 185 specifications: CFM, PSI, weight, fuel consumption — verify against official spec sheet"*

**Sources consulted directly (not via AI):**
- `lectura-specs.com` — cross-verified equipment dimensions and weights
- `MachineryTrader.com` and `rbauction.com` — live auction results for replacement costs
- `DOZR.com` and `BigRentz.com` — rental rate benchmarks
- `powerequipment.honda.com`, `atlascopco.com`, `boschtools.com` — official manufacturer specs
- NY OGS state contract rate schedule — government benchmark for heavy equipment rental

All 14 seed items have real specs, real market values, and defensible billing rates. A separate [source reference document](./fleet-catalog-source-references.pdf) records exactly where each data point came from.

---

### Phase 3 — Architecture and component design (Claude)

With domain understanding and data in hand, I used **Claude** to think through the architecture before coding.

**Prompts I used for planning:**

> *"I'm building a Next.js + TypeScript equipment catalog. The user is an office admin. What fields should the Equipment type have, and how should I structure state — one central hook or distributed? Walk me through the tradeoffs."*

> *"For this equipment catalog, what are the edge cases I need to handle that most developers would miss on first pass?"*

> *"I want an undo system that works across all mutations — add, edit, delete, bulk operations, inline edits. What's the cleanest way to implement this in React without Redux?"*

This produced the core architectural decisions:
- Single `useEquipment` hook as the state owner — components get the store as a prop, no context needed
- `lib/storage.ts` as the only place touching localStorage — four functions, easy to swap
- Snapshot-based undo (store `{ equipment, logs }` before every mutation, 8-second window)
- `visible` (filtered+sorted) vs `paged` (sliced for current page) as separate derived values

---

### Phase 4 — Implementation (Claude + GitHub Copilot)

The actual coding split across two tools depending on the task:

**Claude** handled anything requiring reasoning about the whole system:
- The `useEquipment` hook (all mutations, undo, pagination, bulk ops)
- `DetailPanel.tsx` — inline editing of 7 different field types in one component
- The confirm dialog flow (delete-in-use blocking, bulk delete with In Use skipping)
- Lease expiry alert logic and urgency tiers

**GitHub Copilot** handled repetitive, mechanical code:
- Boilerplate form field markup in `EquipmentForm.tsx`
- Tailwind class repetition across badge variants
- The CSV export row-mapping logic
- TypeScript interface completion

**Prompts that produced the best results with Claude:**

> *"Build a `useEquipment` hook that owns all equipment state. It needs: filter+sort+paginate (derived, not stored), snapshot-based undo with 8s timeout, bulk operations that skip In Use items, and localStorage persistence that only runs client-side."*

> *"Build the detail panel component. It should have inline editing for status (dropdown), category (dropdown), ownership (dropdown), lease expiry (date picker with clear button), rates (click-to-edit number inputs, save all three together), and notes (textarea). Each field independently shows/hides its edit UI."*

> *"The table needs to use `paged` (the current page slice) for rendering rows, but `visible` (all filtered results) for the empty state check and total count. Fix the select-all checkbox to only select rows on the current page."*

---

## Project structure

```
├── app/
│   ├── layout.tsx                Root layout
│   └── page.tsx                  Main page — orchestrates all components
├── types/
│   └── equipment.ts              All TypeScript interfaces, enums, status metadata
├── lib/
│   ├── seed.ts                   14 real equipment items with researched specs
│   ├── storage.ts                localStorage abstraction (4 functions, easy to swap)
│   ├── utils.ts                  filter, sort, format, lease math, CSV export
│   └── cn.ts                     className merge utility
├── hooks/
│   └── useEquipment.ts           Central state — all mutations, undo, pagination
└── components/
    ├── ui/
    │   ├── Badge.tsx              StatusBadge, CategoryBadge, OwnershipBadge
    │   ├── Modal.tsx              Reusable modal wrapper
    │   └── ConfirmDialog.tsx      Confirm/cancel dialog
    └── equipment/
        ├── StatsBar.tsx           5-card fleet summary
        ├── Toolbar.tsx            Live search + 3 composable filters + CSV export
        ├── EquipmentTable.tsx     Sortable table, row actions, right-click context menu
        ├── TableFooter.tsx        Page size picker (5/10/25/50) + pagination controls
        ├── DetailPanel.tsx        Slide-in panel with inline editing + maintenance log
        ├── EquipmentForm.tsx      Add/Edit modal form with photo upload
        ├── BulkBar.tsx            Multi-select bulk actions including Delete All
        ├── Banners.tsx            Lease expiry alerts + undo banner
        └── SuggestionsCard.tsx    Dismissible feature roadmap panel
```

---

## Tech stack decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Assignment preference; file-based routing, TypeScript first-class |
| Language | TypeScript (strict) | Full type safety — zero `any`, zero type errors at build |
| Styling | Tailwind CSS v4 | Utility-first; no design system overhead at this scope |
| State | React hooks + localStorage | Right-sized for scope; storage layer abstracted for easy swap |
| Icons | lucide-react | Lightweight, tree-shakeable SVG icons |

---

## Features

### Core requirements (all 7)

| # | Feature | Implementation |
|---|---|---|
| 1 | **Add** | Modal form — 12 fields with per-field validation, duplicate asset # blocked |
| 2 | **View** | Sticky-header table, 10 sortable columns, paginated (5 / 10 / 25 / 50 per page) |
| 3 | **Search** | Live search across name, asset #, serial # simultaneously |
| 4 | **Filter** | Type + Status + Ownership — all three compose as AND logic |
| 5 | **Sort** | Any column header, toggle asc/desc, active column indicated with arrow |
| 6 | **Edit** | Full edit modal + inline editing of every field in the detail panel |
| 7 | **Delete/Retire** | Delete blocked if In Use (with explanation). Retire = soft delete. |

### Stretch goals (both completed)

**Detail panel** — click any row name to open a 360px sidebar with photo upload, all fields editable inline, TCO summary, and maintenance log.

**Maintenance log** — date + cost + notes per entry, running total, maintenance-to-replacement ratio with progress bar, billing-day breakeven.

### Beyond the spec

| Feature | Reasoning |
|---|---|
| Undo (8s, ⌘Z) | Office admins misclick — every mutation is reversible |
| Lease expiry alerts | Rented equipment has a fundamentally different workflow; approaching expiry needs to be impossible to miss |
| Bulk actions | Realistic fleet sizes make one-at-a-time operations painful |
| Right-click context menu | Quick status change is the most common action — 3 clicks → 1 |
| Pagination (5/10/25/50) | Catalog grows over time; all-at-once doesn't scale |
| Delete All | Useful for resetting between projects or clearing test data |
| CSV export | Exports the current filtered view — "show me Available Excavators" → export |
| Keyboard shortcuts | `/` search, `N` add, `Esc` close, `⌘Z` undo |

---

## Field choices

| Field | Why it earns its place |
|---|---|
| **Name** | Free-form — contractors use location nicknames ("Main Street Excavator"), not model names |
| **Asset number** | The internal tracking ID. Unique-enforced. What staff actually search by |
| **Serial number** | Manufacturer S/N — required for warranty claims, insurance, DOT inspections |
| **Category** | 7 real types: Excavator, Scissor Lift, Generator, Compressor, Drill, Truck, Other |
| **Ownership** | Owned vs Rented drives entirely different workflows — rented needs lease tracking |
| **Status** | Four real states an asset moves through: Available / In Use / Out for Repair / Retired |
| **Hourly + Daily rates** | Both matter — short jobs bill hourly, multi-day deployments bill daily |
| **Replacement cost** | Insurance valuation. Also the denominator in TCO: "is it worth repairing?" |
| **Lease expiry** | Only visible for Rented items. Fires urgency alerts at 30d / 7d / overdue |
| **Photo** | Confirms the admin is looking at the right machine — matters when names are ambiguous |
| **Notes** | CDL requirements, storage location, certification notes, project assignment |
| **Maintenance log** | Service history with costs — feeds the TCO analysis |

---

## Edge cases

- Duplicate asset numbers blocked at save with a field-level error naming the conflict
- Deleting an "In Use" item shows a blocking modal explaining why and suggesting Archive
- Long text truncated with ellipsis in table; full text visible in detail panel
- Zero results from filters shows an explicit empty state (not a blank table)
- Retired items are visually dimmed; Archive button disabled in detail panel
- Lease overdue shown in red; sorted to top when sorting by lease column
- In Use items are silently skipped in bulk delete; count shown in confirm dialog
- Photos over 2 MB blocked client-side before upload

---

## Data persistence

Two `localStorage` keys: `fc_eq_v1` (equipment array) and `fc_log_v1` (maintenance logs).

`lib/storage.ts` is the only module that touches storage — four functions (`loadEquipment`, `saveEquipment`, `loadLogs`, `saveLogs`). Swapping to a REST API or database means editing exactly those four functions and nothing else.

---

## What I'd build next

1. **Postgres + Prisma + Next.js API routes** — multi-user support, server-side search, proper relations
2. **Auth with roles** — admin (full CRUD) vs viewer (read-only) for field crew
3. **Project/employee assignment** — link equipment to jobs, track utilization %
4. **Scheduled service reminders** — alert when a service interval is due based on date or hours
5. **DOT / inspection expiry tracking** — same alert system as lease expiry, for compliance dates
6. **QR codes per asset** — scan on-site to open the detail panel on a phone
7. **Audit log** — full history of who changed what and when, per item
8. **PDF export** — per-asset maintenance report formatted for insurance or resale
9. **Offline-first PWA** — service worker so field staff can look up equipment without signal
