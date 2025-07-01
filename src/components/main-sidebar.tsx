"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FilePlus2,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "./ui/separator"
import { Icons } from "./icons"
import type { User } from "@/types"

const allNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ['student', 'organiser', 'faculty'] },
  { href: "/clubs", icon: Users, label: "Clubs & Groups", roles: ['student', 'organiser', 'faculty'] },
  { href: "/events/propose", icon: FilePlus2, label: "Propose Event", roles: ['student', 'organiser'] },
  { href: "/admin", icon: Shield, label: "Faculty Admin", roles: ['faculty'] },
]

export function MainSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  const navItems = allNavItems.filter(item => item.roles.includes(user.role))

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path)
  }

  return (
    <Sidebar side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <Icons.logo className="w-7 h-7 text-primary" />
          <span className="text-primary group-data-[collapsible=icon]:hidden">
            Campus
          </span>
          <span className="group-data-[collapsible=icon]:hidden">Connect</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={{ children: item.label }}
                className={cn(
                  isActive(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="mb-2" />
        <p className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          © 2024 CampusConnect
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
