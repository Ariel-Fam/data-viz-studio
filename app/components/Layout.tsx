'use client';

import { useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3, Database, Import, LayoutDashboard, Moon, Sun,
  Menu, X, Plus, ChevronRight, PenSquare, Network, FlaskConical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useAppStore } from '../store/AppContext';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/import', label: 'Import Data', icon: Import },
  { to: '/whiteboard', label: 'Whiteboard', icon: PenSquare },
  { to: '/mind-map', label: 'Mind Map', icon: Network },
  { to: '/data-science', label: 'Data Science', icon: FlaskConical },
];

export function Layout({ children }: LayoutProps) {
  const { datasets, charts, theme, toggleTheme } = useAppStore();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex flex-col border-r border-border bg-card overflow-hidden shrink-0 z-30"
            >
              {/* Logo */}
              <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border min-w-[200px]">
                <div className="size-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Image
                    src="/space_pointer.png"
                    alt="DataViz Studio"
                    width={70}
                    height={70}
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-none">DataViz Studio</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Analytics Platform</div>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-0.5 p-2 min-w-[200px]">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        pathname === item.to || (!item.exact && pathname.startsWith(item.to))
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Datasets */}
              <div className="flex-1 overflow-y-auto min-w-[200px]">
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Datasets
                    </span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{datasets.length}</Badge>
                  </div>
                </div>

                <div className="px-2 pb-2 space-y-0.5">
                  {datasets.slice(0, 10).map(ds => (
                    <button
                      key={ds.id}
                      onClick={() => router.push(`/dataset/${ds.id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left group"
                    >
                      <Database className="size-3.5 shrink-0" />
                      <span className="truncate flex-1">{ds.name}</span>
                      <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}

                  {datasets.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground italic">
                      No datasets yet
                    </div>
                  )}

                  <button
                    onClick={() => router.push('/import')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border border-dashed border-border mt-1"
                  >
                    <Plus className="size-3.5" />
                    <span>Add dataset</span>
                  </button>
                </div>

                {/* Charts section */}
                {charts.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Charts
                        </span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">{charts.length}</Badge>
                      </div>
                    </div>
                    <div className="px-2 pb-2 space-y-0.5">
                      {charts.slice(0, 6).map(chart => (
                        <button
                          key={chart.id}
                          onClick={() => router.push(`/charts/${chart.id}`)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left group"
                        >
                          <BarChart3 className="size-3.5 shrink-0" />
                          <span className="truncate flex-1">{chart.title}</span>
                          <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border p-2 min-w-[200px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleTheme}>
                      {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                      <span className="text-sm">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle theme</TooltipContent>
                </Tooltip>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-12 border-b border-border flex items-center gap-2 px-3 bg-card shrink-0 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>

            {/* Breadcrumb / title area - children can override this */}
            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push('/import')}
            >
              <Plus className="size-3.5" />
              New Dataset
            </Button>

            {!isSignedIn && (
              <div className="hidden items-center gap-2 md:flex">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign up</Button>
                </SignUpButton>
              </div>
            )}

            {isSignedIn && (
              <div className="flex items-center">
                <UserButton />
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}