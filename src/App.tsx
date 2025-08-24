import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import BottomNav, { TabType } from './components/BottomNav'
import PlayersScreen from './screens/PlayersScreen'
import FieldScreen from './screens/FieldScreen'
import SettingsScreen from './screens/SettingsScreen'
import { SettingsProvider } from './contexts/SettingsContext'
import { Player, Match } from './types'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('field')

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
      currentMatchFieldTime: 0, // Reset for each match
      currentMatchPositionTime: 0, // Reset for each match
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
    return (
      <SettingsProvider>
        <Auth />
      </SettingsProvider>
    )
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'players':
        return (
          <PlayersScreen 
            players={players}
            setPlayers={setPlayers}
            currentMatch={currentMatch}
          />
        )
      case 'field':
        return (
          <FieldScreen 
            players={players}
            setPlayers={setPlayers}
            currentMatch={currentMatch}
          />
        )
      case 'settings':
        return (
          <SettingsScreen 
            currentMatch={currentMatch}
            setCurrentMatch={setCurrentMatch}
            players={players}
            setPlayers={setPlayers}
          />
        )
      default:
        return null
    }
  }

  return (
    <SettingsProvider>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderActiveScreen()}
        </div>

        {/* Bottom Navigation */}
        <BottomNav 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </SettingsProvider>
  )
}

export default App