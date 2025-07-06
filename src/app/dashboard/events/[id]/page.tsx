
import { getEventById } from '@/lib/data';
import EventDetailPage from '@/components/event-detail-page';
import { notFound } from 'next/navigation';
import { getImagesFromDriveFolder } from '@/lib/drive';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  // Fetch gallery images from the drive link on the server
  const galleryImageResult = event.photoAlbumUrl 
    ? await getImagesFromDriveFolder(event.photoAlbumUrl) 
    : [];

  // Handle the case where the folder is inaccessible vs. empty
  const galleryHasError = galleryImageResult === null;
  const galleryImages = galleryImageResult || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage event={event} galleryImages={galleryImages} galleryHasError={galleryHasError} />
    </div>
  );
}
