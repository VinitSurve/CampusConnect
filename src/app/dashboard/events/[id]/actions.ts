'use server';

import { getImageInfoFromDriveFolder, getImagesDataUrisFromIds } from '@/lib/drive';
import { curateEventPhotos } from '@/ai/flows/curate-event-photos';

interface FetchGalleryResult {
  finalImageDataUris: string[];
  totalImageCount: number;
  galleryHasError: boolean;
}

export async function fetchAndCurateGallery(photoAlbumUrl: string): Promise<FetchGalleryResult> {
  if (!photoAlbumUrl) {
    return { finalImageDataUris: [], totalImageCount: 0, galleryHasError: false };
  }

  // Step 1: Fetch lightweight image info (IDs and thumbnail URLs). This is fast.
  const allImageInfo = await getImageInfoFromDriveFolder(photoAlbumUrl);

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
        // Fallback to showing the first 4 photos is handled by the check below if curatedFileIds remains empty.
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

  return { finalImageDataUris, totalImageCount, galleryHasError };
}
