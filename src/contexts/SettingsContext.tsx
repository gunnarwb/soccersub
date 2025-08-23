import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GameFormat } from '../types'

interface AppSettings {
  gameFormat: GameFormat
  selectedFormationId: string
  matchDuration: number
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  gameFormat: '11v11',
  selectedFormationId: '1-4-4-2-11v11',
  matchDuration: 90
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('soccersub-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('soccersub-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }, [settings])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      
      // Auto-update formation when game format changes
      if (newSettings.gameFormat && newSettings.gameFormat !== prev.gameFormat) {
        const formatFormationMap: Record<GameFormat, string> = {
          '7v7': '1-2-2-1-7v7',
          '9v9': '1-3-3-2-9v9',
          '11v11': '1-4-4-2-11v11'
        }
        updated.selectedFormationId = formatFormationMap[newSettings.gameFormat]
      }
      
      return updated
    })
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}