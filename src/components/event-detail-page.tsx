
'use client';

import type { Event, Club, User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, Target, Users, Mic, UserCircle, Info, Calendar, Clock, MapPin, Globe, Map, Camera, CalendarPlus, Building, Link as LinkIcon, Instagram, Linkedin } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { format } from 'date-fns';
import EventGallery from './event-gallery';
import { getStudentById } from '@/lib/data';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';


interface EventDetailPageProps {
  event: Event;
  club: Club | null;
  lead: User | null;
}

const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    if (!children || (typeof children === 'string' && !children.trim()) || (Array.isArray(children) && children.length === 0) || (Array.isArray(children) && children.every(item => !item))) return null;
    return (
        <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <div className="text-white/80 space-y-3 prose prose-invert prose-p:my-0 prose-ul:my-0 prose-li:my-1 prose-ul:list-none prose-ul:p-0">
                {children}
            </div>
        </div>
    );
};

const ClubInfoCard = ({ club, leadUser }: { club: Club | null; leadUser: User | null }) => {
    if (!club) return null;

    return (
        <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <Building className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Organizing Club</h2>
            </div>
            <div className="space-y-4">
                <Link href={`/dashboard/clubs/${club.id}`} className="font-bold text-lg text-blue-300 hover:underline">{club.name}</Link>
                
                {leadUser ? (
                     <div className="flex items-center gap-2 text-white/80">
                        <UserCircle className="w-5 h-5"/>
                        <span>Lead: {leadUser.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-white/80">
                        <Skeleton className="h-4 w-24" />
                    </div>
                )}
                
                {(club.socialLinks && Object.values(club.socialLinks).some(link => link)) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {club.socialLinks.website && <Button asChild size="sm" variant="outline" className="bg-white/5"><a href={club.socialLinks.website} target="_blank" rel="noopener noreferrer"><LinkIcon /> Website</a></Button>}
                        {club.socialLinks.instagram && <Button asChild size="sm" variant="outline" className="bg-white/5"><a href={club.socialLinks.instagram} target="_blank" rel="noopener noreferrer"><Instagram /> Instagram</a></Button>}
                        {club.socialLinks.linkedin && <Button asChild size="sm" variant="outline" className="bg-white/5"><a href={club.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn</a></Button>}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function EventDetailPage({ event, club, lead }: EventDetailPageProps) {
  const { 
      title, description, longDescription, organizer, category, image, headerImage, eventLogo,
      whatYouWillLearn, targetAudience, keySpeakers, tags, date, time, endTime, registrationLink, location,
      allowExternals, photoAlbumUrl
  } = event;

  const parseSpeakers = (speakers?: string) => {
    if (!speakers) return [];
    return speakers.split('\n').map(line => {
      const [name, bio] = line.split(' - ');
      return { name: name?.trim(), bio: bio?.trim() };
    }).filter(s => s.name);
  };
  
  const speakersList = parseSpeakers(keySpeakers);

  // Safely create date object to avoid timezone issues during formatting
  const eventDate = new Date(`${date}T00:00:00`);
  
  const generateGoogleCalendarLink = () => {
    if (!event.date || !event.time) return '#';

    const formatGoogleCalendarDate = (date: Date) => {
      // Converts to YYYYMMDDTHHMMSSZ format
      return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };
    
    const startDate = new Date(`${event.date}T${event.time}`);
    // Default to a 1-hour duration if no end time is provided
    const endDate = event.endTime ? new Date(`${event.date}T${event.endTime}`) : new Date(startDate.getTime() + 60 * 60 * 1000);

    // Creating a more detailed description for the calendar event
    const details = `For more details, visit the event page:\n${window.location.href}\n\n${event.longDescription || event.description}`;

    // Determine location based on whether externals are allowed
    const calendarLocation = event.allowExternals 
      ? "Bharati Vidyapeeth Department of Management Studies (Off Campus), Sector 3, Sector 4, Kharghar, Navi Mumbai, Maharashtra 410210" 
      : event.location;

    const gCalUrl = new URL('https://www.google.com/calendar/render');
    gCalUrl.searchParams.set('action', 'TEMPLATE');
    gCalUrl.searchParams.set('text', event.title);
    gCalUrl.searchParams.set('dates', `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`);
    gCalUrl.searchParams.set('details', details);
    gCalUrl.searchParams.set('location', calendarLocation);

    return gCalUrl.toString();
  };


  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
             <div className="relative h-64 md:h-80 w-full">
                <Image 
                  src={headerImage || image || 'https://placehold.co/2560x650.png'} 
                  alt={title} 
                  fill 
                  sizes="(max-width: 896px) 100vw, 896px" 
                  className="object-cover" 
                  data-ai-hint="event photo" 
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
                        {eventLogo && (
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 border-white/20 bg-black/50 overflow-hidden flex-shrink-0 mb-4 sm:mb-0">
                                <Image src={eventLogo} alt={`${title} logo`} fill sizes="8rem" className="object-cover" />
                            </div>
                        )}
                        <div className="flex flex-col items-start">
                             <Badge variant="secondary" className="mb-2 bg-white/20 text-white">{category}</Badge>
                             <h1 className="text-3xl md:text-4xl font-bold text-white shadow-lg">{title}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <DetailSection title="About this event" icon={<Info className="h-6 w-6 text-blue-400" />}>
                        <p>{longDescription || description}</p>
                    </DetailSection>

                    {photoAlbumUrl && (
                        <DetailSection title="Event Gallery" icon={<Camera className="h-6 w-6 text-blue-400" />}>
                            <EventGallery photoAlbumUrl={photoAlbumUrl} />
                        </DetailSection>
                    )}

                    {allowExternals && (
                      <DetailSection title="Campus Location" icon={<Globe className="h-6 w-6 text-blue-400" />}>
                        <p className="font-semibold mb-2">Bharati Vidyapeeth Department of Management Studies (Off Campus)</p>
                        <p className="mb-4">Sector 3, Sector 4, Kharghar, Navi Mumbai, Maharashtra 410210</p>
                        <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10">
                          <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.6917411681556!2d73.05602431538356!3d19.0332619871128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c24243ffffff%3A0x1d14e05b6301389e!2sBharati%20Vidyapeeth%20Institute%20of%20Management%20Studies%20and%20Research!5e0!3m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Google Map of the event location"
                          ></iframe>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <a href="https://maps.app.goo.gl/WZ5m7xgHH4YRyz9D9" target="_blank" rel="noopener noreferrer">
                                    <Map className="mr-2 h-4 w-4" />
                                    View on Google Maps
                                </a>
                            </Button>
                        </div>
                      </DetailSection>
                    )}
                    
                    <DetailSection title="Tags" icon={<Tag className="h-6 w-6 text-blue-400" />}>
                        <div className="flex flex-wrap gap-2">
                            {tags?.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="bg-white/10 text-white font-normal">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
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
                                    <div key={index} className="flex items-center gap-4">
                                        <UserCircle className="h-10 w-10 text-white/50" />
                                        <div>
                                            <h3 className="font-semibold text-white">{speaker.name}</h3>
                                            <p className="text-sm text-white/70">{speaker.bio}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-8 self-start lg:sticky lg:top-24">
                     <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Calendar className="h-8 w-8 text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">{format(eventDate, 'MMMM d, yyyy')}</p>
                                    <p className="text-white/70 text-sm">{format(eventDate, 'EEEE')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Clock className="h-8 w-8 text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">{time}{endTime && ` - ${endTime}`}</p>
                                    <p className="text-white/70 text-sm">Event Time</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <MapPin className="h-8 w-8 text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">{location}</p>
                                    <p className="text-white/70 text-sm">Location</p>
                                </div>
                            </div>
                        </div>
                         <div className="w-full mt-6 flex flex-col gap-3">
                            {registrationLink && (
                            <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <a href={registrationLink} target="_blank" rel="noopener noreferrer">RSVP Now</a>
                            </Button>
                            )}
                            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                                <a href={generateGoogleCalendarLink()} target="_blank" rel="noopener noreferrer">
                                    <CalendarPlus />
                                    Add to Calendar
                                </a>
                            </Button>
                        </div>
                    </div>
                     <ClubInfoCard club={club} leadUser={lead} />
                </div>
            </div>
        </div>
    </div>
  );
}
