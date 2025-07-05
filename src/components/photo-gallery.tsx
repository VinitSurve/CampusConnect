
'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Camera, AlertTriangle, Link as LinkIcon } from 'lucide-react';

interface PhotoGalleryProps {
  albumUrl: string;
}

const getShareTokenFromUrl = (url: string): string | null => {
    try {
        const match = url.match(/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export default function PhotoGallery({ albumUrl }: PhotoGalleryProps) {
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && albumUrl) {
      const shareToken = getShareTokenFromUrl(albumUrl);
      if (!shareToken) {
          setError("This doesn't seem to be a valid Google Photos album link.");
          setIsLoading(false);
          return;
      }

      const fetchPhotos = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/photos/${shareToken}`);
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch photos.');
          }
          const data = await res.json();
          setPhotos(data.photos);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPhotos();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, albumUrl]);

  if (isLoading) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full bg-white/10" />
            ))}
        </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
        <div className="text-center p-8 bg-black/20 rounded-lg border border-white/10">
            <LinkIcon className="mx-auto h-12 w-12 text-white/50 mb-4" />
            <p className="text-white mb-1">To view the event gallery, you need to connect your Google account.</p>
            <p className="text-white/70 mb-4 text-sm">This is a one-time step to grant permission.</p>
            <Button onClick={() => signIn('google')}>Connect with Google</Button>
        </div>
    )
  }

  if (error) {
     return (
        <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500/50">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-white font-semibold mb-2">Could not load gallery</p>
            <p className="text-red-300 text-sm">{error}</p>
        </div>
    )
  }

  if (photos.length === 0) {
      return (
           <div className="text-center p-8 bg-black/20 rounded-lg">
                <Camera className="mx-auto h-12 w-12 text-white/50 mb-4" />
                <p className="text-white">No photos found in this album yet.</p>
           </div>
      )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {photos.slice(0, 4).map((photoUrl, i) => (
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
