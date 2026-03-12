import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Credibility from '@/components/landing/Credibility'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Credibility />
      <HowItWorks />
      <Features />
      <Footer />
    </main>
  )
}
