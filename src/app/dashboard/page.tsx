
import { EventsDisplay } from '@/components/events-display';
import { getEvents } from '@/lib/data';

export default async function DashboardPage() {
  const allEvents = await getEvents();
  const upcomingEvents = allEvents.filter(e => e.status === 'upcoming');
  
  return (
      <EventsDisplay events={upcomingEvents} />
  );
}
