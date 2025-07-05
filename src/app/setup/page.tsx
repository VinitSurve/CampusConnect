'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuthedUser } from '@/app/actions';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function SetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        fullName: '',
        mobile: '',
        course: '',
        year: '',
    });

    useEffect(() => {
        const fetchUser = async () => {
            const authedUser = await getAuthedUser();
            if (!authedUser) {
                router.push('/login');
            } else {
                setUser(authedUser);
                setFormData({
                    fullName: authedUser.fullName || authedUser.name || '',
                    mobile: authedUser.mobile || '',
                    course: authedUser.course || '',
                    year: String(authedUser.year || ''),
                });
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        const { fullName, mobile, course, year } = formData;
        if (!fullName || !mobile || !course || !year) {
            toast({
                title: 'Missing Information',
                description: 'Please fill out all fields to complete your profile.',
                variant: 'destructive',
            });
            return;
        }

        startTransition(async () => {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, {
                    fullName,
                    name: fullName, // Keep name in sync with fullName
                    mobile,
                    course,
                    year,
                    updatedAt: serverTimestamp(),
                });

                toast({
                    title: 'Profile Updated!',
                    description: 'Welcome to CampusConnect!',
                });

                router.push('/dashboard');

            } catch (error) {
                console.error("Error updating profile:", error);
                toast({
                    title: 'Error',
                    description: 'Could not update your profile. Please try again.',
                    variant: 'destructive',
                });
            }
        });
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                 <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-10 w-1/3 bg-white/10" />
                    <Skeleton className="h-8 w-1/2 bg-white/10" />
                    <Skeleton className="h-12 w-full bg-white/10" />
                    <Skeleton className="h-12 w-full bg-white/10" />
                    <Skeleton className="h-12 w-full bg-white/10" />
                 </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden p-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-white/70 mb-6">Just a few more details to get you started.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="fullName" className="text-white">Full Name</Label>
                            <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="mobile" className="text-white">Mobile Number</Label>
                            <Input id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="course" className="text-white">Course</Label>
                             <Select name="course" value={formData.course} onValueChange={(value) => handleSelectChange('course', value)} required>
                                <SelectTrigger><SelectValue placeholder="Select your course..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BCA">BCA</SelectItem>
                                    <SelectItem value="BBA">BBA</SelectItem>
                                    <SelectItem value="BAF">BAF</SelectItem>
                                    <SelectItem value="MBA">MBA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="year" className="text-white">Year</Label>
                            <Select name="year" value={formData.year} onValueChange={(value) => handleSelectChange('year', value)} required>
                                <SelectTrigger><SelectValue placeholder="Select your year..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">I</SelectItem>
                                    <SelectItem value="2">II</SelectItem>
                                    <SelectItem value="3">III</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save and Continue'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
