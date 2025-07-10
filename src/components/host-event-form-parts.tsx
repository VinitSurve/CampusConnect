
'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { EventProposal } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, FileEdit, Calendar, Mic, Trophy, Presentation, Hammer, Minus, Plus, CheckCircle2, XCircle, Share2, Building, Link as LinkIcon, Camera } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getDayScheduleForLocation } from "@/lib/data";
import { format } from 'date-fns';
import Link from "next/link";
import { Input } from "./ui/input";

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
    photoAlbumUrl: "",
    clubId: "",
    clubName: "",
    date: "",
    time: "",
    endTime: "",
    headerImage: null as File | null,
    eventLogo: null as File | null,
    headerImageUrl: "",
    eventLogoUrl: "",
    googleDriveFolderId: "",
    allowExternals: false,
};

export const EMPTY_EQUIPMENT_STATE = {
    wirelessMics: 0,
    collarMics: 0,
    waterBottles: 0,
    table: false,
    chairs: 0,
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
      <div className="space-y-4">
        {list.map(p => (
          <div key={p.id} className="bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70 mb-4">
                 <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {p.date ? new Date(p.date).toLocaleDateString() : 'Date TBD'} {p.time && ` at ${p.time}`}</span>
                 {p.status && <Badge variant={statusVariantMap[p.status]} className="capitalize">{p.status}</Badge>}
                 <span className="flex items-center gap-1.5"><Building className="h-4 w-4" />{p.location || 'Location TBD'}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                 <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" onClick={() => onEdit(p)}>
                    <FileEdit className="mr-2 h-4 w-4"/>
                    {p.status === 'rejected' ? 'View & Resubmit' : p.status === 'pending' ? 'Edit Request' : 'Edit Draft'}
                </Button>
                 {p.status === 'approved' && p.publishedEventId && (
                    <Button asChild size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                      <Link href={`/dashboard/events/${p.publishedEventId}`} target="_blank">
                        <LinkIcon className="mr-2 h-4 w-4"/> View Published Event
                      </Link>
                    </Button>
                )}
              </div>
            </div>

            <div className="w-full md:w-32 h-32 flex-shrink-0">
                 <Image 
                    src={p.eventLogo || 'https://placehold.co/100x100.png'} 
                    alt="Event Logo" 
                    width={100} 
                    height={100} 
                    className="rounded-lg object-cover w-full h-full bg-black/20" 
                    data-ai-hint="event logo"
                 />
            </div>
          </div>
        ))}
      </div>
    )
}

export const TemplateCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <button onClick={onClick} className="text-left w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition-all hover:border-blue-500/50">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/70">{description}</p>
    </button>
);

