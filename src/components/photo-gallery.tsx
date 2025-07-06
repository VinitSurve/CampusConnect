
'use client';

import Image from 'next/image';

interface PhotoGalleryProps {
  photoUrls: string[];
}

export default function PhotoGallery({ photoUrls }: PhotoGalleryProps) {
  // Add a final, robust filter to ensure only valid, non-empty strings are passed to the Image component.
  // This prevents crashes if the AI or data source returns malformed data (e.g., empty strings or nulls).
  const validPhotoUrls = photoUrls.filter(url => typeof url === 'string' && url.trim() !== '');

  if (validPhotoUrls.length === 0) {
    return null; // Don't render anything if there are no valid photos.
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {validPhotoUrls.map((photoUrl, i) => (
        <div key={i} className="aspect-square relative rounded-lg overflow-hidden group border-2 border-white/10 shadow-lg">
          <Image
            src={photoUrl}
            alt={`Event photo ${i + 1}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="event photograph"
          />
        </div>
      ))}
    </div>
  );
}
