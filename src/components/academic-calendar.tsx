
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
  locationFilter
}: AcademicCalendarProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps;
    const isTimetable = props.eventType === 'timetable';
    const isSeminar = props.eventType === 'seminar';
    
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
            ) : isSeminar ? (
                <div className="space-y-1 text-sm">
                    <p><strong>Organizer:</strong> {props.organizer}</p>
                    <p><strong>Time:</strong> {props.startTime} - {props.endTime}</p>
                    <p><strong>Location:</strong> Seminar Hall</p>
                </div>
            ) : (
                <div className="space-y-1 text-sm">
                    <p><strong>Organizer:</strong> {props.organizer}</p>
                    <p><strong>Time:</strong> {new Date(eventInfo.event.startStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p><strong>Location:</strong> {props.location}</p>
                </div>
            )}
        </div>
    );

    const eventDisplay = (
        <div className='w-full h-full p-2 overflow-hidden text-left cursor-pointer'>
            <p className="font-semibold truncate text-lg">{eventInfo.event.title}</p>
            {!isTimetable && <p className="text-sm truncate opacity-80">{eventInfo.timeText}</p>}
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
            className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary cursor-pointer'
          };
        });

        // Fetch timetable entries
        const timetablesQuery = query(collection(db, "timetables"));
        const timetablesSnapshot = await getDocs(timetablesQuery);
        
        const today = new Date();
        const yearStart = new Date(today.getFullYear(), 0, 1); // January 1st
        const yearEnd = new Date(today.getFullYear(), 11, 31); // December 31st

        const timetableEvents = timetablesSnapshot.docs.flatMap(doc => {
            const data = doc.data() as TimetableEntry;
            
            if (typeof data.dayOfWeek !== 'number' || data.dayOfWeek < 1 || data.dayOfWeek > 6) { // 1=Monday, 6=Saturday
                return []; 
            }

            const daysInYear = [];
            let currentDay = new Date(yearStart);

            while (currentDay <= yearEnd) {
                // JS getDay() is 0 for Sunday, ..., 6 for Saturday. We map our 1-6 to this.
                const jsDay = currentDay.getDay(); 
                
                if (data.dayOfWeek === jsDay) {
                    const year = currentDay.getFullYear();
                    const month = currentDay.getMonth(); // 0-indexed
                    const date = currentDay.getDate();
                    
                    // Construct date string manually to avoid timezone issues with toISOString()
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    
                    daysInYear.push({
                        id: `tt-${doc.id}-${dateString}`,
                        title: `${data.subject}`,
                        start: `${dateString}T${data.startTime}`,
                        end: `${dateString}T${data.endTime}`,
                        allDay: false,
                        display: 'block',
                        extendedProps: { ...data, eventType: 'timetable' },
                        className: 'bg-secondary/30 text-secondary-foreground border-l-4 border-secondary cursor-pointer'
                    });
                }
                
                // Move to the next day
                currentDay.setDate(currentDay.getDate() + 1);
            }
            return daysInYear;
        });

        // Fetch seminar bookings
        const seminarBookingsQuery = query(collection(db, "seminarBookings"));
        const seminarBookingsSnapshot = await getDocs(seminarBookingsQuery);
        const seminarBookingEvents = seminarBookingsSnapshot.docs.map(doc => {
            const data = doc.data() as SeminarBooking;
            return {
                id: `sb-${doc.id}`,
                title: data.title,
                start: `${data.date}T${data.startTime}`,
                end: `${data.date}T${data.endTime}`,
                allDay: false,
                display: 'block',
                extendedProps: { ...data, eventType: 'seminar', location: 'seminar' },
                className: 'bg-purple-600/30 text-purple-100 border-l-4 border-purple-400 cursor-pointer'
            }
        });

        const allCalEvents = [...regularEvents, ...timetableEvents, ...seminarBookingEvents];
        
        const filteredEvents = locationFilter
          ? allCalEvents.filter(e => {
              const eventLocation = e.extendedProps.location;
              // Handle both short ID ("seminar") and full name ("Seminar Hall")
              const locationName = locationIdToNameMap[locationFilter] || locationFilter;
              return eventLocation === locationFilter || eventLocation === locationName;
            })
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
        <div className="backdrop-blur-none bg-white/10 rounded-xl border border-white/10 p-4 md:p-6">
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
            displayEventTime={false}
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
            />
        )}
        </div>
    </TooltipProvider>
  );
}
