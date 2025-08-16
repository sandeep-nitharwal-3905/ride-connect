import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Shield, Zap, Users, BarChart3 } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Booking System",
      description: "Effortless ride scheduling with intelligent vendor matching and real-time availability.",
    },
    {
      icon: MapPin,
      title: "Live Tracking",
      description: "Monitor all rides in real-time with GPS tracking and instant status updates.",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security with encrypted data and verified vendor partnerships.",
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description: "Real-time alerts for booking confirmations, ride updates, and partner requests.",
    },
    {
      icon: Users,
      title: "Partner Network",
      description: "Access to a curated network of trusted vendors and transportation providers.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into ride patterns, costs, and vendor performance.",
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need for Corporate Transportation</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform provides all the tools companies and vendors need to create successful transportation
            partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
