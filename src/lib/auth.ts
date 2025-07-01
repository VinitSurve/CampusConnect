import { cookies } from 'next/headers'
import { getUserById } from './data'
import type { User } from '@/types'

export async function getCurrentUser(): Promise<User | null> {
  const userId = cookies().get('userId')?.value
  if (!userId) {
    return null
  }
  return (await getUserById(userId)) || null
}
