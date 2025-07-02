
'use client';

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AcademicCalendar from '@/components/academic-calendar';
import type { User } from "@/types";
import type { DateSelectArg } from "@fullcalendar/core";
import { Textarea } from "./ui/textarea";
import { Sparkles, UploadCloud, X } from "lucide-react";
import { generateEventDescription } from "@/ai/flows/generate-event-description";
import { generateEventTakeaways } from "@/ai/flows/generate-event-takeaways";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import Image from "next/image";
import { createEventProposalAction } from "../app/dashboard/host-event/actions";

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

const equipmentList = [
  { id: 'wirelessMics', name: 'Wireless Mics', max: 2 },
  { id: 'collarMics', name: 'Collar Mics', max: 2 },
  { id: 'tables', name: 'Tables', max: 1 },
  { id: 'chairs', name: 'Chairs', max: 5 },
  { id: 'waterBottles', name: 'Water Bottles (packs)', max: 10, step: 1 },
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-50">
            {pending ? 'Submitting...' : 'Submit Event Request'}
        </button>
    );
}

const FileInput = ({ name, label, accepted, helpText, onFileChange }: { name: string, label: string, accepted: string, helpText: string, onFileChange: (file: File | null, preview: string | null) => void }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                onFileChange(file, result);
            };
            reader.readAsDataURL(file);
            setFileName(file.name);
        } else {
            setPreview(null);
            setFileName(null);
            onFileChange(null, null);
        }
    };

    const handleClear = () => {
        setPreview(null);
        setFileName(null);
        onFileChange(null, null);
        const input = document.getElementById(name) as HTMLInputElement;
        if(input) input.value = "";
    }

    return (
        <div className="space-y-2">
            <label className="text-white text-sm">{label}</label>
            <div className="w-full bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-4 text-center">
                {preview ? (
                    <div className="relative group">
                        <Image src={preview} alt="Preview" width={2560} height={650} className="w-full h-auto max-h-48 object-contain rounded-lg" />
                        <button type="button" onClick={handleClear} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/80 transition-opacity opacity-50 group-hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <UploadCloud className="w-10 h-10 text-white/50" />
                        <label htmlFor={name} className="relative cursor-pointer">
                            <span className="text-blue-400 font-semibold">Click to upload</span>
                            <input id={name} name={name} type="file" className="sr-only" accept={accepted} onChange={handleFileChange} />
                        </label>
                        <p className="text-xs text-white/50">{helpText}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

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
  const [isAllowed, setIsAllowed] = useState(false);
  const [userClubs, setUserClubs] = useState<{id: string, name: string}[]>([]);
  const [locationAvailability, setLocationAvailability] = useState<Record<string, boolean>>({});
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingTakeaways, setIsGeneratingTakeaways] = useState(false);

  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<string, number>>({
    wirelessMics: 0,
    collarMics: 0,
    tables: 0,
    chairs: 0,
    waterBottles: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    const equipmentString = equipmentList
      .map(item => {
        const quantity = equipmentQuantities[item.id];
        return quantity > 0 ? `${item.name}: ${quantity}` : null;
      })
      .filter(Boolean)
      .join('\n');
    setForm(prev => ({ ...prev, equipmentNeeds: equipmentString }));
  }, [equipmentQuantities]);

  const handleQuantityChange = (itemId: string, delta: number, max: number) => {
    setEquipmentQuantities(prev => {
        const currentQuantity = prev[itemId] || 0;
        const newQuantity = currentQuantity + delta;
        return {
            ...prev,
            [itemId]: Math.max(0, Math.min(newQuantity, max)),
        }
    });
  };

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
          <form action={createEventProposalAction} className="space-y-6">
             {/* Hidden inputs to pass state to server action */}
            <input type="hidden" name="clubId" value={form.clubId} />
            <input type="hidden" name="clubName" value={form.clubName} />
            <input type="hidden" name="date" value={form.date} />
            <input type="hidden" name="time" value={form.time} />
            <input type="hidden" name="equipmentNeeds" value={form.equipmentNeeds} />
            
            <div className="space-y-2">
              <label className="text-white text-sm">Event Title*</label>
              <input type="text" name="title" defaultValue={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="Enter event title" required />
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
                <Textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="A clear, engaging summary of what the event is about." required />
            </div>
            
            <FileInput name="headerImage" label="Header Image" accepted="image/jpeg, image/png" helpText="2560 x 650 pixels. JPG or PNG." onFileChange={() => {}} />
            <FileInput name="eventLogo" label="Event Logo" accepted="image/jpeg, image/png" helpText="1080 x 1080 pixels. JPG or PNG." onFileChange={() => {}} />

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
              <Textarea name="whatYouWillLearn" value={form.whatYouWillLearn} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="Use bullet points for key takeaways, e.g.,&#10;- How to build in the Cloud&#10;- Key resources and learning paths&#10;- Common pitfalls to avoid" />
            </div>

            <div className="space-y-2">
                <label className="text-white text-sm">Target Audience</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {availableCourses.map((course) => (
                    <div key={course} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-transparent has-[:checked]:border-blue-500/50 has-[:checked]:bg-blue-900/20 transition-all">
                        <Checkbox
                            id={`course-${course}`}
                            name="targetAudience"
                            value={course}
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
              <Textarea name="keySpeakers" defaultValue={form.keySpeakers} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="List each speaker on a new line, e.g.,&#10;Rakesh Varade - Google Cloud Specialist&#10;Jane Doe - AI Researcher" />
            </div>

             <div className="space-y-4">
              <label className="text-white text-sm">Equipment Needs (Optional)</label>
              {equipmentList.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <span className="text-white/90">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/10"
                      onClick={() => handleQuantityChange(item.id, -(item.step || 1), item.max)}
                      disabled={equipmentQuantities[item.id] <= 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{equipmentQuantities[item.id]}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/10"
                      onClick={() => handleQuantityChange(item.id, item.step || 1, item.max)}
                      disabled={equipmentQuantities[item.id] >= item.max}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>

             <div className="space-y-2">
                <label className="text-white text-sm">Budget & Funding (Optional)</label>
                <Textarea name="budgetDetails" defaultValue={form.budgetDetails} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Total budget: $500. Requesting $200 from college." />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">Select Location*</label>
              <select name="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
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
              <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                <option value="" className="bg-gray-800">Select a category</option>
                {categories.map(category => (<option key={category.id} value={category.name} className="bg-gray-800">{category.icon} {category.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">Registration Link (Optional)</label>
              <input name="registrationLink" type="url" defaultValue={form.registrationLink} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..." />
            </div>
            {user.role !== 'faculty' && userClubs.length > 0 && (
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">Hosting as Club</label>
                <select name="clubId" value={form.clubId} onChange={(e) => { const club = userClubs.find(c => c.id === e.target.value); setForm(prev => ({...prev, clubId: e.target.value, clubName: club?.name || '' })); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" required>
                  {userClubs.map(club => (<option key={club.id} value={club.id} className="bg-gray-800">{club.name}</option>))}
                </select>
              </div>
            )}
            <SubmitButton />
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
