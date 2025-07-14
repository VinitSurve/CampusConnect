
import { EventsDisplay } from '@/components/events-display';
import { getEvents } from '@/lib/data';

export default async function EventsPage() {
  const allEvents = await getEvents();
  
  return (
      <EventsDisplay events={allEvents} />
  );
}
