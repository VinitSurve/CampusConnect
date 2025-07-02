
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AuthenticationForm from '@/components/authentication-form'

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    if (user.role === 'faculty') {
      redirect('/admin