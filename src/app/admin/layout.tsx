import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import FacultyNavbar from '@/components/faculty-navbar';
import AnimatedParticles from '@/components/animated-particles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect non-faculty away from this layout
  if (user.role !== 'faculty') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white">
       <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
          style={{ top: '10%', right: '15%' }}></div>
          <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
          style={{ bottom: '5%', left: '10%' }}></div>
          <AnimatedParticles />
      </div>
      <FacultyNavbar user={user} />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
