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
