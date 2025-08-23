import { useDrop } from 'react-dnd'
import { supabase } from '../lib/supabase'
import { Player, Match, GameFormat } from '../types'
import { getFormationsByGameFormat } from '../utils/formations'
import PositionSlot from '../components/PositionSlot'
import PlayerCircle from '../components/PlayerCircle'

interface FieldScreenProps {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  gameFormat: GameFormat
  currentMatch: Match | null
}

export default function FieldScreen({ 
  players, 
  setPlayers, 
  gameFormat, 
  currentMatch 
}: FieldScreenProps) {
  const formations = getFormationsByGameFormat(gameFormat)
  const formation = formations[0] // Use first formation for now

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'player',
    drop: (item: { playerId: string }, monitor) => {
      if (!monitor.didDrop()) {
        // Player dropped on empty field, remove from position
        removePlayerFromPosition(item.playerId)
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver() && !monitor.getDropResult(),
    }),
  }))

  const removePlayerFromPosition = async (playerId: string, shouldSubOut: boolean = false) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    const now = Date.now()
    let updatedPlayer = { ...player }

    // End position time tracking if player was in a position
    if (player.position && player.positionTimeStart && currentMatch?.isActive) {
      const positionTime = now - player.positionTimeStart
      updatedPlayer.totalPositionTime += positionTime
    }

    // If shouldSubOut is true, remove them from field entirely
    if (shouldSubOut) {
      if (player.fieldTimeStart && currentMatch?.isActive) {
        const fieldTime = now - player.fieldTimeStart
        updatedPlayer.totalFieldTime += fieldTime
      }
      updatedPlayer.isOnField = false
      updatedPlayer.fieldTimeStart = undefined
    }

    updatedPlayer.position = undefined
    updatedPlayer.positionTimeStart = undefined

    try {
      await supabase
        .from('players')
        .update({
          is_on_field: updatedPlayer.isOnField,
          field_time_start: updatedPlayer.fieldTimeStart,
          position: null,
          position_time_start: null,
          total_position_time: updatedPlayer.totalPositionTime,
          total_field_time: updatedPlayer.totalFieldTime
        })
        .eq('id', playerId)

      setPlayers(prev => 
        prev.map(p => p.id === playerId ? updatedPlayer : p)
      )

      // Log times if match is active
      if (currentMatch?.isActive) {
        // Log position time if there was one
        if (player.position && player.positionTimeStart) {
          await supabase
            .from('time_logs')
            .insert({
              player_id: playerId,
              match_id: currentMatch.id,
              start_time: player.positionTimeStart,
              end_time: now,
              position: player.position,
              type: 'position'
            })
        }

        // Log field time if being subbed out
        if (shouldSubOut && player.fieldTimeStart) {
          await supabase
            .from('time_logs')
            .insert({
              player_id: playerId,
              match_id: currentMatch.id,
              start_time: player.fieldTimeStart,
              end_time: now,
              type: 'field'
            })
        }
      }
    } catch (error) {
      console.error('Error removing player from position:', error)
    }
  }

  const assignPlayerToPosition = async (playerId: string, positionName: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    const now = Date.now()
    let updatedPlayer = { ...player }

    // If player is not on field, this is a substitution (sub them in)
    if (!player.isOnField) {
      updatedPlayer.isOnField = true
      updatedPlayer.fieldTimeStart = now
    }

    // End previous position time if player was in a position
    if (player.position && player.positionTimeStart) {
      const positionTime = now - player.positionTimeStart
      updatedPlayer.totalPositionTime += positionTime

      // Log the previous position time if match is active
      if (currentMatch?.isActive) {
        await supabase
          .from('time_logs')
          .insert({
            player_id: playerId,
            match_id: currentMatch.id,
            start_time: player.positionTimeStart,
            end_time: now,
            position: player.position,
            type: 'position'
          })
      }
    }

    // Assign new position
    updatedPlayer.position = positionName
    updatedPlayer.positionTimeStart = currentMatch?.isActive ? now : undefined

    try {
      await supabase
        .from('players')
        .update({
          is_on_field: updatedPlayer.isOnField,
          field_time_start: updatedPlayer.fieldTimeStart,
          position: positionName,
          position_time_start: updatedPlayer.positionTimeStart,
          total_position_time: updatedPlayer.totalPositionTime
        })
        .eq('id', playerId)

      setPlayers(prev => 
        prev.map(p => p.id === playerId ? updatedPlayer : p)
      )

      // Log field time start if this was a substitution and match is active
      if (!player.isOnField && currentMatch?.isActive) {
        await supabase
          .from('time_logs')
          .insert({
            player_id: playerId,
            match_id: currentMatch.id,
            start_time: now,
            end_time: null,
            type: 'field'
          })
      }
    } catch (error) {
      console.error('Error assigning player to position:', error)
    }
  }

  const getPlayerInPosition = (positionName: string) => {
    return players.find(p => p.position === positionName)
  }

  const availablePlayers = currentMatch?.isActive 
    ? players.filter(p => p.isOnField && !p.position)
    : players.filter(p => !p.position)

  if (!formation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No formations available for {gameFormat}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Full Screen Soccer Field */}
      <div 
        ref={drop}
        className="flex-1 relative bg-gradient-to-b from-pitch-light to-pitch-dark"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {/* Field markings */}
        <div className="absolute inset-0 p-4">
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white rounded-full opacity-80"></div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          
          {/* Penalty areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-20 border-4 border-white border-t-0 opacity-80"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-20 border-4 border-white border-b-0 opacity-80"></div>
          
          {/* Goal areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-12 border-4 border-white border-t-0 opacity-80"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-12 border-4 border-white border-b-0 opacity-80"></div>
          
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-white opacity-80"></div>
          
          {/* Corner arcs */}
          <div className="absolute top-0 left-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-full opacity-60"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-full opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-full opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-full opacity-60"></div>
        </div>

        {/* Position slots */}
        {formation.positions.map((position) => {
          const playerInPosition = getPlayerInPosition(position.name)
          return (
            <PositionSlot
              key={position.id}
              position={position}
              player={playerInPosition}
              onPlayerAssigned={(playerId) => assignPlayerToPosition(playerId, position.name)}
              onPlayerRemoved={(playerId, shouldSubOut) => removePlayerFromPosition(playerId, shouldSubOut)}
              currentMatch={currentMatch}
              disabled={false}
            />
          )
        })}

        {/* Drop feedback overlay */}
        {isOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-400 flex items-center justify-center">
            <div className="text-white text-xl font-bold bg-blue-500 bg-opacity-80 px-4 py-2 rounded-lg">
              Drop to remove from position
            </div>
          </div>
        )}
      </div>

      {/* Bottom Player Panel */}
      <div className="bg-white border-t-2 border-gray-200 p-4" style={{ height: '33vh' }}>
        <div className="h-full flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {currentMatch?.isActive ? 'Available Players' : 'All Players'}
          </h3>
          
          {availablePlayers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p className="text-center">
                {currentMatch?.isActive 
                  ? 'No players available for positioning' 
                  : 'All players are positioned'
                }
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {availablePlayers.map(player => (
                  <PlayerCircle 
                    key={player.id} 
                    player={player} 
                    currentMatch={currentMatch}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}