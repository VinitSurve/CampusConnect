
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import StudentNavbar from '@/components/student-navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect non-students away from this layout
  if (user.role === 'faculty' || user.role === 'admin') {
    redirect('/admin'); // Assuming an admin dashboard exists or will exist
  }

  return (
    <>
      <StudentNavbar user={user} />
      <main>{children}</main>
    </>
  );
}
