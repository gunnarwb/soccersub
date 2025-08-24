import { supabase } from '../lib/supabase'
import { Match, Player } from '../types'
import { useSettings } from '../contexts/SettingsContext'
import { getFormationsByGameFormat } from '../utils/formations'
import MatchControls from '../components/MatchControls'
import { Settings, Users, Clock, LogOut, RefreshCw, MapPin } from 'lucide-react'

interface SettingsScreenProps {
  currentMatch: Match | null
  setCurrentMatch: React.Dispatch<React.SetStateAction<Match | null>>
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
}

export default function SettingsScreen({ 
  currentMatch, 
  setCurrentMatch, 
  players, 
  setPlayers
}: SettingsScreenProps) {
  const { settings, updateSettings } = useSettings()
  const availableFormations = getFormationsByGameFormat(settings.gameFormat)

  const gameFormats = [
    { value: '7v7', label: '7v7 (Youth)', description: 'Smaller field, 7 players each side' },
    { value: '9v9', label: '9v9 (Youth)', description: 'Medium field, 9 players each side' },
    { value: '11v11', label: '11v11 (Full)', description: 'Full field, 11 players each side' },
  ]

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const refreshPlayerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        console.error('Error refreshing player data:', error)
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
        currentMatchFieldTime: 0,
        currentMatchPositionTime: 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }))

      setPlayers(mappedPlayers)
      alert('Player data refreshed from database')
    } catch (error) {
      console.error('Error refreshing data:', error)
      alert('Error refreshing data')
    }
  }

  const fixDataInconsistencies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fix rule: If player has a position, they MUST be on field
      // If player is off field, they CANNOT have a position
      const { error } = await supabase.rpc('fix_player_inconsistencies', {
        target_user_id: user.id
      })

      if (error) {
        // If RPC doesn't exist, do it manually
        const { data: playersData, error: fetchError } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', user.id)

        if (fetchError) throw fetchError

        const updates = []
        for (const player of playersData) {
          let needsUpdate = false
          const updateData: any = {}

          // Rule 1: If has position, must be on field
          if (player.position && !player.is_on_field) {
            updateData.is_on_field = true
            needsUpdate = true
          }

          // Rule 2: If off field, cannot have position
          if (!player.is_on_field && player.position) {
            updateData.position = null
            updateData.position_time_start = null
            needsUpdate = true
          }

          if (needsUpdate) {
            updates.push(
              supabase
                .from('players')
                .update(updateData)
                .eq('id', player.id)
            )
          }
        }

        if (updates.length > 0) {
          await Promise.all(updates)
          alert(`Fixed ${updates.length} data inconsistencies`)
        } else {
          alert('No inconsistencies found')
        }
      } else {
        alert('Data inconsistencies fixed')
      }

      // Refresh the data
      await refreshPlayerData()
    } catch (error: any) {
      console.error('Error fixing data inconsistencies:', error)
      alert(`Error fixing data: ${error.message}`)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* Match Controls */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Match Control
            </h3>
          </div>
          <div className="p-4">
            <MatchControls 
              currentMatch={currentMatch}
              setCurrentMatch={setCurrentMatch}
              players={players}
              setPlayers={setPlayers}
            />
          </div>
        </div>

        {/* Game Format */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Game Format
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {gameFormats.map((format) => (
              <label
                key={format.value}
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.gameFormat === format.value 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="gameFormat"
                  value={format.value}
                  checked={settings.gameFormat === format.value}
                  onChange={(e) => updateSettings({ gameFormat: e.target.value as any })}
                  className="mt-1 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{format.label}</div>
                  <div className="text-sm text-gray-600">{format.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Formation Selection */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Formation Layout
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {availableFormations.map((formation) => (
              <label
                key={formation.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.selectedFormationId === formation.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="formation"
                  value={formation.id}
                  checked={settings.selectedFormationId === formation.id}
                  onChange={(e) => updateSettings({ selectedFormationId: e.target.value })}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{formation.name}</div>
                  <div className="text-sm text-gray-600">
                    {formation.playerCount} players - 
                    {formation.positions.filter(p => p.role === 'defender').length} defenders,
                    {formation.positions.filter(p => p.role === 'midfielder').length} midfielders,
                    {formation.positions.filter(p => p.role === 'forward').length} forwards
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Match Duration */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Match Duration
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {[60, 70, 80, 90].map((duration) => (
                <label
                  key={duration}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    settings.matchDuration === duration 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={duration}
                    checked={settings.matchDuration === duration}
                    onChange={(e) => updateSettings({ matchDuration: parseInt(e.target.value) })}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-900">{duration} minutes</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Team Overview
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{players.length}</div>
                <div className="text-sm text-gray-600">Total Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {players.filter(p => p.isOnField).length}
                </div>
                <div className="text-sm text-gray-600">On Field</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {players.filter(p => p.position).length}
                </div>
                <div className="text-sm text-gray-600">Positioned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {players.filter(p => !p.isOnField).length}
                </div>
                <div className="text-sm text-gray-600">Off Field</div>
              </div>
            </div>
            
            {/* Debug info */}
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-700">Debug Info:</div>
                <div className="flex space-x-2">
                  <button
                    onClick={refreshPlayerData}
                    className="flex items-center space-x-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={fixDataInconsistencies}
                    className="flex items-center space-x-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    <span>Fix Data</span>
                  </button>
                </div>
              </div>
              <div>Players on field: {players.filter(p => p.isOnField).map(p => p.name).join(', ') || 'None'}</div>
              <div className="mt-1">Players off field: {players.filter(p => !p.isOnField).map(p => p.name).join(', ') || 'None'}</div>
              <div className="mt-1">Players with positions: {players.filter(p => p.position).map(p => `${p.name}(${p.position})`).join(', ') || 'None'}</div>
              
              {/* Highlight inconsistencies */}
              {players.some(p => p.position && !p.isOnField) && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                  <div className="font-medium text-red-700">⚠️ Data Inconsistency Detected:</div>
                  <div className="text-red-600">
                    Players with positions but marked as off-field: {
                      players.filter(p => p.position && !p.isOnField).map(p => p.name).join(', ')
                    }
                  </div>
                  <div className="text-red-600 text-xs mt-1">Click "Fix Data" to resolve this.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">App Information</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Version</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Game Format</span>
              <span className="text-gray-900">{settings.gameFormat}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Formation</span>
              <span className="text-gray-900">{availableFormations.find(f => f.id === settings.selectedFormationId)?.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Match Duration</span>
              <span className="text-gray-900">{settings.matchDuration} minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Match Status</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                currentMatch?.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentMatch?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 py-3 px-4 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}