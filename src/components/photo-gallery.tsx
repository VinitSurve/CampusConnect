
'use client';

import Image from 'next/image';

interface PhotoGalleryProps {
  photoUrls: string[];
}

export default function PhotoGallery({ photoUrls }: PhotoGalleryProps) {
  // The parent component now ensures photoUrls is not empty and handles errors.
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {photoUrls.map((photoUrl, i) => (
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
