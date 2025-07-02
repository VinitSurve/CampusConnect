import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function PublicHeader() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8">
      <nav className="relative z-50 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Icons.logo className="h-7 w-7 text-white" />
          <span>CampusConnect</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/login">Register</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}