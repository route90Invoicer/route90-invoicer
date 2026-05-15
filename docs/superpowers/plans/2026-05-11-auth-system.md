# Auth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, working auth system — login UI, protected dashboard layout with sidebar and topbar, and sign-out — for Route90 Invoicer.

**Architecture:** Supabase client-side `signInWithPassword` handles login; `src/middleware.js` guards all non-public routes; the dashboard layout double-checks server-side via `supabase.auth.getUser()` and renders the sidebar + topbar shell. Sign-out runs as a Next.js server action called from a `<form>` in the sidebar.

**Tech Stack:** Next.js 14 App Router (JS), `@supabase/ssr`, Tailwind CSS, `lucide-react`

---

## What Already Exists (Do Not Rebuild)

The following files are complete from Phase 0 scaffold — skip them:

- `src/lib/supabase/client.js` — `createBrowserClient` wrapper
- `src/lib/supabase/server.js` — `createServerClient` with cookie handling
- `src/lib/supabase/middleware.js` — `updateSession` with redirect logic
- `src/middleware.js` — calls `updateSession`, matcher excludes static assets

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/app/layout.js` | Modify | Route90 metadata + Apple system font |
| `src/app/globals.css` | Modify | Remove dark-mode vars; add sidebar hover class |
| `src/app/actions/auth.js` | Create | `signOut` server action |
| `src/components/Sidebar.js` | Create | Dark sidebar, nav links, user info, sign-out button |
| `src/components/TopBar.js` | Create | Page title, search input, bell, avatar |
| `src/app/(dashboard)/layout.js` | Modify | Server session guard + renders Sidebar + TopBar |
| `src/app/(auth)/login/page.js` | Modify | Full login form, error display, Supabase auth |

---

## Task 1: Root layout — metadata + Apple font

**Files:**
- Modify: `src/app/layout.js`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace `src/app/layout.js`**

```js
import "./globals.css";

export const metadata = {
  title: "Route90 Invoicer",
  description: "Invoicing for Route90 Trucking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  background-color: #F2F2F7;
  color: #1C1C1E;
}

.sidebar-link:hover {
  background-color: rgba(255, 255, 255, 0.07);
  color: white !important;
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Open http://localhost:3000 — should redirect to /login (middleware active). No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.js src/app/globals.css
git commit -m "feat: Route90 metadata, Apple system font, remove dark mode globals"
```

---

## Task 2: Sign-out server action

**Files:**
- Create: `src/app/actions/auth.js`

- [ ] **Step 1: Create `src/app/actions/auth.js`**

```js
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/auth.js
git commit -m "feat: add signOut server action"
```

---

## Task 3: Sidebar component

**Files:**
- Create: `src/components/Sidebar.js`

The sidebar is a server component. It receives `user` from the dashboard layout and calls `signOut` via a `<form action={signOut}>` — no client JS needed.

- [ ] **Step 1: Create `src/components/Sidebar.js`**

```js
import Link from 'next/link'
import { LayoutDashboard, FilePlus, Camera, Settings, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/invoices/new', label: 'New Invoice', Icon: FilePlus },
  { href: '/invoices/scan', label: 'Scan Trip Sheet', Icon: Camera },
]

export default function Sidebar({ user }) {
  const initial = user?.email?.[0]?.toUpperCase() ?? 'U'
  const emailDisplay = user?.email ?? 'User'

  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      backgroundColor: '#0D1117',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px', flexShrink: 0,
    }}>
      {/* Route90 badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: '#4F46E5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>
          R90
        </div>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Route90</span>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {mainNav.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="sidebar-link"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
            }}
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom: Settings + user + sign-out */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link
          href="/settings"
          className="sidebar-link"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 8,
            color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
            fontSize: 14, fontWeight: 500,
          }}
        >
          <Settings size={18} strokeWidth={1.75} />
          Settings
        </Link>

        <div style={{ marginTop: 12, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: '#4F46E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: 'white', fontSize: 12, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {emailDisplay}
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', padding: 4,
                display: 'flex', alignItems: 'center',
              }}
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.js
git commit -m "feat: Sidebar with nav links, user badge, and sign-out action"
```

---

## Task 4: TopBar component

**Files:**
- Create: `src/components/TopBar.js`

TopBar is a client component (owns search `useState`). It receives `title` and `userInitial` as props — both are serializable strings the server can pass safely.

- [ ] **Step 1: Create `src/components/TopBar.js`**

```js
'use client'

