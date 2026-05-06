import type { AppState } from '../types'
import { DIFFICULTIES } from '../utils/constants'
import { renderCard } from './Card'

export function renderBoard(state: AppState): string {
  const cfg = DIFFICULTIES[state.gameData.currentDifficulty]
  const pausedClass = state.gameData.isPaused ? 'is-paused' : ''

  return `
    <div class="board-wrap">
      <div class="board ${pausedClass}" id="board" style="--cols:${cfg.cols}">
        ${state.gameData.cards.map(renderCard).join('')}
      </div>
    </div>
  `
}
