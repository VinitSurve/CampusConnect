import { mockClubs, mockEventProposals } from "@/lib/mock-data"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminClientPage from "./client-page"

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (user?.role !== 'faculty') {
    redirect('/dashboard')
  }

  return <AdminClientPage initialProposals={mockEventProposals} initialClubs={mockClubs} />
}
