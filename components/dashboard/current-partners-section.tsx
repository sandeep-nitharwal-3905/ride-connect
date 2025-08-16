"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUserData } from "@/hooks/use-user-data"
import { Users, Building2, Truck, RefreshCw, Phone, MapPin } from "lucide-react"

interface CurrentPartnersSectionProps {
  userId: string
  userType: 'company' | 'vendor'
}

export function CurrentPartnersSection({ userId, userType }: CurrentPartnersSectionProps) {
  const { currentPartners, loading, error, refresh } = useUserData(userId, userType)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading.currentPartners) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading partners...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error.currentPartners) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error.currentPartners}</p>
            <Button onClick={refresh.currentPartners} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Partners
          </div>
          <Button 
            onClick={refresh.currentPartners} 
            variant="outline" 
            size="sm"
            disabled={loading.currentPartners}
          >
            <RefreshCw className={`h-4 w-4 ${loading.currentPartners ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          {userType === 'company' 
            ? 'Vendors you are partnered with' 
            : 'Companies you are partnered with'
          } ({currentPartners.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentPartners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active partnerships</p>
            <p className="text-sm mt-2">Start building your network by adding partners</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentPartners.map((partnership) => {
              const partner = userType === 'company' ? partnership.vendor : partnership.company
              if (!partner) return null

              return (
                <div key={partnership.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {userType === 'company' ? (
                        <Truck className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1.5" />
                      ) : (
                        <Building2 className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-1.5" />
                      )}
                      <div>
                        <h4 className="font-semibold">
                          {userType === 'company' ? partner.vendor_name : partner.company_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{partner.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{partner.phone}</span>
                      </div>
                    )}
                    
                    {partner.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{partner.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-muted-foreground">
                        Partnership since: {formatDate(partnership.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
