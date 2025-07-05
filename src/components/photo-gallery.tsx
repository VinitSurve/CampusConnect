
'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';

interface PhotoGalleryProps {
  photoUrls: string[];
}

export default function PhotoGallery({ photoUrls }: PhotoGalleryProps) {

  if (!photoUrls || photoUrls.length === 0) {
      return (
           <div className="text-center p-8 bg-black/20 rounded-lg">
                <Camera className="mx-auto h-12 w-12 text-white/50 mb-4" />
                <p className="text-white">No gallery preview available for this event.</p>
           </div>
      )
  }

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
