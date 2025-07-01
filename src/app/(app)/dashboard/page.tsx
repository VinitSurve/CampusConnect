import { recommendEvents, type RecommendEventsInput, type RecommendEventsOutput } from "@/ai/flows/event-recommendation"
import { EventCard } from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { mockEvents } from "@/lib/mock-data"
import type { Event } from "@/types"
import { Calendar } from "lucide-react"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  const allEvents = mockEvents.filter((e) => e.status === "upcoming")

  // Prepare input for AI recommendation
  const aiInput: RecommendEventsInput = {
    studentProfile: {
      interests: user.interests || [],
    },
    availableEvents: allEvents.map((e) => ({
      title: e.title,
      description: e.description,
      date: e.date,
      time: e.time,
      location: e.location,
      interests: e.interests,
    })),
  }

  let recommendedEvents: RecommendEventsOutput = []
  if (user.interests && user.interests.length > 0) {
    try {
      recommendedEvents = await recommendEvents(aiInput)
    } catch (error) {
      console.error("AI recommendation failed:", error)
      // Fallback or error handling
    }
  }

  // Map AI output back to full Event objects
  const recommendedEventObjects: Event[] = recommendedEvents
    .map((recEvent) => allEvents.find((e) => e.title === recEvent.title))
    .filter((e): e is Event => e !== undefined)
    .slice(0, 3) // Limit to 3 recommendations for the dashboard

  const otherUpcomingEvents = allEvents.filter(
    (event) => !recommendedEventObjects.some((rec) => rec.id === event.id)
  )

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Welcome back, {user.name}! Here's what's happening on campus.
        </p>
      </div>

      {recommendedEventObjects.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-headline">Recommended For You</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendedEventObjects.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Upcoming Events</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {otherUpcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  )
}
