import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Player, Match, GoalEvent } from '../types'
import { Target } from 'lucide-react'

interface ScoreDisplayProps {
  currentMatch: Match | null
  players: Player[]
  goals: GoalEvent[]
  setGoals: React.Dispatch<React.SetStateAction<GoalEvent[]>>
}

export default function ScoreDisplay({ currentMatch, players, goals, setGoals }: ScoreDisplayProps) {
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedScorer, setSelectedScorer] = useState<string>('')
  const [selectedAssist, setSelectedAssist] = useState<string>('')
  const [isOwnGoal, setIsOwnGoal] = useState(false)

  const ourGoals = goals.filter(g => !g.isOwnGoal).length
  const theirGoals = goals.filter(g => g.isOwnGoal).length

  const getMatchMinute = () => {
    if (!currentMatch?.startTime) return 0
    const elapsed = Date.now() - currentMatch.startTime
    
    // Account for halftime
    let adjustedElapsed = elapsed
    if (currentMatch.halfTimeStart && currentMatch.halfTimeEnd) {
      const halfTimeDuration = currentMatch.halfTimeEnd - currentMatch.halfTimeStart
      adjustedElapsed = elapsed - halfTimeDuration
    } else if (currentMatch.halfTimeStart) {
      adjustedElapsed = currentMatch.halfTimeStart - currentMatch.startTime
    }
    
    return Math.floor(adjustedElapsed / 60000) // Convert to minutes
  }

  const handleAddGoal = async () => {
    if (!currentMatch) return

    try {
      const minute = getMatchMinute()
      const timestamp = Date.now()

      const { data, error } = await supabase
        .from('goal_events')
        .insert({
          match_id: currentMatch.id,
          scorer_id: selectedScorer || null,
          assist_id: selectedAssist || null,
          is_own_goal: isOwnGoal,
          minute,
          timestamp
        })
        .select()
        .single()

      if (error) throw error

      const newGoal: GoalEvent = {
        id: data.id,
        matchId: data.match_id,
        scorerId: data.scorer_id,
        assistId: data.assist_id,
        isOwnGoal: data.is_own_goal,
        minute: data.minute,
        timestamp: data.timestamp,
        createdAt: data.created_at
      }

      setGoals(prev => [...prev, newGoal])
      setShowScoreModal(false)
      setSelectedScorer('')
      setSelectedAssist('')
      setIsOwnGoal(false)
    } catch (error) {
      console.error('Error adding goal:', error)
    }
  }

  if (!currentMatch?.isActive) {
    return (
      <div className="text-white text-center">
        <div className="text-lg font-bold">0 - 0</div>
        <div className="text-xs opacity-60">No match</div>
      </div>
    )
  }

  return (
    <>
      {/* Score Display */}
      <div 
        className="cursor-pointer"
        onClick={() => setShowScoreModal(true)}
      >
        <div className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg border border-white border-opacity-30 shadow-lg hover:bg-opacity-30 transition-all">
          <div className="text-center">
            <div className="text-xl font-bold">
              {ourGoals} - {theirGoals}
            </div>
            <div className="text-xs opacity-80">{getMatchMinute()}'</div>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Record Goal - Minute {getMatchMinute()}
            </h3>

            <div className="space-y-4">
              {/* Goal Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type
                </label>
                <div className="flex space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="goalType"
                      checked={!isOwnGoal}
                      onChange={() => setIsOwnGoal(false)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm">Our Goal</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="goalType"
                      checked={isOwnGoal}
                      onChange={() => setIsOwnGoal(true)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm">Their Goal</span>
                  </label>
                </div>
              </div>

              {!isOwnGoal && (
                <>
                  {/* Scorer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Scorer (optional)
                    </label>
                    <select
                      value={selectedScorer}
                      onChange={(e) => setSelectedScorer(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select scorer...</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} {player.number ? `#${player.number}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assist (optional)
                    </label>
                    <select
                      value={selectedAssist}
                      onChange={(e) => setSelectedAssist(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select assist...</option>
                      {players.filter(p => p.id !== selectedScorer).map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} {player.number ? `#${player.number}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddGoal}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Record Goal
              </button>
              <button
                onClick={() => {
                  setShowScoreModal(false)
                  setSelectedScorer('')
                  setSelectedAssist('')
                  setIsOwnGoal(false)
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}