import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Try to sign in immediately
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInData.session) {
      // Success! Return the session data
      console.log('✅ User signed up and immediately logged in successfully')
      return NextResponse.json({
        success: true,
        message: 'Account created and signed in successfully',
        session: signInData.session,
        user: signInData.user,
      })
    } else {
      // If immediate sign-in fails, return the user data anyway
      // The client can handle the sign-in process
      console.warn('⚠️ Immediate sign-in after signup failed:', signInError?.message || 'Unknown error')
      
      // Check if it's specifically an email confirmation error
      const isEmailConfirmationError = signInError?.message?.toLowerCase().includes('email') || 
                                       signInError?.message?.toLowerCase().includes('confirm')
      
      return NextResponse.json({
        success: true,
        message: isEmailConfirmationError 
          ? 'Account created! Please check your email for confirmation link, or sign in below.'
          : 'Account created successfully. Please sign in.',
        user: signUpData.user,
        requiresSignIn: true,
        error: signInError?.message || 'Sign-in required',
      })
    }

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
