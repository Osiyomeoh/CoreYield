import React from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenCalculator: () => void
  onOpenAnalytics: () => void
  onOpenInfoBot: () => void
  onOpenWhaleAlerts: () => void
  onOpenSocial: () => void
  onOpenDocumentation: () => void
  onOpenMobile: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: string
  action: () => void
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ 
  onClose, 
  onOpenCalculator,
  onOpenAnalytics,
  onOpenInfoBot,
  onOpenWhaleAlerts,
  onOpenSocial,
  onOpenDocumentation,
  onOpenMobile
}) => {
  const menuItems: MenuItem[] = [
    // Core Features
    { id: 'analytics', label: 'Analytics', icon: '📈', action: onOpenAnalytics },
    { id: 'social', label: 'Social Features', icon: '💬', action: onOpenSocial },
    { id: 'documentation', label: 'Documentation', icon: '📚', action: onOpenDocumentation },
    { id: 'mobile', label: 'Mobile View', icon: '📱', action: onOpenMobile },
    
    // Divider
    { id: 'divider1', label: '', icon: '', action: () => {} },
    
    // Tools
    { id: 'calculator', label: 'Calculator', icon: '🧮', action: onOpenCalculator },
    { id: 'info-bot', label: 'Info Bot', icon: '🤖', action: onOpenInfoBot },
    { id: 'whale-alerts', label: 'Whale Alerts', icon: '🐋', action: onOpenWhaleAlerts },
    
    // Divider
    { id: 'divider2', label: '', icon: '', action: () => {} },
    
    // Updates and Legal
    { id: 'latest-update', label: 'Latest Update', icon: '🆕', action: () => window.open('/updates', '_blank') },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: '🔒', action: () => window.open('/privacy', '_blank') },
    { id: 'terms-of-use', label: 'Terms of Use', icon: '📋', action: () => window.open('/terms', '_blank') },
  ]



  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Mobile Menu Dropdown */}
      <div className="fixed top-16 left-4 w-64 sm:w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
        {/* Dropdown Arrow */}
        <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"></div>
        {/* Menu Items */}
        <div className="p-2">
          {menuItems.map((item) => (
            item.id.startsWith('divider') ? (
              <div key={item.id} className="h-px bg-gray-700 my-2"></div>
            ) : (
              <button
                key={item.id}
                onClick={() => {
                  item.action()
                  onClose()
                }}
                className="w-full p-3 text-left bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 transition-all duration-200 group mb-1"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base sm:text-lg">{item.icon}</span>
                  <span className="font-medium text-white text-sm sm:text-base">{item.label}</span>
                </div>
              </button>
            )
          ))}
        </div>
      </div>
    </>
  )
} 