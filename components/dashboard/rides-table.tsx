import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, User, Clock, DollarSign } from "lucide-react"
import { Booking } from "@/lib/database-client"

interface RidesTableProps {
  rides: Booking[]
  type: "ongoing" | "completed" | "cancelled" | "pending"
}

export function RidesTable({ rides, type }: RidesTableProps) {
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "pending": "bg-yellow-100 text-yellow-800",
      "accepted": "bg-blue-100 text-blue-800", 
      "in_progress": "bg-orange-100 text-orange-800",
      "completed": "bg-green-100 text-green-800",
      "cancelled": "bg-red-100 text-red-800",
      "rejected": "bg-gray-100 text-gray-800",
    }

    const statusText = status.replace("_", " ").toUpperCase()
    
    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        {statusText}
      </Badge>
    )
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A"
    try {
      return new Date(timeString).toLocaleString()
    } catch (error) {
      return "Invalid date"
    }
  }

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A"
    return `$${price.toFixed(2)}`
  }

  const getVendorName = (ride: Booking) => {
    if (!ride.vendor) return "No vendor assigned"
    return ride.vendor.vendor_name || ride.vendor.email || "Unknown vendor"
  }

  const getCompanyName = (ride: Booking) => {
    if (!ride.company) return "Unknown company"
    return ride.company.company_name || ride.company.email || "Unknown company"
  }

  if (!rides || rides.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No {type} rides</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ride ID</TableHead>
            <TableHead>Pickup Location</TableHead>
            <TableHead>Dropoff Location</TableHead>
            {type !== "cancelled" && type !== "pending" && <TableHead>Vendor</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Pickup Time</TableHead>
            {type === "completed" && <TableHead>Price</TableHead>}
            <TableHead>Passengers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rides.map((ride) => (
            <TableRow key={ride.id}>
              <TableCell className="font-medium">
                #{ride.id ? ride.id.slice(-8) : "Unknown"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="max-w-[200px] truncate">
                    {ride.pickup_location || "Location not specified"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="max-w-[200px] truncate">
                    {ride.dropoff_location || "Location not specified"}
                  </span>
                </div>
              </TableCell>
              {type !== "cancelled" && type !== "pending" && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="max-w-[150px] truncate">
                      {getVendorName(ride)}
                    </span>
                  </div>
                </TableCell>
              )}
              <TableCell>{getStatusBadge(ride.status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{formatTime(ride.pickup_time)}</span>
                </div>
              </TableCell>
              {type === "completed" && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium">{formatPrice(ride.price)}</span>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>
                    {ride.passenger_count || 0} {ride.passenger_count === 1 ? 'passenger' : 'passengers'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
