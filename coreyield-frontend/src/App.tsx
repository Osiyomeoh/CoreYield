import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Web3Provider } from './providers/Web3Provider'

import { LandingPage } from './components/LandingPage'
import { MainDashboard } from './components/MainDashboard'
import { Education } from './components/Education'
import { Footer } from './components/Footer'
import { Calculator } from './components/Calculator'
import { MobileMenu } from './components/MobileMenu'
import { Analytics } from './components/Analytics'
import { InfoBot } from './components/InfoBot'
import { WhaleAlerts } from './components/WhaleAlerts'
import { SocialFeatures } from './components/SocialFeatures'
import { Documentation } from './components/Documentation'
import { MobileOptimization } from './components/MobileOptimization'


type ViewType = 'landing' | 'dashboard' | 'education' | 'social' | 'documentation' | 'mobile'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing')
  const [showCalculator, setShowCalculator] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showInfoBot, setShowInfoBot] = useState(false)
  const [showWhaleAlerts, setShowWhaleAlerts] = useState(false)

  const handleLaunchApp = () => {
    setCurrentView('dashboard')
  }

  const handleBackToLanding = () => {
    setCurrentView('landing')
  }

  const handleShowEducation = () => {
    setCurrentView('education')
  }

  const handleOpenCalculator = () => {
    setShowCalculator(true)
  }

  const handleCloseCalculator = () => {
    setShowCalculator(false)
  }

  // Removed unused handleNavigate function

  const handleOpenAnalytics = () => {
    setShowAnalytics(true)
    setMobileMenuOpen(false)
  }

  const handleOpenInfoBot = () => {
    setShowInfoBot(true)
    setMobileMenuOpen(false)
  }

  const handleOpenWhaleAlerts = () => {
    setShowWhaleAlerts(true)
    setMobileMenuOpen(false)
  }

  const handleOpenSocial = () => {
    setCurrentView('social')
    setMobileMenuOpen(false)
  }

  const handleOpenDocumentation = () => {
    setCurrentView('documentation')
    setMobileMenuOpen(false)
  }

  const handleOpenMobile = () => {
    setCurrentView('mobile')
    setMobileMenuOpen(false)
  }

    return (
    <Web3Provider>
      <div className="min-h-screen flex flex-col">
        <Toaster position="bottom-right" />
        
        {currentView === 'landing' ? (
          // Landing page - no mobile menu
          <div className="flex-1">
            <LandingPage onLaunchApp={handleLaunchApp} onShowEducation={handleShowEducation} />
          </div>
        ) : (
          // Dashboard and other views - with mobile menu
          <div className="flex-1">
            {currentView === 'dashboard' && (
              <MainDashboard 
                onBackToLanding={handleBackToLanding} 
                onShowEducation={handleShowEducation}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
            )}
            {currentView === 'education' && (
              <Education 
                onBackToLanding={handleBackToLanding} 
                onLaunchApp={handleLaunchApp} 
                onBackToDashboard={() => setCurrentView('dashboard')}
                isStandalone={true}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
            )}
            {currentView === 'social' && (
              <SocialFeatures />
            )}
            {currentView === 'documentation' && (
              <Documentation />
            )}
            {currentView === 'mobile' && (
              <MobileOptimization />
            )}
          </div>
        )}
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MobileMenu 
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            onOpenCalculator={handleOpenCalculator}
            onOpenAnalytics={handleOpenAnalytics}
            onOpenInfoBot={handleOpenInfoBot}
            onOpenWhaleAlerts={handleOpenWhaleAlerts}
            onOpenSocial={handleOpenSocial}
            onOpenDocumentation={handleOpenDocumentation}
            onOpenMobile={handleOpenMobile}
          />
        )}
        
        <Footer variant={currentView} onOpenCalculator={handleOpenCalculator} />
        
        {showCalculator && (
          <Calculator onClose={handleCloseCalculator} />
        )}
        
        {showAnalytics && (
          <Analytics />
        )}
        
        {showInfoBot && (
          <InfoBot onClose={() => setShowInfoBot(false)} />
        )}
        
        {showWhaleAlerts && (
          <WhaleAlerts onClose={() => setShowWhaleAlerts(false)} />
        )}
      </div>
    </Web3Provider>
  )
}

export default App