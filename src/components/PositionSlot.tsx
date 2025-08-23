import { useDrop } from 'react-dnd'
import { Player, Position, Match } from '../types'

interface PositionSlotProps {
  position: Position
  player?: Player
  onPlayerAssigned: (playerId: string) => void
  onPlayerRemoved: (playerId: string, shouldSubOut: boolean) => void
  currentMatch: Match | null
  disabled?: boolean
}

export default function PositionSlot({ 
  position, 
  player, 
  onPlayerAssigned, 
  onPlayerRemoved,
  currentMatch,
  disabled = false 
}: PositionSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'player',
    drop: (item: { playerId: string }) => {
      if (!disabled) {
        onPlayerAssigned(item.playerId)
      }
      return { position: position.name }
    },
    canDrop: () => !disabled,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

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

  const handleDoubleClick = () => {
    if (player && !disabled) {
      // Double-click to remove from position (sub out if match is active)
      onPlayerRemoved(player.id, currentMatch?.isActive || false)
    }
  }

  return (
    <div
      ref={drop}
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
          ${isOver && canDrop ? 'ring-4 ring-white ring-opacity-50 scale-110' : ''}
          ${!canDrop && isOver ? 'opacity-50' : ''}
          ${disabled ? 'opacity-50' : ''}
          ${player ? 'hover:scale-105' : ''}
        `}
        onDoubleClick={handleDoubleClick}
        title={player ? `Double-click to ${currentMatch?.isActive ? 'sub out' : 'remove'} ${player.name}` : `Drop player here for ${position.name}`}
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