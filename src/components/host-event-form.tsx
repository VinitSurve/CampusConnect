
'use client';

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AcademicCalendar from '@/components/academic-calendar';
import type { User, EventProposal, Event, Club } from "@/types";
import type { DateSelectArg } from "@fullcalendar/core";
import { Textarea } from "./ui/textarea";
import { Sparkles, Check, Plus, ArrowLeft, FileText, Mic, Trophy, Presentation, Hammer, Calendar, Clock, Edit, Globe } from "lucide-react";
import { generateEventDetails } from "@/ai/flows/generate-event-details";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import { handleEventMediaUpload } from "../app/dashboard/host-event/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, toDate } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
    TimeSlotSelectionModal,
    ProposalList,
    TemplateCard,
    EquipmentSelector,
    EMPTY_FORM,
    EMPTY_EQUIPMENT_STATE,
    locations,
    categories,
    templates,
    availableCourses,
    formSteps,
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
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [submissionType, setSubmissionType] = useState<'draft' | 'pending' | null>(null);
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
        const clubsQuery = query(collection(db, "clubs"), where("leadId", "==", user.uid));
        const querySnapshot = await getDocs(clubsQuery);
        if (!querySnapshot.empty) {
            const clubsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
            setUserClubs(clubsData);
            setIsAllowed(true);
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

  useEffect(() => {
    // When user clubs load, if no club is selected in the form yet, default to the first one.
    // This ensures the correct club name and advisor IDs are picked up.
    if (userClubs.length > 0 && !form.clubId) {
      const defaultClub = userClubs[0];
      setForm((prev: any) => ({
        ...prev,
        clubId: defaultClub.id,
        clubName: defaultClub.name,
        facultyAdvisorIds: defaultClub.facultyAdvisorIds || [],
      }));
    }
  }, [userClubs, form.clubId]);

  const getOrganizerClub = (): Club | null => {
    if (form.clubId) {
        return userClubs.find(c => c.id === form.clubId) || null;
    }
    return null;
  };

  const { liveProposals, completedProposals, draftProposals, rejectedProposals } = useMemo(() => {
    const now = new Date();
    return {
      liveProposals: proposals.filter(p => p.status === 'approved' && toDate(p.date) >= now),
      completedProposals: proposals.filter(p => p.status === 'approved' && toDate(p.date) < now),
      draftProposals: proposals.filter(p => p.status === 'pending' || p.status === 'draft'),
      rejectedProposals: proposals.filter(p => p.status === 'rejected'),
    };
  }, [proposals]);

  const mapFormToPreviewData = () => {
    const getTagsArray = (tagsValue: any): string[] => {
      if (!tagsValue) return [];
      if (Array.isArray(tagsValue)) return tagsValue;
      if (typeof tagsValue === 'string') return tagsValue.split(',').map((t: string) => t.trim()).filter(Boolean);
      return [];
    };

    const club = getOrganizerClub();

    const event: Event = {
        id: 'preview',
        title: form.title || 'Your Event Title',
        description: form.description?.substring(0, 100) + '...',
        longDescription: form.description || 'Your event description will appear here.',
        date: form.date || new Date().toISOString().split('T')[0],
        time: form.time || '12:00',
        endTime: form.endTime,
        location: form.location ? (locations.find(l => l.id === form.location)?.name || form.location) : 'TBD',
        organizer: club?.name || 'CampusConnect',
        category: form.category || 'General',
        image: 'https://placehold.co/600x400.png',
        attendees: 0,
        capacity: 100,
        registrationLink: form.registrationLink || '#',
        status: 'upcoming',
        gallery: [],
        tags: getTagsArray(form.tags),
        targetAudience: form.targetAudience,
        keySpeakers: form.keySpeakers,
        whatYouWillLearn: form.whatYouWillLearn,
        googleDriveFolderId: form.googleDriveFolderId,
        photoAlbumUrl: form.photoAlbumUrl,
        allowExternals: form.allowExternals,
        facultyAdvisorIds: form.facultyAdvisorIds || [],
        clubId: club?.id,
    };
    
    // The `user` object is the currently logged-in user, who is the lead.
    const lead: User | null = user;

    return { event, club, lead };
  }

  useEffect(() => {
    if (view === 'form' && previewChannel) {
      const previewData = mapFormToPreviewData();
      try {
        sessionStorage.setItem('eventPreviewData', JSON.stringify(previewData));
        previewChannel.postMessage(previewData);
      } catch (error) {
        console.error("Could not update preview data:", error);
      }
    }
  }, [form, equipment, view, previewChannel, userClubs, user]);

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
              tags: result.tags.join(', '),
          }));
          toast({ title: "AI Generated Content", description: "Event details have been filled in. Please review." });
      } catch (error) {
          console.error("Error generating details:", error);
          toast({ title: "AI Error", description: (error as Error).message, variant: "destructive" });
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

  const handleEditProposal = (proposal: EventProposal) => {
    setCurrentProposalId(proposal.id);
    setSelectedTemplate(null);
    
    const draftLocation = proposal.location || 'seminar';

    setForm({
        ...EMPTY_FORM,
        ...proposal,
        location: draftLocation,
        tags: Array.isArray(proposal.tags) ? proposal.tags.join(', ') : (proposal.tags || ''),
    });
    
    if (proposal.date) {
        setSelectedDate(toDate(proposal.date));
    }
    
    let parsedEquipment = EMPTY_EQUIPMENT_STATE;
    if (proposal.equipmentNeeds) {
        try {
            const parsed = JSON.parse(proposal.equipmentNeeds);
            parsedEquipment = { ...EMPTY_EQUIPMENT_STATE, ...parsed };
        } catch (e) {
            console.error("Could not parse equipment needs:", e);
        }
    }
    setEquipment(parsedEquipment);
    
    setView('form');
    setStep(1);
  }

  const handleNewRequest = () => {
    const clubInfo = userClubs[0] ? { clubId: userClubs[0].id, clubName: userClubs[0].name, facultyAdvisorIds: userClubs[0].facultyAdvisorIds || [] } : {};
    
    setForm({...EMPTY_FORM, ...clubInfo});
    setEquipment(EMPTY_EQUIPMENT_STATE);
    setCurrentProposalId(null);
    setSelectedTemplate(null);
    setSelectedDate(null);
    setView('templates');
    setStep(1);
  }
  
  const handleSelectTemplate = (templateKey: keyof typeof templates | 'scratch') => {
    setSelectedTemplate(templateKey);
    const clubInfo = userClubs[0] ? { clubId: userClubs[0].id, clubName: userClubs[0].name, facultyAdvisorIds: userClubs[0].facultyAdvisorIds || [] } : {};
    const persistentInfo = {...clubInfo};

    if (templateKey === 'scratch') {
      setForm({ ...EMPTY_FORM, ...persistentInfo });
    } else {
      setForm({ ...EMPTY_FORM, ...templates[templateKey], ...persistentInfo });
    }
    setEquipment(EMPTY_EQUIPMENT_STATE);
    setView('form');
    setStep(1);
  }
  
  const handleFormSubmit = async (status: 'draft' | 'pending') => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (status === 'pending' && (!form.location || !form.category || !form.description || !form.date || !form.time || !form.registrationLink)) {
        toast({ title: "Missing Information", description: "Please fill all required fields before submitting for review.", variant: "destructive"});
        return;
    }

    if (status === 'draft' && !form.title) {
        toast({ title: "Title Required", description: "Please enter a title to save a draft.", variant: "destructive" });
        return;
    }
    
    setSubmissionType(status);
    startTransition(async () => {
      try {
        const formData = new FormData();
        
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if ((key === 'targetAudience' || key === 'facultyAdvisorIds') && Array.isArray(value)) {
                    value.forEach(item => formData.append(key, item));
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        
        formData.set('equipmentNeeds', JSON.stringify(equipment));

        const uploadResult = await handleEventMediaUpload(formData, form.googleDriveFolderId, status);

        if (!uploadResult.success || !uploadResult.data) {
          toast({ title: "Save Failed", description: uploadResult.error || "Could not process event data.", variant: "destructive" });
          return;
        }

        let savedProposal: EventProposal;
        
        if (currentProposalId) {
            try {
                // This is the key fix. The data object for an UPDATE must only contain fields the user is allowed to change.
                const dataToSave: Partial<EventProposal> = {
                  ...uploadResult.data,
                  status,
                  // Do NOT send server timestamps from the client on updates, as this can be blocked by rules.
                  // The backend/functions should handle this. For now, we remove it to allow submission.
                };

                // Remove fields that should not be updated by the user
                delete dataToSave.createdBy;
                delete dataToSave.creatorEmail;
                delete dataToSave.createdAt;

                const docRef = doc(db, "eventRequests", currentProposalId);
                await updateDoc(docRef, dataToSave);

                const updatedDoc = await getDoc(docRef);
                if (!updatedDoc.exists()) {
                    throw new Error("Failed to retrieve updated document after saving");
                }
                savedProposal = { id: updatedDoc.id, ...updatedDoc.data() } as EventProposal;
                setProposals(prev => prev.map(p => p.id === savedProposal.id ? savedProposal : p));
            } catch (dbError) {
                console.error("Database error:", dbError);
                toast({ title: "Database Error", description: "Failed to update event in the database. Please try again.", variant: "destructive" });
                return;
            }
        } else {
            try {
                const dataToSave: Partial<EventProposal> = {
                  ...uploadResult.data,
                  status,
                  createdBy: currentUser.uid,
                  creatorEmail: currentUser.email ?? '',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };

                const newDocRef = await addDoc(collection(db, "eventRequests"), dataToSave);
                const newDoc = await getDoc(newDocRef);
                savedProposal = { id: newDoc.id, ...newDoc.data() } as EventProposal;
                setCurrentProposalId(savedProposal.id);
                setProposals(prev => [savedProposal, ...prev]);
            } catch (dbError) {
                console.error("Database error:", dbError);
                toast({ title: "Database Error", description: "Failed to save new event to database. Please try again.", variant: "destructive" });
                return;
            }
        }

        const finalFormState = {
            ...form,
            ...savedProposal,
            photoAlbumUrl: savedProposal.photoAlbumUrl,
        };
        
        setForm(finalFormState);

        toast({ title: "Success!", description: status === 'draft' ? "Your draft has been saved." : "Your proposal has been submitted!" });

        if (status === 'pending') {
          setView('list'); 
        }

      } catch (error) {
        console.error("Error submitting form:", error);
        toast({ title: "An Error Occurred", description: (error as Error).message, variant: "destructive" });
      } finally {
        setSubmissionType(null);
      }
    });
  };

  const handlePreview = () => {
    const previewData = mapFormToPreviewData();
    try {
        sessionStorage.setItem('eventPreviewData', JSON.stringify(previewData));
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
          if (!form.date || !form.time || !form.location || !form.registrationLink) {
              isValid = false;
              message = "Please select a date, time, location, and provide a registration link.";
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
    setIsTimeModalOpen(true);
  };
  
  const handleConfirmTime = (selection: { start: string, end: string, date: string }) => {
      setForm((prev:any) => ({
        ...prev,
        date: selection.date,
        time: selection.start,
        endTime: selection.end,
      }));
      
      toast({ title: "Time Slot Confirmed", description: `Set to ${selection.date} from ${selection.start} to ${selection.end}` });
      setIsTimeModalOpen(false);
  };
  
  const handleClubChange = (clubId: string) => {
    const club = userClubs.find(c => c.id === clubId);
    if (club) {
        setForm((prev:any) => ({
            ...prev, 
            clubId: club.id, 
            clubName: club.name, 
            facultyAdvisorIds: club.facultyAdvisorIds || [] 
        }));
    }
  };


  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 mb-6">Only designated club leads can host events.</p>
          <Link href="/dashboard/events" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg transition-colors">Back to Events</Link>
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
          <Button onClick={handleNewRequest} className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Plus className="mr-2"/> New Event Proposal</Button>
        </div>
        <Tabs defaultValue="drafts" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
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
            <Button onClick={() => setView('list')} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Proposals</Button>
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
        <Button onClick={() => setView('list')} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Proposals</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
            <div className="flex items-center space-x-2 sm:space-x-4 mb-8">
                {formSteps.map((s, index) => (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(s.id)}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${step >= s.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-white/10 border-2 border-white/20'}`}>
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
                            <Textarea name="keySpeakers" value={form.keySpeakers || ''} onChange={(e) => setForm({ ...form, keySpeakers: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g.,&#10;Rakesh Varade - Google Cloud Specialist&#10;Jane Doe - AI Researcher" />
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
                                                <p className="font-semibold text-white">{format(toDate(form.date), 'EEEE, MMMM d, yyyy')}</p>
                                                <p className="text-white/70">{form.time} - {form.endTime}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => handleDateClick({start: toDate(form.date)} as DateSelectArg)}>
                                            <Edit className="w-4 h-4 mr-2"/>
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-white/60">Please select a date, time, and location from the calendar view on the right.</p>
                                )}
                            </div>
                        </div>

                        <EquipmentSelector equipment={equipment} setEquipment={setEquipment} />
                        
                        <div className="space-y-2">
                            <label className="text-white text-sm">Are external attendees allowed?</label>
                            <RadioGroup
                                value={String(form.allowExternals || 'false')}
                                onValueChange={(value) => setForm({ ...form, allowExternals: value === 'true' })}
                                className="flex gap-4 pt-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="true" id="externals-yes" />
                                    <Label htmlFor="externals-yes">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="false" id="externals-no" />
                                    <Label htmlFor="externals-no">No</Label>
                                </div>
                            </RadioGroup>
                            <p className="text-xs text-white/60">If yes, a public map will be shown on the event page.</p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-white text-sm">Budget & Funding (Optional)</label>
                            <Textarea name="budgetDetails" value={form.budgetDetails || ''} onChange={(e) => setForm({ ...form, budgetDetails: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Total budget: $500. Requesting $200 from college." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white text-sm" htmlFor="registration-link">Registration Link*</label>
                            <input id="registration-link" name="registrationLink" type="url" value={form.registrationLink || ''} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..." required />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-white text-sm">Photo Album Folder</label>
                            <div className="p-4 bg-black/20 rounded-lg border border-white/10 min-h-[56px] flex items-center">
                                {form.photoAlbumUrl ? (
                                    <div className="flex justify-between items-center w-full">
                                        <Link href={form.photoAlbumUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate text-sm">
                                            {form.photoAlbumUrl}
                                        </Link>
                                    </div>
                                ) : (
                                    <p className="text-white/60 text-sm">A Google Drive folder will be automatically created when you save a draft with a title.</p>
                                )}
                            </div>
                            <p className="text-xs text-white/60">Upload photos to this folder to display them in the event gallery after the event.</p>
                        </div>

                        {userClubs.length > 0 && (
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Hosting as Club</label>
                                <select name="clubId" value={form.clubId || ''} onChange={(e) => handleClubChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" required>
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
                        {isSubmitting && submissionType === 'draft' ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button type="button" variant="outline" className="bg-white/10" onClick={handlePreview}>Preview</Button>
                    {step < 3 && <Button type="button" onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Next</Button>}
                    {step === 3 && 
                        <Button 
                          type="button" 
                          onClick={() => handleFormSubmit('pending')} 
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          {isSubmitting && submissionType === 'pending' ? 'Submitting...' : 'Submit Event Request'}
                        </Button>
                    }
                </div>
            </div>

          </form>
        </div>
        <div className="sticky top-24 self-start">
          <div className="space-y-2 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white">Select Date, Time & Location*</h3>
              <p className="text-sm text-white/70">Click a date on the calendar to open the daily schedule and select a time slot.</p>
          </div>
          <div className="mb-4">
            <select name="location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                <option value="" className="bg-gray-800">Select a location...</option>
                {locations.map(loc => (<option key={loc.id} value={loc.id} className="bg-gray-800">{loc.icon} {loc.name}</option>))}
            </select>
          </div>
          <AcademicCalendar
            onDateSelect={handleDateClick}
            initialView="dayGridMonth"
            headerToolbarRight=""
            locationFilter={form.location}
          />
        </div>
      </div>

       <TimeSlotSelectionModal
            isOpen={isTimeModalOpen}
            onClose={() => setIsTimeModalOpen(false)}
            onConfirm={handleConfirmTime}
            selectedDate={selectedDate}
            locationId={form.location}
        />
    </div>
  );
}

    