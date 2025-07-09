'use client';

import { useState, useEffect } from 'react';
import { fetchAndCurateGallery } from '../app/dashboard/events/[id]/actions';
import PhotoGallery from './photo-gallery';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { AlertTriangle, ExternalLink, Info } from 'lucide-react';

interface EventGalleryProps {
  photoAlbumUrl: string | undefined | null;
}

export default function EventGallery({ photoAlbumUrl }: EventGalleryProps) {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [totalImageCount, setTotalImageCount] = useState(0);
  const [galleryHasError, setGalleryHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!photoAlbumUrl) {
      setIsLoading(false);
      return;
    }

    const loadGallery = async () => {
      try {
        const result = await fetchAndCurateGallery(photoAlbumUrl);
        setGalleryImages(result.finalImageDataUris);
        setTotalImageCount(result.totalImageCount);
        setGalleryHasError(result.galleryHasError);
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
        setGalleryHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [photoAlbumUrl]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="aspect-square w-full bg-white/10" />
        <Skeleton className="aspect-square w-full bg-white/10" />
        <Skeleton className="aspect-square w-full bg-white/10" />
        <Skeleton className="aspect-square w-full bg-white/10" />
      </div>
    );
  }

  if (galleryHasError) {
    return (
      <div className="text-center p-8 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
        <p className="text-yellow-200 font-semibold">Could not load photos.</p>
        <p className="text-yellow-300/80 text-sm mt-1">The folder might be restricted or deleted. Please ensure it's shared with "Anyone with the link".</p>
      </div>
    );
  }

  if (galleryImages.length > 0) {
    return (
      <>
        <PhotoGallery photoUrls={galleryImages} />
        {totalImageCount > 4 && photoAlbumUrl && (
          <div className="text-center mt-6">
            <Button asChild size="lg">
              <a href={photoAlbumUrl} target="_blank" rel="noopener noreferrer">
                View Full Album ({totalImageCount} Photos)
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="text-center p-8 bg-blue-900/20 border border-blue-500/30 rounded-lg">
      <Info className="mx-auto h-12 w-12 text-blue-300 mb-4" />
      <p className="text-white font-semibold">Photos Coming Soon!</p>
      <p className="text-white/80 text-sm mt-1">Photos from the event will appear here once they are added by the organizer.</p>
    </div>
  );
}
