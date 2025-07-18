
'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventContentArg } from '@fullcalendar/core';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import type { Event, TimetableEntry, SeminarBooking } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';


interface AcademicCalendarProps {
  onDateSelect?: (selectInfo: DateSelectArg) => void;
  headerToolbarRight?: string;
  initialView?: string;
  locationFilter?: string;
  initialDate?: Date;
  showToolbar?: boolean;
}

const locationIdToNameMap: { [key: string]: string } = {
  'lab401': 'Lab 401',
  'lab402': 'Lab 402',
  'lab503': 'Lab 503',
  'seminar': 'Seminar Hall'
};


export default function AcademicCalendar({ 
  onDateSelect,
  headerToolbarRight = 'dayGridMonth,timeGridWeek,timeGridDay',
  initialView = 'timeGridWeek',
  locationFilter,
  initialDate,
  showToolbar = true
}: AcademicCalendarProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps;
    const isTimetable = props.eventType === 'timetable';
    
    const eventDetails = (
        <div className="p-2">
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
                    <p><strong>Time:</strong> {eventInfo.event.allDay ? 'All Day' : eventInfo.timeText}</p>
                    <p><strong>Location:</strong> {props.location}</p>
                </div>
            )}
        </div>
    );

    const eventDisplay = (
        <div className='w-full h-full p-2 overflow-hidden text-left cursor-pointer'>
            <p className="font-semibold truncate text-lg">{eventInfo.event.title}</p>
            {!isTimetable && !eventInfo.event.allDay && <p className="text-sm truncate opacity-80">{eventInfo.timeText}</p>}
        </div>
    );

    if (isMobile) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    {eventDisplay}
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-slate-950/100 text-white border border-white/10 shadow-xl backdrop-blur-none">
                    {eventDetails}
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {eventDisplay}
            </TooltipTrigger>
            <TooltipContent className="w-64 bg-slate-950/100 text-white border border-white/10 shadow-xl backdrop-blur-none">
                {eventDetails}
            </TooltipContent>
        </Tooltip>
    );
  };


  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const todayStr = today.toISOString().slice(0, 10);

        // Fetch regular events, only upcoming
        const eventsQuery = query(
          collection(db, "events"),
          where("status", "==", "upcoming"),
          where("date", ">=", todayStr),
          orderBy("date", "asc")
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const regularEvents = eventsSnapshot.docs.map((doc) => {
          const data = doc.data() as Event;
          const startDateTime = new Date(`${data.date}T${data.time || '00:00'}:00`);
          
          const className = data.location === 'Seminar Hall'
              ? 'bg-purple-600/30 text-purple-100 border-l-4 border-purple-400 cursor-pointer'
              : 'bg-primary/30 text-primary-foreground border-l-4 border-primary cursor-pointer';

          return {
            id: doc.id,
            title: data.title,
            start: startDateTime,
            end: data.endTime ? new Date(`${data.date}T${data.endTime}:00`) : undefined,
            allDay: !data.time,
            extendedProps: { ...data, eventType: 'event' },
            className: className,
          };
        });


        const seminarQuery = query(
          collection(db, 'seminarBookings'),
          where('date', '>=', todayStr)
        );

        const seminarSnapshot = await getDocs(seminarQuery);
        const seminarBookings = seminarSnapshot.docs.map(doc => {
            const data = doc.data() as SeminarBooking;
            return {
                id: `sb-${doc.id}`,
                title: data.title,
                start: `${data.date}T${data.startTime}`,
                end: `${data.date}T${data.endTime}`,
                extendedProps: { ...data, eventType: 'booking' },
                className: 'bg-yellow-600/30 text-yellow-100 border-l-4 border-yellow-400 cursor-pointer'
            }
        });


        // Fetch timetable entries as recurring events
        const timetablesQuery = query(collection(db, "timetables"));
        const timetablesSnapshot = await getDocs(timetablesQuery);
        const timetableEvents = timetablesSnapshot.docs.map(doc => {
            const data = doc.data() as TimetableEntry;
            const dayOfWeek = data.dayOfWeek;

            if (typeof dayOfWeek !== 'number' || dayOfWeek < 1 || dayOfWeek > 6) {
                return null;
            }

            return {
                id: `tt-${doc.id}`,
                title: `${data.subject}`,
                startTime: data.startTime,
                endTime: data.endTime,
                daysOfWeek: [ dayOfWeek ], // 1=Mon, 2=Tue, etc.
                display: 'block',
                extendedProps: { ...data, eventType: 'timetable' },
                className: 'bg-secondary/30 text-secondary-foreground border-l-4 border-secondary cursor-pointer'
            };
        }).filter(Boolean);


        const allCalEvents = [...regularEvents, ...seminarBookings, ...timetableEvents];
        
        const filteredEvents = locationFilter
          ? allCalEvents.filter(e => {
              const eventLocation = e.extendedProps.location;
              const expectedLocationName = locationIdToNameMap[locationFilter] || locationFilter;
              // Robust filter: Check against both ID and Name
              return eventLocation === expectedLocationName || eventLocation === locationFilter;
            })
          : allCalEvents;

        setEvents(filteredEvents as any[]);
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
        <div className="backdrop-blur-none bg-white/10 rounded-xl border border-white/10 p-4 md:p-6">
        {loading ? (
            <div className="animate-pulse">
                <div className="h-12 bg-white/5 rounded-lg mb-4"></div>
                <div className="h-[600px] bg-white/5 rounded-lg"></div>
            </div>
        ) : (
            <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={showToolbar ? {
                left: 'prev,next today',
                center: 'title',
                right: headerToolbarRight
            } : false}
            initialView={initialView}
            initialDate={initialDate}
            weekends={true}
            events={events}
            displayEventTime={true}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateSelect}
            eventContent={renderEventContent}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="18:00:00"
            slotLabelInterval="01:00:00"
            slotDuration="01:00:00"
            eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
            }}
            />
        )}
        </div>
    </TooltipProvider>
  );
}
