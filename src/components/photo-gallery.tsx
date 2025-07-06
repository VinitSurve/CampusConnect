
'use client';

import Image from 'next/image';

interface PhotoGalleryProps {
  photoUrls: string[];
}

export default function PhotoGallery({ photoUrls }: PhotoGalleryProps) {
  // This is the final line of defense. We will only accept strings that are valid data URIs for images.
  // This prevents crashes from empty strings, nulls, or malformed data from any source.
  const validPhotoUrls = Array.isArray(photoUrls)
    ? photoUrls.filter(url => typeof url === 'string' && url.startsWith('data:image'))
    : [];

  if (validPhotoUrls.length === 0) {
    // It's better to render nothing than to crash the page.
    return null;
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
