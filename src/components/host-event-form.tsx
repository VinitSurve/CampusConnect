
'use client';

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AcademicCalendar from '@/components/academic-calendar';
import type { User, EventProposal, Event } from "@/types";
import type { DateSelectArg } from "@fullcalendar/core";
import { Textarea } from "./ui/textarea";
import { Sparkles, UploadCloud, X, Check, FileEdit, Plus, Trash2, ArrowLeft, Calendar, FileText, Info, Mic, Trophy, Presentation, Hammer } from "lucide-react";
import { generateEventDetails } from "@/ai/flows/generate-event-details";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import Image from "next/image";
import { createEventProposalAction, saveDraftAction } from "../app/dashboard/host-event/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import EventDetailPage from "./event-detail-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const EMPTY_FORM = {
    title: "",
    description: "",
    targetAudience: [] as string[],
    keySpeakers: "",
    equipmentNeeds: "",
    budgetDetails: "",
    whatYouWillLearn: "",
    tags: "",
    location: "",
    category: "",
    registrationLink: "",
    clubId: "",
    clubName: "",
    date: "",
    time: "",
    headerImage: null as File | null,
    eventLogo: null as File | null,
    headerImageUrl: "",
    eventLogoUrl: "",
    googleDriveFolderId: ""
};

const locations = [
    { id: "lab401", name: "Lab 401", icon: "🏫" },
    { id: "lab402", name: "Lab 402", icon: "🏫" },
    { id: "lab503", name: "Lab 503", icon: "🏫" },
    { id: "seminar", name: "Seminar Hall", icon: "🎪" }
];

const categories = [
    { id: "Academic", name: "Academic", icon: "🎓" },
    { id: "Guest Speaker", name: "Guest Speaker", icon: "🎤" },
    { id: "Cultural", name: "Cultural", icon: "🎭" },
    { id: "Technical", name: "Technical", icon: "💻" },
    { id: "Sports", name: "Sports", icon: "⚽" },
    { id: "Workshop", name: "Workshop", icon: "🛠️" },
    { id: "Social", name: "Social", icon: "🎉" },
    { id: "Networking", name: "Networking", icon: "🤝" },
];

const templates = {
  'speaker_session': {
    title: 'Speaker Session: [Your Topic Here]',
    description: 'Join us for an enlightening session with an industry expert. This talk will delve into [briefly describe topic], offering valuable insights for anyone interested in [field of interest]. A Q&A session will follow the presentation, providing a great opportunity for networking.',
    category: 'Guest Speaker',
    whatYouWillLearn: '- Gain deep insights from a seasoned professional.\n- Explore the latest trends and challenges in [field].\n- Understand key concepts and practical applications.\n- Network with the speaker and fellow attendees.',
    targetAudience: ['All Students'],
  },
  'competition': {
    title: 'Competition: [Your Competition Name]',
    description: 'Ready to test your skills? Join our [competition type, e.g., coding, business case] competition! Compete against your peers, solve challenging problems, and win exciting prizes. All skill levels are welcome to participate and learn.',
    category: 'Technical',
    whatYouWillLearn: '- Apply your skills in a competitive environment.\n- Learn to work effectively under pressure.\n- Showcase your talent to peers and faculty.\n- Win prizes and gain recognition.',
    targetAudience: ['All Students'],
  },
  'info_session': {
    title: 'Info Session: [Subject of Info Session]',
    description: 'Curious about [subject]? This information session will cover everything you need to know. We will discuss [point 1], [point 2], and answer all of your questions. This is the perfect place to get informed.',
    category: 'Academic',
    whatYouWillLearn: '- Understand the key details about [subject].\n- Get answers to your specific questions.\n- Learn about the opportunities available.\n- Make informed decisions about your involvement.',
    targetAudience: ['All Students'],
  },
  'workshop': {
    title: 'Workshop: Hands-On [Your Topic Here]',
    description: 'Roll up your sleeves and get ready to learn by doing! This interactive workshop will guide you through the fundamentals of [topic]. By the end of this session, you will have created your own [what they will build]. No prior experience necessary.',
    category: 'Workshop',
    whatYouWillLearn: '- Gain practical, hands-on experience in [topic].\n- Build a small project from scratch.\n- Learn best practices from an experienced instructor.\n- Collaborate with peers and solve real-world problems.',
    targetAudience: ['All Students'],
  },
};


