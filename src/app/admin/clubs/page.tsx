
'use client';

import { useState, useEffect, useTransition } from 'react';
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

import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Users, User as UserIcon, BookUser, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const DEFAULT_CLUB: Partial<Club> = {
    name: '',
    description: '',
    facultyAdvisor: '',
    leadId: ''
};

export default function AdminClubsPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClub, setCurrentClub] = useState<Partial<Club>>(DEFAULT_CLUB);
    
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

    const handleOpenForm = async (club?: Club) => {
        try {
            setLoading(true);
            const studentsData = await getStudents();
            setStudents(studentsData);
            setLoading(false);

            if (club) {
                setCurrentClub(club);
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
                    image: 'https://placehold.co/600x400.png',
                    tags: [],
                    contactEmail: leadContactEmail,
                    facultyAdvisor: clubData.facultyAdvisor || '',
                    leadId: clubData.leadId,
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
                        members: 0,
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

    if (loading && clubs.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-10 w-48 bg-white/10" />
                    <Skeleton className="h-10 w-32 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full bg-white/10" />)}
                </div>
            </div>
        )
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Manage Clubs</h1>
                <Button onClick={() => handleOpenForm()} className="gap-2"><PlusCircle /> Add New Club</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                    <div key={club.id} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col group">
                        <div className="relative h-40 w-full">
                            <Image src={club.image || 'https://placehold.co/600x400.png'} alt={club.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                            <h2 className="text-xl font-semibold text-white mb-2">{club.name}</h2>
                            <p className="text-white/70 text-sm mb-4 flex-grow">{club.description}</p>
                            
                            <div className="space-y-2 text-sm text-white/80 mb-4">
                                <p className="flex items-center gap-2"><UserIcon /> <strong>Lead:</strong> {students.find(s => s.id === club.leadId)?.name || 'N/A'}</p>
                                <p className="flex items-center gap-2"><BookUser /> <strong>Advisor:</strong> {club.facultyAdvisor}</p>
                                <p className="flex items-center gap-2"><Mail /> <strong>Contact:</strong> {club.contactEmail}</p>
                                <p className="flex items-center gap-2"><Users /> <strong>Members:</strong> {club.members}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(Array.isArray(club.tags) ? club.tags : []).map(tag => (
                                    <span key={tag} className="px-2 py-1 text-xs bg-white/20 text-white rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-black/20 border-t border-white/10 flex justify-end gap-2">
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
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Club' : 'Add New Club'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
