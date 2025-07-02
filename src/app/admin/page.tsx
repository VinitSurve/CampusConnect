import { getEventProposals } from "@/lib/data";
import FacultyDashboardClient from "@/components/faculty-dashboard";

export default async function FacultyDashboardPage() {
    const requests = await getEventProposals();

    return (
        <div className="container mx-auto px-4 py-8">
            <FacultyDashboardClient initialRequests={requests} />
        </div>
    );
}
