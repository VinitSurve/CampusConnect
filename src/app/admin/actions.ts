'use server'

// The core logic for approving and rejecting event requests has been moved to the
// client component at src/components/faculty-dashboard.tsx.

// This change was necessary to resolve a PERMISSION_DENIED error from Firestore.
// By moving the database writes to the client, we leverage the existing Firebase
// auth session to satisfy security rules (e.g., isFaculty()), while keeping
// server-only logic like Google Drive operations in dedicated server actions.
