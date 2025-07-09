
import { getClubById, getEventsByClubId, getStudents, getClubMembers } from '@/lib/data';
import ClubDetailPage from '@/components/club-detail-page';
import { notFound } from 'next/navigation';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const club = await getClubById(params.id);

  if (!club) {
    notFound();
  }

  const [events, students, members] = await Promise.all([
    getEventsByClubId(club.id),
    getStudents(), // Keep fetching all students for lead lookup
    getClubMembers(club.id),
  ]);
  
  const leadUser = students.find(s => s.id === club.leadId) || null;

  return (
    <div className="container mx-auto px-4 py-8">
      <ClubDetailPage club={club} events={events} lead={leadUser} members={members} />
    </div>
  );
}
