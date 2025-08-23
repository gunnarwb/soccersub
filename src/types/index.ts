export interface Player {
  id: string
  name: string
  number?: number
  isOnField: boolean
  position?: string
  fieldTimeStart?: number
  totalFieldTime: number
  positionTimeStart?: number
  totalPositionTime: number
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  date: string
  opponent?: string
  score?: string
  startTime?: number
  endTime?: number
  halfTimeStart?: number
  halfTimeEnd?: number
  duration: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Formation {
  id: string
  name: string
  playerCount: number
  positions: Position[]
}

export interface Position {
  id: string
  name: string
  x: number
  y: number
  role: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
}

export interface TimeLog {
  id: string
  playerId: string
  matchId: string
  startTime: number
  endTime?: number
  position?: string
  type: 'field' | 'position'
  createdAt: string
}

export type GameFormat = '7v7' | '9v9' | '11v11'