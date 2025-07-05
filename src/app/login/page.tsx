
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthenticationForm from "@/components/authentication-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "faculty") {
      redirect("/admin");
    } else {
      // User is a student. Check for profile completion.
      if (!user.course || !user.year) {
        redirect('/setup');
      } else {
        redirect("/dashboard");
      }
    }
  }

  return <AuthenticationForm />;
}
