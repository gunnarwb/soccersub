import { useState, useRef } from 'react'
import { Player, Position, Match } from '../types'

interface PositionSlotProps {
  position: Position
  player?: Player
  onPositionClick: () => void
  onPlayerClick?: () => void
  onPlayerSubOut?: () => void
  selectedPlayerId: string | null
  currentMatch: Match | null
}

export default function PositionSlot({ 
  position, 
  player, 
  onPositionClick,
  onPlayerClick,
  onPlayerSubOut,
  selectedPlayerId,
  currentMatch
}: PositionSlotProps) {
  const [showSubOutOption, setShowSubOutOption] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const getPositionColor = (role: Position['role']) => {
    switch (role) {
      case 'goalkeeper':
        return 'bg-yellow-500 border-yellow-600'
      case 'defender':
        return 'bg-blue-500 border-blue-600'
      case 'midfielder':
        return 'bg-green-500 border-green-600'
      case 'forward':
        return 'bg-red-500 border-red-600'
      default:
        return 'bg-gray-500 border-gray-600'
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getPlayerFieldTime = (player: Player) => {
    let totalTime = player.totalFieldTime
    if (player.isOnField && player.fieldTimeStart) {
      totalTime += Date.now() - player.fieldTimeStart
    }
    return totalTime
  }

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

  const isTargeted = selectedPlayerId !== null && selectedPlayerId !== player?.id
  const isEmpty = !player
  const shouldPulsate = isEmpty && currentMatch?.isActive

  const handleMouseDown = () => {
    if (player && currentMatch?.isActive) {
      longPressTimer.current = setTimeout(() => {
        setShowSubOutOption(true)
      }, 800) // 800ms long press
    }
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleClick = () => {
    if (showSubOutOption) {
      setShowSubOutOption(false)
      return
    }
    
    if (player) {
      onPlayerClick?.()
    } else {
      onPositionClick()
    }
  }

  const handleSubOut = () => {
    setShowSubOutOption(false)
    onPlayerSubOut?.()
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
    >
      <div
        className={`
          relative w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center text-white font-bold text-xs shadow-lg transition-all cursor-pointer
          ${getPositionColor(position.role)}
          ${isTargeted ? 'ring-4 ring-blue-400 ring-opacity-70 scale-110' : ''}
          ${player?.id === selectedPlayerId ? 'ring-4 ring-yellow-400 ring-opacity-70 scale-110' : ''}
          ${shouldPulsate ? 'animate-pulse-empty' : ''}
          ${player ? 'hover:scale-105' : 'hover:ring-2 hover:ring-white hover:ring-opacity-50'}
        `}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        title={
          player 
            ? `Click to ${selectedPlayerId ? 'swap with selected player' : 'select'} ${player.name}. Long press to sub out.`
            : selectedPlayerId 
              ? `Click to assign selected player to ${position.name}`
              : `Empty ${position.name} position`
        }
      >
        {player ? (
          <>
            <div className="text-[9px] leading-none text-center font-bold truncate max-w-full px-1">
              {getFirstName(player.name)}
            </div>
            <div className="text-[7px] leading-none opacity-90">
              {formatTime(getPlayerFieldTime(player))}
            </div>
          </>
        ) : (
          <span className="text-[9px] leading-none text-center px-1">
            {position.name}
          </span>
        )}
        
        {/* Sub out option popup */}
        {showSubOutOption && player && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
              <button
                onClick={handleSubOut}
                className="hover:bg-red-600 px-1 py-0.5 rounded"
              >
                Sub Out
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Empty position alert */}
      {isEmpty && currentMatch?.isActive && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse-alert">
            Empty!
          </div>
        </div>
      )}
    </div>
  )
}