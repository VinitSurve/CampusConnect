
'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SeminarBooking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Skeleton } from '@/components/ui/skeleton';

export default function SeminarHallManagerPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<SeminarBooking[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSeminarBookings();
  }, []);

  const fetchSeminarBookings = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'seminarBookings'),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const entries: SeminarBooking[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SeminarBooking));
      
      // Secondary sort on client to order events within the same day
      entries.sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
      });
      
      setBookings(entries);

    } catch (error) {
      console.error("Error fetching seminar bookings:", error);
      toast({ title: "Error", description: "Failed to load seminar hall schedule.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const calendarEvents = bookings.map(booking => ({
    id: booking.id,
    title: booking.title,
    start: `${booking.date}T${booking.startTime}`,
    end: `${booking.date}T${booking.endTime}`,
    extendedProps: booking,
    className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary'
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Seminar Hall Bookings</h1>
      </div>
      
      <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
        <p className="text-white/80 mb-6">
          This is a read-only view of the Seminar Hall schedule. Bookings are automatically added here when an event proposal for the hall is approved.
        </p>

        {loading ? (
            <Skeleton className="h-[700px] w-full bg-white/5" />
        ) : (
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                }}
                initialView="dayGridMonth"
                weekends={true}
                events={calendarEvents}
                editable={false}
                selectable={false}
                selectMirror={false}
                dayMaxEvents={true}
                height="auto"
                displayEventTime={false}
            />
        )}
      </div>
    </div>
  );
}
