import { Suspense, lazy } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import FeaturedTools from './components/FeaturedTools'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import WhyBand from './components/WhyBand'
import ShareProblem from './components/ShareProblem'
import Footer from './components/Footer'
import PageBackground from './components/PageBackground'
import { resolveRoute } from './lib/route'

// Loaded only on its own route so the homepage bundle does not grow.
const MedicalBillPage = lazy(() => import('./components/medical/MedicalBillPage'))

export default function App() {
  if (resolveRoute(window.location.pathname) === 'medical-bill-checker') {
    return (
      <Suspense fallback={<p role="status" className="p-8 text-center text-slate-600">Loading…</p>}>
        <MedicalBillPage />
      </Suspense>
    )
  }

  return (
    <div className="relative isolate overflow-x-clip bg-gradient-to-b from-sky-50 via-slate-50 to-indigo-50">
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
