
'use client';

import { useState, useEffect, useTransition } from 'react';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SeminarBooking, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { getAuthedUser } from '@/app/actions';

export default function SeminarHallManagerPage() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [bookings, setBookings] = useState<SeminarBooking[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<SeminarBooking>>({});
  const [user, setUser] = useState<User | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    getAuthedUser().then(u => setUser(u));
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
  
  const canAddManually = user?.role === 'faculty';

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!canAddManually) return;
    
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection

    setIsEditMode(false);
    setCurrentBooking({
        date: format(selectInfo.start, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        organizer: user?.name,
    });
    setIsFormOpen(true);
  };
  
  const handleEventClick = (clickInfo: EventClickArg) => {
    if (!canAddManually) return;
    
    const bookingId = clickInfo.event.id;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        handleEditClick(booking);
    }
  };

  const handleEditClick = (booking: SeminarBooking) => {
    setIsEditMode(true);
    setCurrentBooking(booking);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    const dataToSave: Omit<SeminarBooking, 'id'> = {
        title: currentBooking.title || '',
        organizer: currentBooking.organizer || user?.name || '',
        date: currentBooking.date || '',
        startTime: currentBooking.startTime || '',
        endTime: currentBooking.endTime || '',
    };
    
    if (!dataToSave.title || !dataToSave.organizer || !dataToSave.date || !dataToSave.startTime || !dataToSave.endTime) {
        toast({ title: "Missing Information", description: "Please fill all fields.", variant: "destructive" });
        return;
    }

    startTransition(async () => {
      try {
        if (isEditMode && currentBooking.id) {
          const entryRef = doc(db, "seminarBookings", currentBooking.id);
          await updateDoc(entryRef, {
            ...dataToSave,
            updatedAt: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, "seminarBookings"), {
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        toast({ title: "Success", description: "Seminar Hall schedule updated!" });
        setIsFormOpen(false);
        fetchSeminarBookings();
      } catch (error) {
        console.error("Error saving booking:", error);
        toast({ title: "Permission Error", description: (error as Error).message, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!currentBooking.id) return;
    startTransition(async () => {
      try {
        const entryRef = doc(db, "seminarBookings", currentBooking.id!);
        await deleteDoc(entryRef);
        toast({ title: "Success", description: "Booking deleted." });
        setIsFormOpen(false);
        fetchSeminarBookings();
      } catch (error) {
        console.error("Error deleting booking:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      }
    });
  };
  
  const calendarEvents = bookings.map(booking => ({
    id: booking.id,
    title: booking.title,
    start: `${booking.date}T${booking.startTime}`,
    end: `${booking.date}T${booking.endTime}`,
    extendedProps: booking,
    className: 'bg-primary/30 text-primary-foreground border-l-4 border-primary cursor-pointer'
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Seminar Hall Bookings</h1>
      </div>
      
      <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
        <p className="text-white/80 mb-6">
          {canAddManually 
            ? "Manage bookings for the Seminar Hall. Click on a date to add a new booking, or click an existing booking to edit. Approved event proposals for the hall will appear here automatically."
            : "View the Seminar Hall schedule. Only faculty can add or manage manual bookings."
          }
        </p>

        {loading || !user ? (
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
                selectable={canAddManually}
                selectMirror={true}
                dayMaxEvents={true}
                eventClick={handleEventClick}
                select={handleDateSelect}
                height="auto"
                displayEventTime={false}
            />
        )}
      </div>

      {canAddManually && (
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setIsEditMode(false); }}>
          <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={currentBooking.title || ''} onChange={e => setCurrentBooking({...currentBooking, title: e.target.value})} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="organizer" className="text-right">Organizer</Label>
                <Input id="organizer" value={currentBooking.organizer || ''} onChange={e => setCurrentBooking({...currentBooking, organizer: e.target.value})} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          variant={"outline"}
                          className={cn(
                              "col-span-3 justify-start text-left font-normal bg-transparent text-white hover:bg-white/10 hover:text-white",
                              !currentBooking.date && "text-muted-foreground"
                          )}
                          >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentBooking.date ? format(new Date(`${currentBooking.date}T00:00:00`), "PPP") : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={currentBooking.date ? new Date(`${currentBooking.date}T00:00:00`) : undefined}
                              onSelect={(date) => setCurrentBooking({...currentBooking, date: date ? format(date, 'yyyy-MM-dd') : ''})}
                              initialFocus
                          />
                      </PopoverContent>
                  </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">Time</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input id="startTime" type="time" value={currentBooking.startTime || ''} onChange={e => setCurrentBooking({...currentBooking, startTime: e.target.value})} />
                  <span>to</span>
                  <Input id="endTime" type="time" value={currentBooking.endTime || ''} onChange={e => setCurrentBooking({...currentBooking, endTime: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter className="justify-between">
              {isEditMode ? (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="mr-auto"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. This will permanently delete the booking.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                                  {isPending ? 'Deleting...' : 'Continue'}
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              ) : <div></div>}
              <div className="flex gap-2">
                  <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                  <Button onClick={handleSave} disabled={isPending}>
                      {isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    
