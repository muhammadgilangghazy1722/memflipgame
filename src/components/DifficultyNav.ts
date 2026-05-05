import type { Difficulty, AppState } from '../types'
import { DIFFICULTIES } from '../utils/constants'

export function renderDifficultyNav(state: AppState): string {
  return `
    <nav class="level-nav">
      ${(Object.keys(DIFFICULTIES) as Difficulty[])
        .map(d => {
          const dc = DIFFICULTIES[d]
          const best = state.bestScores[d]
          const isActive = d === state.gameData.currentDifficulty
          return `
            <button class="level-btn ${isActive ? 'active' : ''}"
                    data-diff="${d}"
                    style="--lc:${dc.color}">
              <span class="level-icon">${dc.icon}</span>
              <span class="level-label">${dc.label}</span>
              ${best !== undefined ? `<span class="level-best">${best}pt</span>` : ''}
            </button>
          `
        })
        .join('')}
    </nav>
  `
}
