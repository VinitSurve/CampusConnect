
'use client';

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AcademicCalendar from '@/components/academic-calendar';
import type { User, EventProposal, Event } from "@/types";
import type { DateSelectArg } from "@fullcalendar/core";
import { Textarea } from "./ui/textarea";
import { Sparkles, Check, Plus, ArrowLeft, FileText, Mic, Trophy, Presentation, Hammer, Calendar, Clock, Edit } from "lucide-react";
import { generateEventDetails } from "@/ai/flows/generate-event-details";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import { handleEventMediaUpload } from "../app/dashboard/host-event/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProposals } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { 
    FileInput, 
    ProposalList,
    TemplateCard,
    EquipmentSelector,
    EMPTY_FORM,
    EMPTY_EQUIPMENT_STATE,
    locations,
    categories,
    templates,
    availableCourses,
    formSteps
} from './host-event-form-parts';

interface HostEventFormProps {
    user: User;
    proposals: EventProposal[];
}

export default function HostEventForm({ user, proposals: initialProposals }: HostEventFormProps) {
  const [view, setView] = useState<'list' | 'templates' | 'form'>('list');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [equipment, setEquipment] = useState(EMPTY_EQUIPMENT_STATE);
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates | 'scratch' | null>(null);
  const [previews, setPreviews] = useState({ headerImage: null as string | null, eventLogo: null as string | null });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [tempTime, setTempTime] = useState<{ start: string; end: string } | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userClubs, setUserClubs] = useState<{id: string, name: string}[]>([]);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [proposals, setProposals] = useState(initialProposals);
  const [previewChannel, setPreviewChannel] = useState<BroadcastChannel | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const channel = new BroadcastChannel('event_preview_channel');
    setPreviewChannel(channel);

    return () => {
        channel.close();
    };
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !db) return;
      try {
        let clubs: { id: string; name: string; }[] = [];
        if (user.role === 'faculty') {
          setIsAllowed(true);
          setForm((prev:any) => ({...prev, clubName: user.name || 'Faculty Event' }));
        } else {
            const clubsQuery = query(collection(db, "clubs"), where("leadId", "==", user.uid));
            const querySnapshot = await getDocs(clubsQuery);
            if (!querySnapshot.empty) {
                clubs = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setUserClubs(clubs);
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
            }
        }
        
        if (clubs.length > 0) {
            setForm((prev: any) => ({ ...prev, clubId: clubs[0].id, clubName: clubs[0].name }));
        }

      } catch (error) {
        console.error("Error checking permissions:", error);
        toast({ title: "Error", description: "Could not verify your permissions.", variant: "destructive"});
      }
    };
    checkPermissions();
  }, [user, toast]);

  const getOrganizerName = () => {
    // Priority 1: Use the explicitly set club name from the form state
    if (form.clubName) return form.clubName;
    
    // Priority 2: If the user is a club lead, use their first club's name.
    if (user.role !== 'faculty' && userClubs.length > 0) return userClubs[0].name;
    
    // Priority 3: If it's a faculty member, use their name.
    if (user.role === 'faculty') return user.name || 'Faculty Event';
    
    // Final fallback.
    return 'CampusConnect';
  };

  const { liveProposals, completedProposals, draftProposals, rejectedProposals } = useMemo(() => {
    const now = new Date();
    const pendingAndDraft = proposals.filter(p => p.status === 'pending' || p.status === 'draft');
    return {
      liveProposals: proposals.filter(p => p.status === 'approved' && new Date(p.date) >= now),
      completedProposals: proposals.filter(p => p.status === 'approved' && new Date(p.date) < now),
      draftProposals: pendingAndDraft, // Combining pending and draft for simplicity in one view
      rejectedProposals: proposals.filter(p => p.status === 'rejected'),
    };
  }, [proposals]);

  const mapFormToEventPreview = (): Event => {
    const getTagsArray = (tagsValue: any): string[] => {
      if (!tagsValue) return [];
      if (Array.isArray(tagsValue)) return tagsValue;
      if (typeof tagsValue === 'string') return tagsValue.split(',').map((t: string) => t.trim()).filter(Boolean);
      return [];
    };

    return {
        id: 'preview',
        title: form.title || 'Your Event Title',
        description: form.description?.substring(0, 100) + '...',
        longDescription: form.description || 'Your event description will appear here.',
        date: form.date || new Date().toISOString().split('T')[0],
        time: form.time || '12:00',
        endTime: form.endTime,
        location: form.location ? (locations.find(l => l.id === form.location)?.name || form.location) : 'TBD',
        organizer: getOrganizerName(),
        category: form.category || 'General',
        image: previews.headerImage || 'https://placehold.co/600x400.png',
        headerImage: previews.headerImage || 'https://placehold.co/2560x650.png',
        eventLogo: previews.eventLogo,
        attendees: 0,
        capacity: 100,
        registrationLink: form.registrationLink || '#',
        status: 'upcoming',
        gallery: [],
        tags: getTagsArray(form.tags),
        targetAudience: form.targetAudience,
        keySpeakers: form.keySpeakers,
        whatYouWillLearn: form.whatYouWillLearn,
        googleDriveFolderId: form.googleDriveFolderId
    };
  }

  // Effect to update session storage for real-time preview
  useEffect(() => {
    if (view === 'form' && previewChannel) {
      const eventData = mapFormToEventPreview();
      try {
        sessionStorage.setItem('eventPreviewData', JSON.stringify(eventData));
        previewChannel.postMessage(eventData);
      } catch (error) {
        console.error("Could not update preview data:", error);
      }
    }
  }, [form, equipment, previews, view, previewChannel, userClubs]);

  const handleGenerateDetails = async () => {
      if (!form.title) {
          toast({ title: "Title needed", description: "Please enter an event title first.", variant: "destructive" });
          return;
      }
      setIsGeneratingDetails(true);
      try {
          const result = await generateEventDetails({ title: form.title, template: selectedTemplate || undefined });
          setForm((prev:any) => ({
              ...prev,
              description: result.description,
              category: result.category,
              whatYouWillLearn: result.whatYouWillLearn,
              targetAudience: result.targetAudience,
              tags: result.tags.join(', '),
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
    setForm((prev: any) => {
        const currentAudience: string[] = prev.targetAudience || [];
        let newAudience: string[];

        if (course === "All Students") {
            newAudience = currentAudience.includes("All Students") ? [] : ["All Students"];
        } else {
            let updatedAudience = currentAudience.filter(c => c !== "All Students");
            
            if (updatedAudience.includes(course)) {
                newAudience = updatedAudience.filter(c => c !== course);
            } else {
                newAudience = [...updatedAudience, course];
            }
        }
        
        return { ...prev, targetAudience: newAudience };
    });
  };


  const handleFileChange = (name: string, file: File | null) => {
    setForm((prev:any) => ({ ...prev, [name]: file, [`${name}Url`]: "" }));
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviews(prev => ({ ...prev, [name]: reader.result as string }));
        reader.readAsDataURL(file);
    } else {
        setPreviews(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleEditProposal = (proposal: EventProposal) => {
    setCurrentProposalId(proposal.id);
    setSelectedTemplate(null);
    setForm({
        ...EMPTY_FORM,
        ...proposal,
        location: proposal.location || 'seminar', // Fallback for existing drafts
        tags: Array.isArray(proposal.tags) ? proposal.tags.join(', ') : (proposal.tags || ''),
        headerImageUrl: proposal.headerImage || '',
        eventLogoUrl: proposal.eventLogo || '',
    });
    setPreviews({
        headerImage: proposal.headerImage || null,
        eventLogo: proposal.eventLogo || null,
    });
    if (proposal.date) {
        setSelectedDate(new Date(proposal.date + 'T00:00:00'));
    }
    
    let parsedEquipment = EMPTY_EQUIPMENT_STATE;
    if (proposal.equipmentNeeds) {
        try {
            parsedEquipment = { ...parsedEquipment, ...JSON.parse(proposal.equipmentNeeds) };
        } catch (e) {
            console.error("Could not parse equipment needs:", e);
        }
    }
    setEquipment(parsedEquipment);
    
    setView('form');
    setStep(1);
  }

  const handleNewRequest = () => {
    const persistentInfo = {
        clubId: userClubs[0]?.id || "",
        clubName: userClubs[0]?.name || (user.role === 'faculty' ? (user.name || 'Faculty Event') : ''),
    };
    setForm({...EMPTY_FORM, ...persistentInfo});
    setEquipment(EMPTY_EQUIPMENT_STATE);
    setCurrentProposalId(null);
    setSelectedTemplate(null);
    setPreviews({ headerImage: null, eventLogo: null });
    setSelectedDate(null);
    setView('templates');
    setStep(1);
  }
  
  const handleSelectTemplate = (templateKey: keyof typeof templates | 'scratch') => {
    setSelectedTemplate(templateKey);
    const clubInfo = userClubs[0] ? { clubId: userClubs[0].id, clubName: userClubs[0].name } : {};
    const persistentInfo = {
        ...clubInfo,
        ...(user.role === 'faculty' && !clubInfo.clubName && { clubName: user.name || 'Faculty Event' })
    };
    if (templateKey === 'scratch') {
      setForm({ ...EMPTY_FORM, ...persistentInfo });
    } else {
      setForm({ ...EMPTY_FORM, ...templates[templateKey], ...persistentInfo });
    }
    setEquipment(EMPTY_EQUIPMENT_STATE);
    setView('form');
    setStep(1);
  }
  
  // Client-side handler for saving/submitting
  const handleFormSubmit = async (status: 'draft' | 'pending') => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (status === 'pending' && (!form.location || !form.category || !form.description || !form.date || !form.time)) {
        toast({ title: "Missing Information", description: "Please fill all required fields before submitting.", variant: "destructive"});
        return;
    }
    if (status === 'draft' && !form.title) {
        toast({ title: "Title Required", description: "Please enter a title to save a draft.", variant: "destructive" });
        return;
    }
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (key === 'targetAudience' && Array.isArray(value)) {
                    value.forEach(item => formData.append(key, item));
                } else if (value instanceof File) {
                    formData.append(key, value as File);
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        
        formData.set('equipmentNeeds', JSON.stringify(equipment));

        const result = await handleEventMediaUpload(formData, form.googleDriveFolderId);

        if (!result.success || !result.data) {
          toast({ title: "Upload Failed", description: result.error || "Could not process file uploads.", variant: "destructive" });
          return;
        }

        const dataToSave = {
          ...result.data,
          status,
          createdBy: currentUser.uid,
          creatorEmail: currentUser.email ?? '',
        };

        if (currentProposalId) {
          const docRef = doc(db, "eventRequests", currentProposalId);
          await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() });
        } else {
          const newDoc = await addDoc(collection(db, "eventRequests"), { ...dataToSave, createdAt: serverTimestamp() });
          setCurrentProposalId(newDoc.id);
        }
        
        const finalFormState = {
            ...form,
            ...dataToSave,
            tags: Array.isArray(dataToSave.tags) ? dataToSave.tags.join(', ') : (dataToSave.tags || ''),
            headerImage: null,
            eventLogo: null,
            headerImageUrl: dataToSave.headerImage,
            eventLogoUrl: dataToSave.eventLogo,
        };

        setForm(finalFormState);

        setPreviews({
            headerImage: dataToSave.headerImage || null,
            eventLogo: dataToSave.eventLogo || null,
        });

        toast({ title: "Success!", description: status === 'draft' ? "Your draft has been saved." : "Your proposal has been submitted!" });

        if (status === 'pending') {
          setView('list'); 
        }
        const updatedProposals = await getUserProposals(user.uid);
        setProposals(updatedProposals);

      } catch (error) {
        console.error("Error submitting form:", error);
        toast({ title: "An Error Occurred", description: (error as Error).message, variant: "destructive" });
      }
    });
  };

  const handlePreview = () => {
    const eventData = mapFormToEventPreview();
    try {
        sessionStorage.setItem('eventPreviewData', JSON.stringify(eventData));
        window.open('/dashboard/host-event/preview', '_blank');
    } catch (error) {
        console.error("Could not open preview:", error);
        toast({
            title: "Preview Error",
            description: "Could not prepare data for preview. Please check console for details.",
            variant: "destructive",
        });
    }
  };

  const validateStep = (targetStep: number) => {
      let isValid = true;
      let message = "Please fill all required fields.";
      if (targetStep === 1) {
          if (!form.title || !form.description || !form.category) isValid = false;
      }
      if (targetStep === 2) {
          if (form.targetAudience.length === 0 || !form.whatYouWillLearn) isValid = false;
      }
      if (targetStep === 3) {
          if (!form.date || !form.time || !form.location) {
              isValid = false;
              message = "Please select a date, time, and location from the calendar view.";
          }
      }
      if (!isValid) {
          toast({ title: "Missing Information", description: message, variant: "destructive"});
      }
      return isValid;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => s + 1) };
  const handleBack = () => setStep(s => s - 1);
  
  const handleDateClick = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setTempTime(null); // Reset previous temporary selection
    setIsTimeModalOpen(true);
  };
  
  const handleTimeSelect = (selectInfo: DateSelectArg) => {
      const start = selectInfo.start;
      const end = selectInfo.end;
  
      if (end.getTime() === start.getTime() || (start.getDate() !== end.getDate() && end.getTime() - start.getTime() > 3600000)) {
          selectInfo.view.calendar.unselect();
          setTempTime(null);
          return;
      }
  
      setTempTime({ start: selectInfo.startStr, end: selectInfo.endStr });
  };
  
  const handleConfirmTime = () => {
      if (!tempTime || !selectedDate) return;
  
      const startTimeStr = new Date(tempTime.start).toTimeString().split(' ')[0].substring(0, 5);
      const endTimeStr = new Date(tempTime.end).toTimeString().split(' ')[0].substring(0, 5);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      setForm((prev:any) => ({
        ...prev,
        date: dateStr,
        time: startTimeStr,
        endTime: endTimeStr,
      }));
      
      toast({ title: "Time Slot Confirmed", description: `Set to ${dateStr} from ${startTimeStr} to ${endTimeStr}` });
      setIsTimeModalOpen(false);
      setTempTime(null);
  };


  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 mb-6">Only faculty members and designated club leads can host events.</p>
          <Link href="/dashboard/events" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Back to Events</Link>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Event Proposals</h1>
            <p className="text-white/70">Create and manage your event proposals.</p>
          </div>
          <Button onClick={handleNewRequest} className="mt-4 sm:mt-0"><Plus className="mr-2"/> New Event</Button>
        </div>
        <Tabs defaultValue="drafts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="drafts">Drafts & Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="live"><ProposalList list={liveProposals} emptyText="You have no upcoming approved events." onEdit={handleEditProposal}/></TabsContent>
          <TabsContent value="completed"><ProposalList list={completedProposals} emptyText="You have no past events." onEdit={handleEditProposal}/></TabsContent>
          <TabsContent value="drafts"><ProposalList list={draftProposals} emptyText="You have no saved drafts or pending proposals." onEdit={handleEditProposal}/></TabsContent>
          <TabsContent value="rejected"><ProposalList list={rejectedProposals} emptyText="You have no rejected proposals." onEdit={handleEditProposal}/></TabsContent>
        </Tabs>
      </div>
    );
  }
  
  if (view === 'templates') {
    return (
      <div className="container mx-auto px-4 py-8">
         <div className="mb-6">
            <Button onClick={() => setView('list')} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Events</Button>
         </div>
         <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Start a New Proposal</h1>
            <p className="text-lg text-white/70 mt-2">Choose a template to get started quickly, or begin from scratch.</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <TemplateCard icon={<Mic />} title="Speaker Session" description="Invite an expert to share their knowledge." onClick={() => handleSelectTemplate('speaker_session')} />
            <TemplateCard icon={<Trophy />} title="Competition / Hackathon" description="Host a competitive event to test skills." onClick={() => handleSelectTemplate('competition')} />
            <TemplateCard icon={<Presentation />} title="Info Session" description="Share important information with an audience." onClick={() => handleSelectTemplate('info_session')} />
            <TemplateCard icon={<Hammer />} title="Workshop" description="A hands-on session for practical learning." onClick={() => handleSelectTemplate('workshop')} />
            <div className="md:col-span-2">
              <TemplateCard icon={<FileText />} title="Start From Scratch" description="Build your event proposal from a blank slate." onClick={() => handleSelectTemplate('scratch')} />
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button onClick={() => setView('list')} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Events</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
            <div className="flex items-center space-x-2 sm:space-x-4 mb-8">
                {formSteps.map((s, index) => (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(s.id)}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${step >= s.id ? 'bg-blue-600' : 'bg-white/10 border-2 border-white/20'}`}>
                                {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                            </div>
                            <span className={`text-sm sm:text-base font-medium transition-all hidden sm:block ${step >= s.id ? 'text-white' : 'text-white/50'}`}>{s.name}</span>
                        </div>
                        {index < formSteps.length - 1 && <div className="flex-grow h-0.5 bg-white/20"></div>}
                    </React.Fragment>
                ))}
            </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-6">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in-0 duration-300">
                        <div className="space-y-2">
                            <label className="text-white text-sm" htmlFor="event-title">Event Title*</label>
                            <input id="event-title" type="text" name="title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., 'Introduction to Cloud Computing'" required />
                        </div>
                        
                        <div className="pt-2">
                            <Button type="button" onClick={handleGenerateDetails} disabled={isGeneratingDetails || !form.title} variant="outline" className="bg-white/10">
                                <Sparkles className={`mr-1.5 h-4 w-4 ${isGeneratingDetails ? 'animate-spin' : ''}`} />
                                {isGeneratingDetails ? 'Generating...' : 'Generate Event Details'}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm">Event Description*</label>
                            <Textarea name="description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 min-h-[200px]" placeholder="A clear, engaging summary of what the event is about." required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm">Tags</label>
                            <input type="text" name="tags" value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., AI, Career, Networking" />
                            <p className="text-xs text-white/60">Comma-separated tags to help students discover your event.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm">Select Category*</label>
                            <select name="category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                                <option value="" className="bg-gray-800">Select a category...</option>
                                {categories.map(category => (<option key={category.id} value={category.id} className="bg-gray-800">{category.icon} {category.name}</option>))}
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
                                        <Checkbox id={`course-${course}`} name="targetAudience" value={course} checked={Array.isArray(form.targetAudience) && form.targetAudience.includes(course)} onCheckedChange={() => handleAudienceChange(course)} className="h-5 w-5" />
                                        <label htmlFor={`course-${course}`} className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow">{course}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white text-sm">What You'll Learn*</label>
                            <Textarea name="whatYouWillLearn" value={form.whatYouWillLearn || ''} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 min-h-[200px]" placeholder="Use bullet points for key takeaways, e.g.,&#10;- How to build in the Cloud&#10;- Key resources and learning paths&#10;- Common pitfalls to avoid" required/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white text-sm">Key Speakers or Guests (Optional)</label>
                            <Textarea name="keySpeakers" value={form.keySpeakers || ''} onChange={(e) => setForm({ ...form, keySpeakers: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="List each speaker on a new line, e.g.,&#10;Rakesh Varade - Google Cloud Specialist&#10;Jane Doe - AI Researcher" />
                        </div>
                    </div>
                )}
                
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in-0 duration-300">
                        <div className="space-y-2">
                            <label className="text-white text-sm">Date & Time*</label>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                {form.date && form.time ? (
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 items-center">
                                            <Calendar className="w-8 h-8 text-blue-300"/>
                                            <div>
                                                <p className="font-semibold text-white">{format(new Date(form.date+'T00:00:00'), 'EEEE, MMMM d, yyyy')}</p>
                                                <p className="text-white/70">{form.time} - {form.endTime}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => handleDateClick({start: new Date(form.date+'T00:00:00')} as DateSelectArg)}>
                                            <Edit className="w-4 h-4 mr-2"/>
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-white/60">Please select a date, time, and location from the calendar view on the right.</p>
                                )}
                            </div>
                        </div>

                        <FileInput name="headerImage" label="Header Image" accepted="image/jpeg, image/png" helpText="2560 x 650 pixels. JPG or PNG." onFileChange={handleFileChange} currentPreview={previews.headerImage} />
                        <FileInput name="eventLogo" label="Event Logo (Optional)" accepted="image/jpeg, image/png" helpText="1080 x 1080 pixels. JPG or PNG." onFileChange={handleFileChange} currentPreview={previews.eventLogo} />
                        
                        <EquipmentSelector equipment={equipment} setEquipment={setEquipment} />
                        
                        <div className="space-y-2">
                            <label className="text-white text-sm">Budget & Funding (Optional)</label>
                            <Textarea name="budgetDetails" value={form.budgetDetails || ''} onChange={(e) => setForm({ ...form, budgetDetails: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Total budget: $500. Requesting $200 from college." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white text-sm">Registration Link (Optional)</label>
                            <input name="registrationLink" type="url" value={form.registrationLink || ''} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..." />
                        </div>
                        {user.role !== 'faculty' && userClubs.length > 0 && (
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Hosting as Club</label>
                                <select name="clubId" value={form.clubId || ''} onChange={(e) => { const club = userClubs.find(c => c.id === e.target.value); setForm((prev:any) => ({...prev, clubId: e.target.value, clubName: club?.name || '' })); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" required>
                                {userClubs.map(club => (<option key={club.id} value={club.id} className="bg-gray-800">{club.name}</option>))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                <div>{step > 1 && <Button type="button" variant="outline" onClick={handleBack} className="bg-white/10">Back</Button>}</div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={() => handleFormSubmit('draft')} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button type="button" variant="outline" className="bg-white/10" onClick={handlePreview}>Preview</Button>
                    {step < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
                    {step === 3 && 
                        <Button type="button" onClick={() => handleFormSubmit('pending')} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Event Request'}
                        </Button>
                    }
                </div>
            </div>

          </form>
        </div>
        <div className="sticky top-24 self-start">
          <div className="space-y-2 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white">Select Date, Time & Location*</h3>
              <p className="text-sm text-white/70">Click a date on the calendar. This will open a popup to select an available time slot.</p>
          </div>
          <div className="mb-4">
            <select name="location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                <option value="" className="bg-gray-800">Select a location...</option>
                {locations.map(loc => (<option key={loc.id} value={loc.id} className="bg-gray-800">{loc.icon} {loc.name}</option>))}
            </select>
          </div>
          <AcademicCalendar onDateSelect={handleDateClick} initialView="dayGridMonth" headerToolbarRight="" locationFilter={form.location} />
        </div>
      </div>

      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-gray-900/90 backdrop-blur-lg border border-gray-700 text-white">
            <DialogHeader>
                <DialogTitle className="text-xl">Select an available time for {selectedDate && format(selectedDate, 'EEEE, MMMM d')}</DialogTitle>
                <DialogDescription>Click and drag on the calendar to select your desired time range.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto -mx-6 -my-2 pr-2">
              {selectedDate && form.location && (
                  <AcademicCalendar
                      key={`${form.location}-${selectedDate.toISOString()}`}
                      initialView="timeGridDay"
                      initialDate={selectedDate}
                      locationFilter={form.location}
                      onDateSelect={handleTimeSelect}
                      headerToolbarRight=""
                  />
              )}
            </div>
            <DialogFooter className="bg-gray-900/80 -mx-6 -mb-6 p-4 border-t border-gray-700 flex justify-between items-center">
                <div className="text-white">
                    {tempTime ? (
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400"/>
                            <div>
                                <span className="font-semibold">Selected:</span>{' '}
                                <span className="font-mono bg-white/10 px-2 py-1 rounded-md">{format(new Date(tempTime.start), 'p')} - {format(new Date(tempTime.end), 'p')}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-white/60">No time slot selected.</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setIsTimeModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmTime} disabled={!tempTime}>Confirm Selection</Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
