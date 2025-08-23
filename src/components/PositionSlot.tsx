import { Player, Position, Match } from '../types'

interface PositionSlotProps {
  position: Position
  player?: Player
  onPositionClick: () => void
  onPlayerClick?: () => void
  selectedPlayerId: string | null
  currentMatch: Match | null
}

export default function PositionSlot({ 
  position, 
  player, 
  onPositionClick,
  onPlayerClick,
  selectedPlayerId,
  currentMatch: _currentMatch
}: PositionSlotProps) {

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
          ${player ? 'hover:scale-105' : ''}
        `}
        onClick={player ? onPlayerClick : onPositionClick}
        title={
          player 
            ? `Click to ${selectedPlayerId ? 'swap with selected player' : 'select'} ${player.name}`
            : `Click to assign selected player to ${position.name}`
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
      </div>
    </div>
  )
}