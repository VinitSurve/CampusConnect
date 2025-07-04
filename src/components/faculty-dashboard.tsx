
'use client';

import { useState, useTransition, useEffect } from 'react';
import type { EventProposal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { approveRequest, rejectRequest } from '@/app/admin/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Building, Tag, Info, User as UserIcon, DollarSign, Wrench, Link as LinkIcon, Image as ImageIcon, FileText, Target, Mic } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FacultyDashboardClientProps {
  initialRequests: EventProposal[];
}

const DetailItem = ({ icon, label, value, isPreformatted = false, isLink = false }: { icon: React.ReactNode, label: string; value?: string | string[]; isPreformatted?: boolean, isLink?: boolean }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  
  const content = isLink ? (
    <a href={displayValue} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{displayValue}</a>
  ) : isPreformatted ? (
    <pre className="text-base text-white whitespace-pre-wrap font-sans bg-black/20 p-3 rounded-md">{displayValue}</pre>
  ) : (
    <p className="text-base text-white">{displayValue}</p>
  );

  return (
    <div>
      <p className="text-sm font-medium text-white/70 flex items-center gap-2 mb-1">{icon} {label}</p>
      {content}
    </div>
  )
}

const EquipmentDetails = ({ jsonString }: { jsonString?: string }) => {
    if (!jsonString) return <p className="text-base text-white">None requested.</p>;
  
    try {
        const data = JSON.parse(jsonString);
        
        const labelMap: { [key: string]: string } = {
            wirelessMics: "Wireless Mics",
            collarMics: "Collar Mics",
            waterBottles: "Water Bottles",
            table: "Table",
            chairs: "Chairs",
        };

        const items = Object.entries(data)
            .map(([key, value]) => {
                if (!value || value === 0) return null;
                const label = labelMap[key] || key;
                const displayValue = value === true ? "Yes" : String(value);
                return { label, value: displayValue };
            })
            .filter(Boolean);

        if (items.length === 0) {
            return <p className="text-base text-white">None requested.</p>;
        }

        return (
            <div className="bg-black/20 p-3 rounded-md">
                <ul className="list-disc list-inside text-base text-white space-y-1">
                    {items.map(item => (
                        item && <li key={item.label}>
                            {item.label}: <span className="font-semibold">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );

    } catch (e) {
        return <p className="text-base text-white bg-black/20 p-3 rounded-md">{jsonString}</p>;
    }
};


export default function FacultyDashboardClient({ initialRequests }: FacultyDashboardClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<EventProposal | null>(null);
  const [requestForRejection, setRequestForRejection] = useState<EventProposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isTransitioning, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (initialRequests.length > 0) {
      setSelectedRequest(initialRequests[0]);
    } else {
      setSelectedRequest(null);
    }
    setRequests(initialRequests);
    setIsLoading(false);
  }, [initialRequests]);

  const handleApprove = (request: EventProposal) => {
    startTransition(async () => {
      const result = await approveRequest(request);
      if (result.success) {
        setRequests(prev => prev.filter(req => req.id !== request.id));
        toast({ title: "Success", description: "Event approved successfully!" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!requestForRejection) return;
    startTransition(async () => {
      const result = await rejectRequest(requestForRejection.id, rejectionReason);
       if (result.success) {
        setRequests(prev => prev.filter(req => req.id !== requestForRejection.id));
        toast({ title: "Success", description: "Event has been rejected." });
        setRequestForRejection(null);
        setRejectionReason("");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4"><Skeleton className="h-[600px] w-full bg-white/10" /></div>
        <div className="lg:col-span-8"><Skeleton className="h-[600px] w-full bg-white/10" /></div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request Queue Column */}
        <div className="lg:col-span-4 backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-4">
          <h2 className="text-lg font-semibold text-white px-2 mb-2">Request Queue ({requests.length})</h2>
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2">
            {requests.length > 0 ? requests.map(request => (
              <button 
                key={request.id} 
                onClick={() => setSelectedRequest(request)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  selectedRequest?.id === request.id ? 'bg-blue-600/50' : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <p className="font-medium text-white truncate">{request.title}</p>
                <p className="text-sm text-white/70 truncate">{request.clubName}</p>
              </button>
            )) : (
              <div className="text-center py-12 text-white/70">No pending requests</div>
            )}
          </div>
        </div>

        {/* Details & Actions Column */}
        <div className="lg:col-span-8">
          {selectedRequest ? (
            <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10">
              <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold text-white">{selectedRequest.title}</h1>
                <div className="mt-2 flex flex-wrap items-center text-sm text-white/60 gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5"><Users /> {selectedRequest.clubName}</div>
                  <div className="flex items-center gap-1.5"><Calendar /> {new Date(selectedRequest.date).toLocaleDateString()} at {selectedRequest.time}</div>
                  <div className="flex items-center gap-1.5"><Building /> {selectedRequest.location}</div>
                  <div className="flex items-center gap-1.5"><Tag /> {selectedRequest.category}</div>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                <DetailItem icon={<Info />} label="Description" value={selectedRequest.description} isPreformatted />
                <DetailItem icon={<Target />} label="What You'll Learn" value={selectedRequest.whatYouWillLearn} isPreformatted />
                <DetailItem icon={<Users />} label="Target Audience" value={selectedRequest.targetAudience} />
                <DetailItem icon={<Mic />} label="Key Speakers / Guests" value={selectedRequest.keySpeakers} isPreformatted />
                
                <div>
                  <p className="text-sm font-medium text-white/70 flex items-center gap-2 mb-1"><Wrench /> Equipment Needs</p>
                  <EquipmentDetails jsonString={selectedRequest.equipmentNeeds} />
                </div>
                
                <DetailItem icon={<DollarSign />} label="Budget & Funding" value={selectedRequest.budgetDetails} isPreformatted />
                <DetailItem icon={<LinkIcon />} label="Registration Link" value={selectedRequest.registrationLink} isLink />
                <DetailItem icon={<FileText />} label="Tags" value={Array.isArray(selectedRequest.tags) ? selectedRequest.tags.join(', ') : selectedRequest.tags} />
                <DetailItem icon={<UserIcon />} label="Submitted By" value={selectedRequest.creatorEmail} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/70 flex items-center gap-2 mb-1"><ImageIcon /> Header Image</p>
                    <Image src={selectedRequest.headerImage || 'https://placehold.co/600x400.png'} alt="Header Image" width={400} height={200} className="rounded-lg object-cover" />
                  </div>
                   <div>
                    <p className="text-sm font-medium text-white/70 flex items-center gap-2 mb-1"><ImageIcon /> Event Logo</p>
                    <Image src={selectedRequest.eventLogo || 'https://placehold.co/100x100.png'} alt="Event Logo" width={100} height={100} className="rounded-lg object-cover bg-black/20" />
                  </div>
                </div>

              </div>
              
              <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end gap-2">
                <Button onClick={() => setRequestForRejection(selectedRequest)} disabled={isTransitioning} variant="destructive">
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedRequest)} disabled={isTransitioning} variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
                  Approve
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6 text-white/70">
              Select a request from the queue to view its details.
            </div>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!requestForRejection} onOpenChange={(isOpen) => !isOpen && setRequestForRejection(null)}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Reject Event: {requestForRejection?.title}</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this proposal. This will be shared with the student.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="bg-gray-800 border-gray-600 text-white"
            rows={4}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={isTransitioning || !rejectionReason.trim()}>
              {isTransitioning ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
