"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, Search, LayoutDashboard, Settings, HelpCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/searches", label: "SEARCHES", icon: Search },
  { href: "/matches", label: "MATCHES", icon: CheckCircle2 },
  { href: "/settings", label: "SETTINGS", icon: Settings },
  { href: "/help", label: "HELP", icon: HelpCircle },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3 transition-all">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-foreground transition-all group-hover:border-accent group-hover:bg-accent">
            <span className="font-mono text-lg font-bold text-background transition-all">A</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground">ALPHASCRAPE</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">RESALE SEARCH AGENT</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 border-l-2 border-foreground px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Trigger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" className="border-2 border-foreground bg-transparent hover:border-accent hover:bg-accent hover:text-accent-foreground" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 border-r-2 border-foreground bg-background p-0">
            <SheetHeader className="border-b-2 border-foreground px-6 py-6">
              <SheetTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-foreground">
                  <span className="font-mono text-lg font-bold text-background">A</span>
                </div>
                <div>
                  <span className="block font-mono text-sm font-bold uppercase tracking-[0.15em] text-foreground">ALPHASCRAPE</span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">RESALE SEARCH AGENT</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 border-b-2 border-foreground px-6 py-5 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-150",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t-2 border-foreground p-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                STATUS: ONLINE<br />
                VERSION: 1.0.0
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
