
'use client';

import { useState, useTransition } from 'react';
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
import { Calendar, Users, Building, Tag, Info } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface FacultyDashboardClientProps {
  initialRequests: EventProposal[];
}

const DetailItem = ({ label, value, isPreformatted = false }: { label: string; value?: string | string[]; isPreformatted?: boolean }) => {
  if (!value) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div>
      <p className="text-sm font-medium text-white/70">{label}</p>
      {isPreformatted ? (
        <pre className="text-base text-white whitespace-pre-wrap font-sans">{displayValue}</pre>
      ) : (
        <p className="text-base text-white">{displayValue}</p>
      )}
    </div>
  )
}

const EquipmentDetails = ({ equipmentData }: { equipmentData?: string | any }) => {
    if (!equipmentData) return <DetailItem label="Equipment Needs" value="None" />;

    let data;
    try {
        data = typeof equipmentData === 'string' ? JSON.parse(equipmentData) : equipmentData;
    } catch (e) {
        return <DetailItem label="Equipment Needs" value={equipmentData} isPreformatted />;
    }

    const items = [
        data.wirelessMics && `Wireless Mics: ${data.wirelessMics}`,
        data.collarMics && `Collar Mics: ${data.collarMics}`,
        data.chairs && `Chairs: ${data.chairs}`,
        data.table && `Table: 1`,
        data.waterBottles && `Water Bottles: ${data.waterBottles}`,
    ].filter(Boolean);

    if (items.length === 0) return <DetailItem label="Equipment Needs" value="None" />;

    return <DetailItem label="Equipment Needs" value={items.join('\n')} isPreformatted />;
};


export default function FacultyDashboardClient({ initialRequests }: FacultyDashboardClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<EventProposal | null>(null);
  const [requestForDetails, setRequestForDetails] = useState<EventProposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isTransitioning, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useState(() => {
    setIsLoading(false);
  })

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
    if (!selectedRequest) return;
    startTransition(async () => {
      const result = await rejectRequest(selectedRequest.id, rejectionReason);
       if (result.success) {
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        toast({ title: "Success", description: "Event has been rejected." });
        setSelectedRequest(null);
        setRejectionReason("");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-medium text-white">Pending Requests</h3>
          <p className="mt-2 text-3xl font-bold text-white">{requests.length}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-medium text-white">Approved Events</h3>
          <p className="mt-2 text-3xl font-bold text-white">12</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-medium text-white">Total Clubs</h3>
          <p className="mt-2 text-3xl font-bold text-white">8</p>
        </div>
      </div>
      
      <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Pending Event Requests</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/10" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-white/70">No pending requests</div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="bg-white/5 rounded-xl p-4 transition-opacity" style={{ opacity: isTransitioning ? 0.5 : 1 }}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-white">{request.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center text-sm text-white/60 gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(request.date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><Users className="h-4 w-4" />{request.clubName}</div>
                        <div className="flex items-center gap-1.5"><Building className="h-4 w-4" />{request.location}</div>
                        <div className="flex items-center gap-1.5"><Tag className="h-4 w-4" />{request.category}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0 flex-shrink-0">
                      <Button onClick={() => setRequestForDetails(request)} disabled={isTransitioning} variant="outline" className="bg-white/10 hover:bg-white/20 text-white">
                        <Info className="mr-2 h-4 w-4" />Details
                      </Button>
                      <Button onClick={() => handleApprove(request)} disabled={isTransitioning} variant="secondary" className="bg-green-600/80 hover:bg-green-600 text-white">
                        Approve
                      </Button>
                      <Button onClick={() => setSelectedRequest(request)} disabled={isTransitioning} variant="destructive" className="bg-red-600/80 hover:bg-red-600 text-white">
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Reject Event: {selectedRequest?.title}</DialogTitle>
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
      
      {/* Details Dialog */}
       <Dialog open={!!requestForDetails} onOpenChange={(isOpen) => !isOpen && setRequestForDetails(null)}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{requestForDetails?.title}</DialogTitle>
            <DialogDescription>
              Proposed by {requestForDetails?.clubName} for {new Date(requestForDetails?.date || '').toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
             <DetailItem label="Description" value={requestForDetails?.description} isPreformatted />
             <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <DetailItem label="Target Audience" value={requestForDetails?.targetAudience} />
                <DetailItem label="Key Speakers / Guests" value={requestForDetails?.keySpeakers} isPreformatted />
             </div>
             <EquipmentDetails equipmentData={requestForDetails?.equipmentNeeds} />
             <DetailItem label="Budget & Funding" value={requestForDetails?.budgetDetails} isPreformatted />
             <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <DetailItem label="Location" value={requestForDetails?.location} />
                <DetailItem label="Time" value={requestForDetails?.time} />
             </div>
             <DetailItem label="Registration Link" value={requestForDetails?.registrationLink} />
             <DetailItem label="Submitted By" value={requestForDetails?.creatorEmail} />
          </div>
           <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button onClick={() => { if(requestForDetails) handleApprove(requestForDetails); setRequestForDetails(null); }} disabled={isTransitioning} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
