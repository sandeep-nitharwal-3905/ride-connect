import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-background to-muted min-h-screen flex items-center">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Connect Companies with
            <span className="text-primary"> Trusted Vendors</span> for Seamless Ride Solutions
          </h1>

          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
            Streamline your corporate transportation with our intelligent platform. Real-time booking, instant partner
            matching, and comprehensive ride management all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">Real-time Updates</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">Instant Matching</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/3 h-96 opacity-10">
        <img
          src="/modern-business-transportation.png"
          alt="Transportation fleet"
          className="w-full h-full object-cover rounded-l-lg"
        />
      </div>
    </section>
  )
}
