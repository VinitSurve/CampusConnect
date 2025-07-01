import { cookies } from 'next/headers'
import { usersById } from './mock-data'
import type { User } from '@/types'

export async function getCurrentUser(): Promise<User | null> {
  const userId = cookies().get('userId')?.value
  if (!userId) {
    return null
  }
  return usersById[userId] || null
}
