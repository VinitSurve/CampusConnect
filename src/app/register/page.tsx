import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/register-form'

export default async function RegisterPage() {
  const user = await getCurrentUser()

  if (user) {
    if (user.role === 'faculty') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  return <RegisterForm />
}
