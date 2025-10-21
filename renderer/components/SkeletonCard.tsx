import React from 'react'

const SkeletonCard: React.FC = () => {
  return (
    <div className="card animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="h-6 bg-dark-300 rounded w-16"></div>
        <div className="h-4 bg-dark-300 rounded w-8"></div>
      </div>
      
      <div className="h-4 bg-dark-300 rounded w-32 mb-2"></div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 bg-dark-300 rounded w-12"></div>
          <div className="h-4 bg-dark-300 rounded w-16"></div>
        </div>
        
        <div className="flex justify-between">
          <div className="h-3 bg-dark-300 rounded w-12"></div>
          <div className="h-4 bg-dark-300 rounded w-20"></div>
        </div>
        
        <div className="flex justify-between">
          <div className="h-3 bg-dark-300 rounded w-12"></div>
          <div className="h-4 bg-dark-300 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard







