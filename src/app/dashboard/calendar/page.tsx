import { redirect } from 'next/navigation';

// The student calendar page is no longer in use and was causing instability
// with the development server. It now redirects to the main events page to
// create a canonical URL and improve stability.
export default function CalendarPage() {
  redirect('/dashboard/events');
}
