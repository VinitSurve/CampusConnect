'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/types';
import { logout } from '@/app/actions';
import { Button } from './ui/button';
import { Menu, X, Settings, LogOut } from 'lucide-react';

interface FacultyNavbarProps {
  user: User;
}

export default function FacultyNavbar({ user }: FacultyNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileDropdownOpen && !(event.target as Element).closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };
  
  const navItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/calendar', label: 'Timetable' },
    { path: '/admin/clubs', label: 'Clubs' },
    { path: '/admin/faculties', label: 'Faculties' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  }

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">CampusConnect</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className='flex items-center space-x-2'>
             <div className="hidden md:block relative profile-dropdown-container">
                <button onClick={() => setIsProfileDropdownOpen(prev => !prev)} className="flex items-center space-x-3 p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                      {user.name?.[0]?.toUpperCase() || 'F'}
                    </div>
                </button>
                {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 transition-all z-50">
                        <div className="px-4 py-2 border-b border-white/10">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/70 truncate">{user.email}</p>
                        </div>
                        <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                            <Settings className="h-4 w-4" />
                            Profile Settings
                        </Link>
                        <button 
                          onClick={handleSignOut} 
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            <div className="md:hidden">
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex items-center px-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium border-2 border-white/20">
                        {user.name?.[0]?.toUpperCase() || 'F'}
                    </div>
                    <div className="ml-3">
                        <p className="text-base font-medium text-white">{user.name}</p>
                        <p className="text-sm text-white/70">{user.email}</p>
                    </div>
                </div>
                 <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-white/70 hover:text-white hover:bg-white/5"
                    >
                    <Settings className="h-4 w-4" /> Profile Settings
                </Link>
                <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-white/10"
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
