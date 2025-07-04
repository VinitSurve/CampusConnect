
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Event } from "@/types"
import { Calendar } from "lucide-react"
import { format } from 'date-fns'

interface EventsDisplayProps {
  events: Event[]
}

export function EventsDisplay({ events }: EventsDisplayProps) {
  const [filter, setFilter] = useState("all")

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
  };

  const displayCategories = allCategories.map(cat => ({
    id: cat,
    name: categoryMap[cat]?.name || cat,
    icon: categoryMap[cat]?.icon || "⭐"
  }));


  const filteredEvents =
    filter === "all"
      ? events
      : events.filter(
          (event) => event.category === filter
        )

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Categories */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col group"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={event.headerImage || event.image || 'https://placehold.co/600x400.png'}
                  alt={event.title}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
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
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {format(new Date(`${event.date}T00:00:00`), 'EEE MMM d yyyy')}
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
      )}
    </main>
  )
}
