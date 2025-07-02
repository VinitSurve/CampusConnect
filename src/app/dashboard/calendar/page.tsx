import AcademicCalendar from "@/components/academic-calendar";

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Campus Timetable</h1>
      <AcademicCalendar />
    </div>
  );
}
