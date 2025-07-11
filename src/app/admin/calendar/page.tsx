
'use client';

import { useState, useEffect, useTransition } from 'react';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TimetableEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Printer, Upload, Download, Share2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00'
];

const courses = ["BCA", "BBA", "BAF", "MBA"];
const courseYears: { [key: string]: string[] } = {
  BCA: ["1", "2", "3"],
  BBA: ["1", "2", "3"],
  BAF: ["1", "2", "3"],
  MBA: ["1", "2"],
};
const divisions = ["A", "B", "C"];
const locations = ["Lab 401", "Lab 402", "Lab 503"];


type TimetableGrid = {
  [day: string]: {
    [time: string]: (TimetableEntry & { isFirstHour: boolean; totalHours: number }) | null
  }
}

export default function TimetableManagerPage() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [timetableGrid, setTimetableGrid] = useState<TimetableGrid>({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<TimetableEntry>>({});

  const { toast } = useToast();

  const availableYears = selectedCourse ? courseYears[selectedCourse] || [] : [];

  useEffect(() => {
    if (selectedCourse && selectedYear && selectedDivision) {
      fetchTimetableData(selectedCourse, selectedYear, selectedDivision);
    } else {
      setTimetableEntries([]);
      setTimetableGrid({});
      setLoading(false);
    }
  }, [selectedCourse, selectedYear, selectedDivision]);

  const fetchTimetableData = async (course: string, year: string, division: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'timetables'),
        where('course', '==', course),
        where('year', '==', year),
        where('division', '==', division)
      );

      const querySnapshot = await getDocs(q);
      const entries: TimetableEntry[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry));

      setTimetableEntries(entries);
      organizeEntriesIntoGrid(entries);

    } catch (error) {
      console.error("Error fetching timetable:", error);
      toast({ title: "Error", description: "Failed to load timetable data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const organizeEntriesIntoGrid = (entries: TimetableEntry[]) => {
    const newGrid: TimetableGrid = {};
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
    setTimetableGrid(newGrid);
  };

  const handleCellClick = (day: string, time: string, entry?: TimetableEntry) => {
    if (!selectedCourse || !selectedYear || !selectedDivision) {
        toast({ title: "Select a class", description: "Please select a course, year, and division first.", variant: "destructive" });
        return;
    }

    if (entry) {
      setCurrentEntry(entry);
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
      const startTime = time;
      const startTimeIndex = TIME_SLOTS.indexOf(startTime);
      const endTime = TIME_SLOTS[startTimeIndex + 1] || startTime; // Default to 1 hour
      setCurrentEntry({
        dayOfWeek: DAYS_OF_WEEK.indexOf(day) + 1,
        startTime: startTime,
        endTime: endTime,
 location: 'Seminar Hall', // Default location
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!selectedCourse || !selectedYear || !selectedDivision) {
        toast({ title: "Error", description: "Please select a class first.", variant: "destructive" });
        return;
    }
    // Prepare a clean data object to save
    const dataToSave = {
        subject: currentEntry.subject || '',
        facultyName: currentEntry.facultyName || '',
        location: currentEntry.location || 'Seminar Hall',
        course: selectedCourse,
        year: selectedYear,
        division: selectedDivision,
        dayOfWeek: Number(currentEntry.dayOfWeek),
        startTime: currentEntry.startTime || '',
        endTime: currentEntry.endTime || '',
    };

    startTransition(async () => {
      try {
        if (isEditMode && currentEntry.id) {
          // Update existing document
          const entryRef = doc(db, "timetables", currentEntry.id);
          await updateDoc(entryRef, {
            ...dataToSave,
            updatedAt: serverTimestamp()
          });
        } else {
          // Add new document
          await addDoc(collection(db, "timetables"), {
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        toast({ title: "Success", description: "Timetable updated!" });
        setIsFormOpen(false);
        // Refetch data to update the UI
        fetchTimetableData(selectedCourse, selectedYear, selectedDivision);
      } catch (error) {
        console.error("Error saving timetable entry:", error);
        toast({ title: "Permission Error", description: (error as Error).message, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!currentEntry.id) return;
    startTransition(async () => {
      try {
        const entryRef = doc(db, "timetables", currentEntry.id!);
        await deleteDoc(entryRef);
        toast({ title: "Success", description: "Timetable entry deleted." });
        setIsFormOpen(false);
        fetchTimetableData(selectedCourse, selectedYear, selectedDivision);
      } catch (error) {
        console.error("Error deleting timetable entry:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="print-header hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-white">CampusConnect Timetable</h1>
        <p className="text-white/80">{new Date().toLocaleDateString()}</p>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4 print:hidden">Lab Timetable Manager</h1>
      
      <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCourse} onValueChange={val => { setSelectedCourse(val); setSelectedYear(''); }}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Course..." /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedCourse}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Year..." /></SelectTrigger>
              <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedDivision} onValueChange={setSelectedDivision} disabled={!selectedYear}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Division..." /></SelectTrigger>
              <SelectContent>{divisions.map(d => <SelectItem key={d} value={d}>Division {d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

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
                        const entry = timetableGrid[day]?.[time];
                        if (loading) {
                            return <div key={`${day}-${time}`} className="h-20"><Skeleton className="w-full h-full bg-white/5" /></div>
                        }
                        if (entry?.isFirstHour) {
                            return (
                                <div key={`${day}-${time}`} 
                                    onClick={() => handleCellClick(day, time, entry)}
                                    className="p-2 rounded-lg bg-blue-500/20 text-white cursor-pointer hover:bg-blue-500/30 transition-colors text-center flex flex-col justify-center"
                                    style={{ gridRow: `span ${entry.totalHours || 1}`}}
                                >
                                    <p className="font-bold text-sm">{entry.subject}</p>
                                    <p className="text-xs text-white/80">{entry.facultyName}</p>
                                    <p className="text-xs text-white/60">{entry.location}</p>
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
            <DialogTitle>{isEditMode ? 'Edit Timetable Entry' : 'Add New Entry'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">Subject</Label>
              <Input id="subject" value={currentEntry.subject || ''} onChange={e => setCurrentEntry({...currentEntry, subject: e.target.value})} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="facultyName" className="text-right">Faculty</Label>
              <Input id="facultyName" value={currentEntry.facultyName || ''} onChange={e => setCurrentEntry({...currentEntry, facultyName: e.target.value})} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Select value={currentEntry.location} onValueChange={val => setCurrentEntry({...currentEntry, location: val})}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                        {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                    </SelectContent>
                </Select>
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
                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the entry.</AlertDialogDescription>
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
                <Button onClick={handleSave} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
