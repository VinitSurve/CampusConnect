import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClientPage from "./client-page";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/');
    }

    return <ProfileClientPage user={user} />;
}
