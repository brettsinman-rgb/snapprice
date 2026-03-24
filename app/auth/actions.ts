'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Create the user in our local database
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
        },
      })
    } catch (e) {
      console.error('Failed to create user in Prisma:', e)
      // Note: In production, you might want to handle this more gracefully
    }
  }

  return { success: true }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function clearSearchHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Delete all search sessions for this user. 
    // Cascade delete in Prisma schema (if configured) or manual delete of children is needed.
    // Looking at schema.prisma, we don't have onDelete: Cascade, so we should delete in order.
    
    // First, find all session IDs for this user
    const userSessions = await prisma.searchSession.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    
    const sessionIds = userSessions.map(s => s.id);
    
    if (sessionIds.length > 0) {
      await prisma.$transaction([
        prisma.clickEvent.deleteMany({
          where: { sessionId: { in: sessionIds } }
        }),
        prisma.searchResult.deleteMany({
          where: { sessionId: { in: sessionIds } }
        }),
        prisma.searchSession.deleteMany({
          where: { id: { in: sessionIds } }
        })
      ]);
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to clear history:', error)
    return { error: 'Failed to clear search history' }
  }
}
