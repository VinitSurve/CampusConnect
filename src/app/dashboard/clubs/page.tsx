
import { getClubs } from '@/lib/data';
import { ClubsDisplay } from '@/components/clubs-display';

export const dynamic = 'force-dynamic';

export default async function ClubsPage() {
  const clubs = await getClubs();
  
  return (
    <ClubsDisplay clubs={clubs} />
  );
}
