
import { getEventById, getClubById, getStudentById } from '@/lib/data';
import EventDetailPage from '@/components/event-detail-page';
import { notFound } from 'next/navigation';
import type { Club, User } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  let club: Club | null = null;
  let lead: User | null = null;

  if (event.clubId) {
    club = await getClubById(event.clubId);
    if (club?.leadId) {
      lead = await getStudentById(club.leadId);
    }
  }

  // All the slow photo fetching logic has been moved to a client component
  // and a server action. The page now loads almost instantly.

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage event={event} club={club} lead={lead} />
    </div>
  );
}
