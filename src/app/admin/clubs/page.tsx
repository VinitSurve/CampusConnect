
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { getClubs, getStudents, getAllFaculty } from '@/lib/data';
import type { Club, User } from '@/types';
import { collection, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createClubFolder, uploadClubLogo } from '@/lib/drive';
import { Readable } from 'stream';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Search, Check, UploadCloud, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';


const DEFAULT_CLUB: Partial<Club> = {
    name: '',
    description: '',
    facultyAdvisorIds: [],
    leadId: '',
    logoUrl: '',
    googleDriveFolderId: '',
    whatsAppGroupLink: '',
    socialLinks: {
        website: '',
        facebook: '',
        twitter: '',
        instagram: '',
    }
};

// --- SERVER ACTION ---
// This function runs only on the server
async function handleClubSave(formData: FormData) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "You must be logged in to save a club." };
    }
    
    const clubId = formData.get('id') as string | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const leadId = formData.get('leadId') as string;
    const facultyAdvisorIds = formData.getAll('facultyAdvisorIds') as string[];
    let existingLogoUrl = formData.get('logoUrl') as string;
    let driveFolderId = formData.get('googleDriveFolderId') as string;
    const whatsAppGroupLink = formData.get('whatsAppGroupLink') as string;
    const website = formData.get('website') as string;
    const facebook = formData.get('facebook') as string;
    const twitter = formData.get('twitter') as string;
    const instagram = formData.get('instagram') as string;
    const logoFile = formData.get('logoFile') as File | null;

    if (!name || !leadId || facultyAdvisorIds.length === 0) {
        return { success: false, error: "Please fill all required fields, including at least one faculty advisor." };
    }

    try {
        const studentDocRef = doc(db, "users", leadId);
        const studentDoc = await getDoc(studentDocRef);

        if (!studentDoc.exists()) {
             return { success: false, error: "Selected club lead could not be found." };
        }
        const leadContactEmail = studentDoc.data().email;
        if (!leadContactEmail) {
            return { success: false, error: "The selected club lead does not have an email address." };
        }

        let finalLogoUrl = existingLogoUrl;

        // For new club or if we don't have a folder yet, create one
        if (!driveFolderId && name) {
            try {
                // Use our new createClubFolder function
                const { folderId } = await createClubFolder(name);
                driveFolderId = folderId;
                console.log(`Created club folder with ID: ${folderId}`);
            } catch (folderError) {
                console.error("Error creating club folder:", folderError);
                // Continue even if folder creation fails, we'll just not be able to upload the logo
            }
        }
        
        // If we have a logo file and a folder to store it in
        if (logoFile && logoFile.size > 0 && driveFolderId) {
            try {
                // Convert File to Buffer for server-side processing
                const arrayBuffer = await logoFile.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                // Upload the logo using our specialized function
                finalLogoUrl = await uploadClubLogo(buffer, driveFolderId, logoFile.name);
                console.log(`Uploaded logo with URL: ${finalLogoUrl}`);
            } catch (uploadError) {
                console.error("Error uploading club logo:", uploadError);
                // Continue without the logo if upload fails
            }
        }
        
        const dataToSave = {
            name,
            description,
            image: 'https://placehold.co/600x400.png',
            logoUrl: finalLogoUrl,
            googleDriveFolderId: driveFolderId,
            tags: [], // Tags can be added later if needed
            contactEmail: leadContactEmail,
            facultyAdvisorIds,
            leadId,
            whatsAppGroupLink,
            socialLinks: { website, facebook, twitter, instagram }
        };

        if (clubId) {
            const clubRef = doc(db, "clubs", clubId);
            await updateDoc(clubRef, {
                ...dataToSave,
                updatedAt: serverTimestamp(),
            });
        } else {
            const newClubRef = await addDoc(collection(db, "clubs"), {
                ...dataToSave,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user.uid,
            });
            // If it's a new club, update its drive folder ID
            if (driveFolderId) {
              await updateDoc(newClubRef, { googleDriveFolderId: driveFolderId });
            }
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error in handleClubSave server action:", error);
        const message = error.code === 'permission-denied' 
            ? "You do not have permission to perform this action. Please ensure you are logged in as faculty."
            : error.message;
        return { success: false, error: message };
    }
}


