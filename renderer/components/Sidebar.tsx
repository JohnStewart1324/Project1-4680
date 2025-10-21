import React from 'react'
import { getFilterCategories } from '../utils/aiFilter'

interface SidebarProps {
  activeFilter: string
  onFilterSelect: (filterId: string) => void
  onResetFilters: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeFilter, onFilterSelect, onResetFilters }) => {
  const categories = getFilterCategories()

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-0">
        <h2 className="text-lg font-bold text-white mb-4">AI Filters</h2>
        
        {/* Reset Button */}
        <button
          onClick={onResetFilters}
          className={`w-full text-left px-3 py-2 rounded-md mb-4 transition-colors duration-200 ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-dark-300 hover:bg-dark-400 text-gray-300'
          }`}
        >
          <span className="mr-2">📊</span>
          All Stocks
        </button>

        {/* Filter Categories */}
        <div className="space-y-1">
          {categories.slice(1).map((category) => (
            <button
              key={category.id}
              onClick={() => onFilterSelect(category.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                activeFilter === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-300 hover:bg-dark-400 text-gray-300'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 pt-4 border-t border-dark-300">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Coming Soon</h3>
          
          <div className="space-y-2">
            <div className="bg-dark-300 rounded-md p-3 opacity-60">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-2">🤖</span>
                <div>
                  <div className="text-sm font-medium text-gray-300">AI Recommendations</div>
                  <div className="text-xs text-gray-500">Personalized stock suggestions</div>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-300 rounded-md p-3 opacity-60">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">📊</span>
                <div>
                  <div className="text-sm font-medium text-gray-300">Portfolio Simulation</div>
                  <div className="text-xs text-gray-500">Test investment strategies</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-dark-300">
          <div className="text-xs text-gray-500 text-center">
            <div className="mb-1">Stock Viewer v1.0</div>
            <div>AI-Powered Analysis</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
