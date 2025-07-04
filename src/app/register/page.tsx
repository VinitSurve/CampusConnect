import { redirect } from 'next/navigation';

// This page was incorrectly showing the home page.
// The correct user flow is to go to the /login page where the authentication
// form (which includes a registration flip-card) is displayed.
// This page now correctly redirects users there.
export default function RegisterPage() {
  redirect('/login');
}
