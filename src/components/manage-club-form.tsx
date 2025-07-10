
'use client';

import { useState, useTransition } from 'react';
import type { Club, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateClubAction } from '@/app/dashboard/manage-club/actions';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, X, Trash2, Link, Facebook, Twitter, Instagram } from 'lucide-react';

interface ManageClubFormProps {
  club: Club;
  user: User;
}

export default function ManageClubForm({ club: initialClub, user }: ManageClubFormProps) {
  const [club, setClub] = useState(initialClub);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [newCoverImage, setNewCoverImage] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);

  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryUrlsToDelete, setGalleryUrlsToDelete] = useState<string[]>([]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setClub(prev => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [field]: value },
      }));
    } else {
      setClub(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewGalleryFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };
  
  const removeNewGalleryImage = (index: number) => {
    setNewGalleryFiles(files => files.filter((_, i) => i !== index));
    setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
  };
  
  const removeExistingGalleryImage = (url: string) => {
    setGalleryUrlsToDelete(prev => [...prev, url]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', club.name);
      formData.append('description', club.description);

      // Social Links
      Object.entries(club.socialLinks || {}).forEach(([key, value]) => {
          if (value) formData.append(`socialLinks.${key}`, value);
      });
      
      // Cover Image
      if (newCoverImage) {
        formData.append('image', newCoverImage);
      }

      // Gallery Images
      newGalleryFiles.forEach(file => {
          formData.append('gallery', file);
      });
      formData.append('galleryUrlsToDelete', JSON.stringify(galleryUrlsToDelete));


      const result = await updateClubAction(club.id, club, formData);

      if (result.success) {
        toast({ title: 'Success', description: 'Club details updated successfully.' });
        if (result.updatedClubData) {
            setClub(prev => ({ ...prev, ...result.updatedClubData }));
            // Reset pending file states after successful upload
            setNewCoverImage(null);
            setNewCoverPreview(null);
            setNewGalleryFiles([]);
            setGalleryPreviews([]);
            setGalleryUrlsToDelete([]);
        }
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Your Club</h1>
        <p className="text-white/70">Update your club's profile, social links, and photo gallery.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Club Profile</CardTitle>
            <CardDescription className="text-white/60">This information is visible to all students on the club's detail page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input id="name" name="name" value={club.name} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Club Description</Label>
              <Textarea id="description" name="description" value={club.description} onChange={handleFormChange} required rows={5} />
            </div>
            <div className="space-y-2">
               <Label>Cover Image</Label>
               <div className="w-full bg-black/20 border-2 border-dashed border-white/20 rounded-xl p-4 text-center">
                    <div className="relative group aspect-video">
                        <Image src={newCoverPreview || club.image} alt="Cover preview" fill className="object-cover rounded-lg" data-ai-hint="club banner" />
                    </div>
                    <label htmlFor="cover-image-upload" className="relative cursor-pointer mt-4 inline-block">
                        <div className="text-blue-400 font-semibold hover:underline">Change Cover Image</div>
                        <input id="cover-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleCoverImageChange} />
                    </label>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription className="text-white/60">Link to your club's social media pages and website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-3">
                <Link className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white/10 rounded-md p-2" href={club.socialLinks?.website || '#'} target="_blank"/>
                <Input name="socialLinks.website" value={club.socialLinks?.website || ''} onChange={handleFormChange} placeholder="https://yourclub.com" />
             </div>
             <div className="flex items-center gap-3">
                <Facebook className="h-10 w-10 flex-shrink-0 p-2 bg-white/10 rounded-md"/>
                <Input name="socialLinks.facebook" value={club.socialLinks?.facebook || ''} onChange={handleFormChange} placeholder="https://facebook.com/yourclub" />
             </div>
             <div className="flex items-center gap-3">
                <Twitter className="h-10 w-10 flex-shrink-0 p-2 bg-white/10 rounded-md"/>
                <Input name="socialLinks.twitter" value={club.socialLinks?.twitter || ''} onChange={handleFormChange} placeholder="https://twitter.com/yourclub" />
             </div>
             <div className="flex items-center gap-3">
                <Instagram className="h-10 w-10 flex-shrink-0 p-2 bg-white/10 rounded-md"/>
                <Input name="socialLinks.instagram" value={club.socialLinks?.instagram || ''} onChange={handleFormChange} placeholder="https://instagram.com/yourclub" />
             </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription className="text-white/60">Showcase photos from your club's past events.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Display existing photos */}
                    {(club.gallery || []).filter(url => !galleryUrlsToDelete.includes(url)).map((url, index) => (
                        <div key={`existing-${index}`} className="relative group aspect-square">
                            <Image src={url} alt={`Gallery photo ${index + 1}`} fill className="object-cover rounded-lg" data-ai-hint="event photo" />
                            <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingGalleryImage(url)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {/* Display new photo previews */}
                    {galleryPreviews.map((previewUrl, index) => (
                         <div key={`new-${index}`} className="relative group aspect-square">
                            <Image src={previewUrl} alt={`New photo preview ${index + 1}`} fill className="object-cover rounded-lg" data-ai-hint="event photo" />
                             <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewGalleryImage(index)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                     {/* Upload button */}
                    <label htmlFor="gallery-upload" className="aspect-square flex flex-col items-center justify-center bg-black/20 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-black/30 hover:border-blue-400 transition-colors">
                        <UploadCloud className="w-8 h-8 text-white/50" />
                        <span className="mt-2 text-sm text-center text-white/70">Add Photos</span>
                        <input id="gallery-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleGalleryChange} />
                    </label>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
