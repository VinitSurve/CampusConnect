
'use client';

import { redirect } from "next/navigation";
import { useEffect } from "react";

// This page is no longer in use as the faculty invitation system has been removed.
// It now redirects to the login page to avoid dead links.
export default function InvitePage() {
    useEffect(() => {
        redirect('/login');
    }, []);

    return null;
}
