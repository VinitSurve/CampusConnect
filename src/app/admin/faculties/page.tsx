
'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Building, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllFaculty } from '@/lib/data';
import { Input } from '@/components/ui/input';

export default function AdminFacultiesPage() {
    const [faculty, setFaculty] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
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

    const filteredFaculty = faculty.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const FacultyCardSkeleton = () => (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center">
            <Skeleton className="h-20 w-20 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="w-full space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
        </div>
    );
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Faculty Directory</h1>
                    <p className="text-white/70 mt-1">Browse and manage all faculty members.</p>
                </div>
                <Input
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-72"
                />
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <FacultyCardSkeleton key={i} />)}
                </div>
            ) : (
                filteredFaculty.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFaculty.map(member => (
                            <div key={member.id} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center flex flex-col items-center transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20">
                                <Avatar className="h-24 w-24 mb-4 border-4 border-white/20">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-3xl">
                                        {member.name?.[0]?.toUpperCase() || 'F'}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-semibold text-white">{member.name}</h2>
                                <p className="text-blue-300/80 mb-6">{member.department || 'N/A'}</p>
                                
                                <div className="space-y-3 text-left w-full border-t border-white/10 pt-6">
                                     <p className="flex items-center gap-3 text-sm text-white/80"><Mail className="h-5 w-5 text-white/50 flex-shrink-0"/> <span className="truncate">{member.email}</span></p>
                                </div>

                                <div className="mt-6 w-full">
                                     <Button variant="destructive" size="sm" className="w-full" disabled>
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 bg-white/10 rounded-lg col-span-full">
                        <h3 className="text-xl font-semibold text-white mb-2">No Faculty Found</h3>
                        <p className="text-white/80">Your search for "{searchTerm}" did not match any faculty members.</p>
                    </div>
                )
            )}
        </div>
    );
}
