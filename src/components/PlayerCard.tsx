import { useDrag } from 'react-dnd'
import { Player } from '../types'
import { Hash } from 'lucide-react'

interface PlayerCardProps {
  player: Player
  disabled?: boolean
}

export default function PlayerCard({ player, disabled = false }: PlayerCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'player',
    item: { playerId: player.id },
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`
        inline-flex items-center space-x-2 bg-white border-2 border-blue-200 rounded-lg px-3 py-2 shadow-sm transition-all touch-manipulation select-none
        ${isDragging ? 'opacity-50 scale-95 rotate-2' : 'hover:shadow-md hover:border-blue-300 hover:scale-105'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
        ${!disabled ? 'animate-pulse-border' : ''}
      `}
      style={{ 
        cursor: disabled ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
      title={disabled ? '' : 'Drag to field position'}
    >
      {player.number && (
        <div className="flex items-center">
          <Hash className="h-3 w-3 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{player.number}</span>
        </div>
      )}
      <span className="text-sm font-medium text-gray-900">{player.name}</span>
    </div>
  )
}