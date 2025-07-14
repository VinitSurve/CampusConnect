
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Event } from "@/types"
import { Calendar as CalendarIcon, Users, Clock, MapPin, Tag, LayoutGrid, Search, User as UserIcon } from "lucide-react"
import { format } from 'date-fns'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface EventsDisplayProps {
  events: Event[]
}

const getCategoryColor = (category?: string) => {
    switch (category) {
      case "Technical": return "bg-blue-600/20 text-blue-300 border border-blue-500/50"
      case "Sports": return "bg-green-600/20 text-green-300 border border-green-500/50"
      case "Cultural": return "bg-purple-600/20 text-purple-300 border border-purple-500/50"
      case "Guest Speaker": return "bg-yellow-600/20 text-yellow-300 border border-yellow-500/50"
      case "Workshop": return 'bg-orange-600/20 text-orange-300 border border-orange-500/50'
      default: return "bg-gray-600/20 text-gray-300 border border-gray-500/50"
    }
}

const getCategoryClass = (category: string) => {
    switch (category) {
        case "Technical": return 'event-technical';
        case "Sports": return 'event-sports';
        case "Cultural": return 'event-cultural';
        case "Guest Speaker": return 'event-speaker';
        case "Workshop": return 'event-workshop';
        default: return 'event-default';
    }
}

const EventCard = ({ event }: { event: Event }) => {
    return (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col group">
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={event.headerImage || event.image || 'https://placehold.co/600x400.png'}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="event photo"
                />
            </div>
            <CardContent className="p-4 flex flex-col flex-grow">
                 <div className="flex justify-between items-start mb-2">
                    <Badge className={`${getCategoryColor(event.category)}`}>{event.category}</Badge>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees || 0}</span>
                    </div>
                 </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{event.title}</h3>
                <CardDescription className="text-white/70 mt-1 text-sm flex-grow">{event.description}</CardDescription>
                
                <div className="space-y-2 text-sm text-white/80 mt-4">
                     <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-white/50" />
                        <span>{format(new Date(event.date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/50" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-white/50" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-white/50" />
                        <span>by {event.organizer}</span>
                    </div>
                </div>
            </CardContent>
            <div className="bg-gradient-to-t from-black/20 to-transparent p-4 mt-auto">
                 <Link href={`/dashboard/events/${event.id}`}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                        View Details
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

const EventList = ({ events }: { events: Event[] }) => {
    if (events.length === 0) {
        return (
            <div className="text-center py-16 bg-white/10 rounded-lg col-span-full">
                <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                <p className="text-white/80">Try adjusting your filters.</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-300">
            {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
    );
}

export function EventsDisplay({ events }: EventsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<'grid' | 'calendar'>('grid');

  const allCategories = ['All Categories', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];
  const [filter, setFilter] = useState("All Categories");
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of today for accurate date comparison

  const filterEvents = (eventList: Event[]) => {
    return eventList.filter(event => {
        const lowerSearch = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || 
            event.title.toLowerCase().includes(lowerSearch) ||
            event.description.toLowerCase().includes(lowerSearch) ||
            event.organizer.toLowerCase().includes(lowerSearch) ||
            event.tags?.some(tag => tag.toLowerCase().includes(lowerSearch));
        const categoryMatch = filter === 'All Categories' || event.category === filter;
        return searchMatch && categoryMatch;
    });
  }

  const upcomingEvents = filterEvents(events.filter(e => new Date(e.date) >= now));
  const pastEvents = filterEvents(events.filter(e => new Date(e.date) < now));

    
  const calendarEvents = upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: `${event.date}T${event.time || '00:00'}`,
    end: event.endTime ? `${event.date}T${event.endTime}` : undefined,
    url: `/dashboard/events/${event.id}`,
    allDay: !event.time,
    className: getCategoryClass(event.category)
  }));
  
  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="fc-event-main-wrapper">
        <b className="fc-event-title">{eventInfo.event.title}</b>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Events</h1>
          <p className="text-white/70 mt-1">Discover what's happening on campus</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full md:w-auto md:flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input 
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto justify-between">
                            <Tag className="mr-2" />
                            {filter}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {allCategories.map(category => (
                            <DropdownMenuItem key={category} onSelect={() => setFilter(category)}>
                                {category}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="bg-white/10 p-1 rounded-lg flex items-center">
                     <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} className={view === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}><LayoutGrid/></Button>
                     <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('calendar')} className={view === 'calendar' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}><CalendarIcon/></Button>
                </div>
            </div>
      </div>

        {view === 'grid' && (
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                    <TabsTrigger value="past">Past Events</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    <EventList events={upcomingEvents} />
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                    <EventList events={pastEvents} />
                </TabsContent>
            </Tabs>
        )}

      {view === 'calendar' && (
           <div className="bg-white/10 border border-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm mb-4">The calendar view shows upcoming events only. Switch to grid view to see past events.</p>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                }}
                initialView="dayGridMonth"
                weekends={true}
                events={calendarEvents}
                eventContent={renderEventContent}
                editable={false}
                selectable={false}
                dayMaxEvents={true}
                height="auto"
                eventClick={(info) => {
                    info.jsEvent.preventDefault();
                    if (info.event.url) {
                        window.location.href = info.event.url;
                    }
                }}
            />
           </div>
      )}
    </main>
  )
}
