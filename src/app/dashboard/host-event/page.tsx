
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HostEventForm from '@/components/host-event-form';
import type { User } from '@/types';

export default async function HostEventPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <HostEventForm user={user} />;
}
