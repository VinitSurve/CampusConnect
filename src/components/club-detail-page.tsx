
'use client';

import { useState } from 'react';
import type { Club, Event, User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, BookUser, User as UserIcon, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface ClubDetailPageProps {
  club: Club;
  events: Event[];
  lead: User | null;
}

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
    if (!children) return null;
    return (
        <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
            <div className="text-white/80 space-y-3 prose prose-invert prose-p:my-0">
                {children}
            </div>
        </div>
    );
};

export default function ClubDetailPage({ club, events, lead }: ClubDetailPageProps) {
    const [joinStatus, setJoinStatus] = useState<'idle' | 'pending' | 'joined'>('idle');

    const handleJoinRequest = () => {
        setJoinStatus('pending');
        // Mocking an API call
        setTimeout(() => {
            setJoinStatus('joined');
        }, 1500);
    };

    const getButtonState = () => {
        switch (joinStatus) {
            case 'pending':
                return { text: 'Request Sent', disabled: true };
            case 'joined':
                return { text: "You're a Member", disabled: true };
            default:
                return { text: 'Request to Join', disabled: false };
        }
    };

    const buttonState = getButtonState();
    
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
    const pastEvents = events.filter(e => new Date(e.date) < new Date());

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="relative h-64 md:h-80 w-full">
                    <Image src={club.image || 'https://placehold.co/2560x650.png'} alt={club.name} fill sizes="100vw" className="object-cover" data-ai-hint="organization community" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <h1 className="text-3xl md:text-4xl font-bold text-white shadow-lg">{club.name}</h1>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="md:col-span-2 space-y-4">
                            <p className="text-white/80">{club.description}</p>
                             <div className="flex flex-wrap gap-2">
                                {club.tags?.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="bg-white/10 text-white font-normal">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                            <h3 className="font-semibold text-white mb-2">Club Details</h3>
                            {lead && (
                                <p className="flex items-center gap-2 text-sm"><UserIcon /> <strong>Lead:</strong> {lead.name}</p>
                            )}
                            <p className="flex items-center gap-2 text-sm"><BookUser /> <strong>Advisor:</strong> {club.facultyAdvisor}</p>
                            <p className="flex items-center gap-2 text-sm"><Mail /> <strong>Contact:</strong> <a href={`mailto:${club.contactEmail}`} className="text-blue-400 hover:underline">{club.contactEmail}</a></p>
                            <Button onClick={handleJoinRequest} disabled={buttonState.disabled} className="w-full mt-2">
                                {buttonState.text}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {upcomingEvents.length > 0 && (
                            <DetailSection title="Upcoming Events">
                                <div className="space-y-4">
                                {upcomingEvents.map(event => (
                                    <Link key={event.id} href={`/dashboard/events/${event.id}`} className="block bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
                                        <h4 className="font-semibold text-white">{event.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-white/70 mt-1">
                                            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(`${event.date}T00:00:00`), 'MMM d, yyyy')}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {event.time}</span>
                                        </div>
                                    </Link>
                                ))}
                                </div>
                            </DetailSection>
                        )}
                        
                        {pastEvents.length > 0 && (
                             <DetailSection title="Past Events">
                                 <p className="text-sm text-white/70">Check out what we've been up to! This section will soon feature a photo gallery from past events.</p>
                            </DetailSection>
                        )}

                        {events.length === 0 && (
                            <DetailSection title="Events">
                                <p className="text-center text-white/70 py-8">This club has no scheduled events right now. Check back soon!</p>
                            </DetailSection>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
