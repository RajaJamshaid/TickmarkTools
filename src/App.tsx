import Header from './components/Header'
import Hero from './components/Hero'
import FeaturedTools from './components/FeaturedTools'
import TrustStrip from './components/TrustStrip'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import WhyBand from './components/WhyBand'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <FeaturedTools />
        <TrustStrip />
        <HowItWorks />
        <Pricing />
        <WhyBand />
      </main>
      <Footer />
    </>
  )
}
