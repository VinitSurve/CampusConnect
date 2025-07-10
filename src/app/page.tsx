
'use client'

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Users, MapPin, Clock, ArrowRight, Sparkles, List } from "lucide-react"
import Link from "next/link"
import { getEvents } from "@/lib/data"
import type { Event } from "@/types"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRouter } from "next/navigation"

const EventCard = ({ event }: { event: Event }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical":
      case "Technology":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "Sports":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Cultural":
      case "Arts & Culture":
         return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "Guest Speaker":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  return (
    <Card
      key={event.id}
      className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 group flex flex-col"
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={getCategoryColor(event.category)}>
            {event.category}
          </Badge>
          <div className="flex items-center text-gray-400 text-sm">
            <Users className="w-4 h-4 mr-1" />
            {event.attendees || 0}
          </div>
        </div>
        <CardTitle className="text-white group-hover:text-blue-300 transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {new Date(event.date + 'T00:00:00').toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {event.time}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            {event.location}
          </div>
          <div className="pt-2 text-blue-300 font-medium">
            by {event.organizer}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const router = useRouter();

  React.useEffect(() => {
    async function fetchEvents() {
      const allEvents = await getEvents();
      const upcomingEvents = allEvents.filter(e => e.status === 'upcoming');
      setEvents(upcomingEvents);
    }
    fetchEvents();
  }, []);

  const upcomingEventsForList = events.slice(0, 3);
  
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: `${event.date}T${event.time || '00:00:00'}`,
    end: event.endTime ? `${event.date}T${event.endTime}:00` : undefined,
    allDay: !event.time,
    url: `/dashboard/events/${event.id}`,
    className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary cursor-pointer'
  }));

  const handleEventClick = (info: any) => {
    info.jsEvent.preventDefault();
    // Use login redirect for public page
    router.push('/login');
  };

  return (
    <>
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md bg-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CampusConnect</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Login
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Your Campus,{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Connected
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Discover events, join clubs, and stay connected with everything
                happening on campus. CampusConnect brings your entire university
                experience together in one modern platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    Join CampusConnect
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Upcoming Events
              </h2>
               <div className="flex justify-center items-center gap-4">
                <p className="text-gray-300">
                  Don't miss out on these exciting campus activities
                </p>
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
            </div>
            
            {view === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEventsForList.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
                </div>
            ) : (
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

            <div className="text-center mt-12">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  View All Events
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Why Choose CampusConnect?
              </h2>
              <p className="text-gray-300">
                Everything you need for campus life in one place
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white/5 backdrop-blur-md border-white/10 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Discover Events</CardTitle>
                  <CardDescription className="text-gray-300">
                    Find and join events that match your interests across all campus
                    clubs and organizations.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white/5 backdrop-blur-md border-white/10 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Join Communities</CardTitle>
                  <CardDescription className="text-gray-300">
                    Connect with like-minded students through clubs and build
                    lasting friendships.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white/5 backdrop-blur-md border-white/10 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">AI-Powered</CardTitle>
                  <CardDescription className="text-gray-300">
                    Smart recommendations and AI-assisted event
                    creation make campus life easier.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CampusConnect</span>
            </div>
            <p className="text-gray-400">
              © {new Date().getFullYear()} CampusConnect. Bringing campus life online.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
