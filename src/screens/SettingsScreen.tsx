import { supabase } from '../lib/supabase'
import { GameFormat, Match, Player } from '../types'
import MatchControls from '../components/MatchControls'
import { Settings, Users, Clock, LogOut } from 'lucide-react'

interface SettingsScreenProps {
  currentMatch: Match | null
  setCurrentMatch: React.Dispatch<React.SetStateAction<Match | null>>
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  gameFormat: GameFormat
  setGameFormat: React.Dispatch<React.SetStateAction<GameFormat>>
}

export default function SettingsScreen({ 
  currentMatch, 
  setCurrentMatch, 
  players, 
  setPlayers,
  gameFormat,
  setGameFormat
}: SettingsScreenProps) {

  const gameFormats = [
    { value: '7v7' as GameFormat, label: '7v7 (Youth)', description: 'Smaller field, 7 players each side' },
    { value: '9v9' as GameFormat, label: '9v9 (Youth)', description: 'Medium field, 9 players each side' },
    { value: '11v11' as GameFormat, label: '11v11 (Full)', description: 'Full field, 11 players each side' },
  ]

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
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
                  gameFormat === format.value 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="gameFormat"
                  value={format.value}
                  checked={gameFormat === format.value}
                  onChange={(e) => setGameFormat(e.target.value as GameFormat)}
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
                <div className="text-sm text-gray-600">On Bench</div>
              </div>
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
              <span className="text-gray-900">{gameFormat}</span>
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