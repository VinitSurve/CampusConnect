'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import type { Event, TimetableEntry } from '@/types';

interface AcademicCalendarProps {
  onDateSelect?: (selectInfo: DateSelectArg) => void;
}

export default function AcademicCalendar({ onDateSelect }: AcademicCalendarProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        // Fetch regular events
        const eventsQuery = query(
          collection(db, "events"),
          orderBy("date", "asc")
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const regularEvents = eventsSnapshot.docs.map((doc) => {
          const data = doc.data() as Event;
          const startDateTime = new Date(`${data.date}T${data.time || '00:00'}:00`);
          return {
            id: doc.id,
            title: data.title,
            start: startDateTime,
            allDay: !data.time,
            extendedProps: { ...data, eventType: 'event' },
            className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary h-full'
          };
        });

        // Fetch timetable entries
        const timetablesQuery = query(collection(db, "timetables"));
        const timetablesSnapshot = await getDocs(timetablesQuery);
        
        const today = new Date();
        const semesterStart = new Date(today.getFullYear(), 7, 1); // Assume semester starts August 1st
        const semesterEnd = new Date(today.getFullYear(), 11, 31); // Assume semester ends December 31st

        const timetableEvents = timetablesSnapshot.docs.map(doc => {
            const data = doc.data() as TimetableEntry;
            return {
                id: `tt-${doc.id}`,
                title: `${data.subject} (${data.facultyName})`,
                daysOfWeek: [data.dayOfWeek],
                startTime: data.startTime,
                endTime: data.endTime,
                startRecur: semesterStart.toISOString().split('T')[0],
                endRecur: semesterEnd.toISOString().split('T')[0],
                allDay: false,
                display: 'block',
                extendedProps: { ...data, eventType: 'timetable' },
                className: 'bg-secondary/30 text-secondary-foreground border-l-4 border-secondary h-full'
            }
        });

        setEvents([...regularEvents, ...timetableEvents]);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    }
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps;
    if (props.eventType === 'timetable') {
        alert(
            `Class: ${clickInfo.event.title}\n` +
            `Course: ${props.course} Year-${props.year} Div-${props.division}\n` +
            `Location: ${props.location}`
        );
    } else {
        alert(`Event: ${clickInfo.event.title}\nStatus: ${props.status}`);
    }
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
          initialView="timeGridWeek"
          weekends={true}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="17:00:00"
          slotLabelInterval="01:00:00"
        />
      )}
    </div>
  );
}
