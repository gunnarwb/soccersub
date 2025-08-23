import { useState } from 'react'
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const formations = getFormationsByGameFormat(gameFormat)
  const formation = formations[0] // Use first formation for now


  const swapPlayers = async (selectedPlayerId: string, targetPlayerId?: string, targetPosition?: string) => {
    const selectedPlayer = players.find(p => p.id === selectedPlayerId)
    if (!selectedPlayer) return

    const now = Date.now()
    let updatedPlayers = [...players]

    if (targetPlayerId) {
      // Swapping with another player (field-to-field swap)
      const targetPlayer = players.find(p => p.id === targetPlayerId)
      if (!targetPlayer) return

      // Store current positions
      const selectedPlayerPosition = selectedPlayer.position
      const targetPlayerPosition = targetPlayer.position

      // End timing for both players' current positions if match is active
      if (currentMatch?.isActive) {
        if (selectedPlayer.positionTimeStart && selectedPlayer.position) {
          const positionTime = now - selectedPlayer.positionTimeStart
          updatedPlayers = updatedPlayers.map(p => 
            p.id === selectedPlayerId 
              ? { ...p, totalPositionTime: p.totalPositionTime + positionTime }
              : p
          )

          await supabase.from('time_logs').insert({
            player_id: selectedPlayerId,
            match_id: currentMatch.id,
            start_time: selectedPlayer.positionTimeStart,
            end_time: now,
            position: selectedPlayer.position,
            type: 'position'
          })
        }

        if (targetPlayer.positionTimeStart && targetPlayer.position) {
          const positionTime = now - targetPlayer.positionTimeStart
          updatedPlayers = updatedPlayers.map(p => 
            p.id === targetPlayerId 
              ? { ...p, totalPositionTime: p.totalPositionTime + positionTime }
              : p
          )

          await supabase.from('time_logs').insert({
            player_id: targetPlayerId,
            match_id: currentMatch.id,
            start_time: targetPlayer.positionTimeStart,
            end_time: now,
            position: targetPlayer.position,
            type: 'position'
          })
        }
      }

      // Swap positions
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === selectedPlayerId) {
          return {
            ...p,
            position: targetPlayerPosition,
            positionTimeStart: currentMatch?.isActive ? now : undefined
          }
        }
        if (p.id === targetPlayerId) {
          return {
            ...p,
            position: selectedPlayerPosition,
            positionTimeStart: currentMatch?.isActive ? now : undefined
          }
        }
        return p
      })

      // Update database for both players
      await Promise.all([
        supabase.from('players').update({
          position: targetPlayerPosition,
          position_time_start: currentMatch?.isActive ? now : null,
          total_position_time: updatedPlayers.find(p => p.id === selectedPlayerId)?.totalPositionTime
        }).eq('id', selectedPlayerId),
        
        supabase.from('players').update({
          position: selectedPlayerPosition,
          position_time_start: currentMatch?.isActive ? now : null,
          total_position_time: updatedPlayers.find(p => p.id === targetPlayerId)?.totalPositionTime
        }).eq('id', targetPlayerId)
      ])

    } else if (targetPosition) {
      // Assigning to a specific position (bench-to-field or empty position)
      await assignPlayerToPosition(selectedPlayerId, targetPosition)
      return
    }

    setPlayers(updatedPlayers)
    setSelectedPlayerId(null) // Clear selection
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

  const handlePositionClick = async (positionName: string) => {
    if (!selectedPlayerId) return

    const playerInPosition = players.find(p => p.position === positionName)
    
    if (playerInPosition) {
      // Swap with the player currently in this position
      await swapPlayers(selectedPlayerId, playerInPosition.id)
    } else {
      // Assign to empty position
      await swapPlayers(selectedPlayerId, undefined, positionName)
    }
  }

  const handlePlayerClick = (playerId: string) => {
    if (selectedPlayerId === playerId) {
      // Deselect if clicking the same player
      setSelectedPlayerId(null)
    } else if (selectedPlayerId) {
      // Swap players if another player is selected
      const targetPlayer = players.find(p => p.id === playerId)
      if (targetPlayer?.position) {
        // Target is positioned on field - swap positions
        swapPlayers(selectedPlayerId, playerId)
      } else {
        // Target is on bench - just select them instead
        setSelectedPlayerId(playerId)
      }
    } else {
      // Select this player
      setSelectedPlayerId(playerId)
    }
  }

  const getPlayerInPosition = (positionName: string) => {
    return players.find(p => p.position === positionName)
  }

  // Bottom section shows all players NOT currently positioned on the field (the bench)
  const benchPlayers = players.filter(p => !p.position)

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
              onPositionClick={() => handlePositionClick(position.name)}
              onPlayerClick={playerInPosition ? () => handlePlayerClick(playerInPosition.id) : undefined}
              selectedPlayerId={selectedPlayerId}
              currentMatch={currentMatch}
            />
          )
        })}
      </div>

      {/* Bottom Player Panel - The Bench */}
      <div className="bg-white border-t-2 border-gray-200 p-4" style={{ height: '33vh' }}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              The Bench ({benchPlayers.length} players)
            </h3>
            {selectedPlayerId && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {players.find(p => p.id === selectedPlayerId)?.name} selected
              </div>
            )}
          </div>
          
          {benchPlayers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p className="text-center">All players are positioned on the field</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {benchPlayers.map(player => (
                  <PlayerCircle 
                    key={player.id} 
                    player={player} 
                    currentMatch={currentMatch}
                    isSelected={selectedPlayerId === player.id}
                    onClick={() => handlePlayerClick(player.id)}
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