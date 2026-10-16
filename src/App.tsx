import Header from './components/Header'
import Hero from './components/Hero'
import FeaturedTools from './components/FeaturedTools'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import WhyBand from './components/WhyBand'
import ShareProblem from './components/ShareProblem'
import Footer from './components/Footer'
import PageBackground from './components/PageBackground'

export default function App() {
  return (
    <div className="relative isolate overflow-x-clip bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <PageBackground />
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
        <HowItWorks />
        <Pricing />
        <WhyBand />
        <ShareProblem />
      </main>
      <Footer />
    </div>
  )
}
