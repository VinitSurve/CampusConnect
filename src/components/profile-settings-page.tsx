
'use client';

import { useState, useTransition, useEffect } from 'react';
import { User, Settings, Lock, BarChartHorizontal, AlertTriangle } from 'lucide-react';
import type { User as UserType, UserPreferences } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserPreferences } from '@/app/settings/actions';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useRouter } from 'next/navigation';


interface ProfileSettingsPageProps {
  user: UserType;
}

const ServiceIcon = ({ provider, letter }: { provider: 'google' | 'apple', letter: string }) => {
    const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg";
    const providerClasses = {
        google: "bg-red-600 text-white",
        apple: "bg-white text-black"
    };
    return (
        <div className={cn(baseClasses, providerClasses[provider])}>
            {letter}
        </div>
    );
};

export function ProfileSettingsPage({ user }: ProfileSettingsPageProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');
  
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences || {
    emailNotifications: true,
    weeklyDigest: false,
    clubUpdates: true,
    dataAnalytics: false,
    personalization: false,
  });
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // If user object from server changes, update local state
    setName(user.name);
    setEmail(user.email);
    setPreferences(user.preferences || {
      emailNotifications: true,
      weeklyDigest: false,
      clubUpdates: true,
      dataAnalytics: false,
      personalization: false,
    });
  }, [user]);

  const handleProfileSave = () => {
    startTransition(async () => {
      try {
        await updateUserProfile({ name, email });
        toast({
          title: 'Success',
          description: 'Your profile has been updated successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    });
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    startTransition(async () => {
        try {
            await updateUserPreferences(newPreferences);
            toast({
                title: "Preferences saved",
                description: "Your settings have been updated.",
            });
        } catch (error) {
             toast({
                title: 'Error Saving Preferences',
                description: (error as Error).message,
                variant: 'destructive',
            });
            // Revert optimistic UI update on failure
            setPreferences(prev => ({...prev, [key]: !value}));
        }
    });
  };

  const handleChangePassword = () => {
      if (!currentPassword || !newPassword) {
          toast({ title: 'Error', description: 'Please fill all password fields.', variant: 'destructive' });
          return;
      }
      startTransition(async () => {
          const currentUser = auth.currentUser;
          if (!currentUser || !currentUser.email) {
              toast({ title: 'Error', description: 'Not logged in or email not found.', variant: 'destructive' });
              return;
          }
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          try {
              await reauthenticateWithCredential(currentUser, credential);
              await updatePassword(currentUser, newPassword);
              toast({ title: 'Success', description: 'Password updated successfully.' });
              setCurrentPassword('');
              setNewPassword('');
          } catch (error) {
              toast({ title: 'Error updating password', description: (error as Error).message, variant: 'destructive' });
          }
      });
  };
  
  const handleAccountDelete = () => {
    startTransition(async () => {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
            toast({ title: 'Error', description: 'Could not find authenticated user.', variant: 'destructive' });
            return;
        }
        
        const credential = EmailAuthProvider.credential(currentUser.email, reauthPassword);
        
        try {
            await reauthenticateWithCredential(currentUser, credential);

            // First, delete Firestore document
            const userDocRef = doc(db, 'users', currentUser.uid);
            await deleteDoc(userDocRef);

            // Then, delete Firebase Auth user
            await deleteUser(currentUser);
            
            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted. You will be logged out.' });
            
            // Redirect to home/login page after successful deletion
            router.push('/');
            
        } catch (error) {
            toast({ title: 'Error deleting account', description: (error as Error).message, variant: 'destructive' });
        }
    });
  };
  
  const handleExportData = () => {
    const data = JSON.stringify(user, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campus-connect-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data Exported', description: 'Your data has been downloaded as a JSON file.' });
  };


  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-5 h-5" /> },
    { id: 'data', label: 'Data', icon: <BarChartHorizontal className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-white/70 mt-2">Customize your experience</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center space-x-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl font-bold">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <p className="text-sm text-white/60">{user.email}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-2 mb-8">
        <nav className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        {activeTab === 'profile' && (
          <div>
            <h3 className="text-2xl font-semibold mb-1">Profile Settings</h3>
            <p className="text-white/60 mb-8">Manage your personal information</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/20 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 h-12"
                />
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleProfileSave}
                  disabled={isPending}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
             <h3 className="text-2xl font-semibold mb-1">Security</h3>
            <p className="text-white/60 mb-8">Manage your account security settings</p>
            <div className="space-y-8">
                <div>
                    <h4 className="font-semibold text-lg text-white mb-4">Password</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-white/5 border-white/20 h-12"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-white/5 border-white/20 h-12"/>
                        </div>
                        <div className="pt-2">
                             <Button onClick={handleChangePassword} disabled={isPending} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base">
                                {isPending ? 'Updating...' : 'Update Password'}
                             </Button>
                        </div>
                    </div>
                </div>

                <Separator className="bg-white/10"/>

                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h4 className="font-semibold text-lg text-red-300 mb-2">Danger Zone</h4>
                    <p className="text-red-300/80 mb-4">Permanently delete your account and all associated data.</p>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="lg" className="w-full sm:w-auto text-base">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900/80 backdrop-blur-lg border-gray-700 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your account. To confirm, please enter your password.
                                </AlertDialogDescription>
                                <div className="pt-4">
                                     <Label htmlFor="reauth-password">Password</Label>
                                     <Input id="reauth-password" type="password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} placeholder="Enter your password to confirm" />
                                </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setReauthPassword('')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleAccountDelete} disabled={isPending || !reauthPassword} className="bg-red-600 hover:bg-red-700">
                                    {isPending ? 'Deleting...' : 'Delete My Account'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          </div>
        )}
        
        {activeTab === 'preferences' && (
            <div>
                <h3 className="text-2xl font-semibold mb-1">Preferences</h3>
                <p className="text-white/60 mb-8">Tailor your CampusConnect experience.</p>
                <div className="space-y-8">
                    <div>
                        <h4 className="font-semibold text-lg text-white mb-4">Notifications</h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h5 className="font-semibold text-white">Email Notifications</h5>
                                    <p className="text-white/70 text-sm">Receive emails about new events and important updates.</p>
                                </div>
                                <Switch id="email-notifications" checked={preferences.emailNotifications} onCheckedChange={(val) => handlePreferenceChange('emailNotifications', val)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h5 className="font-semibold text-white">Weekly Digest</h5>
                                    <p className="text-white/70 text-sm">Get a summary of upcoming events every Monday.</p>
                                </div>
                                <Switch id="weekly-digest" checked={preferences.weeklyDigest} onCheckedChange={(val) => handlePreferenceChange('weeklyDigest', val)} />
                            </div>
                             <div className="flex items-center justify-between">
                                <div>
                                    <h5 className="font-semibold text-white">Club Updates</h5>
                                    <p className="text-white/70 text-sm">Get notified about activity from clubs you've joined.</p>
                                </div>
                                <Switch id="club-updates" checked={preferences.clubUpdates} onCheckedChange={(val) => handlePreferenceChange('clubUpdates', val)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'data' && (
          <div>
            <h3 className="text-2xl font-semibold mb-1">Data & Privacy</h3>
            <p className="text-white/60 mb-8">Manage your data and privacy settings</p>
            <div className="space-y-8">
              <div>
                <h4 className="font-semibold text-lg text-white mb-2">Data Export</h4>
                <div className="bg-black/20 p-6 rounded-lg">
                  <h5 className="font-semibold text-white">Export Your Data</h5>
                  <p className="text-white/70 mb-4 mt-1">Download a copy of your user profile data.</p>
                  <Button onClick={handleExportData} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base">
                    Export Data
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg text-white mb-4">Data Settings</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-white">Data Analytics</h5>
                      <p className="text-white/70 text-sm">Allow app to analyze your usage patterns to improve the service.</p>
                    </div>
                    <Switch id="data-analytics-switch" checked={preferences.dataAnalytics} onCheckedChange={(val) => handlePreferenceChange('dataAnalytics', val)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-white">Personalization</h5>
                      <p className="text-white/70 text-sm">Receive personalized event and club recommendations.</p>
                    </div>
                    <Switch id="personalization-switch" checked={preferences.personalization} onCheckedChange={(val) => handlePreferenceChange('personalization', val)} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
