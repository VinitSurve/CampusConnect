
'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AcademicCalendar from '@/components/academic-calendar';
import type { User } from "@/types";
import type { DateSelectArg } from "@fullcalendar/core";
import { Textarea } from "./ui/textarea";
import { Sparkles, UploadCloud, X, Check } from "lucide-react";
import { generateEventDetails } from "@/ai/flows/generate-event-details";
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
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Submitting...' : 'Submit Event Request'}
        </Button>
    );
}

const FileInput = ({ name, label, accepted, helpText, onFileChange, currentPreview }: { name: string, label: string, accepted: string, helpText: string, onFileChange: (name: string, file: File | null) => void, currentPreview: string | null }) => {
    const [preview, setPreview] = useState<string | null>(currentPreview);

    useEffect(() => {
        setPreview(currentPreview);
    }, [currentPreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onFileChange(name, file);
        }
    };

    const handleClear = () => {
        setPreview(null);
        onFileChange(name, null);
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

const formSteps = [
    { id: 1, name: "Event Details" },
    { id: 2, name: "Content & Audience" },
    { id: 3, name: "Logistics & Media" }
];

export default function HostEventForm({ user }: HostEventFormProps) {
  const [step, setStep] = useState(1);
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
    time: "",
    headerImage: null as File | null,
    eventLogo: null as File | null,
  });

  const [previews, setPreviews] = useState({
      headerImage: null as string | null,
      eventLogo: null as string | null
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userClubs, setUserClubs] = useState<{id: string, name: string}[]>([]);
  const [locationAvailability, setLocationAvailability] = useState<Record<string, boolean>>({});
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);


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

        const clubsQuery = query(collection(db, "clubs"), where("leadId", "==", user.uid));
        const querySnapshot = await getDocs(clubsQuery);
        if (!querySnapshot.empty) {
            const clubs = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setUserClubs(clubs);
            setIsAllowed(true);
            if (clubs.length > 0) {
              setForm(prev => ({ ...prev, clubId: clubs[0].id, clubName: clubs[0].name }));
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
      const dateStr = date.toISOString().split('T')[0];
      const q = query(collection(db, "events"), where("date", "==", dateStr));
      
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
  
  const handleGenerateDetails = async () => {
      if (!form.title) {
          toast({ title: "Title needed", description: "Please enter an event title first.", variant: "destructive" });
          return;
      }
      setIsGeneratingDetails(true);
      try {
          const result = await generateEventDetails({ title: form.title });
          setForm(prev => ({
              ...prev,
              description: result.description,
              category: result.category,
              whatYouWillLearn: result.whatYouWillLearn,
              targetAudience: result.targetAudience,
          }));
          toast({ title: "AI Generated Content", description: "Event details have been filled in. Please review." });
      } catch (error) {
          console.error("Error generating details:", error);
          toast({ title: "AI Error", description: "Failed to generate details.", variant: "destructive" });
      } finally {
          setIsGeneratingDetails(false);
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

  const handleFileChange = (name: string, file: File | null) => {
    setForm(prev => ({ ...prev, [name]: file }));
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
             setPreviews(prev => ({ ...prev, [name]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else {
        setPreviews(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = () => {
      let isValid = true;
      let message = "Please fill all required fields.";
      if (step === 1) {
          if (!form.title || !form.description || !form.category) isValid = false;
      }
      if (step === 2) {
          if (form.targetAudience.length === 0) isValid = false;
      }
      if (step === 3) {
          if (!form.date || !form.time) {
              isValid = false;
              message = "Please select a date and time from the calendar.";
          }
      }
      if (!isValid) {
          toast({ title: "Missing Information", description: message, variant: "destructive"});
      }
      return isValid;
  };

  const handleNext = () => {
      if (validateStep()) {
          setStep(s => s + 1);
      }
  };

  const handleBack = () => setStep(s => s - 1);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep()) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
        if (value) {
            if (key === 'targetAudience' && Array.isArray(value)) {
                value.forEach(item => formData.append(key, item));
            } else if (value instanceof File) {
                formData.append(key, value);
            } else {
                formData.append(key, value as string);
            }
        }
    });

    try {
        await createEventProposalAction(formData);
        toast({title: "Success!", description: "Your event proposal has been submitted for review."});
    } catch (error) {
        toast({title: "Submission Error", description: (error as Error).message, variant: "destructive"});
    }
  };


  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 mb-6">Only faculty members and designated club leads can host events.</p>
          <Link href="/dashboard/events" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
            {/* Steps Indicator */}
            <div className="flex items-center space-x-2 sm:space-x-4 mb-8">
                {formSteps.map((s, index) => (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${step >= s.id ? 'bg-blue-600' : 'bg-white/10 border-2 border-white/20'}`}>
                                {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                            </div>
                            <span className={`text-sm sm:text-base font-medium transition-all hidden sm:block ${step >= s.id ? 'text-white' : 'text-white/50'}`}>{s.name}</span>
                        </div>
                        {index < formSteps.length - 1 && <div className="flex-grow h-0.5 bg-white/20"></div>}
                    </React.Fragment>
                ))}
            </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <input type="hidden" name="clubId" value={form.clubId} />
            <input type="hidden" name="clubName" value={form.clubName} />
            <input type="hidden" name="date" value={form.date} />
            <input type="hidden" name="time" value={form.time} />
            <input type="hidden" name="equipmentNeeds" value={form.equipmentNeeds} />
            
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                    <div className="space-y-2">
                        <label className="text-white text-sm">Event Title*</label>
                        <input type="text" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="Enter event title" required />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-white text-sm">Event Details</label>
                             <Button type="button" onClick={handleGenerateDetails} disabled={isGeneratingDetails || !form.title} size="sm" variant="outline" className="bg-white/10 text-xs">
                                <Sparkles className={`mr-1.5 h-4 w-4 ${isGeneratingDetails ? 'animate-spin' : ''}`} />
                                {isGeneratingDetails ? 'Generating...' : 'Generate with AI'}
                            </Button>
                        </div>
                        <label className="text-white/70 text-xs">Event Description*</label>
                        <Textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="A clear, engaging summary of what the event is about." required rows={6} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-white text-sm">Select Category*</label>
                        <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                            <option value="" className="bg-gray-800">Select a category</option>
                            {categories.map(category => (<option key={category.id} value={category.name} className="bg-gray-800">{category.icon} {category.name}</option>))}
                        </select>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                    <div className="space-y-2">
                        <label className="text-white text-sm">Target Audience*</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            {availableCourses.map((course) => (
                                <div key={course} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-transparent has-[:checked]:border-blue-500/50 has-[:checked]:bg-blue-900/20 transition-all">
                                    <Checkbox id={`course-${course}`} name="targetAudience" value={course} checked={form.targetAudience.includes(course)} onCheckedChange={() => handleAudienceChange(course)} className="h-5 w-5" />
                                    <label htmlFor={`course-${course}`} className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow">{course}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white text-sm">What You'll Learn</label>
                        <Textarea name="whatYouWillLearn" value={form.whatYouWillLearn} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="Use bullet points for key takeaways, e.g.,&#10;- How to build in the Cloud&#10;- Key resources and learning paths&#10;- Common pitfalls to avoid" rows={6}/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white text-sm">Key Speakers or Guests (Optional)</label>
                        <Textarea name="keySpeakers" value={form.keySpeakers} onChange={(e) => setForm({ ...form, keySpeakers: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="List each speaker on a new line, e.g.,&#10;Rakesh Varade - Google Cloud Specialist&#10;Jane Doe - AI Researcher" />
                    </div>
                </div>
            )}
            
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                    <FileInput name="headerImage" label="Header Image" accepted="image/jpeg, image/png" helpText="2560 x 650 pixels. JPG or PNG." onFileChange={handleFileChange} currentPreview={previews.headerImage} />
                    <FileInput name="eventLogo" label="Event Logo" accepted="image/jpeg, image/png" helpText="1080 x 1080 pixels. JPG or PNG." onFileChange={handleFileChange} currentPreview={previews.eventLogo} />

                     <div className="space-y-4">
                        <label className="text-white text-sm">Equipment Needs (Optional)</label>
                        {equipmentList.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                            <span className="text-white/90">{item.name}</span>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="outline" size="icon" className="h-8 w-8 bg-white/10" onClick={() => handleQuantityChange(item.id, -(item.step || 1), item.max)} disabled={(equipmentQuantities[item.id] || 0) <= 0}>-</Button>
                                <span className="w-8 text-center font-medium">{equipmentQuantities[item.id]}</span>
                                <Button type="button" variant="outline" size="icon" className="h-8 w-8 bg-white/10" onClick={() => handleQuantityChange(item.id, item.step || 1, item.max)} disabled={(equipmentQuantities[item.id] || 0) >= item.max}>+</Button>
                            </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-white text-sm">Budget & Funding (Optional)</label>
                        <Textarea name="budgetDetails" value={form.budgetDetails} onChange={(e) => setForm({ ...form, budgetDetails: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Total budget: $500. Requesting $200 from college." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-white text-sm">Registration Link (Optional)</label>
                        <input name="registrationLink" type="url" value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..." />
                    </div>

                    {user.role !== 'faculty' && userClubs.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-white text-sm font-medium mb-2">Hosting as Club</label>
                            <select name="clubId" value={form.clubId} onChange={(e) => { const club = userClubs.find(c => c.id === e.target.value); setForm(prev => ({...prev, clubId: e.target.value, clubName: club?.name || '' })); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" required>
                            {userClubs.map(club => (<option key={club.id} value={club.id} className="bg-gray-800">{club.name}</option>))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                <div>
                    {step > 1 && <Button type="button" variant="outline" onClick={handleBack} className="bg-white/10">Back</Button>}
                </div>
                <div>
                    {step < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
                    {step === 3 && <SubmitButton />}
                </div>
            </div>

          </form>
        </div>
        <div className="sticky top-24">
          <div className="space-y-2 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white">Select Date & Time*</h3>
              <p className="text-sm text-white/70">Click a date on the calendar below to select it. This will also show you which locations are already booked on that day.</p>
          </div>
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
