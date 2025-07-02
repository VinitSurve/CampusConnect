'use client';

import { useState, useTransition, useMemo } from 'react';
import AcademicCalendar from "@/components/academic-calendar";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addTimetableEntry } from '@/app/admin/actions';
import type { TimetableEntry } from '@/types';

const courses = ["BCA", "BBA", "BAF", "MBA"];
const courseYears: { [key: string]: string[] } = {
  BCA: ["1", "2", "3"],
  BBA: ["1", "2", "3"],
  BAF: ["1", "2", "3"],
  MBA: ["1", "2"],
};
const divisions = ["A", "B", "C"];
const daysOfWeek = [
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

const initialFormState: Omit<TimetableEntry, 'id'> = {
    course: '',
    year: '',
    division: '',
    subject: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
    location: '',
    facultyName: ''
};

export default function AdminCalendarPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormState);

  const handleCourseChange = (course: string) => {
    setFormData(prev => ({ ...prev, course, year: '' }));
  };

  const handleFormChange = (field: keyof typeof formData, value: string | number) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addTimetableEntry({
          ...formData,
          dayOfWeek: Number(formData.dayOfWeek)
      });
      if (result.success) {
        toast({ title: "Success", description: "Timetable entry added successfully!" });
        setIsDialogOpen(false);
        setFormData(initialFormState);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const availableYears = useMemo(() => {
      if (!formData.course) return [];
      return courseYears[formData.course] || [];
  }, [formData.course]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Campus Timetable</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Timetable Entry
        </Button>
      </div>
      <AcademicCalendar />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Add New Timetable Entry</DialogTitle>
                  <DialogDescription>
                      Fill in the details for the recurring class schedule.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="course" className="text-right">Course</Label>
                        <Select value={formData.course} onValueChange={handleCourseChange}>
                            <SelectTrigger id="course" className="col-span-3">
                                <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                         <div className="grid grid-cols-2 items-center gap-4 col-start-3">
                            <Label htmlFor="year" className="text-right">Year</Label>
                            <Select value={formData.year} onValueChange={(val) => handleFormChange('year', val)} disabled={!formData.course}>
                                <SelectTrigger id="year">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <Label htmlFor="division" className="text-right">Division</Label>
                            <Select value={formData.division} onValueChange={(val) => handleFormChange('division', val)}>
                                <SelectTrigger id="division">
                                    <SelectValue placeholder="Div" />
                                </SelectTrigger>
                                <SelectContent>
                                    {divisions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">Subject</Label>
                        <Input id="subject" value={formData.subject} onChange={e => handleFormChange('subject', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="facultyName" className="text-right">Faculty</Label>
                        <Input id="facultyName" value={formData.facultyName} onChange={e => handleFormChange('facultyName', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dayOfWeek" className="text-right">Day</Label>
                        <Select value={String(formData.dayOfWeek)} onValueChange={(val) => handleFormChange('dayOfWeek', val)}>
                            <SelectTrigger id="dayOfWeek" className="col-span-3">
                                <SelectValue placeholder="Select Day" />
                            </SelectTrigger>
                            <SelectContent>
                                {daysOfWeek.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-4 col-start-3">
                            <Label htmlFor="startTime" className="text-right">Start Time</Label>
                            <Input id="startTime" type="time" value={formData.startTime} onChange={e => handleFormChange('startTime', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <Label htmlFor="endTime" className="text-right">End Time</Label>
                            <Input id="endTime" type="time" value={formData.endTime} onChange={e => handleFormChange('endTime', e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Location</Label>
                        <Input id="location" value={formData.location} onChange={e => handleFormChange('location', e.target.value)} className="col-span-3" placeholder="e.g., Lab 401"/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Entry'}
                    </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
