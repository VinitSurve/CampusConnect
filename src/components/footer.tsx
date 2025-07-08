import Link from 'next/link';
import { Twitter, Youtube, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-white/70 hover:text-white transition-colors text-sm">{children}</Link>
);

const FooterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
        <h3 className="font-semibold text-white uppercase tracking-wider text-sm">{title}</h3>
        <div className="flex flex-col space-y-3">
            {children}
        </div>
    </div>
);

export default function Footer() {
  return (
    <footer className="bg-gray-900/50 border-t border-white/10 text-white mt-16">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
                 <h3 className="text-xl font-bold text-white">CampusConnect</h3>
            </div>
            <FooterSection title="Your Account">
                <FooterLink href="/login">Sign up</FooterLink>
                <FooterLink href="/login">Log in</FooterLink>
                <FooterLink href="#">Help</FooterLink>
            </FooterSection>
            <FooterSection title="Discover">
                <FooterLink href="/dashboard/clubs">Groups</FooterLink>
                <FooterLink href="/dashboard/events">Events</FooterLink>
                <FooterLink href="#">Topics</FooterLink>
            </FooterSection>
            <FooterSection title="CampusConnect">
                <FooterLink href="#">About</FooterLink>
                <FooterLink href="#">Blog</FooterLink>
                <FooterLink href="#">Careers</FooterLink>
            </FooterSection>
             <FooterSection title="Follow us">
                <div className="flex space-x-4">
                    <FooterLink href="#"><Facebook /></FooterLink>
                    <FooterLink href="#"><Twitter /></FooterLink>
                    <FooterLink href="#"><Youtube /></FooterLink>
                    <FooterLink href="#"><Instagram /></FooterLink>
                </div>
                <div className="flex flex-col space-y-3 pt-2">
                    <Link href="#"><Image src="https://placehold.co/120x40.png" width={120} height={40} alt="Google Play Store" data-ai-hint="google play" /></Link>
                    <Link href="#"><Image src="https://placehold.co/120x40.png" width={120} height={40} alt="Apple App Store" data-ai-hint="apple store" /></Link>
                </div>
            </FooterSection>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
                <FooterLink href="#">Terms of Service</FooterLink>
                <FooterLink href="#">Privacy Policy</FooterLink>
            </div>
        </div>
      </div>
    </footer>
  );
}
