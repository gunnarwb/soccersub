import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Player, Match } from '../types'
import { Play, Pause, Square, Clock, Calendar, Users } from 'lucide-react'

interface MatchControlsProps {
  currentMatch: Match | null
  setCurrentMatch: React.Dispatch<React.SetStateAction<Match | null>>
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
}

export default function MatchControls({ 
  currentMatch, 
  setCurrentMatch, 
  players, 
  setPlayers 
}: MatchControlsProps) {
  const [matchTime, setMatchTime] = useState(0)
  const [isHalfTime, setIsHalfTime] = useState(false)
  const [opponent, setOpponent] = useState('')
  const [score, setScore] = useState('')
  const [duration, setDuration] = useState(90)

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (currentMatch?.isActive && currentMatch.startTime && !isHalfTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - (currentMatch.startTime || 0)
        
        // Account for halftime if it happened
        let adjustedElapsed = elapsed
        if (currentMatch.halfTimeStart && currentMatch.halfTimeEnd) {
          const halfTimeDuration = currentMatch.halfTimeEnd - currentMatch.halfTimeStart
          adjustedElapsed = elapsed - halfTimeDuration
        } else if (currentMatch.halfTimeStart) {
          // Currently in halftime
          adjustedElapsed = currentMatch.halfTimeStart - (currentMatch.startTime || 0)
        }
        
        setMatchTime(adjustedElapsed)
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [currentMatch, isHalfTime])

  const startMatch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = Date.now()
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('matches')
        .insert({
          date: today,
          opponent: opponent || null,
          score: score || null,
          start_time: now,
          duration: duration,
          is_active: true,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      const newMatch: Match = {
        id: data.id,
        date: data.date,
        opponent: data.opponent,
        score: data.score,
        startTime: data.start_time,
        endTime: data.end_time,
        halfTimeStart: data.half_time_start,
        halfTimeEnd: data.half_time_end,
        duration: data.duration,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setCurrentMatch(newMatch)
      setMatchTime(0)
    } catch (error) {
      console.error('Error starting match:', error)
    }
  }

  const endMatch = async () => {
    if (!currentMatch) return

    try {
      const now = Date.now()

      // End field time for all players currently on field
      const updatedPlayers = await Promise.all(
        players.map(async (player) => {
          if (player.isOnField && player.fieldTimeStart) {
            const sessionTime = now - player.fieldTimeStart
            const updatedPlayer = {
              ...player,
              isOnField: false,
              fieldTimeStart: undefined,
              position: undefined,
              positionTimeStart: undefined,
              totalFieldTime: player.totalFieldTime + sessionTime
            }

            await supabase
              .from('players')
              .update({
                is_on_field: false,
                field_time_start: null,
                position: null,
                position_time_start: null,
                total_field_time: updatedPlayer.totalFieldTime
              })
              .eq('id', player.id)

            // Log the final time entry
            await supabase
              .from('time_logs')
              .insert({
                player_id: player.id,
                match_id: currentMatch.id,
                start_time: player.fieldTimeStart,
                end_time: now,
                type: 'field'
              })

            return updatedPlayer
          }
          return player
        })
      )

      setPlayers(updatedPlayers)

      // Update match as ended
      await supabase
        .from('matches')
        .update({
          end_time: now,
          is_active: false
        })
        .eq('id', currentMatch.id)

      setCurrentMatch({ ...currentMatch, endTime: now, isActive: false })
      setMatchTime(0)
      setIsHalfTime(false)
    } catch (error) {
      console.error('Error ending match:', error)
    }
  }

  const toggleHalfTime = async () => {
    if (!currentMatch) return

    try {
      const now = Date.now()

      if (!isHalfTime) {
        // Starting halftime
        await supabase
          .from('matches')
          .update({ half_time_start: now })
          .eq('id', currentMatch.id)

        setCurrentMatch({ ...currentMatch, halfTimeStart: now })
        setIsHalfTime(true)
      } else {
        // Ending halftime
        await supabase
          .from('matches')
          .update({ half_time_end: now })
          .eq('id', currentMatch.id)

        setCurrentMatch({ ...currentMatch, halfTimeEnd: now })
        setIsHalfTime(false)
      }
    } catch (error) {
      console.error('Error toggling halftime:', error)
    }
  }

  const formatMatchTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const onFieldCount = players.filter(p => p.isOnField).length

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Match Control</h2>
        {currentMatch?.isActive && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-2xl font-bold text-green-600">
              <Clock className="h-6 w-6" />
              <span>{formatMatchTime(matchTime)}</span>
            </div>
            {isHalfTime && (
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                Half Time
              </span>
            )}
          </div>
        )}
      </div>

      {!currentMatch?.isActive ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opponent (optional)
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Team name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score (optional)
              </label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 2-1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={60}>60 minutes</option>
                <option value={70}>70 minutes</option>
                <option value={80}>80 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          <button
            onClick={startMatch}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Play className="h-5 w-5" />
            <span>Start Match</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date(currentMatch.date).toLocaleDateString()}
                </span>
              </div>
              {currentMatch.opponent && (
                <span className="text-sm text-gray-600">vs {currentMatch.opponent}</span>
              )}
              {currentMatch.score && (
                <span className="text-sm font-medium text-gray-900">
                  Score: {currentMatch.score}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{onFieldCount} on field</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={toggleHalfTime}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isHalfTime 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <Pause className="h-4 w-4" />
              <span>{isHalfTime ? 'End Half Time' : 'Half Time'}</span>
            </button>
            
            <button
              onClick={endMatch}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Square className="h-4 w-4" />
              <span>End Match</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}