import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  console.log('Middleware: Request to:', req.nextUrl.pathname)
  
  // Log all cookies to see what's available
  const allCookies = req.cookies.getAll()
  console.log('Middleware: All cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? 'exists' : 'empty' })))
  
  // Create a response object to modify cookies
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
  
  // Check for Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Middleware: Supabase not configured, allowing access')
    return res
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })

  // Check if user is trying to access dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware: Dashboard route accessed:', req.nextUrl.pathname)
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Middleware: Session check result:', { hasSession: !!session, error: error?.message })
      
      if (!session) {
        console.log('Middleware: No session found, redirecting to appropriate login')
        // Redirect to appropriate login based on the dashboard type
        let loginUrl
        if (req.nextUrl.pathname.startsWith('/dashboard/vendor')) {
          loginUrl = new URL('/auth/vendor/login', req.url)
        } else {
          loginUrl = new URL('/auth/company/login', req.url)
        }
        return NextResponse.redirect(loginUrl)
      }
      
      console.log('Middleware: Valid session found, allowing access')
    } catch (error) {
      console.log('Middleware: Error checking session:', error)
      // On error, redirect to login
      const loginUrl = req.nextUrl.pathname.startsWith('/dashboard/vendor')
        ? new URL('/auth/vendor/login', req.url)
        : new URL('/auth/company/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check if user is trying to access auth routes while already logged in
  if (req.nextUrl.pathname.startsWith('/auth')) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('Middleware: User already logged in, redirecting to dashboard')
        
        // Get user profile to determine redirect destination
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          try {
            const { data: userProfile } = await supabase
              .from('users')
              .select('user_type')
              .eq('email', user.email)
              .single()
            
            if (userProfile?.user_type === 'vendor') {
              return NextResponse.redirect(new URL('/dashboard/vendor', req.url))
            } else {
              return NextResponse.redirect(new URL('/dashboard/company', req.url))
            }
          } catch (profileError) {
            console.log('Middleware: Error fetching user profile:', profileError)
            // Default to company dashboard if profile fetch fails
            return NextResponse.redirect(new URL('/dashboard/company', req.url))
          }
        } else {
          // Default to company dashboard if no email
          return NextResponse.redirect(new URL('/dashboard/company', req.url))
        }
      }
    } catch (error) {
      console.log('Middleware: Error checking session for auth routes:', error)
      // Continue to auth page on error
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
} 