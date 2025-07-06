
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

  const galleryHasError = allGalleryImages === null;
  let finalGalleryImages: string[] = [];
  const totalImageCount = allGalleryImages?.length || 0;

  if (!galleryHasError && allGalleryImages) {
    if (totalImageCount > 4) {
      try {
        const curationResult = await curateEventPhotos({ photoUrls: allGalleryImages });
        
        // Use the indices returned by the AI to build the gallery
        if (curationResult && Array.isArray(curationResult.curatedIndices) && curationResult.curatedIndices.length > 0) {
            finalGalleryImages = curationResult.curatedIndices
                .map(index => allGalleryImages[index]) // Map indices to the actual image data
                .filter(Boolean); // Filter out any undefined/null if index was out of bounds
        }
        
        // Fallback if AI curation fails or returns invalid data
        if (finalGalleryImages.length === 0) {
            console.error("AI photo curation returned invalid indices, falling back.");
            finalGalleryImages = allGalleryImages.slice(0, 4);
        }

      } catch (error) {
        console.error("AI photo curation failed, falling back to showing the first 4 images.", error);
        finalGalleryImages = allGalleryImages.slice(0, 4);
      }
    } else {
      // 4 or fewer images, just show them all
      finalGalleryImages = allGalleryImages;
    }
  }

  // Final defensive filtering to absolutely prevent empty strings from reaching the Image component.
  const cleanGalleryImages = finalGalleryImages.filter(url => url && typeof url === 'string');

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage
        event={event}
        galleryImages={cleanGalleryImages}
        galleryHasError={galleryHasError}
        totalImageCount={totalImageCount}
      />
    </div>
  );
}
