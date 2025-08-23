import { Formation, GameFormat } from '../types'

export const formations: Record<GameFormat, Formation[]> = {
  '7v7': [
    {
      id: '1-2-2-1-7v7',
      name: '1-2-2-1',
      playerCount: 7,
      positions: [
        { id: 'gk', name: 'GK', x: 50, y: 5, role: 'goalkeeper' },
        { id: 'lb', name: 'LB', x: 25, y: 25, role: 'defender' },
        { id: 'rb', name: 'RB', x: 75, y: 25, role: 'defender' },
        { id: 'lm', name: 'LM', x: 25, y: 50, role: 'midfielder' },
        { id: 'rm', name: 'RM', x: 75, y: 50, role: 'midfielder' },
        { id: 'f', name: 'F', x: 50, y: 80, role: 'forward' }
      ]
    },
    {
      id: '1-3-2-7v7',
      name: '1-3-2',
      playerCount: 7,
      positions: [
        { id: 'gk', name: 'GK', x: 50, y: 5, role: 'goalkeeper' },
        { id: 'lb', name: 'LB', x: 20, y: 25, role: 'defender' },
        { id: 'cb', name: 'CB', x: 50, y: 20, role: 'defender' },
        { id: 'rb', name: 'RB', x: 80, y: 25, role: 'defender' },
        { id: 'cm', name: 'CM', x: 50, y: 50, role: 'midfielder' },
        { id: 'lf', name: 'LF', x: 35, y: 80, role: 'forward' },
        { id: 'rf', name: 'RF', x: 65, y: 80, role: 'forward' }
      ]
    }
  ],
  '9v9': [
    {
      id: '1-3-3-2-9v9',
      name: '1-3-3-2',
      playerCount: 9,
      positions: [
        { id: 'gk', name: 'GK', x: 50, y: 5, role: 'goalkeeper' },
        { id: 'lb', name: 'LB', x: 20, y: 25, role: 'defender' },
        { id: 'cb', name: 'CB', x: 50, y: 20, role: 'defender' },
        { id: 'rb', name: 'RB', x: 80, y: 25, role: 'defender' },
        { id: 'lm', name: 'LM', x: 25, y: 50, role: 'midfielder' },
        { id: 'cm', name: 'CM', x: 50, y: 50, role: 'midfielder' },
        { id: 'rm', name: 'RM', x: 75, y: 50, role: 'midfielder' },
        { id: 'lf', name: 'LF', x: 35, y: 80, role: 'forward' },
        { id: 'rf', name: 'RF', x: 65, y: 80, role: 'forward' }
      ]
    },
    {
      id: '1-4-3-1-9v9',
      name: '1-4-3-1',
      playerCount: 9,
      positions: [
        { id: 'gk', name: 'GK', x: 50, y: 5, role: 'goalkeeper' },
        { id: 'lb', name: 'LB', x: 15, y: 25, role: 'defender' },
        { id: 'lcb', name: 'LCB', x: 40, y: 20, role: 'defender' },
        { id: 'rcb', name: 'RCB', x: 60, y: 20, role: 'defender' },
        { id: 'rb', name: 'RB', x: 85, y: 25, role: 'defender' },
        { id: 'lm', name: 'LM', x: 25, y: 50, role: 'midfielder' },
        { id: 'cm', name: 'CM', x: 50, y: 50, role: 'midfielder' },
        { id: 'rm', name: 'RM', x: 75, y: 50, role: 'midfielder' },
        { id: 'f', name: 'F', x: 50, y: 80, role: 'forward' }
      ]
    }
  ],
  '11v11': [
    {
      id: '1-4-4-2-11v11',
      name: '1-4-4-2',
      playerCount: 11,
      positions: [
        { id: 'gk', name: 'GK', x: 50, y: 5, role: 'goalkeeper' },
        { id: 'lb', name: 'LB', x: 15, y: 25, role: 'defender' },
        { id: 'lcb', name: 'LCB', x: 40, y: 20, role: 'defender' },
        { id: 'rcb', name: 'RCB', x: 60, y: 20, role: 'defender' },
        { id: 'rb', name: 'RB', x: 85, y: 25, role: 'defender' },
        { id: 'lm', name: 'LM', x: 15, y: 50, role: 'midfielder' },
        { id: 'lcm', name: 'LCM', x: 40, y: 50, role: 'midfielder' },
        { id: 'rcm', name: 'RCM', x: 60, y: 50, role: 'midfielder' },
        { id: 'rm', name: 'RM', x: 85, y: 50, role: 'midfielder' },
        { id: 'lf', name: 'LF', x: 35, y: 80, role: 'forward' },
        { id: 'rf', name: 'RF', x: 65, y: 80, role: 'forward' }
      ]
    },
    {
      id: '1-4-3-3-11v11',
      name: '1-4-3-3',
      playerCount: 11,
      positions: [
        { id: 'gk', name: 'GK', x: 50, y: 5, role: 'goalkeeper' },
        { id: 'lb', name: 'LB', x: 15, y: 25, role: 'defender' },
        { id: 'lcb', name: 'LCB', x: 40, y: 20, role: 'defender' },
        { id: 'rcb', name: 'RCB', x: 60, y: 20, role: 'defender' },
        { id: 'rb', name: 'RB', x: 85, y: 25, role: 'defender' },
        { id: 'lcm', name: 'LCM', x: 35, y: 45, role: 'midfielder' },
        { id: 'cm', name: 'CM', x: 50, y: 45, role: 'midfielder' },
        { id: 'rcm', name: 'RCM', x: 65, y: 45, role: 'midfielder' },
        { id: 'lw', name: 'LW', x: 15, y: 75, role: 'forward' },
        { id: 'st', name: 'ST', x: 50, y: 85, role: 'forward' },
        { id: 'rw', name: 'RW', x: 85, y: 75, role: 'forward' }
      ]
    }
  ]
}

export const getFormationsByGameFormat = (format: GameFormat): Formation[] => {
  return formations[format] || []
}