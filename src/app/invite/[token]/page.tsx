
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { FacultyInvitation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createSession } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvitePage({ params }: { params: { token: string } }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<FacultyInvitation | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const verifyToken = async () => {
            if (!params.token) {
                setError("No invitation token provided.");
                setLoading(false);
                return;
            }

            try {
                const q = query(collection(db, "facultyInvitations"), where("token", "==", params.token), where("used", "==", false));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    setError("This invitation is invalid or has already been used.");
                    setLoading(false);
                    return;
                }
                
                const inviteDoc = querySnapshot.docs[0];
                const inviteData = { id: inviteDoc.id, ...inviteDoc.data() } as FacultyInvitation;
                
                const expiresAt = (inviteData.expiresAt as any).toDate();

                if (new Date() > expiresAt) {
                    setError("This invitation has expired. Please ask an administrator to send a new one.");
                    setLoading(false);
                    return;
                }
                
                setInvitation(inviteData);
            } catch (e) {
                console.error("Error verifying token:", e);
                setError("An error occurred while verifying your invitation.");
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [params.token]);
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!invitation || !auth) return;
        
        if (password !== confirmPassword) {
            toast({ title: "Passwords do not match", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Step 1: Create the user in Firebase Auth. This is the only way to get a UID.
            const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, password);
            const user = userCredential.user;
            
            // Step 2: Use a batch write to ensure all database changes happen together or not at all.
            const batch = writeBatch(db);

            // Step 2a: Create the corresponding user document in Firestore.
            const userDocRef = doc(db, 'users', user.uid);
            batch.set(userDocRef, {
                uid: user.uid,
                email: invitation.email,
                name: invitation.name,
                fullName: invitation.name,
                role: 'faculty',
                createdAt: new Date(),
            });

            // Step 2b: Mark the invitation as used so it cannot be used again.
            const inviteDocRef = doc(db, 'facultyInvitations', invitation.id);
            batch.update(inviteDocRef, { used: true });

            // Step 3: Commit the batch. This is an atomic operation.
            await batch.commit();
            
            toast({ title: "Account Created!", description: `Welcome, ${invitation.name}. You are now logged in.` });
            
            // Step 4: Create a session cookie and redirect the user to their dashboard.
            const redirectUrl = await createSession(user.uid, true);
            router.push(redirectUrl);

        } catch (error: any) {
            console.error("Error creating faculty account:", error);
            // Provide a more user-friendly error message
            let errorMessage = "An unknown error occurred during registration. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email address is already in use. Please sign in instead.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "The password is too weak. Please choose a stronger password.";
            } else if (error.code === 'permission-denied' || error.code === 7) {
                errorMessage = "Permission denied. Please check Firestore security rules.";
            } else if (error.code === 'not-found' || error.code === 5) {
                 errorMessage = "Invitation not found. It may have been used or revoked. Please request a new invitation.";
            } else {
                 errorMessage = error.message;
            }
            toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return (
             <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
             </div>
        );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">CampusConnect</span>
                  </div>
                </div>

                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-white text-2xl">
                          {error ? "Invitation Error" : `Welcome, ${invitation?.name}!`}
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                           {error ? "There was a problem with your invitation link." : "Complete your faculty account setup."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : invitation && (
                             <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={invitation.name} disabled className="bg-black/20"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={invitation.email} disabled className="bg-black/20"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Create Password</Label>
                                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
                                </Button>
                             </form>
                        )}
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
