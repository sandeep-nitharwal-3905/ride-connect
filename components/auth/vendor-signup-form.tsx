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
import { getUserByEmail, createUser } from "@/lib/database-client"

export function VendorSignupForm() {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactPerson: "",
    phone: "",
    serviceArea: "",
    vehicleCount: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match")
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard/vendor`,
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (authData.user) {
        const userProfile = await createUser({
          email: formData.email,
          user_type: "vendor",
          vendor_name: formData.businessName,
          phone: formData.phone,
          address: formData.serviceArea,
        })

        if (!userProfile) {
          throw new Error("Failed to create user profile")
        }

        toast({
          title: "Vendor account created successfully",
          description: "Please check your email to verify your account before signing in.",
        })
        router.push("/auth/vendor/login")
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          name="businessName"
          placeholder="Your Transport Business"
          value={formData.businessName}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPerson">Contact Person</Label>
        <Input
          id="contactPerson"
          name="contactPerson"
          placeholder="Jane Smith"
          value={formData.contactPerson}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Business Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="contact@transport.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+1 (555) 987-6543"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="serviceArea">Service Area</Label>
        <Input
          id="serviceArea"
          name="serviceArea"
          placeholder="New York, NY"
          value={formData.serviceArea}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehicleCount">Number of Vehicles</Label>
        <Input
          id="vehicleCount"
          name="vehicleCount"
          type="number"
          placeholder="5"
          value={formData.vehicleCount}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Vendor Account"
        )}
      </Button>
    </form>
  )
}
