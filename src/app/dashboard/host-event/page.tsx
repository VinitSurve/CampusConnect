
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HostEventForm from '@/components/host-event-form';
import type { User } from '@/types';
import { getUserProposals } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HostEventPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const proposals = await getUserProposals(user.uid);

  return <HostEventForm user={user} proposals={proposals} />;
}
