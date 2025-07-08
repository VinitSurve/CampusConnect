
import { getEventById } from '@/lib/data';
import EventDetailPage from '@/components/event-detail-page';
import { notFound } from 'next/navigation';
import { getImageInfoFromDriveFolder, getImagesDataUrisFromIds } from '@/lib/drive';
import { curateEventPhotos } from '@/ai/flows/curate-event-photos';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  // Step 1: Fetch lightweight image info (IDs and thumbnail URLs). This is fast.
  const allImageInfo = event.photoAlbumUrl
    ? await getImageInfoFromDriveFolder(event.photoAlbumUrl)
    : [];

  const galleryHasError = allImageInfo === null;
  let finalImageDataUris: string[] = [];
  const totalImageCount = allImageInfo?.length || 0;

  if (!galleryHasError && allImageInfo && allImageInfo.length > 0) {
    let curatedFileIds: string[] = [];

    // Step 2: If there are enough photos, send thumbnail URLs to AI for curation.
    if (totalImageCount > 4) {
      try {
        const thumbnailUrls = allImageInfo.map(info => info.thumbnailUrl);
        const curationResult = await curateEventPhotos({ photoUrls: thumbnailUrls });
        
        // Use the indices returned by the AI to get the corresponding file IDs.
        if (curationResult && Array.isArray(curationResult.curatedIndices) && curationResult.curatedIndices.length > 0) {
          curatedFileIds = curationResult.curatedIndices
            .map(index => allImageInfo[index]?.id) // Map indices to file IDs
            .filter((id): id is string => !!id);   // Filter out any undefined/null IDs
        }
      } catch (error) {
        console.error("AI photo curation failed:", error);
        // Fallback to showing the first 4 photos is handled below.
      }
    }
    
    // If AI curation was skipped, failed, or returned empty, use the first 4 photos as a fallback.
    if (curatedFileIds.length === 0) {
      curatedFileIds = allImageInfo.slice(0, 4).map(info => info.id);
    }
    
    // Step 3: Download full-resolution image data for ONLY the 4 curated photos. This is now fast.
    if (curatedFileIds.length > 0) {
        finalImageDataUris = await getImagesDataUrisFromIds(curatedFileIds);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailPage
        event={event}
        galleryImages={finalImageDataUris}
        galleryHasError={galleryHasError}
        totalImageCount={totalImageCount}
      />
    </div>
  );
}
