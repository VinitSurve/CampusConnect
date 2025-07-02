import { getEventProposals } from "@/lib/data";
import AcademicCalendar from "@/components/academic-calendar";
import FacultyDashboardClient from "@/components/faculty-dashboard";

export default async function FacultyDashboardPage() {
    const requests = await getEventProposals();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* Left Column: Requests and Stats */}
                <div className="xl:col-span-1 flex flex-col gap-8">
                    <FacultyDashboardClient initialRequests={requests} />
                </div>

                {/* Right Column: Calendar */}
                <div className="xl:col-span-2">
                     <div className="sticky top-24">
                        <h2 className="text-2xl font-bold text-white mb-4">Campus Timetable</h2>
                        <AcademicCalendar />
                    </div>
                </div>
            </div>
        </div>
    );
}
