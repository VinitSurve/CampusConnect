import { Header } from "@/components/header"
import { MainSidebar } from "@/components/main-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <MainSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-8 bg-secondary/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
