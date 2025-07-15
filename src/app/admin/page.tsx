
import { getEventProposals } from "@/lib/data";
import FacultyDashboardClient from "@/components/faculty-dashboard";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function FacultyDashboardPage() {
    const user = await getCurrentUser();
    
    if (!user) {
        redirect('/login');
    }

    const requests = await getEventProposals(user.id);

    return (
        <div className="container mx-auto px-4 py-8">
            <FacultyDashboardClient key={user.id} initialRequests={requests} />
        </div>
    );
}
