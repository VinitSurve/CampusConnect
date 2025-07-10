
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Event } from "@/types"
import { Calendar as CalendarIcon, Users, Search, Clock, MapPin, Tag, List, LayoutGrid, User } from "lucide-react"
import { format } from 'date-fns'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

interface EventsDisplayProps {
  events: Event[]
}

const getCategoryColor = (category?: string) => {
    switch (category) {
      case "Technical": return "bg-blue-500/20 text-blue-300 border border-blue-500/30"
      case "Sports": return "bg-green-500/20 text-green-300 border border-green-500/30"
      case "Cultural": return "bg-purple-500/20 text-purple-300 border border-purple-500/30"
      case "Guest Speaker": return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
      default: return "bg-gray-500/20 text-gray-300 border border-gray-500/30"
    }
}

const EventListItem = ({ event }: { event: Event }) => {
    const progressValue = event.capacity > 0 ? (event.attendees / event.capacity) * 100 : 0;
    
    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden transition-all hover:border-slate-600">
            <div className="p-6">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <Badge className={`${getCategoryColor(event.category)} mb-2`}>{event.category}</Badge>
                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                        <p className="text-slate-400 mt-1 text-sm">{event.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="flex items-center justify-end gap-2 text-slate-300">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{event.attendees} / {event.capacity}</span>
                        </div>
                        <Progress value={progressValue} className="w-24 h-1.5 mt-1 bg-slate-700" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-slate-300 text-sm mt-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        <span>{format(new Date(event.date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>by {event.organizer}</span>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-t from-slate-900 to-slate-900/50 px-6 py-3">
                 <Link href={`/dashboard/events/${event.id}`}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0">
                        View Details
                    </Button>
                </Link>
            </div>
        </div>
    );
};


export function EventsDisplay({ events }: EventsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<'list' | 'grid' | 'calendar'>('list');

  const allCategories = ['All Categories', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];
  const [filter, setFilter] = useState("All Categories");

  const filteredEvents = events
    .filter(event => {
        const lowerSearch = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || 
            event.title.toLowerCase().includes(lowerSearch) ||
            event.description.toLowerCase().includes(lowerSearch) ||
            event.organizer.toLowerCase().includes(lowerSearch) ||
            event.tags?.some(tag => tag.toLowerCase().includes(lowerSearch));
        const categoryMatch = filter === 'All Categories' || event.category === filter;

        return searchMatch && categoryMatch;
    });
    
  const calendarEvents = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: `${event.date}T${event.time || '00:00'}`,
    end: event.endTime ? `${event.date}T${event.endTime}` : undefined,
    url: `/dashboard/events/${event.id}`,
    className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary'
  }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Events</h1>
          <p className="text-white/70 mt-1">Upcoming events happening on campus</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto justify-between bg-slate-800 border-slate-700 hover:bg-slate-700">
                        <Tag className="mr-2" />
                        {filter}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                    {allCategories.map(category => (
                        <DropdownMenuItem key={category} onSelect={() => setFilter(category)}>
                            {category}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center">
                 <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className={view === 'list' ? 'bg-blue-600' : ''}><List/></Button>
                 <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} className={view === 'grid' ? 'bg-blue-600' : ''}><LayoutGrid/></Button>
                 <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('calendar')} className={view === 'calendar' ? 'bg-blue-600' : ''}><CalendarIcon/></Button>
            </div>
        </div>
      </div>

      {view === 'list' && (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            {filteredEvents.length > 0 ? (
                filteredEvents.map(event => <EventListItem key={event.id} event={event} />)
            ) : (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                    <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                    <p className="text-white/80">Try adjusting your filters.</p>
                </div>
            )}
          </div>
      )}

      {view === 'grid' && (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-700/50 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-2">Grid View Coming Soon</h3>
            <p className="text-white/80">This feature is under development.</p>
          </div>
      )}

      {view === 'calendar' && (
           <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek'
                }}
                initialView="dayGridMonth"
                weekends={true}
                events={calendarEvents}
                editable={false}
                selectable={false}
                dayMaxEvents={true}
                height="auto"
                eventClick={(info) => {
                    info.jsEvent.preventDefault(); // prevent the browser from navigating
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
