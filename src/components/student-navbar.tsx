
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/types';
import { logout } from '@/app/actions';
import { Button } from './ui/button';
import { Search, Bell, User as UserIcon, LogOut, Settings, Menu, X } from 'lucide-react';

interface StudentNavbarProps {
  user: User;
}

export default function StudentNavbar({ user }: StudentNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };
  
  const navItems = [
    { path: '/dashboard/events', label: 'Events', icon: '🎫' },
    { path: '/dashboard/host-event', label: 'Host Event', icon: '🎭' },
    { path: '/dashboard/clubs', label: 'Clubs', icon: '👥' },
    { path: '/dashboard/calendar', label: 'Timetable', icon: '📅' }
  ];

  const getActiveItem = () => {
    // Treat the base dashboard as the "Events" page for active state
    if (pathname === '/dashboard' || pathname === '/dashboard/events') return 'events';
    
    const item = navItems.find(item => pathname.startsWith(item.path));
    return item ? item.label.toLowerCase() : '';
  };
  
  const activeItem = getActiveItem();
  
  return (
    <nav className="sticky top-0 z-40 w-full bg-blue-900/90 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
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
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    ${activeItem === item.label.toLowerCase()
                      ? 'bg-blue-700/50 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <span className="hidden lg:inline mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center relative">
              <input 
                type="text"
                placeholder="Search..."
                className="bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-1.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-40 lg:w-60"
              />
              <Search className="h-4 w-4 text-white/50 absolute left-3" />
            </div>
            
            <Button variant="ghost" size="icon" className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            
            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium overflow-hidden border-2 border-white/20">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              </button>
              
              {isProfileDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg backdrop-blur-xl bg-white/10 border border-white/10 py-1 z-10">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || "Student"}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {user.email || ""}
                    </p>
                  </div>
                  
                  <Link href="/dashboard/profile" className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10">
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10">
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
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="icon"
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
        <div className="backdrop-blur-md bg-blue-900/90 shadow-lg border-t border-white/10 px-2 pt-2 pb-3 space-y-1">
          <div className="px-3 py-2">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search..."
                className="bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
              />
              <Search className="h-4 w-4 text-white/50 absolute left-3 top-2.5" />
            </div>
          </div>
          
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                activeItem === item.label.toLowerCase()
                  ? 'bg-blue-700/50 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-white/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
