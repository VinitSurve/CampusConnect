
'use client';

import Image from 'next/image';
import { Camera, AlertTriangle } from 'lucide-react';

interface PhotoGalleryProps {
  photoUrls: string[];
  hasError?: boolean;
}

export default function PhotoGallery({ photoUrls, hasError }: PhotoGalleryProps) {

  if (hasError) {
    return (
      <div className="text-center p-8 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
        <p className="text-yellow-200 font-semibold">Could not load photos.</p>
        <p className="text-yellow-300/80 text-sm mt-1">Please ensure the Google Drive folder is shared with "Anyone with the link".</p>
      </div>
    );
  }

  if (photoUrls.length === 0) {
    return (
      <div className="text-center p-8 bg-black/20 rounded-lg">
        <Camera className="mx-auto h-12 w-12 text-white/50 mb-4" />
        <p className="text-white">No photos have been added to the gallery yet.</p>
      </div>
    );
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
