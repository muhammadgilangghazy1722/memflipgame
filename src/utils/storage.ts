import type { Difficulty } from '../types'

const BEST_SCORES_KEY = 'memGame_bestScores'
const SETTINGS_KEY = 'memGame_settings'

export function loadBestScores(): Partial<Record<Difficulty, number>> {
  try {
    const saved = localStorage.getItem(BEST_SCORES_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function saveBestScore(difficulty: Difficulty, score: number): void {
  try {
    const scores = loadBestScores()
    if (score > (scores[difficulty] ?? 0)) {
      scores[difficulty] = score
      localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(scores))
    }
  } catch {
    console.error('Failed to save best score')
  }
}

export function loadSettings(): { soundEnabled: boolean; darkMode: boolean } {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    const defaults = { soundEnabled: true, darkMode: false }
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  } catch {
    return { soundEnabled: true, darkMode: false }
  }
}

export function saveSettings(
  soundEnabled: boolean,
  darkMode: boolean
): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ soundEnabled, darkMode }))
  } catch {
    console.error('Failed to save settings')
  }
}
