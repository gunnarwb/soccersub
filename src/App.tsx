import { useState, useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { supabase } from './lib/supabase'
import PlayerManager from './components/PlayerManager'
import SoccerPitch from './components/SoccerPitch'
import MatchControls from './components/MatchControls'
import Auth from './components/Auth'
import { Player, Match, GameFormat } from './types'


function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [gameFormat, setGameFormat] = useState<GameFormat>('11v11')

  useEffect(() => {
    // Check initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadPlayers()
      loadCurrentMatch()
    }
  }, [user])

  const loadPlayers = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error loading players:', error)
      return
    }

    const mappedPlayers: Player[] = data.map(p => ({
      id: p.id,
      name: p.name,
      number: p.number,
      isOnField: p.is_on_field,
      position: p.position,
      fieldTimeStart: p.field_time_start,
      totalFieldTime: p.total_field_time,
      positionTimeStart: p.position_time_start,
      totalPositionTime: p.total_position_time,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }))

    setPlayers(mappedPlayers)
  }

  const loadCurrentMatch = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading match:', error)
      return
    }

    if (data) {
      const match: Match = {
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
      setCurrentMatch(match)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">SoccerSub</h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="p-4 space-y-6 max-w-6xl mx-auto">
          <MatchControls 
            currentMatch={currentMatch}
            setCurrentMatch={setCurrentMatch}
            players={players}
            setPlayers={setPlayers}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PlayerManager 
                players={players}
                setPlayers={setPlayers}
                currentMatch={currentMatch}
              />
            </div>
            
            <div className="lg:col-span-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Game Format
                </label>
                <select
                  value={gameFormat}
                  onChange={(e) => setGameFormat(e.target.value as GameFormat)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="7v7">7v7</option>
                  <option value="9v9">9v9</option>
                  <option value="11v11">11v11</option>
                </select>
              </div>
              
              <SoccerPitch 
                players={players}
                setPlayers={setPlayers}
                gameFormat={gameFormat}
                currentMatch={currentMatch}
              />
            </div>
          </div>
        </main>
      </div>
    </DndProvider>
  )
}

export default App