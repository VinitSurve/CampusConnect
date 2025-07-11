import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileSettingsPage } from '@/components/profile-settings-page';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <ProfileSettingsPage user={user} />;
}
