
import { getEventById } from '@/lib/data';
import EventDetailPage from '@/components/event-detail-page';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  // All the slow photo fetching logic has been moved to a client component
  // and a server action. The page now loads almost instantly.

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage event={event} />
    </div>
  );
}
