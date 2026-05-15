# Graph Report - Route90-Invoicer  (2026-05-11)

## Corpus Check
- 52 files · ~19,290 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 191 nodes · 182 edges · 21 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eaff4a90`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `Dashboard Layout (Server Guard)` - 12 edges
2. `g()` - 5 edges
3. `getNthColumn()` - 5 edges
4. `enableUI()` - 5 edges
5. `Supabase Middleware updateSession` - 5 edges
6. `Login Page` - 5 edges
7. `Sidebar Component` - 5 edges
8. `makeCurrent()` - 4 edges
9. `Q()` - 4 edges
10. `D()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `generateInvoicePDF (stub)` --semantically_similar_to--> `Invoice HTML Template`  [INFERRED] [semantically similar]
  src/utils/pdfTemplate.js → invoice-template.html
- `Server Action Sign-Out Pattern` --rationale_for--> `Sidebar Component`  [INFERRED]
  docs/superpowers/plans/2026-05-11-auth-system.md → src/components/Sidebar.js
- `Server Action Sign-Out Pattern` --rationale_for--> `signOut Server Action`  [INFERRED]
  docs/superpowers/plans/2026-05-11-auth-system.md → src/app/actions/auth.js
- `Anthropic API Server-Only Rule` --rationale_for--> `Anthropic Client Singleton`  [INFERRED]
  CLAUDE.md → src/lib/anthropic.js
- `Supabase SSR Client Split (browser vs server)` --rationale_for--> `Supabase Browser Client Factory`  [INFERRED]
  CLAUDE.md → src/lib/supabase/client.js

## Hyperedges (group relationships)
- **Dual-Layer Auth Guard (Middleware + Layout Server Check)** — middleware, supabase_middleware, dashboard_layout [INFERRED 0.95]
- **Dashboard Shell (Layout + Sidebar + TopBar)** — dashboard_layout, sidebar_component, topbar_component [EXTRACTED 1.00]
- **Invoice CRUD Page Group (New, Scan, Detail, Edit)** — invoices_new_page, invoices_scan_page, invoice_detail_page, invoice_edit_page [INFERRED 0.85]
- **Auth Flow: Middleware + Server Client + signOut Action** — supabase_middleware, supabase_server_client, auth_signout [INFERRED 0.95]
- **Invoice Calculation Pipeline** — invoicemath_calculatelinetotal, invoicemath_calculatesubtotal, invoicemath_calculatetotal [EXTRACTED 1.00]
- **Dashboard Shell: Sidebar + TopBar + signOut** — sidebar_component, topbar_component, auth_signout [INFERRED 0.90]

## Communities (56 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (18): Root App Layout, Login Page, Signup Page (stub), Apple-Style Design System (Indigo #4F46E5, SF Pro), Authentication Guard Pattern, Next.js Route Groups (auth/dashboard), Supabase Session Management, Dashboard Layout (Server Guard) (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (12): Anthropic Client Singleton, signOut Server Action, Auth System Implementation Plan, Route90 Invoicer Project Memory (CLAUDE.md), Anthropic API Server-Only Rule, Server Action Sign-Out Pattern, Supabase SSR Client Split (browser vs server), Sidebar Component (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (8): calculateBillingPeriod(), calculateGST(), calculateSubtotal(), calculateTotal(), calculateTripAmount(), formatCAD(), generateNextInvoiceNumber(), isInvalidNumber()

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (4): Next.js Middleware (Auth Guard), config, middleware(), updateSession()

### Community 7 - "Community 7"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (3): GST Rate 5%, calculateGST, calculateTotal

## Knowledge Gaps
- **25 isolated node(s):** `nextConfig`, `config`, `config`, `metadata`, `mainNav` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dashboard Layout (Server Guard)` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Supabase Middleware updateSession` connect `Community 3` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `Dashboard Layout (Server Guard)` (e.g. with `Next.js Route Groups (auth/dashboard)` and `Dashboard Page (stub)`) actually correct?**
  _`Dashboard Layout (Server Guard)` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Supabase Middleware updateSession` (e.g. with `Supabase Session Management` and `Supabase Browser Client Factory`) actually correct?**
  _`Supabase Middleware updateSession` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `config`, `config` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._