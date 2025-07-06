
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

  if (!galleryHasError) {
      if (totalImageCount > 4) {
          try {
              const curationResult = await curateEventPhotos({ photoUrls: allGalleryImages! });
              // Ensure we have a valid array, even if AI returns junk
              if (curationResult && Array.isArray(curationResult.curatedUrls) && curationResult.curatedUrls.length > 0) {
                  finalGalleryImages = curationResult.curatedUrls;
              } else {
                  // AI failed or returned empty, fallback to first 4
                  console.error("AI photo curation returned invalid data, falling back.");
                  finalGalleryImages = allGalleryImages!.slice(0, 4);
              }
          } catch (error) {
              console.error("AI photo curation failed, falling back to showing the first 4 images.", error);
              finalGalleryImages = allGalleryImages!.slice(0, 4);
          }
      } else {
          // 4 or fewer images, just show them all
          finalGalleryImages = allGalleryImages!;
      }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage 
        event={event} 
        galleryImages={finalGalleryImages} 
        galleryHasError={galleryHasError}
        totalImageCount={totalImageCount}
      />
    </div>
  );
}
