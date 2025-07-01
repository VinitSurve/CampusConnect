import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { Header } from "@/components/header"
import { MainSidebar } from "@/components/main-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <MainSidebar user={user} />
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-4 md:p-8 bg-secondary/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
