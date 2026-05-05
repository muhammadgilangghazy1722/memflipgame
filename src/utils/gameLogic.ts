import type { Card, Difficulty } from '../types'
import { DIFFICULTIES, EMOJIS } from './constants'

export function buildCards(difficulty: Difficulty): Card[] {
  const { pairs } = DIFFICULTIES[difficulty]
  const pool = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs)

  const doubled = [
    ...pool.map((emoji, idx) => ({ emoji, pairId: idx })),
    ...pool.map((emoji, idx) => ({ emoji, pairId: idx })),
  ].sort(() => Math.random() - 0.5)

  return doubled.map(({ emoji, pairId }, i) => ({
    id: i,
    emoji,
    pairId,
    flipped: false,
    matched: false,
  }))
}

export function calculateScore(
  baseScore: number,
  timeLeft: number,
  moves: number
): number {
  const timeBonus = Math.max(0, Math.floor(timeLeft / 5))
  const movesPenalty = moves > 20 ? moves - 20 : 0
  return Math.max(0, baseScore + timeBonus - movesPenalty)
}

export function calculateFinalScore(
  score: number,
  timeLeft: number,
  _moves: number,
  difficulty: Difficulty
): number {
  let finalScore = score
  finalScore += timeLeft * 2 // Reward remaining time
  
  // Difficulty multiplier
  const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2
  finalScore = Math.round(finalScore * multiplier)

  return finalScore
}
