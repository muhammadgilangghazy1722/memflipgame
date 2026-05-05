import type { AppState } from '../types'

export function renderHeader(state: AppState): string {
  const liveStats = state.gameData.gameState === 'playing' ? renderLiveStats(state) : ''

  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-icon">🃏</span>
        <span class="brand-name">MemFlip</span>
      </div>
      <div class="live-stats" id="live-stats">${liveStats}</div>
      <div class="header-controls">
        <button class="icon-btn" id="btn-sound" title="Sound" data-active="${state.soundEnabled}">
          ${state.soundEnabled ? '🔊' : '🔇'}
        </button>
        <button class="icon-btn" id="btn-dark" title="Dark Mode" data-active="${state.darkMode}">
          ${state.darkMode ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  `
}

function renderLiveStats(state: AppState): string {
  const { timeLeft, moves, score } = state.gameData
  const { timeLimit } = state.gameData.currentDifficulty
  const pct = (timeLeft / timeLimit) * 100
  const urgent = timeLeft <= 20

  return `
    <div class="stat-chip ${urgent ? 'urgent' : ''}">⏱ <strong>${timeLeft}</strong></div>
    <div class="timer-bar-wrap">
      <div class="timer-bar-fill" style="width:${pct}%;background:${urgent ? '#ef4444' : '#4ade80'}"></div>
    </div>
    <div class="stat-chip">↩ <strong>${moves}</strong></div>
    <div class="stat-chip chip-score">⭐ <strong>${score}</strong></div>
  `
}
