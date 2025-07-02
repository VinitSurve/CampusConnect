import PublicHeader from '@/components/public-header';
import { EventsDisplay } from '@/components/events-display';
import { getEvents } from '@/lib/data';
import AnimatedParticles from '@/components/animated-particles';

export default async function HomePage() {
  const allEvents = await getEvents();
  const upcomingEvents = allEvents.filter(e => e.status === 'upcoming');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
            style={{ top: '10%', right: '15%' }}></div>
            <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
            style={{ bottom: '5%', left: '10%' }}></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
            <AnimatedParticles />
        </div>
        
        <div className="relative z-10">
            <PublicHeader />
            <EventsDisplay events={upcomingEvents} />
        </div>
    </div>
  );
}