const availableCourses = ["All Students", "BCA", "BBA", "BAF", "MBA"];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700">
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
        onFileChange(name, file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
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
                        <Image src={preview} alt="Preview" width={1280} height={325} className="w-full h-auto max-h-48 object-contain rounded-lg" />
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

const formSteps = [ { id: 1, name: "Event Details" }, { id: 2, name: "Content & Audience" }, { id: 3, name: "Logistics & Media" }];

interface HostEventFormProps {
    user: User;
    proposals: EventProposal[];
}

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
  draft: "default",
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};


export default function HostEventForm({ user, proposals: initialProposals }: HostEventFormProps) {
  const [view, setView] = useState<'list' | 'templates' | 'form'>('list');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates | 'scratch' | null>(null);
  const [previews, setPreviews] = useState({ headerImage: null as string | null, eventLogo: null as string | null });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userClubs, setUserClubs] = useState<{id: string, name: string}[]>([]);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isSavingDraft, startDraftTransition] = useTransition();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [proposals, setProposals] = useState(initialProposals);

  const { toast } = useToast();

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) return;
      try {
        if (user.role === 'faculty') {
          setIsAllowed(true);
          setForm((prev:any) => ({...prev, clubName: user.name || 'Faculty Event' }));
          return;
        }

        const clubsQuery = query(collection(db, "clubs"), where("leadId", "==", user.uid));
        const querySnapshot = await getDocs(clubsQuery);
        if (!querySnapshot.empty) {
            const clubs = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setUserClubs(clubs);
            setIsAllowed(true);
            if (clubs.length > 0) {
              setForm((prev:any) => ({ ...prev, clubId: clubs[0].id, clubName: clubs[0].name }));
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

  const { liveProposals, completedProposals, draftProposals, rejectedProposals } = useMemo(() => {
    const now = new Date();
    return {
      liveProposals: proposals.filter(p => p.status === 'approved' && new Date(p.date) >= now),
      completedProposals: proposals.filter(p => p.status === 'approved' && new Date(p.date) < now),
      draftProposals: proposals.filter(p => p.status === 'draft'),
      rejectedProposals: proposals.filter(p => p.status === 'rejected'),
    };
  }, [proposals]);

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
    setForm((prev:any) => {
        const currentAudience = prev.targetAudience || [];
        const newAudience = currentAudience.includes(course)
            ? currentAudience.filter(c => c !== course)
            : [...currentAudience, course];
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
        tags: proposal.tags?.join(', ') || '',
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
    setView('form');
    setStep(1);
  }

  const handleNewRequest = () => {
    setForm(EMPTY_FORM);
    setCurrentProposalId(null);
    setSelectedTemplate(null);
    setPreviews({ headerImage: null, eventLogo: null });
    setSelectedDate(null);
    setView('templates');
    setStep(1);
  }
  
  const handleSelectTemplate = (templateKey: keyof typeof templates | 'scratch') => {
    setSelectedTemplate(templateKey);
    if (templateKey === 'scratch') {
      setForm(EMPTY_FORM);
    } else {
      setForm({ ...EMPTY_FORM, ...templates[templateKey] });
    }
    setView('form');
    setStep(1);
  }

  const handleSaveDraft = async () => {
    if (!form.title) {
        toast({ title: "Title is required", description: "Please enter a title to save a draft.", variant: "destructive" });
        return;
    }
    startDraftTransition(async () => {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value) {
                if (key === 'targetAudience' && Array.isArray(value)) value.forEach(item => formData.append(key, item));
                else if (value instanceof File) formData.append(key, value);
                else formData.append(key, value as string);
            }
        });
        if (currentProposalId) formData.append('proposalId', currentProposalId);
        
        const result = await saveDraftAction(formData);

        if (result.success && result.id) {
            toast({ title: "Draft Saved!", description: "Your event proposal has been saved." });
            setCurrentProposalId(result.id);
            const updatedProposals = await getUserProposals(user.uid);
            setProposals(updatedProposals);
        } else {
            toast({ title: "Error Saving Draft", description: result.error, variant: "destructive" });
        }
    });
  }

  const mapFormToEventPreview = (): Event => {
    return {
        id: 'preview',
        title: form.title || 'Your Event Title',
        description: form.description?.substring(0, 100) + '...',
        longDescription: form.description || 'Your event description will appear here.',
        date: form.date || new Date().toISOString().split('T')[0],
        time: form.time || '12:00',
        location: form.location || 'TBD',
        organizer: form.clubName || 'Your Club/Org',
        category: form.category || 'General',
        image: previews.headerImage || 'https://placehold.co/600x400.png',
        headerImage: previews.headerImage || 'https://placehold.co/2560x650.png',
        eventLogo: previews.eventLogo,
        attendees: 0,
        capacity: 100,
        registrationLink: form.registrationLink || '#',
        status: 'upcoming',
        gallery: [],
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()) : [],
        targetAudience: form.targetAudience,
        keySpeakers: form.keySpeakers,
        whatYouWillLearn: form.whatYouWillLearn,
    };
  }

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
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDateTime = selectInfo.start;
    const dateStr = selectedDateTime.toISOString().split('T')[0];
    const timeStr = selectedDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    setForm((prev:any) => ({ ...prev, date: dateStr, time: timeStr }));
    setSelectedDate(selectedDateTime);
    toast({ title: "Date Selected", description: `You selected ${selectedDateTime.toLocaleString()}` });
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
  
  const ProposalList = ({ list, emptyText }: { list: EventProposal[], emptyText: string }) => {
    if (list.length === 0) {
      return <div className="text-center py-12 text-white/70">{emptyText}</div>
    }
    return (
      <div className="space-y-3">
        {list.map(p => (
          <div key={p.id} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-white">{p.title}</p>
              <div className="text-sm text-white/60 flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(p.date || p.createdAt).toLocaleDateString()}</span>
                {p.status && <Badge variant={statusVariantMap[p.status]} className="capitalize">{p.status}</Badge>}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleEditProposal(p)}><FileEdit className="mr-2 h-4 w-4"/>Edit</Button>
          </div>
        ))}
      </div>
    )
  }

  const TemplateCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <button onClick={onClick} className="text-left w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition-all hover:border-blue-500/50">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 bg-blue-600/50 text-white rounded-lg flex items-center justify-center">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/70">{description}</p>
    </button>
  );

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
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="live"><ProposalList list={liveProposals} emptyText="You have no upcoming approved events."/></TabsContent>
          <TabsContent value="completed"><ProposalList list={completedProposals} emptyText="You have no past events."/></TabsContent>
          <TabsContent value="drafts"><ProposalList list={draftProposals} emptyText="You have no saved drafts."/></TabsContent>
          <TabsContent value="rejected"><ProposalList list={rejectedProposals} emptyText="You have no rejected proposals."/></TabsContent>
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

          <form action={createEventProposalAction}>
            <input type="hidden" name="clubId" value={form.clubId} />
            <input type="hidden" name="clubName" value={form.clubName} />
            <input type="hidden" name="date" value={form.date} />
            <input type="hidden" name="time" value={form.time} />
            <input type="hidden" name="equipmentNeeds" value={form.equipmentNeeds} />
            <input type="hidden" name="headerImageUrl" value={form.headerImageUrl} />
            <input type="hidden" name="eventLogoUrl" value={form.eventLogoUrl} />
            {currentProposalId && <input type="hidden" name="proposalId" value={currentProposalId} />}
            {form.googleDriveFolderId && <input type="hidden" name="googleDriveFolderId" value={form.googleDriveFolderId} />}
            
            <div className="space-y-6">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in-0 duration-300">
                        <div className="space-y-2">
                            <label className="text-white text-sm">Event Title*</label>
                            <div className="flex gap-2">
                                <input type="text" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., 'Introduction to Cloud Computing'" required />
                                <Button type="button" onClick={handleGenerateDetails} disabled={isGeneratingDetails || !form.title} variant="outline" className="bg-white/10 text-nowrap">
                                    <Sparkles className={`mr-1.5 h-4 w-4 ${isGeneratingDetails ? 'animate-spin' : ''}`} />
                                    {isGeneratingDetails ? 'Generating...' : 'Generate with AI'}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm">Event Description*</label>
                            <Textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 min-h-[200px]" placeholder="A clear, engaging summary of what the event is about." required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm">Tags</label>
                            <input type="text" name="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., AI, Career, Networking" />
                            <p className="text-xs text-white/60">Comma-separated tags to help students discover your event.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm">Select Category*</label>
                            <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
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
                                        <Checkbox id={`course-${course}`} name="targetAudience" value={course} checked={form.targetAudience.includes(course)} onCheckedChange={() => handleAudienceChange(course)} className="h-5 w-5" />
                                        <label htmlFor={`course-${course}`} className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow">{course}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white text-sm">What You'll Learn*</label>
                            <Textarea name="whatYouWillLearn" value={form.whatYouWillLearn} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 min-h-[200px]" placeholder="Use bullet points for key takeaways, e.g.,&#10;- How to build in the Cloud&#10;- Key resources and learning paths&#10;- Common pitfalls to avoid" required/>
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
                        <FileInput name="eventLogo" label="Event Logo (Optional)" accepted="image/jpeg, image/png" helpText="1080 x 1080 pixels. JPG or PNG." onFileChange={handleFileChange} currentPreview={previews.eventLogo} />
                        <div className="space-y-2">
                            <label className="text-white text-sm">Budget & Funding (Optional)</label>
                            <Textarea name="budgetDetails" value={form.budgetDetails} onChange={(e) => setForm({ ...form, budgetDetails: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50" placeholder="e.g., Total budget: $500. Requesting $200 from college." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white text-sm">Registration Link (Optional)</label>
                            <input name="registrationLink" type="url" value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://..." />
                        </div>
                        {user.role !== 'faculty' && userClubs.length > 0 && (
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Hosting as Club</label>
                                <select name="clubId" value={form.clubId} onChange={(e) => { const club = userClubs.find(c => c.id === e.target.value); setForm((prev:any) => ({...prev, clubId: e.target.value, clubName: club?.name || '' })); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" required>
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
                    <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={isSavingDraft}>{isSavingDraft ? 'Saving...' : 'Save Draft'}</Button>
                    <Button type="button" variant="outline" className="bg-white/10" onClick={() => setIsPreviewOpen(true)}>Preview</Button>
                    {step < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
                    {step === 3 && <SubmitButton />}
                </div>
            </div>

          </form>
        </div>
        <div className="sticky top-24 self-start">
          <div className="space-y-2 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white">Select Date, Time & Location*</h3>
              <p className="text-sm text-white/70">Click a date on the calendar. This will auto-fill the date and time, which you can adjust.</p>
          </div>
          <div className="mb-4">
            <select name="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none" required>
                <option value="" className="bg-gray-800">Select a location...</option>
                {locations.map(loc => (<option key={loc.id} value={loc.name} className="bg-gray-800">{loc.icon} {loc.name}</option>))}
            </select>
          </div>
          <AcademicCalendar onDateSelect={handleDateSelect} initialView="dayGridMonth" headerToolbarRight="" locationFilter={form.location} />
        </div>
      </div>
      
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white max-w-4xl p-0">
          <DialogHeader className="p-6">
            <DialogTitle>Event Page Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto">
            <EventDetailPage event={mapFormToEventPreview()} />
          </div>
          <div className="p-6 border-t border-white/10"><DialogClose asChild><Button>Close Preview</Button></DialogClose></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
