import React from 'react'

interface FooterProps {
  variant?: 'landing' | 'dashboard' | 'education'
  onOpenCalculator?: () => void
}

export const Footer: React.FC<FooterProps> = ({ variant = 'landing', onOpenCalculator }) => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Markets', href: '#markets' },
      { name: 'Portfolio', href: '#portfolio' },
      { name: 'Analytics', href: '#analytics' },
      { name: 'Education', href: '#education' }
    ],
    tools: [
      { name: 'Calculator', href: '#calculator', icon: '🧮' },
      { name: 'APY Converter', href: '#apy-converter', icon: '📊' },
      { name: 'Analytics', href: '#analytics', icon: '📈' },
      { name: 'Info Bot', href: '#info-bot', icon: '🤖' },
      { name: 'Whale Alerts', href: '#whale-alerts', icon: '🐋' }
    ],
    resources: [
      { name: 'Documentation', href: 'https://docs.coreyield.com' },
      { name: 'API Reference', href: 'https://api.coreyield.com' },
      { name: 'GitHub', href: 'https://github.com/coreyield' },
      { name: 'Blog', href: 'https://blog.coreyield.com' },
      { name: 'Whitepaper', href: 'https://whitepaper.coreyield.com' }
    ],
    support: [
      { name: 'Help Center', href: 'https://help.coreyield.com' },
      { name: 'Discord', href: 'https://discord.gg/coreyield' },
      { name: 'Twitter', href: 'https://twitter.com/coreyield' },
      { name: 'Telegram', href: 'https://t.me/coreyield' },
      { name: 'Contact', href: 'mailto:support@coreyield.com' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Use', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Security', href: '/security' },
      { name: 'Latest Update', href: '/updates' }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/coreyield', icon: '𝕏' },
    { name: 'Discord', href: 'https://discord.gg/coreyield', icon: '🎮' },
    { name: 'GitHub', href: 'https://github.com/coreyield', icon: '📚' },
    { name: 'Telegram', href: 'https://t.me/coreyield', icon: '📱' }
  ]

  return (
    <footer className={`relative overflow-hidden ${
      variant === 'landing' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-black' 
        : 'bg-gray-900'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">CY</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">CoreYield</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Next-Generation Yield Protocol</p>
              </div>
            </div>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 max-w-md">
              Earn superior yields on your digital assets with CoreYield's innovative 
              yield farming protocol built on the Core blockchain.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                  title={social.name}
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Tools</h4>
            <ul className="space-y-3">
              {footerLinks.tools.map((link) => (
                <li key={link.name}>
                  {link.name === 'Calculator' && onOpenCalculator ? (
                    <button
                      onClick={onOpenCalculator}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2 w-full text-left"
                    >
                      <span className="text-sm">{link.icon}</span>
                      <span>{link.name}</span>
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"
                    >
                      <span className="text-sm">{link.icon}</span>
                      <span>{link.name}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats Section - Only for landing page */}
        {variant === 'landing' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-8 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">$2.4M+</div>
              <div className="text-gray-400 text-sm">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">15%</div>
              <div className="text-gray-400 text-sm">Average APY</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">1,200+</div>
              <div className="text-gray-400 text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-400 text-sm">Uptime</div>
            </div>
          </div>
        )}

        {/* Latest Updates Section - Only for landing page */}
        {variant === 'landing' && (
          <div className="mb-12 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-700/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span className="text-blue-400">🆕</span>
                <span>Latest Updates</span>
              </h3>
              <a 
                href="/updates" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All →
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-400 text-sm">✨</span>
                  <span className="text-gray-400 text-xs">Dec 15, 2024</span>
                </div>
                <h4 className="text-white font-medium text-sm mb-1">New Calculator Tool</h4>
                <p className="text-gray-400 text-xs">Advanced yield calculation and APY converter now available</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-400 text-sm">🔧</span>
                  <span className="text-gray-400 text-xs">Dec 12, 2024</span>
                </div>
                <h4 className="text-white font-medium text-sm mb-1">Enhanced Analytics</h4>
                <p className="text-gray-400 text-xs">Real-time portfolio tracking and performance metrics</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-purple-400 text-sm">🤖</span>
                  <span className="text-gray-400 text-xs">Dec 10, 2024</span>
                </div>
                <h4 className="text-white font-medium text-sm mb-1">Info Bot Launch</h4>
                <p className="text-gray-400 text-xs">AI-powered assistance for yield farming questions</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-6">
              <p className="text-gray-400 text-sm">
                © {currentYear} CoreYield Protocol. All rights reserved.
              </p>
              
              {/* Legal Links */}
              <div className="flex items-center space-x-4">
                {footerLinks.legal.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-gray-500 hover:text-gray-400 transition-colors duration-200 text-xs"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {onOpenCalculator ? (
                  <button
                    onClick={onOpenCalculator}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    🧮 Calculator
                  </button>
                ) : (
                  <a 
                    href="#calculator" 
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    🧮 Calculator
                  </a>
                )}
                <a 
                  href="#analytics" 
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  📊 Analytics
                </a>
              </div>
              
              {/* Network Status */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400 text-sm">Core Testnet2</span>
              </div>
              
              {/* Version */}
              <div className="text-gray-500 text-xs">
                v1.0.0-beta
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500"></div>
    </footer>
  )
} 