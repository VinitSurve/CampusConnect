
'use client';

import React from "react";
import Image from "next/image";
import type { EventProposal } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, FileEdit, Calendar, Mic, Trophy, Presentation, Hammer, FileText } from "lucide-react";

// --- CONSTANTS ---

export const EMPTY_FORM = {
    title: "",
    description: "",
    targetAudience: [] as string[],
    keySpeakers: "",
    equipmentNeeds: "",
    budgetDetails: "",
    whatYouWillLearn: "",
    tags: "",
    location: "seminar",
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

export const locations = [
    { id: "lab401", name: "Lab 401", icon: "🏫" },
    { id: "lab402", name: "Lab 402", icon: "🏫" },
    { id: "lab503", name: "Lab 503", icon: "🏫" },
    { id: "seminar", name: "Seminar Hall", icon: "🎪" }
];

export const categories = [
    { id: "Academic", name: "Academic", icon: "🎓" },
    { id: "Guest Speaker", name: "Guest Speaker", icon: "🎤" },
    { id: "Cultural", name: "Cultural", icon: "🎭" },
    { id: "Technical", name: "Technical", icon: "💻" },
    { id: "Sports", name: "Sports", icon: "⚽" },
    { id: "Workshop", name: "Workshop", icon: "🛠️" },
    { id: "Social", name: "Social", icon: "🎉" },
    { id: "Networking", name: "Networking", icon: "🤝" },
];

export const templates = {
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

export const availableCourses = ["All Students", "BCA", "BBA", "BAF", "MBA"];

export const formSteps = [ { id: 1, name: "Event Details" }, { id: 2, name: "Content & Audience" }, { id: 3, name: "Logistics & Media" }];

export const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
  draft: "default",
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};


// --- REUSABLE COMPONENTS ---

export const FileInput = ({ name, label, accepted, helpText, onFileChange, currentPreview }: { name: string, label: string, accepted: string, helpText: string, onFileChange: (name: string, file: File | null) => void, currentPreview: string | null }) => {
    const [preview, setPreview] = React.useState<string | null>(currentPreview);

    React.useEffect(() => {
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

export const ProposalList = ({ list, emptyText, onEdit }: { list: EventProposal[], emptyText: string, onEdit: (p: EventProposal) => void }) => {
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
            <Button size="sm" variant="ghost" onClick={() => onEdit(p)}><FileEdit className="mr-2 h-4 w-4"/>Edit</Button>
          </div>
        ))}
      </div>
    )
  }

export const TemplateCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <button onClick={onClick} className="text-left w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition-all hover:border-blue-500/50">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 bg-blue-600/50 text-white rounded-lg flex items-center justify-center">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/70">{description}</p>
    </button>
);
