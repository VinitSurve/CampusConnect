
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PlusCircle, Mail, Building, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllFaculty, inviteFaculty } from './actions';


export default function AdminFacultiesPage() {
    const [faculty, setFaculty] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    
    const { toast } = useToast();

    const fetchFaculty = async () => {
        setLoading(true);
        try {
            const facultyData = await getAllFaculty();
            setFaculty(facultyData);
        } catch (error) {
            console.error("Error fetching faculty:", error);
            toast({ title: "Error", description: "Failed to load faculty data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaculty();
    }, []);

    const handleInvite = () => {
        if (!inviteName || !inviteEmail) {
            toast({ title: "Missing Information", description: "Please enter a name and email.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                const result = await inviteFaculty({ name: inviteName, email: inviteEmail });
                if (result.success) {
                    toast({ title: "Invitation Sent", description: `An invitation has been sent to ${inviteEmail}.` });
                    setIsInviteOpen(false);
                    setInviteName('');
                    setInviteEmail('');
                } else {
                    toast({ title: "Invitation Failed", description: result.error, variant: "destructive" });
                }
            } catch (error) {
                toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
            }
        });
    };
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Faculty</h1>
                    <p className="text-white/70 mt-1">Invite, view, and manage faculty members.</p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white self-start md:self-center">
                    <PlusCircle /> Invite New Faculty
                </Button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="space-y-2 p-4">
                        <Skeleton className="h-12 w-full bg-white/10" />
                        <Skeleton className="h-16 w-full bg-white/10" />
                        <Skeleton className="h-16 w-full bg-white/10" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-white/10 hover:bg-white/5">
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {faculty.length > 0 ? faculty.map(member => (
                                <TableRow key={member.id} className="border-b-white/10 hover:bg-white/5">
                                    <TableCell>
                                        <Avatar>
                                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                                                {member.name?.[0]?.toUpperCase() || 'F'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium text-white">{member.name}</TableCell>
                                    <TableCell className="text-white/80 flex items-center gap-2"><Mail className="h-4 w-4 text-white/50"/>{member.email}</TableCell>
                                    <TableCell className="text-white/80 flex items-center gap-2"><Building className="h-4 w-4 text-white/50"/>{member.department || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-400 hover:bg-red-900/50" disabled>
                                            <Trash2 />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-white/70">
                                        No faculty members found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Invite New Faculty</DialogTitle>
                        <DialogDescription>
                            Enter the name and email of the new faculty member. They will receive an email with a link to create their account and set their password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Dr. Jane Smith" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="e.g. j.smith@university.edu" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleInvite} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            {isPending ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
