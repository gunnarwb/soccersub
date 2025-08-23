import React, { useState } from 'react'
import { useDrop } from 'react-dnd'
import { supabase } from '../lib/supabase'
import { Player, Match, GameFormat } from '../types'
import { getFormationsByGameFormat } from '../utils/formations'
import PlayerCard from './PlayerCard'
import PositionSlot from './PositionSlot'

interface SoccerPitchProps {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  gameFormat: GameFormat
  currentMatch: Match | null
}

export default function SoccerPitch({ 
  players, 
  setPlayers, 
  gameFormat, 
  currentMatch 
}: SoccerPitchProps) {
  const [selectedFormation, setSelectedFormation] = useState(0)
  const formations = getFormationsByGameFormat(gameFormat)
  const formation = formations[selectedFormation]

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

  const removePlayerFromPosition = async (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player || !currentMatch?.isActive) return

    const now = Date.now()
    let updatedPlayer = { ...player }

    // End position time tracking if player was in a position
    if (player.position && player.positionTimeStart) {
      const positionTime = now - player.positionTimeStart
      updatedPlayer.totalPositionTime += positionTime
    }

    updatedPlayer.position = undefined
    updatedPlayer.positionTimeStart = undefined

    try {
      await supabase
        .from('players')
        .update({
          position: null,
          position_time_start: null,
          total_position_time: updatedPlayer.totalPositionTime
        })
        .eq('id', playerId)

      setPlayers(prev => 
        prev.map(p => p.id === playerId ? updatedPlayer : p)
      )

      // Log position time if there was one
      if (player.position && player.positionTimeStart && currentMatch) {
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
    } catch (error) {
      console.error('Error removing player from position:', error)
    }
  }

  const assignPlayerToPosition = async (playerId: string, positionName: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player || !currentMatch?.isActive) return

    const now = Date.now()
    let updatedPlayer = { ...player }

    // End previous position time if player was in a position
    if (player.position && player.positionTimeStart) {
      const positionTime = now - player.positionTimeStart
      updatedPlayer.totalPositionTime += positionTime

      // Log the previous position time
      if (currentMatch) {
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
    updatedPlayer.positionTimeStart = now

    try {
      await supabase
        .from('players')
        .update({
          position: positionName,
          position_time_start: now,
          total_position_time: updatedPlayer.totalPositionTime
        })
        .eq('id', playerId)

      setPlayers(prev => 
        prev.map(p => p.id === playerId ? updatedPlayer : p)
      )
    } catch (error) {
      console.error('Error assigning player to position:', error)
    }
  }

  const getPlayerInPosition = (positionName: string) => {
    return players.find(p => p.position === positionName)
  }

  const unassignedOnFieldPlayers = players.filter(p => p.isOnField && !p.position)

  if (!formation) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">No formations available for {gameFormat}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Field Formation</h2>
        {formations.length > 1 && (
          <select
            value={selectedFormation}
            onChange={(e) => setSelectedFormation(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {formations.map((f, index) => (
              <option key={f.id} value={index}>
                {f.name} ({f.playerCount} players)
              </option>
            ))}
          </select>
        )}
      </div>

      {!currentMatch?.isActive && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Start a match to enable player positioning
        </div>
      )}

      <div 
        ref={drop}
        className={`relative bg-gradient-to-b from-pitch-light to-pitch-dark rounded-lg border-4 border-white shadow-lg ${
          isOver ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          aspectRatio: '3/2',
          minHeight: '300px',
          height: 'min(60vh, 500px)',
          width: '100%'
        }}
      >
        {/* Field markings */}
        <div className="absolute inset-0 p-4">
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full"></div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
          
          {/* Penalty areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white border-t-0"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white border-b-0"></div>
          
          {/* Goal areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-8 border-2 border-white border-t-0"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-8 border-2 border-white border-b-0"></div>
          
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
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
              disabled={!currentMatch?.isActive}
            />
          )
        })}
      </div>

      {/* Unassigned players on field */}
      {unassignedOnFieldPlayers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Players on field (not positioned):
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedOnFieldPlayers.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                disabled={!currentMatch?.isActive}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}