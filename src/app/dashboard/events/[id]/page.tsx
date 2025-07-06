
import { getEventById } from '@/lib/data';
import EventDetailPage from '@/components/event-detail-page';
import { notFound } from 'next/navigation';
import { getImagesFromDriveFolder } from '@/lib/drive';
import { curateEventPhotos } from '@/ai/flows/curate-event-photos';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  // Fetch all gallery images from the drive link on the server
  const allGalleryImages = event.photoAlbumUrl 
    ? await getImagesFromDriveFolder(event.photoAlbumUrl) 
    : [];

  // Handle the case where the folder is inaccessible vs. empty
  const galleryHasError = allGalleryImages === null;
  let finalGalleryImages = allGalleryImages || [];
  
  // If there are more than 4 images, use AI to curate the best ones.
  if (!galleryHasError && finalGalleryImages.length > 4) {
    try {
      // The AI flow will return up to 4 images
      const curationResult = await curateEventPhotos({ photoUrls: finalGalleryImages });
      finalGalleryImages = curationResult.curatedUrls;
    } catch (error) {
      console.error("AI photo curation failed, falling back to showing the first 4 images.", error);
      // Fallback to showing the first 4 if AI fails
      finalGalleryImages = finalGalleryImages.slice(0, 4);
    }
  } else if (!galleryHasError && finalGalleryImages.length > 0) {
     // If there are 1-4 images, just show them all.
     finalGalleryImages = finalGalleryImages.slice(0, 4);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage 
        event={event} 
        galleryImages={finalGalleryImages} 
        galleryHasError={galleryHasError}
        totalImageCount={allGalleryImages?.length || 0}
      />
    </div>
  );
}
