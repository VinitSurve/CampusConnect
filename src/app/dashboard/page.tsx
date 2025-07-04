
import { redirect } from 'next/navigation';

// The /dashboard page was identical to /dashboard/events, which can cause
// instability with the development server. To resolve this and create a
// canonical URL, we now redirect from /dashboard to /dashboard/events.
export default function DashboardPage() {
  redirect('/dashboard/events');
}
