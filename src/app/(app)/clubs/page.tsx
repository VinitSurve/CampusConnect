import { ClubCard } from "@/components/club-card"
import { Input } from "@/components/ui/input"
import { mockClubs } from "@/lib/mock-data"
import { Search } from "lucide-react"

export default function ClubsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Clubs & Groups</h1>
        <p className="text-muted-foreground">
          Discover new interests and connect with fellow students.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search for clubs, interests, or tags..." className="pl-10" />
      </div>

      <section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </section>
    </div>
  )
}
