
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { getClubs, getStudents } from '@/lib/data';
import type { Club, User } from '@/types';
import { collection, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const DEFAULT_CLUB: Partial<Club> = {
    name: '',
    description: '',
    facultyAdvisor: '',
    leadId: '',
    whatsAppGroupLink: '',
    socialLinks: {
        website: '',
        facebook: '',
        twitter: '',
        instagram: '',
    }
};

export default function AdminClubsPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClub, setCurrentClub] = useState<Partial<Club>>(DEFAULT_CLUB);
    
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    
    const refreshData = async () => {
        try {
            const [clubsData, studentsData] = await Promise.all([getClubs(), getStudents()]);
            setClubs(clubsData);
            setStudents(studentsData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
        }
    };
    
    useEffect(() => {
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, []);

    const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const filteredClubs = useMemo(() => {
        if (!searchTerm) return clubs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return clubs.filter(club => {
            const studentLead = club.leadId ? studentsMap.get(club.leadId) : null;
            return (
                club.name.toLowerCase().includes(lowercasedFilter) ||
                (club.description && club.description.toLowerCase().includes(lowercasedFilter)) ||
                club.facultyAdvisor.toLowerCase().includes(lowercasedFilter) ||
                (studentLead && studentLead.name.toLowerCase().includes(lowercasedFilter))
            );
        });
    }, [searchTerm, clubs, studentsMap]);


    const handleOpenForm = async (club?: Club) => {
        try {
            setLoading(true);
            const studentsData = await getStudents();
            setStudents(studentsData);
            setLoading(false);

            if (club) {
                // Ensure socialLinks is an object even if it's missing from Firestore data
                const clubData = {
                    ...club,
                    socialLinks: club.socialLinks || DEFAULT_CLUB.socialLinks
                };
                setCurrentClub(clubData);
                setIsEditMode(true);
            } else {
                setCurrentClub(DEFAULT_CLUB);
                setIsEditMode(false);
            }
            setIsDialogOpen(true);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load up-to-date student list.", variant: "destructive" });
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

    const handleSave = () => {
        if (!currentClub.name || !currentClub.leadId || !currentClub.facultyAdvisor) {
            toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    toast({ title: "Authentication Error", description: "You must be logged in to save a club.", variant: "destructive" });
                    return;
                }

                const { id, ...clubData } = currentClub;
                
                if (!clubData.leadId) {
                    toast({ title: "Error", description: "A club lead must be selected.", variant: "destructive" });
                    return;
                }

                const studentDocRef = doc(db, "users", clubData.leadId);
                const studentDoc = await getDoc(studentDocRef);

                if (!studentDoc.exists()) {
                    toast({ title: "Error", description: "Selected club lead could not be found.", variant: "destructive" });
                    return;
                }
                const leadContactEmail = studentDoc.data().email;
                if (!leadContactEmail) {
                    toast({ title: "Error", description: "The selected club lead does not have an email address.", variant: "destructive" });
                    return;
                }

                const dataToSave = {
                    name: clubData.name || '',
                    description: clubData.description || '',
                    image: clubData.image || 'https://placehold.co/600x400.png',
                    tags: clubData.tags || [],
                    contactEmail: leadContactEmail,
                    facultyAdvisor: clubData.facultyAdvisor || '',
                    leadId: clubData.leadId,
                    whatsAppGroupLink: clubData.whatsAppGroupLink || '',
                    socialLinks: {
                        website: clubData.socialLinks?.website || '',
                        facebook: clubData.socialLinks?.facebook || '',
                        twitter: clubData.socialLinks?.twitter || '',
                        instagram: clubData.socialLinks?.instagram || ''
                    }
                };

                if (id) {
                    const clubRef = doc(db, "clubs", id);
                    await updateDoc(clubRef, {
                        ...dataToSave,
                        updatedAt: serverTimestamp(),
                    });
                    toast({ title: "Success", description: "Club updated successfully." });
                } else {
                    await addDoc(collection(db, "clubs"), {
                        ...dataToSave,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        createdBy: user.uid,
                    });
                    toast({ title: "Success", description: "Club created successfully." });
                }

                setIsDialogOpen(false);
                await refreshData();

            } catch (error: any) {
                console.error("Error saving club:", error);
                if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
                    toast({ title: "Permission Denied", description: "You do not have permission to perform this action. Please ensure you are logged in as faculty.", variant: "destructive" });
                } else {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                }
            }
        });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentClub(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentClub(prev => ({
            ...prev,
            socialLinks: {
                ...prev?.socialLinks,
                [name]: value
            }
        }));
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
                            <TableHead>Faculty Advisor</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClubs.length > 0 ? filteredClubs.map(club => {
                             const studentLead = club.leadId ? studentsMap.get(club.leadId) : null;
                             return (
                                <TableRow key={club.id} className="border-b-white/10 hover:bg-white/5">
                                    <TableCell>
                                        <Image src={club.image || 'https://placehold.co/100x100.png'} alt={club.name} width={40} height={40} className="rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="font-medium text-white">{club.name}</TableCell>
                                    <TableCell className="text-white/80">{studentLead?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-white/80">{club.facultyAdvisor}</TableCell>
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="facultyAdvisor" className="text-right">Advisor*</Label>
                            <Input id="facultyAdvisor" name="facultyAdvisor" value={currentClub.facultyAdvisor || ''} onChange={handleFormChange} className="col-span-3"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="leadId" className="text-right">Club Lead*</Label>
                             <select
                                id="leadId"
                                name="leadId"
                                value={currentClub.leadId || ''}
                                onChange={handleFormChange}
                                className="col-span-3 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                required
                            >
                                <option value="" disabled className="bg-gray-800">Select a student lead...</option>
                                {students.length > 0 ? (
                                    students.map(student => (
                                        <option
                                            key={student.id}
                                            value={student.id}
                                            className="bg-gray-800"
                                        >
                                            {student.name} ({student.course} - {student.year})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled className="bg-gray-800">No students found</option>
                                )}
                            </select>
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

