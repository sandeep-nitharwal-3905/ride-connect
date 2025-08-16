"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Building2, Truck, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export function Sidebar() {
  const router = useRouter()

  const handleCompanyLogin = () => {
    router.push("/auth/company/login")
  }

  const handleVendorLogin = () => {
    router.push("/auth/vendor/login")
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-sidebar-foreground">RideConnect</h1>
          <p className="text-sm text-muted-foreground mt-1">Business Ride Solutions</p>
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-card-foreground">For Companies</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Book rides for your team and manage corporate transportation
            </p>
            <div className="space-y-2">
              <Button onClick={handleCompanyLogin} className="w-full bg-primary hover:bg-primary/90">
                Company Login
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/auth/company/signup")}
              >
                Sign Up as Company
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-card-foreground">For Vendors</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Partner with companies and grow your transportation business
            </p>
            <div className="space-y-2">
              <Button onClick={handleVendorLogin} className="w-full bg-primary hover:bg-primary/90">
                Vendor Login
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/auth/vendor/signup")}
              >
                Sign Up as Vendor
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8 pt-6 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span>Platform Benefits</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Real-time booking updates</li>
            <li>• Seamless partner matching</li>
            <li>• Comprehensive ride tracking</li>
            <li>• 24/7 customer support</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
