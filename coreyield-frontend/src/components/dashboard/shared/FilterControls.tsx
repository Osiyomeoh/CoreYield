import React from 'react'

interface FilterControlsProps {
  marketFilter: 'all' | 'prime' | 'favorites' | 'new'
  setMarketFilter: (filter: 'all' | 'prime' | 'favorites' | 'new') => void
  sortBy: 'default' | 'apy' | 'tvl' | 'volume' | 'maturity'
  setSortBy: (sort: 'default' | 'apy' | 'tvl' | 'volume' | 'maturity') => void
  viewMode: 'list' | 'grid' | 'detailed'
  setViewMode: (mode: 'list' | 'grid' | 'detailed') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  showMarketProperties: boolean
  setShowMarketProperties: (show: boolean) => void
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  marketFilter,
  setMarketFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  showMarketProperties,
  setShowMarketProperties
}) => {
  return (
    <div className="space-y-4">
      {/* Main Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {[
              { id: 'prime', label: 'Prime', icon: '👑' },
              { id: 'favorites', label: 'Favorites', icon: '⭐' },
              { id: 'new', label: 'New', icon: '🆕' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setMarketFilter(filter.id as any)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  marketFilter === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="default">All Categories</option>
            <option value="apy">Sort by APY</option>
            <option value="tvl">Sort by TVL</option>
            <option value="volume">Sort by Volume</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setShowMarketProperties(!showMarketProperties)}
              className="text-gray-400 hover:text-white"
            >
              💡
            </button>
            <span className="text-gray-400">Expand All</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-400">Collapse All</span>
          </div>
          
          <input
            type="text"
            placeholder="Search name or paste address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 w-64"
          />
          <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Market Properties Tooltip */}
      {showMarketProperties && (
        <div className="bg-orange-500 text-white p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>💡</span>
            <span>Hide or show market properties to match your preferences!</span>
          </div>
          <button 
            onClick={() => setShowMarketProperties(false)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}