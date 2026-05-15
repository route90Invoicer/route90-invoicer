'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

export default function DashboardShell({ user, userInitial, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [drawerOpen])

  return (
    <div className="flex min-h-screen bg-[#F2F2F7]">
      <Sidebar
        user={user}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userInitial={userInitial}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