// --- CLIENT COMPONENT ---
export default function AdminClubsPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [allFaculty, setAllFaculty] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClub, setCurrentClub] = useState<Partial<Club>>(DEFAULT_CLUB);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    
    const refreshData = async () => {
        try {
            const [clubsData, studentsData, facultyData] = await Promise.all([getClubs(), getStudents(), getAllFaculty()]);
            setClubs(clubsData);
            setStudents(studentsData);
            setAllFaculty(facultyData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
        }
    };
    
    useEffect(() => {
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, []);

    const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const facultyMap = useMemo(() => new Map(allFaculty.map(f => [f.id, f])), [allFaculty]);

    const filteredClubs = useMemo(() => {
        if (!searchTerm) return clubs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return clubs.filter(club => {
            const studentLead = club.leadId ? studentsMap.get(club.leadId) : null;
            const advisors = (club.facultyAdvisorIds || []).map(id => facultyMap.get(id)?.name).filter(Boolean).join(' ');
            return (
                club.name.toLowerCase().includes(lowercasedFilter) ||
                (club.description && club.description.toLowerCase().includes(lowercasedFilter)) ||
                advisors.toLowerCase().includes(lowercasedFilter) ||
                (studentLead && studentLead.name.toLowerCase().includes(lowercasedFilter))
            );
        });
    }, [searchTerm, clubs, studentsMap, facultyMap]);


    const handleOpenForm = async (club?: Club) => {
        try {
            setLoading(true);
            const [studentsData, facultyData] = await Promise.all([getStudents(), getAllFaculty()]);
            setStudents(studentsData);
            setAllFaculty(facultyData);
            setLoading(false);

            setLogoFile(null);

            if (club) {
                const clubData = {
                    ...club,
                    socialLinks: club.socialLinks || DEFAULT_CLUB.socialLinks,
                    facultyAdvisorIds: club.facultyAdvisorIds || []
                };
                setCurrentClub(clubData);
                setLogoPreview(club.logoUrl || null);
                setIsEditMode(true);
            } else {
                setCurrentClub(DEFAULT_CLUB);
                setLogoPreview(null);
                setIsEditMode(false);
            }
            setIsDialogOpen(true);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load up-to-date lists.", variant: "destructive" });
        }
    };

    const handleDelete = (clubId: string) => {
        startTransition(async () => {
            try {
                await deleteDoc(doc(db, "clubs", clubId));
                toast({ title: "Success", description: "Club deleted successfully." });
                await refreshData();
            } catch (error: any) {
                console.error("Error deleting club:", error);
                if (error.code === 'permission-denied') {
                    toast({ title: "Permission Denied", description: "You do not have permission to delete clubs.", variant: "destructive" });
                } else {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                }
            }
        });
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setLogoFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setLogoPreview(currentClub.logoUrl || null);
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                
                // Append all data to FormData
                if (currentClub.id) formData.append('id', currentClub.id);
                formData.append('name', currentClub.name || '');
                formData.append('description', currentClub.description || '');
                formData.append('leadId', currentClub.leadId || '');
                (currentClub.facultyAdvisorIds || []).forEach(id => formData.append('facultyAdvisorIds', id));
                formData.append('logoUrl', currentClub.logoUrl || '');
                formData.append('googleDriveFolderId', currentClub.googleDriveFolderId || '');
                formData.append('whatsAppGroupLink', currentClub.whatsAppGroupLink || '');
                formData.append('website', currentClub.socialLinks?.website || '');
                formData.append('facebook', currentClub.socialLinks?.facebook || '');
                formData.append('twitter', currentClub.socialLinks?.twitter || '');
                formData.append('instagram', currentClub.socialLinks?.instagram || '');
                
                if (logoFile) {
                    console.log(`Attaching logo file: ${logoFile.name}, size: ${logoFile.size}, type: ${logoFile.type}`);
                    formData.append('logoFile', logoFile);
                } else {
                    console.log("No logo file to attach");
                }

                console.log("Submitting club save request...");
                const result = await handleClubSave(formData);
                
                console.log("Club save result:", result);
                if (result.success) {
                    toast({ title: "Success", description: `Club ${isEditMode ? 'updated' : 'created'} successfully.` });
                    setIsDialogOpen(false);
                    await refreshData();
                } else {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                }
            } catch (error) {
                console.error("Unexpected error in handleSave:", error);
                toast({ title: "Error", description: "An unexpected error occurred while saving the club.", variant: "destructive" });
            }
        });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentClub(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentClub(prev => ({
            ...prev,
            socialLinks: {
                ...(prev.socialLinks as any), // Type assertion to avoid optional chaining issues
                [name]: value
            }
        }));
    };
    
    const handleAdvisorSelect = (advisorId: string) => {
        setCurrentClub(prev => {
            const currentIds = prev?.facultyAdvisorIds || [];
            const newIds = currentIds.includes(advisorId) 
                ? currentIds.filter(id => id !== advisorId)
                : [...currentIds, advisorId];
            return { ...prev, facultyAdvisorIds: newIds };
        });
    };
    
    if (loading && clubs.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-10 w-48 bg-white/10" />
                    <Skeleton className="h-10 w-32 bg-white/10" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-white/10" />
                    <Skeleton className="h-24 w-full bg-white/10" />
                    <Skeleton className="h-24 w-full bg-white/10" />
                </div>
            </div>
        )
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Clubs</h1>
                    <p className="text-white/70 mt-1">Search, view, and manage all campus clubs.</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white self-start md:self-center"><PlusCircle /> Add New Club</Button>
            </div>

            <div className="mb-6 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                 <Input
                    placeholder="Search by club, lead, or advisor..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-white/10 hover:bg-white/5">
                            <TableHead className="w-[80px]">Logo</TableHead>
                            <TableHead>Club Name</TableHead>
                            <TableHead>Student Lead</TableHead>
                            <TableHead>Faculty Advisors</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClubs.length > 0 ? filteredClubs.map(club => {
                             const studentLead = club.leadId ? studentsMap.get(club.leadId) : null;
                             const advisors = (club.facultyAdvisorIds || []).map(id => facultyMap.get(id)?.name).filter(Boolean);
                             return (
                                <TableRow key={club.id} className="border-b-white/10 hover:bg-white/5">
                                    <TableCell>
                                        <Image src={club.logoUrl || 'https://placehold.co/100x100.png'} alt={club.name} width={40} height={40} className="rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="font-medium text-white">{club.name}</TableCell>
                                    <TableCell className="text-white/80">{studentLead?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-white/80">{advisors.join(', ') || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <Button variant="ghost" size="icon" onClick={() => handleOpenForm(club)} className="text-white/70 hover:text-white hover:bg-white/20"><Edit /></Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-400 hover:bg-red-900/50"><Trash2 /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete {club.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone and will permanently delete the club.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(club.id)} disabled={isPending} className="bg-red-600 hover:bg-red-700">
                                                        {isPending ? 'Deleting...' : 'Delete'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                             );
                        }) : (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-white/70">
                                    No clubs found.
                                </TableCell>
                             </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Club' : 'Add New Club'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name*</Label>
                            <Input id="name" name="name" value={currentClub.name || ''} onChange={handleFormChange} className="col-span-3"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Textarea id="description" name="description" value={currentClub.description || ''} onChange={handleFormChange} className="col-span-3"/>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                             <Label className="text-right mt-2">Logo</Label>
                             <div className="col-span-3 space-y-2">
                                <div className="w-full bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-4 text-center">
                                    {logoPreview ? (
                                        <div className="relative group aspect-square w-32 mx-auto">
                                            <Image src={logoPreview} alt="Logo Preview" fill sizes="8rem" className="object-contain rounded-lg" />
                                            <button type="button" onClick={() => { setLogoPreview(currentClub.logoUrl || null); setLogoFile(null); const input = document.getElementById('logo-upload') as HTMLInputElement; if(input) input.value = ''; }} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/80 transition-opacity opacity-50 group-hover:opacity-100">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <UploadCloud className="w-10 h-10 text-white/50" />
                                            <label htmlFor="logo-upload" className="relative cursor-pointer">
                                                <span className="text-blue-400 font-semibold">Click to upload</span>
                                                <input id="logo-upload" name="logoFile" type="file" className="sr-only" accept="image/jpeg, image/png" onChange={handleLogoFileChange} />
                                            </label>
                                            <p className="text-xs text-white/50">PNG, JPG up to 1MB</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4 pt-2">
                             <Label htmlFor="facultyAdvisors" className="text-right mt-2">Advisors*</Label>
                             <div className="col-span-3">
                                 <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                         <Button variant="outline" className="w-full justify-start text-left font-normal h-auto">
                                             <div className="flex gap-1 flex-wrap">
                                                 {(currentClub.facultyAdvisorIds && currentClub.facultyAdvisorIds.length > 0) ? currentClub.facultyAdvisorIds.map(id => (
                                                      <Badge key={id} variant="secondary" className="bg-white/20">
                                                         {facultyMap.get(id)?.name || 'Unknown Advisor'}
                                                      </Badge>
                                                  )) : 'Select advisors...'}
                                             </div>
                                         </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent className="w-[400px]" align="start">
                                         <div className="p-2 text-sm text-muted-foreground">Select one or more advisors</div>
                                         <DropdownMenuSeparator />
                                         <div className="max-h-60 overflow-y-auto">
                                            {allFaculty.map((faculty) => (
                                                <DropdownMenuItem
                                                   key={faculty.id}
                                                   onSelect={(e) => { e.preventDefault(); handleAdvisorSelect(faculty.id); }}
                                                   className="flex justify-between"
                                                >
                                                   <span>{faculty.name}</span>
                                                    {currentClub.facultyAdvisorIds?.includes(faculty.id) && <Check className="h-4 w-4" />}
                                                </DropdownMenuItem>
                                            ))}
                                         </div>
                                     </DropdownMenuContent>
                                 </DropdownMenu>
                             </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="leadId" className="text-right">Club Lead*</Label>
                            <Select 
                                name="leadId" 
                                value={currentClub.leadId || ''} 
                                onValueChange={(value) => setCurrentClub(prev => ({ ...prev, leadId: value }))}
                            >
                                <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a student lead..." />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 text-white">
                                {students.length > 0 ? (
                                    students.map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name} ({student.course} - {student.year})
                                    </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>No students found</SelectItem>
                                )}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                             <h4 className="text-lg font-semibold text-white mb-4 border-t border-white/10 pt-6">Social & Communication Links</h4>
                             <div className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="whatsAppGroupLink" className="text-right">WhatsApp</Label>
                                    <Input id="whatsAppGroupLink" name="whatsAppGroupLink" value={currentClub.whatsAppGroupLink || ''} onChange={handleFormChange} className="col-span-3" placeholder="https://chat.whatsapp.com/..."/>
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="website" className="text-right">Website</Label>
                                    <Input id="website" name="website" value={currentClub.socialLinks?.website || ''} onChange={handleSocialLinkChange} className="col-span-3" placeholder="https://..."/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="instagram" className="text-right">Instagram</Label>
                                    <Input id="instagram" name="instagram" value={currentClub.socialLinks?.instagram || ''} onChange={handleSocialLinkChange} className="col-span-3" placeholder="https://instagram.com/..."/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="twitter" className="text-right">Twitter/X</Label>
                                    <Input id="twitter" name="twitter" value={currentClub.socialLinks?.twitter || ''} onChange={handleSocialLinkChange} className="col-span-3" placeholder="https://x.com/..."/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="facebook" className="text-right">Facebook</Label>
                                    <Input id="facebook" name="facebook" value={currentClub.socialLinks?.facebook || ''} onChange={handleSocialLinkChange} className="col-span-3" placeholder="https://facebook.com/..."/>
                                </div>
                             </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleSave} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                           {isPending ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Club')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
