import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Users } from "lucide-react"
import { format } from 'date-fns';

import type { Event } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "./ui/button";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/events/${event.id}`}>
          <Image
            src={event.image}
            alt={event.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint={`${event.category.toLowerCase()} event`}
          />
        </Link>
        <Badge variant="secondary" className="absolute top-2 right-2">{event.category}</Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 leading-tight">
            <Link href={`/events/${event.id}`} className="hover:text-primary transition-colors">
                {event.title}
            </Link>
        </CardTitle>
        <CardDescription>{event.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4"/>
            <span>{format(new Date(event.date), 'MMMM d, yyyy')} at {event.time}</span>
        </div>
        <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4"/>
            <span>{event.location}</span>
        </div>
        <div className="w-full flex justify-between items-center mt-2">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4"/>
                <span>{event.attendees} / {event.capacity}</span>
            </div>
            <Button asChild size="sm" className="bg-accent hover:bg-accent/90">
                <Link href={`/events/${event.id}`}>View Details</Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
