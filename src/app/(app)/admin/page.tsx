import { getClubs, getEventProposals } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminClientPage from "./client-page"

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (user?.role !== 'faculty') {
    redirect('/dashboard')
  }

  const initialProposals = await getEventProposals()
  const initialClubs = await getClubs()

  return <AdminClientPage initialProposals={initialProposals} initialClubs={initialClubs} />
}
