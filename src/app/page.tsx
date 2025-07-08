import PublicHeader from '@/components/public-header';
import { EventsDisplay } from '@/components/events-display';
import { getEvents } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allEvents = await getEvents();
  const upcomingEvents = allEvents.filter(e => e.status === 'upcoming');
  
  return (
    <>
      <PublicHeader />
      <EventsDisplay events={upcomingEvents} />
    </>
  );
}
