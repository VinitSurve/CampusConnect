
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthenticationForm from "@/components/authentication-form";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "faculty") {
      redirect("/admin");
    } else {
      // All non-faculty users are redirected to the main dashboard events page
      // to avoid a redirect chain from /dashboard -> /dashboard/events.
      redirect("/dashboard/events");
    }
  }

  return <AuthenticationForm />;
}
