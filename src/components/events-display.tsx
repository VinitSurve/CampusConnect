
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Event } from "@/types"
import { Calendar as CalendarIcon, List } from "lucide-react"
import { format } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRouter } from "next/navigation"

interface EventsDisplayProps {
  events: Event[]
}

export function EventsDisplay({ events }: EventsDisplayProps) {
  const [filter, setFilter] = useState("all")
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const router = useRouter();

  const allCategories = ['all', ...Array.from(new Set(events.map(e => e.category)))]

  const categoryMap: { [key: string]: { name: string; icon: string } } = {
    'all': { name: "All Events", icon: "🎯" },
    'Technology': { name: "Technology", icon: "💻" },
    'Music': { name: "Music", icon: "🎵" },
    'Career': { name: "Career", icon: "💼" },
    'Academic': { name: "Academic", icon: "📚" },
    'Social': { name: "Social", icon: "🎉" },
    'Arts': { name: "Arts & Culture", icon: "🎭" },
    'Sports': { name: "Sports & Recreation", icon: "⚽" },
    'Guest Speaker': { name: "Guest Speaker", icon: "⭐" },
    'Technical': { name: "Technical", icon: "💻" },
    'Workshop': { name: "Workshop", icon: "🛠️" },
    'Networking': { name: "Networking", icon: "🤝" },
  };

  const displayCategories = allCategories.map(cat => ({
    id: cat,
    name: categoryMap[cat]?.name || cat,
    icon: categoryMap[cat]?.icon || "⭐"
  })).filter((value, index, self) => index === self.findIndex((t) => t.id === value.id));


  const filteredEvents =
    filter === "all"
      ? events
      : events.filter(
          (event) => event.category === filter
        )

  const calendarEvents = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: `${event.date}T${event.time || '00:00:00'}`,
    end: event.endTime ? `${event.date}T${event.endTime}:00` : undefined,
    allDay: !event.time,
    url: `/dashboard/events/${event.id}`,
    className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary cursor-pointer'
  }));

  const handleEventClick = (info: any) => {
    info.jsEvent.preventDefault(); // Prevent the default browser redirect
    if (info.event.url) {
      router.push(info.event.url); // Use Next.js router for navigation
    }
  };


  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Categories and View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex overflow-x-auto pb-4 gap-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {displayCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`flex items-center px-6 py-3 rounded-xl whitespace-nowrap transition-all text-white ${
                filter === category.id
                  ? "bg-blue-600"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <span className="mr-2 text-lg">{category.icon}</span>
              <span className="text-white font-medium">{category.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-shrink-0 bg-white/10 p-1 rounded-xl flex">
            <button 
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-white/70 hover:text-white'}`}
            >
                <List className="h-4 w-4"/> List
            </button>
            <button 
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${view === 'calendar' ? 'bg-blue-600 text-white' : 'text-white/70 hover:text-white'}`}
            >
                <CalendarIcon className="h-4 w-4"/> Calendar
            </button>
        </div>
      </div>
      

      {/* Conditional Rendering based on view */}
      {view === 'list' ? (
        // List View
        filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-300">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col group"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={event.headerImage || event.image || 'https://placehold.co/600x400.png'}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="event photo"
                  />
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                  <p className="text-white/80 mb-4 text-sm flex-grow">{event.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-white/20 text-white rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-white/80 text-sm mt-auto pt-3 border-t border-white/10">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>
                      {format(new Date(`${event.date}T00:00:00`), 'EEE, MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{event.location}</span>
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="text-white hover:text-blue-300 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-white/80">
                There are no events matching the "{filter}" category right now.
              </p>
            </div>
          </div>
        )
      ) : (
        // Calendar View
        <div className="backdrop-blur-none bg-white/10 rounded-xl border border-white/10 p-4 md:p-6 animate-in fade-in-0 duration-300">
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
                eventClick={handleEventClick}
                editable={false}
                selectable={false}
                selectMirror={false}
                dayMaxEvents={true}
                height="auto"
                eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                }}
            />
        </div>
      )}
    </main>
  )
}
