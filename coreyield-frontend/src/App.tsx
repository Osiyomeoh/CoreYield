import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Web3Provider } from './providers/Web3Provider'
import { ThemeProvider, ThemeToggle } from './components/ThemeProvider'
import { LandingPage } from './components/LandingPage' // Import the NEW Pendle-style landing page
import { MainDashboard } from './components/MainDashboard'


type ViewType = 'landing' | 'dashboard'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing')

  const handleLaunchApp = () => {
    setCurrentView('dashboard')
  }

  const handleBackToLanding = () => {
    setCurrentView('landing')
  }

  return (
    <Web3Provider>
      <ThemeProvider>
        <div className="min-h-screen">
          <Toaster position="bottom-right" />
          
          {currentView === 'landing' ? (
            <LandingPage onLaunchApp={handleLaunchApp} />
          ) : (
            <MainDashboard onBackToLanding={handleBackToLanding} />
          )}
        </div>
      </ThemeProvider>
    </Web3Provider>
  )
}

export default App