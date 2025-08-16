import { Sidebar } from "@/components/sidebar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        <HeroSection />
        <FeaturesSection />
      </main>
    </div>
  )
}
