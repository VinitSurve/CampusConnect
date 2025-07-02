
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, query, where, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import AcademicCalendar from '@/components/academic-calendar';
import type { User } from "@/types";
import type { DateSelectArg } from "@fullcalendar/core";
import { Textarea } from "./ui/textarea";
import { Sparkles } from "lucide-react";
import { generateEventDescription } from "@/ai/flows/generate-event-description";
import { generateEventTakeaways } from "@/ai/flows/generate-event-takeaways";
import { Checkbox } from "@/components/ui/checkbox";

interface HostEventFormProps {
    user: User;
}

const locations = [
    { id: "lab401", name: "Lab 401", icon: "🏫" },
    { id: "lab402", name: "Lab 402", icon: "🏫" },
    { id: "lab503", name: "Lab 503", icon: "🏫" },
    { id: "seminar", name: "Seminar Hall", icon: "🎪" }
];

const categories = [
    { id: "academic", name: "Academic", icon: "🎓" },
    { id: "cultural", name: "Cultural", icon: "🎭" },
    { id: "technical", name: "Technical", icon: "💻" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "workshop", name: "Workshop", icon: "🛠️" }
];

const availableCourses = ["All Students", "BCA", "BBA", "BAF", "MBA"];

export default function HostEventForm({ user }: HostEventFormProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAudience: [] as string[],
    keySpeakers: "",
    equipmentNeeds: "",
    budgetDetails: "",
    whatYouWillLearn: "",
    location: "seminar",
    category: "",
    registrationLink: "",
    clubId: "",
    clubName: "",
    date: "",
    time: ""
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userClubs, setUserClubs] = useState<{id: string, name: string}[]>([]);
  const [locationAvailability, setLocationAvailability] = useState<Record<string, boolean>>({});
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingTakeaways, setIsGeneratingTakeaways] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) return;

      try {
        if (user.role === 'faculty') {
          setIsAllowed(true);
          setForm(prev => ({...prev, clubName: user.name || 'Faculty Event' }));
          return;
        }

        const clubsQuery = query(
          collection(db, "clubs"),
          where("leadId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(clubsQuery);
        if (!querySnapshot.empty) {
            const clubs = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setUserClubs(clubs);
            setIsAllowed(true);
            if (clubs.length > 0) {
              setForm(prev => ({
                ...prev,
                clubId: clubs[0].id,
                clubName: clubs[0].name
              }));
            }
        } else {
            setIsAllowed(false);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        toast({ title: "Error", description: "Could not verify your permissions.", variant: "destructive"});
      }
    };
    checkPermissions();
  }, [user, toast]);

  const checkLocationAvailability = async (date: Date) => {
    try {
      setSelectedDate(date);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const q = query(
        collection(db, "events"),
        where("date", ">=", startOfDay.toISOString().split('T')[0]),
        where("date", "<=", endOfDay.toISOString().split('T')[0])
      );
      
      const querySnapshot = await getDocs(q);
      const bookedLocations = new Set(querySnapshot.docs.map(d => d.data().location));

      const availability: Record<string, boolean> = {};
      locations.forEach(loc => {
        availability[loc.id] = !bookedLocations.has(loc.id);
      });
      setLocationAvailability(availability);
    } catch (error) {
      console.error("Error checking availability:", error);
      const availability: Record<string, boolean> = {};
      locations.forEach(loc => { availability[loc.id] = true; });
      setLocationAvailability(availability);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDateTime = selectInfo.start;
    const dateStr = selectedDateTime.toISOString().split('T')[0];
    const timeStr = selectedDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    setForm(prev => ({ ...prev, date: dateStr, time: timeStr }));
    checkLocationAvailability(selectedDateTime);
    setSelectedDate(selectedDateTime);
    toast({ title: "Date Selected", description: `You selected ${selectedDateTime.toLocaleString()}` });
  };

  const handleGenerateDescription = async () => {
    if (!form.title) {
        toast({
            title: "Title needed",
            description: "Please enter an event title first to generate a description.",
            variant: "destructive",
        });
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const description = await generateEventDescription({ title: form.title });
        setForm(prev => ({ ...prev, description }));
    } catch (error) {
        console.error("Error generating description:", error);
        toast({
            title: "AI Error",
            description: "Failed to generate description. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleGenerateTakeaways = async () => {
    if (!form.title || !form.description) {
        toast({
            title: "Info needed",
            description: "Please enter an event title and description first to generate takeaways.",
            variant: "destructive",
        });
        return;
    }
    setIsGeneratingTakeaways(true);
    try {
        const takeaways = await generateEventTakeaways({ title: form.title, description: form.description });
        setForm(prev => ({ ...prev, whatYouWillLearn: takeaways }));
    } catch (error) {
        console.error("Error generating takeaways:", error);
        toast({
            title: "AI Error",
            description: "Failed to generate takeaways. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsGeneratingTakeaways(false);
    }
  };

  const handleAudienceChange = (course: string) => {
    setForm(prev => {
        const currentAudience = prev.targetAudience || [];
        const newAudience = currentAudience.includes(course)
            ? currentAudience.filter(c => c !== course)
            : [...currentAudience, course];
        return { ...prev, targetAudience: newAudience };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      toast({ title: "Validation Error", description: "Please select a date and time from the calendar.", variant: "destructive" });
      return;
    }
    if (!form.title || !form.location || !form.category || !form.description) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "eventRequests"), {
        ...form,
        createdBy: user.uid,
        creatorEmail: user.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success!", description: "Event request submitted successfully!" });
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Error submitting event:", error);
      toast({ title: "Submission Error", description: "Failed to submit event request.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 mb-6">
            Only faculty members and designated club leads can host events.
          </p>
          <Link
            href="/dashboard/events"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Host New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-white text-sm">Event Title*</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="Enter event title" required />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-white text-sm">Event Description*</label>
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDesc || !form.title}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className={`h-4 w-4 ${isGeneratingDesc ? 'animate-spin' : ''}`} />
                        {isGeneratingDesc ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="A clear, engaging summary of what the event is about." required />
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-white text-sm">What You'll Learn</label>
                    <button
                        type="button"
                        onClick={handleGenerateTakeaways}
                        disabled={isGeneratingTakeaways || !form.title || !form.description}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className={`h-4 w-4 ${isGeneratingTakeaways ? 'animate-spin' : ''}`} />
                        {isGeneratingTakeaways ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
              <Textarea value={form.whatYouWillLearn} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="Use bullet points for key takeaways, e.g.,&#10;- How to build in the Cloud&#10;- Key resources and learning paths&#10;- Common pitfalls to avoid" />
            </div>

            <div className="space-y-2">
                <label className="text-white text-sm">Target Audience</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {availableCourses.map((course) => (
                    <div key={course} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-transparent has-[:checked]:border-blue-500/50 has-[:checked]:bg-blue-900/20 transition-all">
                        <Checkbox
                        id={`course-${course}`}
                        checked={(form.targetAudience || []).includes(course)}
                        onCheckedChange={() => handleAudienceChange(course)}
                        className="h-5 w-5"
                        />
                        <label
                        htmlFor={`course-${course}`}
                        className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow"
                        >
                        {course}
                        </label>
                    </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">Key Speakers or Guests (Optional)</label>
              <Textarea value={form.keySpeakers} onChange={(e) => setForm({ ...form, keySpeakers: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="List each speaker on a new line, e.g.,&#10;Rakesh Varade - Google Cloud Specialist&#10;Jane Doe - AI Researcher" />
            </div>

            <div className="space-y-2">
                <label className="text-white text-sm">Equipment Needs (Optional)</label>
                <Textarea value={form.equipmentNeeds} onChange={(e) => setForm({ ...form, equipmentNeeds: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Projector, 2 microphones, whiteboard" />
            </div>
             <div className="space-y-2">
                <label className="text-white text-sm">Budget & Funding (Optional)</label>
                <Textarea value={form.budgetDetails} onChange={(e) => setForm({ ...form, budgetDetails: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Total budget: $500. Requesting $200 from college." />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">Select Location*</label>
              <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                <option value="" className="bg-gray-800">Select a location to filter calendar</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id} className="bg-gray-800" disabled={!!selectedDate && !locationAvailability[location.id]}>
                    {location.icon} {location.name} {!!selectedDate && !locationAvailability[location.id] ? '(Booked)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">Select Category*</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                <option value="" className="bg-gray-800">Select a category</option>
                {categories.map(category => (<option key={category.id} value={category.name} className="bg-gray-800">{category.icon} {category.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">Registration Link (Optional)</label>
              <input type="url" value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..." />
            </div>
            {user.role !== 'faculty' && userClubs.length > 0 && (
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">Hosting as Club</label>
                <select value={form.clubId} onChange={(e) => { const club = userClubs.find(c => c.id === e.target.value); setForm(prev => ({...prev, clubId: e.target.value, clubName: club?.name || '' })); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" required>
                  {userClubs.map(club => (<option key={club.id} value={club.id} className="bg-gray-800">{club.name}</option>))}
                </select>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Event Request'}
            </button>
          </form>
        </div>
        <div className="sticky top-24">
          <AcademicCalendar
            onDateSelect={handleDateSelect}
            initialView="dayGridMonth"
            headerToolbarRight=""
            locationFilter={form.location}
          />
          {selectedDate && (
            <div className="mt-4 backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-medium text-white mb-4">Location Availability for {selectedDate.toLocaleDateString()}</h3>
              <div className="space-y-3">
                {locations.map(location => (
                  <div key={location.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white">{location.icon} {location.name}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${locationAvailability[location.id] ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {locationAvailability[location.id] ? 'Available' : 'Booked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