const QuantityControl = ({ label, value, onValueChange, max, step = 1 }: { label: string, value: number, onValueChange: (newValue: number) => void, max: number, step?: number }) => {
    const handleDecrement = () => onValueChange(Math.max(0, value - step));
    const handleIncrement = () => onValueChange(Math.min(max, value + step));

    return (
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
            <Label className="text-white">{label} <span className="text-white/60 text-xs">(Max: {max})</span></Label>
            <div className="flex items-center gap-3">
                <Button type="button" size="icon" variant="outline" onClick={handleDecrement} className="h-7 w-7 bg-white/10 hover:bg-white/20">
                    <Minus className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-lg w-6 text-center">{value}</span>
                <Button type="button" size="icon" variant="outline" onClick={handleIncrement} className="h-7 w-7 bg-white/10 hover:bg-white/20">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};


export const EquipmentSelector = ({ equipment, setEquipment }: { equipment: any, setEquipment: (newEquipment: any) => void }) => {
    
    const handleWaterBottleChange = (increment: number) => {
        setEquipment((prev: any) => ({
            ...prev,
            waterBottles: (prev.waterBottles || 0) + increment,
        }));
    };

    return (
        <div className="space-y-2">
            <p className="text-white text-sm">Equipment Needs</p>
            <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/10">
                 <QuantityControl label="Wireless Mics" value={equipment.wirelessMics || 0} onValueChange={(v) => setEquipment({...equipment, wirelessMics: v})} max={2} />
                 <QuantityControl label="Collar Mics" value={equipment.collarMics || 0} onValueChange={(v) => setEquipment({...equipment, collarMics: v})} max={2} />
                 <QuantityControl label="Chairs" value={equipment.chairs || 0} onValueChange={(v) => setEquipment({...equipment, chairs: v})} max={5} />

                 <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                    <Label htmlFor="table-checkbox" className="text-white">Table <span className="text-white/60 text-xs">(Max: 1)</span></Label>
                    <Checkbox id="table-checkbox" checked={equipment.table || false} onCheckedChange={(checked) => setEquipment({ ...equipment, table: !!checked })} className="h-5 w-5"/>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                    <Label className="text-white">Water Bottles</Label>
                     <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg w-8 text-center">{equipment.waterBottles || 0}</span>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleWaterBottleChange(5)} className="bg-white/10 hover:bg-white/20">+5</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleWaterBottleChange(10)} className="bg-white/10 hover:bg-white/20">+10</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEquipment({...equipment, waterBottles: 0})} className="bg-red-900/50 hover:bg-red-900/80 text-white border-red-500/50 hover:border-red-500/80">Clear</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};


export const TimeSlotSelectionModal = ({ isOpen, onClose, onConfirm, selectedDate, locationId }: { isOpen: boolean; onClose: () => void; onConfirm: (selection: { start: string; end: string; date: string; }) => void; selectedDate: Date | null; locationId: string; }) => {
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<Record<string, any>>({});
    const [selection, setSelection] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    useEffect(() => {
        if (!isOpen || !selectedDate || !locationId) return;

        const fetchSchedule = async () => {
            setLoading(true);
            setSelection({ start: null, end: null });
            const bookings = await getDayScheduleForLocation(selectedDate, locationId);
            
            const newSchedule: Record<string, any> = {};
            timeSlots.forEach(slot => {
                const slotStartHour = parseInt(slot.split(':')[0]);
                const slotEndHour = slotStartHour + 1;

                const bookingForSlot = bookings.find(b => {
                    if (!b.startTime || !b.endTime) return false;
                    const bookingStartHour = parseInt(b.startTime.split(':')[0]);
                    const bookingEndHour = parseInt(b.endTime.split(':')[0]);
                    return slotStartHour < bookingEndHour && slotEndHour > bookingStartHour;
                });

                newSchedule[slot] = bookingForSlot ? { booked: true, ...bookingForSlot } : { booked: false };
            });

            setSchedule(newSchedule);
            setLoading(false);
        };

        fetchSchedule();
    }, [isOpen, selectedDate, locationId]);

    const { toast } = useToast();

    const handleSlotClick = (slot: string) => {
        if (schedule[slot]?.booked) return;

        const { start, end } = selection;

        if (start && end) {
            setSelection({ start: slot, end: null });
        } else if (start && !end) {
            const startIndex = timeSlots.indexOf(start);
            const clickIndex = timeSlots.indexOf(slot);
            
            const [minIdx, maxIdx] = [Math.min(startIndex, clickIndex), Math.max(startIndex, clickIndex)];

            for (let i = minIdx; i <= maxIdx; i++) {
                if (schedule[timeSlots[i]].booked) {
                    toast({ title: "Conflict Detected", description: "Your selection includes a booked slot. Please choose a continuous range of available slots.", variant: "destructive"});
                    setSelection({ start: null, end: null });
                    return;
                }
            }
            setSelection({ start: timeSlots[minIdx], end: timeSlots[maxIdx] });

        } else {
            setSelection({ start: slot, end: null });
        }
    };
    
    const getSlotClass = (slot: string) => {
        const isBooked = schedule[slot]?.booked;
        if (isBooked) return "bg-red-900/40 text-white/50 cursor-not-allowed";

        const { start, end } = selection;
        const slotIndex = timeSlots.indexOf(slot);
        
        if (start && end) {
            const startIndex = timeSlots.indexOf(start);
            const endIndex = timeSlots.indexOf(end);
            if (slotIndex >= startIndex && slotIndex <= endIndex) {
                return "bg-blue-600/80 ring-2 ring-blue-400 text-white";
            }
        }
        
        if (start === slot) return "bg-blue-600/50 ring-2 ring-blue-500 text-white";
        
        return "bg-green-800/20 hover:bg-green-800/50 cursor-pointer";
    };
    
    const selectedStartTime = selection.start;
    const selectedEndTime = selection.end ? `${String(parseInt(selection.end.split(':')[0]) + 1).padStart(2, '0')}:00` : null;

    const handleConfirm = () => {
        if (!selection.start) {
            toast({ title: "No Selection", description: "Please select a time slot.", variant: "destructive"});
            return;
        }
        if (!selectedDate) {
             toast({ title: "No Date", description: "An unknown error occurred where the date was lost.", variant: "destructive"});
             return;
        }

        const finalEndTime = selection.end ? `${String(parseInt(selection.end.split(':')[0]) + 1).padStart(2, '0')}:00` : `${String(parseInt(selection.start.split(':')[0]) + 1).padStart(2, '0')}:00`;
        
        onConfirm({ 
            start: selection.start, 
            end: finalEndTime,
            date: format(selectedDate, 'yyyy-MM-dd')
        });

        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
                <DialogHeader>
                    <DialogTitle>Select Time for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}</DialogTitle>
                    <DialogDescription>Click one available slot to select a single hour, or two to select a range.</DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[60vh] overflow-y-auto pr-4 my-4">
                    {loading ? (
                        <div className="space-y-2">
                            {timeSlots.map(slot => <Skeleton key={slot} className="h-16 w-full bg-white/10" />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                           <TooltipProvider>
                            {timeSlots.map(slot => {
                                const slotData = schedule[slot];
                                const isBooked = slotData?.booked;
                                const endTime = `${String(parseInt(slot.split(':')[0]) + 1).padStart(2, '0')}:00`;
                                
                                const slotContent = (
                                    <div key={slot} onClick={() => handleSlotClick(slot)} className={`p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${getSlotClass(slot)}`}>
                                        <div className="font-mono font-bold text-lg">{slot} - {endTime}</div>
                                        {isBooked ? (
                                            <div className="text-right">
                                                <div className="font-semibold text-red-300 flex items-center gap-2"><XCircle className="w-5 h-5"/> Booked</div>
                                                <div className="text-xs text-white/70 truncate max-w-xs">{slotData.title}</div>
                                            </div>
                                        ) : (
                                            <div className="font-semibold text-green-300 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5"/> Available
                                            </div>
                                        )}
                                    </div>
                                );

                                if (isBooked) {
                                    return (
                                        <Tooltip key={`tip-${slot}`} delayDuration={200}>
                                            <TooltipTrigger asChild>{slotContent}</TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-slate-700">
                                                <p className="font-bold">{slotData.title}</p>
                                                <p>Organized by: {slotData.organizer}</p>
                                                <p>Type: {slotData.type}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                }
                                return slotContent;
                            })}
                           </TooltipProvider>
                        </div>
                    )}
                </div>

                <DialogFooter className="justify-between items-center bg-black/20 p-4 -m-6 mt-0 border-t border-white/10">
                    <div className="text-white/80">
                        {selectedStartTime ? (
                            <span>Selected: <span className="font-bold text-white font-mono">{selectedStartTime} - {selectedEndTime || `${String(parseInt(selectedStartTime.split(':')[0]) + 1).padStart(2, '0')}:00`}</span></span>
                        ) : (
                            <span>No time selected.</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" onClick={() => setSelection({ start: null, end: null })}>Clear</Button>
                         <Button onClick={handleConfirm} disabled={!selection.start} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Confirm Selection</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
