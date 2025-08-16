import { VendorSignupForm } from "@/components/auth/vendor-signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Truck } from "lucide-react"
import Link from "next/link"

export default function VendorSignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="bg-card shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground">Create Vendor Account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Partner with companies and grow your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VendorSignupForm />
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have a vendor account?{" "}
                <Link href="/auth/vendor/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
