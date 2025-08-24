import { useState, useEffect } from 'react'
import { Match } from '../types'
import { Clock, Pause } from 'lucide-react'

interface MatchClockProps {
  currentMatch: Match
}

export default function MatchClock({ currentMatch }: MatchClockProps) {
  const [matchTime, setMatchTime] = useState(0)
  const [isHalfTime, setIsHalfTime] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (currentMatch?.isActive && currentMatch.startTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - currentMatch.startTime
        
        // Account for halftime if it happened
        let adjustedElapsed = elapsed
        if (currentMatch.halfTimeStart && currentMatch.halfTimeEnd) {
          const halfTimeDuration = currentMatch.halfTimeEnd - currentMatch.halfTimeStart
          adjustedElapsed = elapsed - halfTimeDuration
          setIsHalfTime(false)
        } else if (currentMatch.halfTimeStart) {
          // Currently in halftime
          adjustedElapsed = currentMatch.halfTimeStart - currentMatch.startTime
          setIsHalfTime(true)
        } else {
          setIsHalfTime(false)
        }
        
        setMatchTime(adjustedElapsed)
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [currentMatch])

  const formatMatchTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-2 text-white">
      <Clock className="h-4 w-4" />
      <div className="text-sm font-mono font-bold">
        {formatMatchTime(matchTime)}
      </div>
      {isHalfTime && (
        <div className="flex items-center">
          <Pause className="h-3 w-3 text-yellow-300" />
          <span className="text-xs text-yellow-300 ml-1">HT</span>
        </div>
      )}
    </div>
  )
}