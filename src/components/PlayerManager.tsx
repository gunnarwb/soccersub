import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Player, Match } from '../types'
import { Plus, UserPlus, UserMinus, Clock, Hash } from 'lucide-react'

interface PlayerManagerProps {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  currentMatch: Match | null
}

export default function PlayerManager({ players, setPlayers, currentMatch }: PlayerManagerProps) {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerNumber, setNewPlayerNumber] = useState('')

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to add players')
        return
      }

      console.log('Adding player:', { name: newPlayerName.trim(), user_id: user.id })

      const { data, error } = await supabase
        .from('players')
        .insert({
          name: newPlayerName.trim(),
          number: newPlayerNumber ? parseInt(newPlayerNumber) : null,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        alert(`Error adding player: ${error.message}`)
        return
      }

      console.log('Player added successfully:', data)

      const newPlayer: Player = {
        id: data.id,
        name: data.name,
        number: data.number,
        isOnField: data.is_on_field,
        position: data.position,
        fieldTimeStart: data.field_time_start,
        totalFieldTime: data.total_field_time,
        positionTimeStart: data.position_time_start,
        totalPositionTime: data.total_position_time,
        currentMatchFieldTime: 0,
        currentMatchPositionTime: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setPlayers(prev => [...prev, newPlayer])
      setNewPlayerName('')
      setNewPlayerNumber('')
      setIsAddingPlayer(false)
    } catch (error: any) {
      console.error('Error adding player:', error)
      alert(`Error adding player: ${error.message}`)
    }
  }

  const toggleFieldStatus = async (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player || !currentMatch?.isActive) return

    const now = Date.now()
    let updatedPlayer = { ...player }

    if (player.isOnField) {
      // Player is going OFF the field
      if (player.fieldTimeStart) {
        const sessionTime = now - player.fieldTimeStart
        updatedPlayer.totalFieldTime += sessionTime
      }
      updatedPlayer.isOnField = false
      updatedPlayer.fieldTimeStart = undefined
      updatedPlayer.position = undefined
      updatedPlayer.positionTimeStart = undefined
    } else {
      // Player is going ON the field
      updatedPlayer.isOnField = true
      updatedPlayer.fieldTimeStart = now
    }

    try {
      const { error } = await supabase
        .from('players')
        .update({
          is_on_field: updatedPlayer.isOnField,
          field_time_start: updatedPlayer.fieldTimeStart,
          total_field_time: updatedPlayer.totalFieldTime,
          position: updatedPlayer.position,
          position_time_start: updatedPlayer.positionTimeStart
        })
        .eq('id', playerId)

      if (error) throw error

      setPlayers(prev => 
        prev.map(p => p.id === playerId ? updatedPlayer : p)
      )

      // Log the time change
      if (currentMatch) {
        await supabase
          .from('time_logs')
          .insert({
            player_id: playerId,
            match_id: currentMatch.id,
            start_time: updatedPlayer.isOnField ? now : (player.fieldTimeStart || now),
            end_time: updatedPlayer.isOnField ? null : now,
            type: 'field'
          })
      }
    } catch (error) {
      console.error('Error updating player field status:', error)
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

  const onFieldPlayers = players.filter(p => p.isOnField)
  const offFieldPlayers = players.filter(p => !p.isOnField)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Players</h2>
        <button
          onClick={() => setIsAddingPlayer(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Player</span>
        </button>
      </div>

      {isAddingPlayer && (
        <form onSubmit={handleAddPlayer} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name *
            </label>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter player name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jersey Number (optional)
            </label>
            <input
              type="number"
              value={newPlayerNumber}
              onChange={(e) => setNewPlayerNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter jersey number"
              min="1"
              max="99"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Add Player
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingPlayer(false)
                setNewPlayerName('')
                setNewPlayerNumber('')
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <UserPlus className="h-4 w-4 mr-2 text-green-600" />
            On Field ({onFieldPlayers.length})
          </h3>
          <div className="space-y-2">
            {onFieldPlayers.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No players on field</p>
            ) : (
              onFieldPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {player.number && (
                      <div className="flex items-center">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">{player.number}</span>
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{player.name}</span>
                    {player.position && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {player.position}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(getPlayerFieldTime(player))}
                    </div>
                    <button
                      onClick={() => toggleFieldStatus(player.id)}
                      disabled={!currentMatch?.isActive}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Sub Out
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <UserMinus className="h-4 w-4 mr-2 text-gray-600" />
            Off Field ({offFieldPlayers.length})
          </h3>
          <div className="space-y-2">
            {offFieldPlayers.length === 0 ? (
              <p className="text-gray-500 text-sm italic">All players are on field</p>
            ) : (
              offFieldPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {player.number && (
                      <div className="flex items-center">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">{player.number}</span>
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{player.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(player.totalFieldTime)}
                    </div>
                    <button
                      onClick={() => toggleFieldStatus(player.id)}
                      disabled={!currentMatch?.isActive}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      Sub In
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}