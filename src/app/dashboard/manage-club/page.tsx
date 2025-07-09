
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClubByLeadId } from '@/lib/data';
import ManageClubForm from '@/components/manage-club-form';

export const dynamic = 'force-dynamic';

export default async function ManageClubPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const club = await getClubByLeadId(user.uid);

  if (!club) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-white/80 mt-2">You are not registered as a lead for any club.</p>
        </div>
      </div>
    );
  }

  return <ManageClubForm club={club} user={user} />;
}
