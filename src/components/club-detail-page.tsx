
'use client';

import { useState } from 'react';
import type { Club, Event, User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, BookUser, User as UserIcon, Calendar, Clock, MessageSquare, Camera, Users, Share2, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClubDetailPageProps {
  club: Club;
  events: Event[];
  lead: User | null;
}

const Section = ({ title, icon, children, cta }: { title: string; icon?: React.ReactNode; children: React.ReactNode; cta?: React.ReactNode }) => {
    return (
        <div className="py-8">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    {icon}
                    <h2 className="text-2xl font-semibold text-white">{title}</h2>
                </div>
                {cta}
            </div>
            <div className="text-white/80 space-y-4 prose prose-invert prose-p:my-0">
                {children}
            </div>
        </div>
    );
};

const EventCard = ({ event }: { event: Event }) => (
    <Link href={`/dashboard/events/${event.id}`} className="block bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-colors">
        <p className="text-sm text-white/70">{format(new Date(`${event.date}T00:00:00`), 'EEE, MMM d, yyyy')} • {event.time}</p>
        <h4 className="font-semibold text-white mt-1">{event.title}</h4>
        <p className="text-sm text-white/70 mt-1 flex items-center gap-2"><UserIcon className="w-4 h-4" /> {event.attendees} attendees</p>
    </Link>
);


export default function ClubDetailPage({ club, events, lead }: ClubDetailPageProps) {
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    const [showAllPast, setShowAllPast] = useState(false);
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.date >= todayStr && e.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date));
    const pastEvents = events.filter(e => e.date < todayStr).sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden mb-8">
                <div className="relative h-64 md:h-80 w-full">
                    <Image 
                      src={club.image || 'https://placehold.co/2560x650.png'} 
                      alt={club.name} 
                      fill 
                      sizes="(max-width: 896px) 100vw, 896px"
                      className="object-cover" 
                      data-ai-hint="organization community" 
                      priority 
                    />
                </div>
                <div className="p-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white shadow-lg mb-3">{club.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80 mb-6">
                        {club.facultyAdvisor && <span className="flex items-center gap-2"><BookUser /> {club.facultyAdvisor}</span>}
                        {club.contactEmail && <span className="flex items-center gap-2"><Mail /> {club.contactEmail}</span>}
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 text-white"><Share2 className="mr-2"/> Share</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                        <Section title="What we're about">
                            <p>{club.description}</p>
                        </Section>
                        <Separator className="my-6 bg-white/10" />
                        {upcomingEvents.length > 0 ? (
                            <Section 
                                title={`Upcoming Events (${upcomingEvents.length})`}
                                icon={<Calendar className="w-6 h-6 text-blue-400" />}
                                cta={upcomingEvents.length > 3 ? (
                                    <Button variant="link" className="text-blue-400" onClick={() => setShowAllUpcoming(!showAllUpcoming)}>
                                        {showAllUpcoming ? 'Show less' : 'See all'}
                                    </Button>
                                ) : null}
                            >
                                <div className="space-y-4 not-prose">
                                    {(showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 3)).map(event => <EventCard key={event.id} event={event} />)}
                                </div>
                            </Section>
                        ) : (
                            <Section 
                                title="Upcoming Events"
                                icon={<Calendar className="w-6 h-6 text-blue-400" />}
                            >
                                <p className="text-center text-white/70 py-4">No upcoming events scheduled yet. Check back soon!</p>
                            </Section>
                        )}
                        
                        <Separator className="my-6 bg-white/10" />

                        {pastEvents.length > 0 && (
                            <>
                                <Section 
                                    title={`Past Events (${pastEvents.length})`}
                                    icon={<Clock className="w-6 h-6 text-blue-400" />}
                                    cta={pastEvents.length > 3 ? (
                                        <Button variant="link" className="text-blue-400" onClick={() => setShowAllPast(!showAllPast)}>
                                            {showAllPast ? 'Show less' : 'See all'}
                                        </Button>
                                    ) : null}
                                >
                                    <div className="space-y-4 not-prose">
                                        {(showAllPast ? pastEvents : pastEvents.slice(0, 3)).map(event => <EventCard key={event.id} event={event} />)}
                                    </div>
                                </Section>
                                <Separator className="my-6 bg-white/10" />
                            </>
                        )}

                        <Section 
                            title="Photos"
                            icon={<Camera className="w-6 h-6 text-blue-400" />}
                            cta={pastEvents.length > 4 ? (
                                <Button variant="link" className="text-blue-400" onClick={() => setShowAllPhotos(!showAllPhotos)}>
                                    {showAllPhotos ? 'Show less' : 'See all'}
                                </Button>
                            ) : null}
                        >
                            {pastEvents.length > 0 ? (
                                <>
                                    <p className="text-sm text-white/70">Photos from past events are available on the event pages.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 not-prose pt-4">
                                        {(showAllPhotos ? pastEvents : pastEvents.slice(0, 4)).map(event => (
                                            <Link href={`/dashboard/events/${event.id}`} key={event.id} className="aspect-square relative rounded-lg overflow-hidden group border-2 border-white/10 shadow-lg">
                                                <Image src={event.headerImage || event.image || 'https://placehold.co/400x400.png'} alt={event.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/50 flex items-end p-2">
                                                    <p className="text-white text-xs font-bold truncate group-hover:whitespace-normal">{event.title}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-white/70 py-4">No photos from past events yet.</p>
                            )}
                        </Section>

                        <Separator className="my-6 bg-white/10" />

                        <Section 
                            title="Discussions"
                            icon={<MessageSquare className="w-6 h-6 text-blue-400" />}
                        >
                             <div className="text-center text-white/70 py-8 bg-black/20 rounded-lg">
                                <p>Discussions feature coming soon!</p>
                             </div>
                        </Section>
                    </div>
                </div>

                <div className="space-y-8">
                     <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                        <Section title="Organizer">
                             {lead ? (
                                 <div className="flex items-center gap-4 not-prose">
                                     <Avatar>
                                         <AvatarImage src={lead.avatar} alt={lead.name} />
                                         <AvatarFallback>{lead.name?.[0]}</AvatarFallback>
                                     </Avatar>
                                     <div>
                                         <p className="font-semibold text-white">{lead.name}</p>
                                         <p className="text-sm text-white/70">{lead.course}</p>
                                     </div>
                                 </div>
                             ) : <p className="text-sm text-white/70">Organizer information not available.</p>}
                        </Section>
                     </div>
                     
                     <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                         <Section title="Related Topics" icon={<Tag className="w-6 h-6 text-blue-400" />}>
                            <div className="flex flex-wrap gap-2">
                                {(club.tags || []).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="bg-white/10 text-white font-normal cursor-pointer hover:bg-white/20">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                         </Section>
                     </div>
                </div>
            </div>
        </div>
    )
}