import { useState } from 'react'
import { Bell, Search } from 'lucide-react'

export default function TopBar({ title = 'Route90 Invoicer', userInitial = 'U' }) {
  const [query, setQuery] = useState('')

  return (
    <header style={{
      height: 60, backgroundColor: 'white',
      borderBottom: '0.5px solid rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16, flexShrink: 0,
    }}>
      <h1 style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#1C1C1E', margin: 0 }}>
        {title}
      </h1>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: '#F2F2F7', borderRadius: 10,
        padding: '7px 12px',
      }}>
        <Search size={15} strokeWidth={2} style={{ color: '#8E8E93', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            border: 'none', background: 'none', outline: 'none',
            fontSize: 14, color: '#1C1C1E', width: 180,
          }}
        />
      </div>

      {/* Notification bell */}
      <button style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 6, display: 'flex', alignItems: 'center', color: '#3C3C43',
      }}>
        <Bell size={20} strokeWidth={1.75} />
      </button>

      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        backgroundColor: '#4F46E5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 13, fontWeight: 600, flexShrink: 0, cursor: 'pointer',
      }}>
        {userInitial}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TopBar.js
git commit -m "feat: TopBar with search, notification bell, and user avatar"
```

---

## Task 5: Dashboard layout — session guard + app shell

**Files:**
- Modify: `src/app/(dashboard)/layout.js`

- [ ] **Step 1: Replace `src/app/(dashboard)/layout.js`**

```js
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userInitial = user.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F2F2F7' }}>
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar userInitial={userInitial} />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify layout renders**

`npm run dev` → open http://localhost:3000/dashboard → should redirect to /login. No errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/layout.js
git commit -m "feat: dashboard layout with server session guard and Sidebar + TopBar shell"
```

---

## Task 6: Login page — full UI + Supabase auth

**Files:**
- Modify: `src/app/(auth)/login/page.js`

- [ ] **Step 1: Replace `src/app/(auth)/login/page.js`**

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F2F2F7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: 14,
        border: '0.5px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        padding: '40px 36px', width: '100%', maxWidth: 400,
      }}>
        {/* Route90 badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: '#4F46E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 18,
            marginBottom: 12,
          }}>
            R90
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>
            Route90 Invoicer
          </h1>
          <p style={{ fontSize: 14, color: '#8E8E93', margin: '6px 0 0' }}>
            Sign in to your account
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#FFF0F0', border: '1px solid #FFCDD2',
            borderRadius: 8, padding: '10px 14px',
            color: '#D32F2F', fontSize: 14, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 13, fontWeight: 500,
              color: '#3C3C43', marginBottom: 6,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@route90.ca"
              style={{
                width: '100%', padding: '11px 14px', fontSize: 15,
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
                outline: 'none', boxSizing: 'border-box',
                color: '#1C1C1E', backgroundColor: 'white',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 13, fontWeight: 500,
              color: '#3C3C43', marginBottom: 6,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%', padding: '11px 14px', fontSize: 15,
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
                outline: 'none', boxSizing: 'border-box',
                color: '#1C1C1E', backgroundColor: 'white',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              backgroundColor: loading ? '#A5B4FC' : '#4F46E5',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '13px', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              width: '100%',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: End-to-end verification**

Run `npm run dev`. Test each flow:

1. http://localhost:3000 → redirects to /login ✓
2. http://localhost:3000/dashboard (no session) → redirects to /login ✓
3. Submit wrong password → red error banner appears below badge ✓
4. Submit correct credentials (user created in Supabase dashboard) → redirects to /dashboard ✓
5. Dashboard shows dark sidebar on left, white topbar on top, #F2F2F7 main area ✓
6. Sidebar shows R90 badge, three nav links, Settings at bottom, user email + LogOut icon ✓
7. TopBar shows "Route90 Invoicer" title, search box, bell, indigo avatar with user initial ✓
8. Click LogOut icon → redirects to /login ✓
9. http://localhost:3000/dashboard after logout → redirects to /login ✓

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/login/page.js
git commit -m "feat: login page with Supabase auth, error display, Route90 badge design"
```

---

## Done

All 6 tasks complete. Auth system is fully working:
- Login page at `/login` with Apple card design
- Middleware protects all dashboard routes
- Dashboard layout double-checks server-side, renders sidebar + topbar
- Sign-out via server action clears session and redirects to `/login`
