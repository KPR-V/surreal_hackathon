"use client"

import { useEffect, useState } from "react"

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="pulse-loader mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-orange-500 mb-4">IPA Platform</h2>
        <p className="text-gray-400 mb-6">Loading your IP asset management platform...</p>
        <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress}%</p>
      </div>
    </div>
  )
}
