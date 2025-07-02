'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import type { Event } from '@/types';

interface AcademicCalendarProps {
  onDateSelect?: (selectInfo: DateSelectArg) => void;
}

export default function AcademicCalendar({ onDateSelect }: AcademicCalendarProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, "events"),
          orderBy("date", "asc")
        );
        const querySnapshot = await getDocs(q);
        const eventData = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Event;
          // Combine date and time string to create a valid Date object for 'start'
          const startDateTime = new Date(`${data.date}T${data.time}:00`);
          
          return {
            id: doc.id,
            title: data.title,
            start: startDateTime,
            allDay: false, // Assuming events are not all-day
            extendedProps: { ...data }
          };
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

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    } else {
        // Default behavior if no handler is passed
        alert(`You selected from ${selectInfo.startStr} to ${selectInfo.endStr}`);
    }
    // Clear selection
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // In a real app, you'd open a modal with event details
    alert(`Event: ${clickInfo.event.title}\nStatus: ${clickInfo.event.extendedProps.status}`);
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    // Placeholder for drag-and-drop update logic
    // In a real app, you would call a server action here to update the event in Firestore
    console.log(`Event ${dropInfo.event.title} was dropped on ${dropInfo.event.startStr}`);
    // You can add optimistic UI updates here and revert on error
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-4 md:p-6">
      {loading ? (
        <div className="animate-pulse">
            <div className="h-12 bg-white/5 rounded-lg mb-4"></div>
            <div className="h-[600px] bg-white/5 rounded-lg"></div>
        </div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="dayGridMonth"
          weekends={true}
          events={events}
          editable={true} // Allows dragging and resizing
          selectable={true} // Allows date selection
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop} // Handle event rescheduling
          height="auto" // Adjusts height to content
        />
      )}
    </div>
  );
}
