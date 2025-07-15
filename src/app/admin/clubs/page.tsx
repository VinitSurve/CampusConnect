
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { getClubs, getStudents, getAllFaculty } from '@/lib/data';
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
import { PlusCircle, Edit, Trash2, Search, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { StudentSelector } from '@/components/student-selector';


const DEFAULT_CLUB: Partial<Club> = {
    name: '',
    description: '',
    facultyAdvisorIds: [],
    leadId: '',
    whatsAppGroupLink: '',
    socialLinks: {
        website: '',
        instagram: '',
        linkedin: '',
    }
};

// --- SERVER ACTION ---
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
    const whatsAppGroupLink = formData.get('whatsAppGroupLink') as string;
    const website = formData.get('website') as string;
    const instagram = formData.get('instagram') as string;
    const linkedin = formData.get('linkedin') as string;

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
        
        const dataToSave = {
            name,
            description,
            image: 'https://placehold.co/600x400.png',
            tags: [],
            contactEmail: leadContactEmail,
            facultyAdvisorIds,
            leadId,
            whatsAppGroupLink,
            socialLinks: { website, instagram, linkedin }
        };

        if (clubId) {
            const clubRef = doc(db, "clubs", clubId);
            await updateDoc(clubRef, {
                ...dataToSave,
                updatedAt: serverTimestamp(),
            });
        } else {
            await addDoc(collection(db, "clubs"), {
                ...dataToSave,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user.uid,
            });
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
    const [allFaculty, setAllFaculty] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClub, setCurrentClub] = useState<Partial<Club>>(DEFAULT_CLUB);
    
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    
    const studentsMap = useMemo(() => new Map(clubs.map(c => c.leadId && c.lead ? [c.leadId, c.lead] : null).filter(Boolean) as [string, User][]), [clubs]);
    
    const refreshData = async () => {
        setLoading(true);
        try {
            const [clubsData, facultyData] = await Promise.all([getClubs(), getAllFaculty()]);
            
            const clubsWithLeadData = await Promise.all(clubsData.map(async (club) => {
                let lead: User | null = null;
                if (club.leadId) {
                    lead = await getStudentById(club.leadId);
                }
                return { ...club, lead };
            }));

            setClubs(clubsWithLeadData);
            setAllFaculty(facultyData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        refreshData();
    }, []);

    const facultyMap = useMemo(() => new Map(allFaculty.map(f => [f.id, f])), [allFaculty]);

    const filteredClubs = useMemo(() => {
        if (!searchTerm) return clubs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return clubs.filter(club => {
            const studentLeadName = club.lead?.name || '';
            const advisors = (club.facultyAdvisorIds || []).map(id => facultyMap.get(id)?.name).filter(Boolean).join(' ');
            return (
                club.name.toLowerCase().includes(lowercasedFilter) ||
                (club.description && club.description.toLowerCase().includes(lowercasedFilter)) ||
                advisors.toLowerCase().includes(lowercasedFilter) ||
                studentLeadName.toLowerCase().includes(lowercasedFilter)
            );
        });
    }, [searchTerm, clubs, facultyMap]);


    const handleOpenForm = async (club?: Club) => {
        try {
            if (club) {
                const clubData = {
                    ...club,
                    socialLinks: club.socialLinks || DEFAULT_CLUB.socialLinks,
                    facultyAdvisorIds: club.facultyAdvisorIds || []
                };
                setCurrentClub(clubData);
                setIsEditMode(true);
            } else {
                setCurrentClub(DEFAULT_CLUB);
                setIsEditMode(false);
            }
            setIsDialogOpen(true);
        } catch (error) {
            toast({ title: "Error", description: "Failed to open form.", variant: "destructive" });
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
        startTransition(async () => {
            try {
                const formData = new FormData();
                
                // Append all data to FormData
                if (currentClub.id) formData.append('id', currentClub.id);
                formData.append('name', currentClub.name || '');
                formData.append('description', currentClub.description || '');
                formData.append('leadId', currentClub.leadId || '');
                (currentClub.facultyAdvisorIds || []).forEach(id => formData.append('facultyAdvisorIds', id));
                formData.append('whatsAppGroupLink', currentClub.whatsAppGroupLink || '');
                formData.append('website', currentClub.socialLinks?.website || '');
                formData.append('instagram', currentClub.socialLinks?.instagram || '');
                formData.append('linkedin', currentClub.socialLinks?.linkedin || '');
                
                const result = await handleClubSave(formData);
                
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
                ...(prev.socialLinks as any),
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
                            <TableHead>Club Name</TableHead>
                            <TableHead>Student Lead</TableHead>
                            <TableHead>Faculty Advisors</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClubs.length > 0 ? filteredClubs.map(club => {
                             const advisors = (club.facultyAdvisorIds || []).map(id => facultyMap.get(id)?.name).filter(Boolean);
                             return (
                                <TableRow key={club.id} className="border-b-white/10 hover:bg-white/5">
                                    <TableCell className="font-medium text-white">{club.name}</TableCell>
                                    <TableCell className="text-white/80">{club.lead?.name || 'N/A'}</TableCell>
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
                                <TableCell colSpan={4} className="text-center h-24 text-white/70">
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
                            <StudentSelector 
                                className="col-span-3"
                                value={currentClub.leadId || ''}
                                onChange={(studentId) => setCurrentClub(prev => ({...prev, leadId: studentId}))}
                            />
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
                                    <Label htmlFor="linkedin" className="text-right">LinkedIn</Label>
                                    <Input id="linkedin" name="linkedin" value={currentClub.socialLinks?.linkedin || ''} onChange={handleSocialLinkChange} className="col-span-3" placeholder="https://linkedin.com/company/..."/>
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
