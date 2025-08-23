import { Users, MapPin, Settings } from 'lucide-react'

export type TabType = 'players' | 'field' | 'settings'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'players' as TabType, label: 'Players', icon: Users },
    { id: 'field' as TabType, label: 'Field', icon: MapPin },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                isActive 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-green-600' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-green-600' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}