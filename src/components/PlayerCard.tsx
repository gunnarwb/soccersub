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
        inline-flex items-center space-x-2 bg-white border-2 border-blue-200 rounded-lg px-3 py-2 shadow-sm cursor-pointer transition-all
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-blue-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{ 
        cursor: disabled ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
      }}
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