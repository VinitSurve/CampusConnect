'use client';

import { useState, useEffect, useTransition } from 'react';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SeminarBooking } from '@/types';
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
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00'
];

type BookingGrid = {
  [day: string]: {
    [time: string]: (SeminarBooking & { isFirstHour: boolean; totalHours: number }) | null
  }
}

export default function SeminarHallManagerPage() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [bookings, setBookings] = useState<SeminarBooking[]>([]);
  const [bookingGrid, setBookingGrid] = useState<BookingGrid>({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<SeminarBooking>>({});

  const { toast } = useToast();

  useEffect(() => {
    fetchSeminarBookings();
  }, []);

  const fetchSeminarBookings = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'seminarBookings'),
        orderBy('startTime')
      );

      const querySnapshot = await getDocs(q);
      const entries: SeminarBooking[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SeminarBooking));

      setBookings(entries);
      organizeBookingsIntoGrid(entries);

    } catch (error) {
      console.error("Error fetching seminar bookings:", error);
      toast({ title: "Error", description: "Failed to load seminar hall schedule.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const organizeBookingsIntoGrid = (entries: SeminarBooking[]) => {
    const newGrid: BookingGrid = {};
    DAYS_OF_WEEK.forEach(day => {
      newGrid[day] = {};
      TIME_SLOTS.forEach(time => {
        newGrid[day][time] = null;
      });
    });

    entries.forEach(entry => {
      const dayOfWeekStr = DAYS_OF_WEEK[entry.dayOfWeek - 1];
      if (dayOfWeekStr && entry.startTime) {
        const startIndex = TIME_SLOTS.indexOf(entry.startTime);
        const endTime = entry.endTime ? entry.endTime : TIME_SLOTS[startIndex + 1];
        const endIndex = TIME_SLOTS.indexOf(endTime);
        const totalHours = endIndex > startIndex ? endIndex - startIndex : 1;

        if (startIndex !== -1) {
          for (let i = startIndex; i < endIndex && i < TIME_SLOTS.length; i++) {
            const timeSlot = TIME_SLOTS[i];
            const isFirstHour = i === startIndex;
            if (isFirstHour) {
               newGrid[dayOfWeekStr][timeSlot] = { ...entry, isFirstHour: true, totalHours: totalHours };
            } else {
               newGrid[dayOfWeekStr][timeSlot] = { ...entry, isFirstHour: false, totalHours: 0 };
            }
          }
        }
      }
    });
    setBookingGrid(newGrid);
  };

  const handleCellClick = (day: string, time: string, entry?: SeminarBooking) => {
    if (entry) {
      setCurrentBooking(entry);
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
      const startTime = time;
      const startTimeIndex = TIME_SLOTS.indexOf(startTime);
      const endTime = TIME_SLOTS[startTimeIndex + 1] || startTime; // Default to 1 hour
      setCurrentBooking({
        dayOfWeek: DAYS_OF_WEEK.indexOf(day) + 1,
        startTime: startTime,
        endTime: endTime,
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    const dataToSave = {
        title: currentBooking.title || '',
        organizer: currentBooking.organizer || '',
        dayOfWeek: Number(currentBooking.dayOfWeek),
        startTime: currentBooking.startTime || '',
        endTime: currentBooking.endTime || '',
    };
    
    if (!dataToSave.title || !dataToSave.organizer) {
        toast({ title: "Missing Information", description: "Please provide a title and organizer.", variant: "destructive" });
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Seminar Hall Schedule</h1>
      
      <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
        <p className="text-white/80 mb-6">Manage recurring weekly bookings for the Seminar Hall. For one-time events, please use the event proposal system.</p>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[auto_repeat(6,minmax(120px,1fr))] gap-1">
            <div className="p-2 text-sm font-semibold text-white/80 sticky left-0 z-10 bg-blue-900/50">Time</div>
            {DAYS_OF_WEEK.map(day => <div key={day} className="p-2 text-center text-sm font-semibold text-white/80">{day}</div>)}
            
            {TIME_SLOTS.map((time, index) => (
                <div key={time} className="contents">
                    <div className="p-2 text-sm font-semibold text-white/70 sticky left-0 z-10 bg-blue-900/50">
                        {`${time} - ${TIME_SLOTS[index+1] || '18:00'}`}
                    </div>
                    {DAYS_OF_WEEK.map(day => {
                        const entry = bookingGrid[day]?.[time];
                        if (loading) {
                            return <div key={`${day}-${time}`} className="h-20"><Skeleton className="w-full h-full bg-white/5" /></div>
                        }
                        if (entry?.isFirstHour) {
                            return (
                                <div key={`${day}-${time}`} 
                                    onClick={() => handleCellClick(day, time, entry)}
                                    className="p-2 rounded-lg bg-purple-500/20 text-white cursor-pointer hover:bg-purple-500/30 transition-colors text-center flex flex-col justify-center"
                                    style={{ gridRow: `span ${entry.totalHours || 1}`}}
                                >
                                    <p className="font-bold text-sm">{entry.title}</p>
                                    <p className="text-xs text-white/80">{entry.organizer}</p>
                                </div>
                            );
                        }
                        if (entry && !entry.isFirstHour) {
                           return null;
                        }
                        return (
                            <div key={`${day}-${time}`} 
                                onClick={() => handleCellClick(day, time)}
                                className="h-20 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center text-white/30"
                            >+</div>
                        );
                    })}
                </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
}
