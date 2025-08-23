import { Player, Match } from '../types'

interface PlayerCircleProps {
  player: Player
  currentMatch: Match | null
  size?: 'small' | 'medium' | 'large'
  isSelected?: boolean
  onClick?: () => void
}

export default function PlayerCircle({ 
  player, 
  currentMatch, 
  size = 'medium',
  isSelected = false,
  onClick
}: PlayerCircleProps) {

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    return `${minutes}m`
  }

  const getPlayerFieldTime = (player: Player) => {
    let totalTime = player.totalFieldTime
    if (player.isOnField && player.fieldTimeStart) {
      totalTime += Date.now() - player.fieldTimeStart
    }
    return totalTime
  }

  const sizeClasses = {
    small: 'w-12 h-12 text-xs',
    medium: 'w-16 h-16 text-sm',
    large: 'w-20 h-20 text-base'
  }

  const getPlayerStatusColor = () => {
    if (player.position) return 'bg-green-500 border-green-600' // On field, positioned
    if (player.isOnField) return 'bg-blue-500 border-blue-600' // On field, not positioned
    return 'bg-red-400 border-red-500' // Subbed out
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        className={`
          ${sizeClasses[size]} rounded-full border-2 flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer transition-all touch-manipulation select-none
          ${getPlayerStatusColor()}
          ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-70 scale-110' : 'hover:scale-105 active:scale-95'}
        `}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
        onClick={onClick}
        title={`Click to ${isSelected ? 'deselect' : 'select'} ${player.name}`}
      >
        <div className="text-center leading-tight">
          {player.number && (
            <div className="text-[10px] opacity-90">#{player.number}</div>
          )}
          <div className="text-[11px] font-bold truncate max-w-full px-1">
            {getFirstName(player.name)}
          </div>
          {currentMatch && (
            <div className="text-[8px] opacity-75">
              {formatTime(getPlayerFieldTime(player))}
            </div>
          )}
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${
          player.position ? 'bg-green-500' : player.isOnField ? 'bg-blue-500' : 'bg-red-400'
        }`}></div>
        <span className="text-xs text-gray-600">
          {player.position ? player.position : player.isOnField ? 'On Field' : 'Subbed Out'}
        </span>
      </div>
    </div>
  )
}