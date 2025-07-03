
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HostEventForm from '@/components/host-event-form';
import type { User } from '@/types';
import { getDraftEventProposals } from '@/lib/data';

export default async function HostEventPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const drafts = await getDraftEventProposals(user.uid);

  return <HostEventForm user={user} drafts={drafts} />;
}
