'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/types';
import { logout } from '@/app/actions';
import { Button } from './ui/button';
import { LayoutDashboard, LogOut, Settings, Menu, X, Calendar, School } from 'lucide-react';

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
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { path: '/admin/clubs', label: 'Manage Clubs', icon: <School className="h-4 w-4" /> },
    { path: '/admin/calendar', label: 'Master Calendar', icon: <Calendar className="h-4 w-4" /> }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-blue-900/90 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin" className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                CC
              </div>
              <span className="ml-2 text-white font-semibold text-lg hidden sm:block">CampusConnect</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    ${pathname === item.path
                      ? 'bg-blue-700/50 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium overflow-hidden border-2 border-white/20">
                  {user.name ? user.name[0].toUpperCase() : 'F'}
                </div>
              </button>
              
              {isProfileDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg backdrop-blur-xl bg-white/10 border border-white/10 py-1 z-10">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{user.name || "Faculty"}</p>
                    <p className="text-xs text-white/70 truncate">{user.email || ""}</p>
                  </div>
                  <Link href="/admin/settings" className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex md:hidden">
              <Button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} variant="ghost" size="icon" className="text-white">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.path ? 'bg-blue-700/50 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button onClick={handleSignOut} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-white/10">
                <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
