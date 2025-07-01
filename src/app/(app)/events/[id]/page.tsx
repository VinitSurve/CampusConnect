import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Users, Ticket, MenuSquare, Info } from "lucide-react"
import { format } from "date-fns"

import { summarizeEvent } from "@/ai/flows/summarize-event"
import { mockEvents } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = mockEvents.find((e) => e.id === params.id)

  if (!event) {
    notFound()
  }

  const { summary } = await summarizeEvent({ eventDescription: event.longDescription })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-8 shadow-lg">
        <Image
          src={event.image}
          alt={event.title}
          layout="fill"
          objectFit="cover"
          className="w-full h-full"
          data-ai-hint={`${event.category.toLowerCase()} event`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
            <Badge variant="secondary" className="mb-2 text-sm">{event.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-headline">{event.title}</h1>
            <p className="text-lg text-primary-foreground/80 mt-2">Organized by {event.organizer}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
            <Alert className="bg-primary/10 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-semibold">Quick Summary</AlertTitle>
                <AlertDescription>
                    {summary}
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                        <MenuSquare className="text-primary"/> About this event
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground prose prose-sm max-w-none">
                    <p>{event.longDescription}</p>
                </CardContent>
            </Card>

            {event.gallery.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Photo Gallery</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {event.gallery.map((img, index) => (
                                <div key={index} className="rounded-lg overflow-hidden aspect-video">
                                    <Image
                                        src={img}
                                        alt={`Event gallery image ${index + 1}`}
                                        width={400}
                                        height={300}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                        data-ai-hint="event photo"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="md:col-span-1 space-y-6">
            <Card className="bg-accent/10">
                <CardContent className="p-6">
                    <Button asChild className="w-full text-lg py-6 bg-accent hover:bg-accent/90">
                        <Link href={event.registrationLink}>
                            <Ticket className="mr-2"/>
                            Register Now
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <Calendar className="w-5 h-5 mt-1 text-primary"/>
                        <div>
                            <p className="font-semibold">Date and Time</p>
                            <p className="text-muted-foreground">{format(new Date(event.date), 'EEEE, MMMM d, yyyy')} at {event.time}</p>
                        </div>
                    </div>
                    <Separator/>
                    <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 mt-1 text-primary"/>
                        <div>
                            <p className="font-semibold">Location</p>
                            <p className="text-muted-foreground">{event.location}</p>
                        </div>
                    </div>
                    <Separator/>
                    <div className="flex items-start gap-4">
                        <Users className="w-5 h-5 mt-1 text-primary"/>
                        <div>
                            <p className="font-semibold">Capacity</p>
                            <p className="text-muted-foreground">{event.attendees} / {event.capacity} attending</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
