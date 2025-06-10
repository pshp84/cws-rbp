'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from "@/utils/supabase/server"

export const updatePassword = async (formData: FormData) => {
    const supabase = await createClient()

    // const accessToken = formData.get('accessToken') as string

    // const { error: exchangeCodeError } = await supabase.auth.exchangeCodeForSession(accessToken)

    // if (exchangeCodeError) {
    //     redirect(`/forgot-password?error-message=${exchangeCodeError.message}`)
    // }

    const newPassword = formData.get('newPassword') as string

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        redirect(`/forgot-password?error-message=${error.message}`)
    }

    revalidatePath('/', 'layout')
    redirect('/sign-in?message=Password updated successfully. Please login to continue.')
}