'use client'

import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AcademicCalendarProps {
  onDateSelect: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
}

const locationsCount = 4; // Total number of bookable locations

export default function AcademicCalendar({ onDateSelect }: AcademicCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndBuildCalendar = async () => {
      try {
        const upcomingStatus: ('upcoming')[] = ['upcoming'];
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("status", "in", upcomingStatus));
        const eventsSnap = await getDocs(q);
        const bookedDates = new Map<string, number>();

        eventsSnap.forEach(doc => {
          const eventData = doc.data();
          if (eventData.date) {
            const eventDate = new Date(eventData.date);
            const dateStr = eventDate.toISOString().split('T')[0];
            bookedDates.set(dateStr, (bookedDates.get(dateStr) || 0) + 1);
          }
        });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const calendarDays: CalendarDay[] = [];

        for (let i = 0; i < firstDayOfWeek; i++) {
          const date = new Date(year, month, i - firstDayOfWeek + 1);
          calendarDays.push({ date, isCurrentMonth: false, isToday: false, isAvailable: false });
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
          const date = new Date(year, month, i);
          const dateStr = date.toISOString().split('T')[0];
          const bookings = bookedDates.get(dateStr) || 0;
          const isPast = date < today;
          
          calendarDays.push({
            date,
            isCurrentMonth: true,
            isToday: date.getTime() === today.getTime(),
            isAvailable: !isPast && bookings < locationsCount,
          });
        }

        const remainingCells = 42 - calendarDays.length;
        for (let i = 1; i <= remainingCells; i++) {
          const date = new Date(year, month + 1, i);
          calendarDays.push({ date, isCurrentMonth: false, isToday: false, isAvailable: false });
        }

        setDays(calendarDays);

      } catch (error) {
        console.error("Error fetching available dates:", error);
        toast({
          title: "Error",
          description: "Failed to load available dates.",
          variant: "destructive"
        });
      }
    };

    fetchAndBuildCalendar();
  }, [currentDate, toast]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5 text-white" />
        </Button>
        <h3 className="text-lg font-medium text-white">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5 text-white" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-white/70 text-xs font-bold py-2">{day}</div>
        ))}
        {days.map((dayObj, index) => (
          <button
            key={index}
            onClick={() => dayObj.isAvailable && onDateSelect(dayObj.date)}
            disabled={!dayObj.isAvailable}
            className={`
              p-2 text-sm rounded-lg text-center h-10 w-10 flex items-center justify-center transition-colors
              ${!dayObj.isCurrentMonth ? 'text-white/30' : ''}
              ${dayObj.isToday ? 'border-2 border-blue-400' : ''}
              ${dayObj.isAvailable 
                ? 'bg-blue-600/20 hover:bg-blue-500/40 text-white cursor-pointer' 
                : 'bg-red-600/10 text-white/50 cursor-not-allowed'}
            `}
          >
            {dayObj.date.getDate()}
          </button>
        ))}
      </div>
       <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/80">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500/50"></span>Available</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500/40"></span>Not Available</div>
      </div>
    </div>
  );
}
