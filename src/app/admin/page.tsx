import { getEventProposals } from "@/lib/data";
import AcademicCalendar from "@/components/academic-calendar";
import FacultyDashboardClient from "@/components/faculty-dashboard";

export default async function FacultyDashboardPage() {
    const requests = await getEventProposals();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Requests and Stats */}
                <div className="flex flex-col gap-8">
                    <FacultyDashboardClient initialRequests={requests} />
                </div>

                {/* Right Column: Calendar */}
                <div className="sticky top-24 hidden lg:block">
                    <AcademicCalendar onDateSelect={() => {}} />
                </div>
            </div>
        </div>
    );
}
