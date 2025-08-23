import { useDrop } from 'react-dnd'
import { Player, Position } from '../types'
import PlayerCard from './PlayerCard'

interface PositionSlotProps {
  position: Position
  player?: Player
  onPlayerAssigned: (playerId: string) => void
  disabled?: boolean
}

export default function PositionSlot({ 
  position, 
  player, 
  onPlayerAssigned, 
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
          relative w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs shadow-lg transition-all
          ${getPositionColor(position.role)}
          ${isOver && canDrop ? 'ring-4 ring-white ring-opacity-50 scale-110' : ''}
          ${!canDrop && isOver ? 'opacity-50' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {player ? (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <PlayerCard player={player} disabled={disabled} />
          </div>
        ) : (
          <span className="text-[10px] leading-none text-center px-1">
            {position.name}
          </span>
        )}
      </div>
    </div>
  )
}