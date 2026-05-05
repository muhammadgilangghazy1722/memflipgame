import type { AppState } from '../types'
import { DIFFICULTIES } from '../utils/constants'

export function renderMenu(state: AppState): string {
  const cfg = DIFFICULTIES[state.gameData.currentDifficulty]
  const best = state.bestScores[state.gameData.currentDifficulty]

  return `
    <div class="home">
      <div class="home-card">
        <div class="home-badges">
          <span class="badge badge--level" style="--lc:${cfg.color}">
            ${cfg.icon} ${cfg.label}
          </span>
          <span class="badge"> ${cfg.cols}×${cfg.rows}</span>
          <span class="badge">⏱ ${cfg.timeLimit}s</span>
        </div>
        <h1 class="home-title">Match all<br><em>${cfg.pairs} pairs!</em></h1>
        ${best !== undefined ? `<div class="home-best">🏆 Best: <strong>${best} pts</strong></div>` : ''}
        <button class="play-btn" id="btn-start">
          ▶ &nbsp;Play Now
        </button>
        <p class="home-hint">Flip two cards — find the matching pair!</p>
      </div>

      <div class="preview-grid" style="--cols:${cfg.cols}">
        ${Array.from({ length: cfg.cols * cfg.rows })
          .map((_, i) => `<div class="preview-card" style="animation-delay:${i * 0.04}s"></div>`)
          .join('')}
      </div>
    </div>
  `
}
