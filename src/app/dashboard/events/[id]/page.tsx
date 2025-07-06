
import { getEventById } from '@/lib/data';
import EventDetailPage from '@/components/event-detail-page';
import { notFound } from 'next/navigation';
import { getImagesFromDriveFolder } from '@/lib/drive';

export default async function Page({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  // Fetch gallery images from the drive link on the server
  const galleryImages = event.photoAlbumUrl 
    ? await getImagesFromDriveFolder(event.photoAlbumUrl) 
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage event={event} galleryImages={galleryImages} />
    </div>
  );
}
