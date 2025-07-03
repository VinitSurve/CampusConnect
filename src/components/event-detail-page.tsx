
'use client';

import type { Event } from '@/types';
import Image from 'next/image';
import { Button } from './ui/button';
import { Calendar, Clock, MapPin, Tag, Target, Users, Mic, UserCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface EventDetailPageProps {
  event: Event;
}

const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    if (!children || (typeof children === 'string' && !children.trim()) || (Array.isArray(children) && children.length === 0)) return null;
    return (
        <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <div className="text-white/80 space-y-3 prose prose-invert prose-p:my-0 prose-ul:my-0 prose-li:my-1">
                {children}
            </div>
        </div>
    );
};

export default function EventDetailPage({ event }: EventDetailPageProps) {
  const { 
      title, longDescription, date, time, location, organizer, category, image, headerImage, eventLogo,
      registrationLink, whatYouWillLearn, targetAudience, keySpeakers
  } = event;

  const parseSpeakers = (speakers?: string) => {
    if (!speakers) return [];
    return speakers.split('\n').map(line => {
      const [name, bio] = line.split(' - ');
      return { name: name?.trim(), bio: bio?.trim() };
    }).filter(s => s.name);
  };
  
  const speakersList = parseSpeakers(keySpeakers);

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
             <div className="relative h-64 md:h-80 w-full">
                <Image src={headerImage || image || 'https://placehold.co/2560x650.png'} alt={title} layout="fill" objectFit="cover" data-ai-hint="event photo" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
                        {eventLogo && (
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 border-white/20 bg-black/50 overflow-hidden flex-shrink-0 mb-4 sm:mb-0">
                                <Image src={eventLogo} alt={`${title} logo`} layout="fill" objectFit="cover" />
                            </div>
                        )}
                        <div className="flex flex-col items-start">
                             <Badge variant="secondary" className="mb-2 bg-white/20 text-white">{category}</Badge>
                             <h1 className="text-3xl md:text-4xl font-bold text-white shadow-lg">{title}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-center gap-3 text-white/90 p-4 bg-white/5 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-400" />
                        <div>
                            <p className="font-semibold">{new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 text-white/90 p-4 bg-white/5 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-400" />
                        <div>
                            <p className="font-semibold">{time}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 text-white/90 p-4 bg-white/5 rounded-lg">
                        <MapPin className="h-6 w-6 text-blue-400" />
                        <div>
                            <p className="font-semibold">{location}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mb-8">
                    <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-10 py-6">
                        <a href={registrationLink} target="_blank" rel="noopener noreferrer">RSVP Now</a>
                    </Button>
                </div>
                
                <div className="space-y-8">
                    <DetailSection title="About this event" icon={<Tag className="h-6 w-6 text-blue-400" />}>
                        <p>{longDescription}</p>
                    </DetailSection>

                    <DetailSection title="What You'll Learn" icon={<Target className="h-6 w-6 text-blue-400" />}>
                         <ul className="list-disc pl-5 space-y-2">
                            {whatYouWillLearn?.split('\n').map((item, index) => item.trim() && <li key={index}>{item.replace(/^-/, '').trim()}</li>)}
                        </ul>
                    </DetailSection>
                    
                    <DetailSection title="Who Should Attend" icon={<Users className="h-6 w-6 text-blue-400" />}>
                        <p>{Array.isArray(targetAudience) ? targetAudience.join(', ') : targetAudience}</p>
                    </DetailSection>

                    {speakersList.length > 0 && (
                        <DetailSection title="Speakers" icon={<Mic className="h-6 w-6 text-blue-400" />}>
                            <div className="space-y-4">
                                {speakersList.map((speaker, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <UserCircle className="h-10 w-10 text-white/50 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-white">{speaker.name}</h3>
                                            <p className="text-sm text-white/70">{speaker.bio}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                    
                    <DetailSection title="Organized by" icon={<UserCircle className="h-6 w-6 text-blue-400" />}>
                        <p>{organizer}</p>
                    </DetailSection>
                </div>
            </div>
        </div>
    </div>
  );
}
