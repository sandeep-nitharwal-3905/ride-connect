"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserData } from "@/hooks/use-user-data"
import { UserPlus, Building2, Truck, RefreshCw, Phone, MapPin, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AvailablePartnersSectionProps {
  userId: string
  userType: 'company' | 'vendor'
}

export function AvailablePartnersSection({ userId, userType }: AvailablePartnersSectionProps) {
  const { availablePartners, loading, error, refresh, createPartnership } = useUserData(userId, userType)
  const { toast } = useToast()
  const [creatingPartnerships, setCreatingPartnerships] = useState<Set<string>>(new Set())

  const handleCreatePartnership = async (partnerId: string, partnerName: string) => {
    setCreatingPartnerships(prev => new Set(prev).add(partnerId))
    
    try {
      const success = await createPartnership(partnerId)
      
      if (success) {
        toast({
          title: "Partnership Created!",
          description: `Successfully partnered with ${partnerName}`,
        })
        
        // Refresh the data to update the lists
        refresh.all()
      } else {
        toast({
          title: "Partnership Failed",
          description: "Failed to create partnership. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Partnership Failed",
        description: "An error occurred while creating the partnership.",
        variant: "destructive",
      })
    } finally {
      setCreatingPartnerships(prev => {
        const newSet = new Set(prev)
        newSet.delete(partnerId)
        return newSet
      })
    }
  }

  if (loading.availablePartners) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Available {userType === 'company' ? 'Vendors' : 'Companies'} to Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading available partners...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error.availablePartners) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Available {userType === 'company' ? 'Vendors' : 'Companies'} to Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error.availablePartners}</p>
            <Button onClick={refresh.availablePartners} variant="outline">
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
            <UserPlus className="h-5 w-5" />
            Available {userType === 'company' ? 'Vendors' : 'Companies'} to Partner
          </div>
          <Button 
            onClick={refresh.availablePartners} 
            variant="outline" 
            size="sm"
            disabled={loading.availablePartners}
          >
            <RefreshCw className={`h-4 w-4 ${loading.availablePartners ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          {userType === 'company' 
            ? 'Vendors you can add as partners' 
            : 'Companies you can partner with'
          } ({availablePartners.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availablePartners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No new partners available</p>
            <p className="text-sm mt-2">
              {userType === 'company' 
                ? 'You are already partnered with all available vendors'
                : 'You are already partnered with all available companies'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {availablePartners.map((partner) => {
              const isCreating = creatingPartnerships.has(partner.id)
              const partnerName = userType === 'company' ? partner.vendor_name : partner.company_name

              return (
                <div key={partner.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {userType === 'company' ? (
                        <Truck className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1.5" />
                      ) : (
                        <Building2 className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-1.5" />
                      )}
                      <div>
                        <h4 className="font-semibold">{partnerName}</h4>
                        <p className="text-sm text-muted-foreground">{partner.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCreatePartnership(partner.id, partnerName || 'Partner')}
                      disabled={isCreating}
                      size="sm"
                    >
                      {isCreating ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {isCreating ? 'Adding...' : 'Add Partner'}
                    </Button>
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
                        Member since: {new Date(partner.created_at).toLocaleDateString()}
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
