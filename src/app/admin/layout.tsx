import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import FacultyNavbar from '@/components/faculty-navbar';

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
    <>
      <FacultyNavbar user={user} />
      <main>{children}</main>
    </>
  );
}
