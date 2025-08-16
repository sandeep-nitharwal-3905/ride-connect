"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getUserByEmail } from "@/lib/database-client"
import { useAuth } from "@/lib/auth-context"

export function VendorLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { refreshUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (authData.user) {
        console.log("Auth successful, checking user profile...")
        console.log("Auth data:", authData)
        console.log("Session:", authData.session)
        
        const userProfile = await getUserByEmail(email)
        console.log("User profile:", userProfile)
        
        if (!userProfile || userProfile.user_type !== "vendor") {
          await supabase.auth.signOut()
          throw new Error("This account is not registered as a vendor. Please use the company login.")
        }

        // Refresh user data in auth context
        console.log("Refreshing user data...")
        await refreshUser()
        console.log("User data refreshed, showing success message...")

        toast({
          title: "Login successful",
          description: "Welcome to your vendor dashboard!",
        })
        
        // Wait for session to be properly established
        console.log("Waiting for session to be established...")
        let sessionEstablished = false
        let attempts = 0
        const maxAttempts = 20
        
        while (!sessionEstablished && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          const { data: { session } } = await supabase.auth.getSession()
          console.log(`Session check attempt ${attempts + 1}:`, !!session)
          
          if (session) {
            sessionEstablished = true
            console.log("Session established, redirecting...")
          }
          attempts++
        }
        
        if (sessionEstablished) {
          // Use window.location for a more reliable redirect
          window.location.href = "/dashboard/vendor"
        } else {
          console.error("Session not established after multiple attempts")
          toast({
            title: "Login issue",
            description: "Please try refreshing the page and logging in again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Vendor Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="vendor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  )
}
