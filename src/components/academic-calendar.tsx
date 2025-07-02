
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  status: 'upcoming' | 'past' | 'cancelled' | 'approved';
  description?: string;
  time?: string;
}

interface AcademicCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export default function AcademicCalendar({ onDateSelect }: AcademicCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Add these utility functions
  const getDaysInMonth = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDaysArray = (): (number | null)[] => {
    const totalDays = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysArray = Array(42).fill(null); // 6 rows * 7 days

    for (let i = 0; i < totalDays; i++) {
      daysArray[firstDay + i] = i + 1;
    }

    return daysArray;
  };

  const getEventsForDay = (day: number | null): CalendarEvent[] => {
    if (!day) return [];
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    return events.filter(event => {
      const eventDate = event.date;
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentMonth &&
             eventDate.getFullYear() === currentYear;
    });
  };

  // Fetch approved events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, "events"),
          orderBy("date", "asc")
        );
        const querySnapshot = await getDocs(q);
        const eventData: CalendarEvent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          eventData.push({
            id: doc.id,
            title: data.title,
            date: data.date?.toDate?.() || new Date(data.date),
            location: data.location,
            status: data.status,
            description: data.description,
            time: data.time
          });
        });
        setEvents(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDateClick = (date: number | null) => {
    if (!date) return;
    const selectedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      date
    );
    onDateSelect?.(selectedDate);
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Academic Calendar</h2>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-white/5 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="text-white/70 text-sm">
                    {event.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <div className="text-xl font-bold text-white">
                    {event.date.getDate()}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-white font-medium">{event.title}</h3>
                  <div className="flex items-center mt-1 text-sm text-white/60">
                    <span className="mr-3">
                      🕒 {event.time}
                    </span>
                    <span>📍 {event.location}</span>
                  </div>
                </div>

                <div className={`px-2 py-1 rounded-full text-xs ${
                  event.status === 'upcoming' 
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {event.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/70">No events scheduled</p>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-white/70 text-sm text-center py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 text-white">
          {getDaysArray().map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                p-2 text-sm rounded-lg text-center
                ${!day ? 'bg-transparent cursor-default' : 
                  'bg-white/5 hover:bg-white/10 cursor-pointer'}
              `}
              disabled={!day}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
