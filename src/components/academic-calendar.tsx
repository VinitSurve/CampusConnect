'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventContentArg } from '@fullcalendar/core';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import type { Event, TimetableEntry } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AcademicCalendarProps {
  onDateSelect?: (selectInfo: DateSelectArg) => void;
  headerToolbarRight?: string;
  initialView?: string;
  locationFilter?: string;
}

const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps;
    const isTimetable = props.eventType === 'timetable';
    
    return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='w-full h-full p-1 overflow-hidden text-left'>
                <p className="font-bold truncate">{eventInfo.event.title}</p>
                {!isTimetable && <p className="text-xs truncate">{eventInfo.timeText}</p>}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-background/90 backdrop-blur-lg border-border text-foreground">
            <p className="font-bold text-base mb-2">{eventInfo.event.title}</p>
            {isTimetable ? (
                <div className="space-y-1 text-sm">
                    <p><strong>Faculty:</strong> {props.facultyName}</p>
                    <p><strong>Course:</strong> {props.course} Year-{props.year} Div-{props.division}</p>
                    <p><strong>Time:</strong> {props.startTime} - {props.endTime}</p>
                    <p><strong>Location:</strong> {props.location}</p>
                </div>
            ) : (
                <div className="space-y-1 text-sm">
                    <p><strong>Organizer:</strong> {props.organizer}</p>
                    <p><strong>Time:</strong> {new Date(eventInfo.event.startStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p><strong>Location:</strong> {props.location}</p>
                </div>
            )}
          </TooltipContent>
        </Tooltip>
    );
};


export default function AcademicCalendar({ 
  onDateSelect,
  headerToolbarRight = 'dayGridMonth,timeGridWeek,timeGridDay',
  initialView = 'timeGridWeek',
  locationFilter
}: AcademicCalendarProps) {
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
            className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary h-full cursor-pointer'
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
                title: `${data.subject}`,
                daysOfWeek: [data.dayOfWeek],
                startTime: data.startTime,
                endTime: data.endTime,
                startRecur: semesterStart.toISOString().split('T')[0],
                endRecur: semesterEnd.toISOString().split('T')[0],
                allDay: false,
                display: 'block',
                extendedProps: { ...data, eventType: 'timetable' },
                className: 'bg-secondary/30 text-secondary-foreground border-l-4 border-secondary h-full cursor-pointer'
            }
        });

        const allCalEvents = [...regularEvents, ...timetableEvents];
        const filteredEvents = locationFilter
          ? allCalEvents.filter(e => e.extendedProps.location === locationFilter)
          : allCalEvents;

        setEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [locationFilter]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    }
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  return (
    <TooltipProvider>
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
                right: headerToolbarRight
            }}
            initialView={initialView}
            weekends={true}
            events={events}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateSelect}
            eventContent={renderEventContent}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="17:00:00"
            slotLabelInterval="01:00:00"
            displayEventTime={false}
            />
        )}
        </div>
    </TooltipProvider>
  );
}
