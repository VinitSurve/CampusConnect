
'use client';

import { useState, useTransition } from 'react';
import { User, Settings, Lock, BarChartHorizontal } from 'lucide-react';
import type { User as UserType } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/settings/actions';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface ProfileSettingsPageProps {
  user: UserType;
}

export function ProfileSettingsPage({ user }: ProfileSettingsPageProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = () => {
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
                  onClick={handleSave}
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
                {/* Change Password Section */}
                <div>
                    <h4 className="font-semibold text-lg text-white mb-4">Password</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" type="password" placeholder="••••••••" className="bg-white/5 border-white/20 h-12"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" placeholder="••••••••" className="bg-white/5 border-white/20 h-12"/>
                        </div>
                        <div>
                            <p className="text-sm text-white/70 mb-2">Password must include:</p>
                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                <li>At least 8 characters</li>
                                <li>At least one uppercase letter</li>
                                <li>At least one number</li>
                                <li>At least one special character</li>
                            </ul>
                        </div>
                        <div className="pt-2">
                             <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base">Update Password</Button>
                        </div>
                    </div>
                </div>

                <Separator className="bg-white/10"/>

                {/* Two-Factor Authentication Section */}
                <div>
                    <h4 className="font-semibold text-lg text-white mb-2">Two-Factor Authentication</h4>
                     <p className="text-white/60 mb-4">Add an extra layer of security to your account.</p>
                     <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 bg-transparent text-base">Setup 2FA</Button>
                </div>

                <Separator className="bg-white/10"/>

                {/* Danger Zone */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h4 className="font-semibold text-lg text-red-300 mb-2">Danger Zone</h4>
                    <p className="text-red-300/80 mb-4">Permanently delete your account and all data.</p>
                    <Button variant="destructive" size="lg" className="w-full sm:w-auto text-base">Delete Account</Button>
                </div>
            </div>
          </div>
        )}

        {(activeTab === 'preferences' || activeTab === 'data') && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-2 capitalize">{activeTab} Settings</h3>
            <p className="text-white/70">This feature is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
