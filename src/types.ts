export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameState = 'idle' | 'playing' | 'won' | 'timeout'
export type ScreenView = 'home' | 'select-level' | 'detail-level' | 'game' | 'confirm-exit'

export interface Card {
  id: number
  emoji: string
  pairId: number
  flipped: boolean
  matched: boolean
}

export interface DifficultyConfig {
  label: string
  icon: string
  cols: number
  rows: number
  pairs: number
  timeLimit: number
  color: string
}

export interface GameData {
  cards: Card[]
  flippedCards: number[]
  matchedPairs: number
  moves: number
  score: number
  timeLeft: number
  gameState: GameState
  currentDifficulty: Difficulty
  isChecking: boolean
}

export interface AppState {
  currentView: ScreenView
  gameData: GameData
  bestScores: Partial<Record<Difficulty, number>>
  soundEnabled: boolean
  darkMode: boolean
}
