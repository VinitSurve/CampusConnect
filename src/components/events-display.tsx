
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Event } from "@/types"
import { Calendar as CalendarIcon, Users, Search, Clock, MapPin, Tag } from "lucide-react"
import { format } from 'date-fns'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface EventsDisplayProps {
  events: Event[]
}

const getCategoryColor = (category?: string) => {
    switch (category) {
      case "Technical":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "Sports":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Cultural":
         return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "Guest Speaker":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
}

const EventCard = ({ event, index }: { event: Event, index: number }) => (
    <Link href={`/dashboard/events/${event.id}`} className="block bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-300 group rounded-xl flex flex-col">
        <div className="relative h-48 w-full overflow-hidden">
            <Image
                src={event.headerImage || event.image || 'https://placehold.co/600x400.png'}
                alt={event.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="event photo"
                priority={index < 6} // Prioritize loading for the first few cards
            />
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white flex items-center gap-1.5">
                <Users className="w-3 h-3"/>
                {event.attendees || 0}
            </div>
             <div className="absolute top-3 left-3">
                <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
            </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <CardTitle className="text-white text-lg font-semibold group-hover:text-blue-300 transition-colors mb-2">{event.title}</CardTitle>
            <CardDescription className="text-gray-300/80 text-sm mb-4 flex-grow">{event.description}</CardDescription>
            <div className="mt-auto space-y-2 text-sm text-gray-300/90">
                <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(new Date(event.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                </div>
                 <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {event.time} {event.endTime && ` - ${event.endTime}`}
                </div>
                <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                </div>
            </div>
        </div>
    </Link>
)

export function EventsDisplay({ events }: EventsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const allCategories = ['All', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];
  const [filter, setFilter] = useState("All");

  const filteredEvents = events
    .filter(event => {
        const lowerSearch = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || 
            event.title.toLowerCase().includes(lowerSearch) ||
            event.description.toLowerCase().includes(lowerSearch) ||
            event.organizer.toLowerCase().includes(lowerSearch) ||
            event.tags?.some(tag => tag.toLowerCase().includes(lowerSearch));
        const categoryMatch = filter === 'All' || event.category === filter;

        return searchMatch && categoryMatch;
    });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Discover Events</h1>
          <p className="text-white/70 mt-1">Find activities and gatherings hosted by campus clubs and organizations.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Input 
            placeholder="Search events, clubs, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white/5 border-white/20 placeholder:text-white/50"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        </div>
      </div>

       <div className="flex overflow-x-auto pb-4 mb-8 gap-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allCategories.map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
              filter === category
                ? "bg-blue-600 text-white"
                : "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
            }`}
          >
            <span className="text-white">{category}</span>
          </button>
        ))}
      </div>
      
      {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-300">
            {filteredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-white/80">
                Your search for "{searchTerm}" in the "{filter}" category yielded no results. Try a different search!
              </p>
            </div>
          </div>
        )
      }
    </main>
  )
}
