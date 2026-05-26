import type { AppState } from '../types'
import { DIFFICULTIES } from '../utils/constants'
import logoSvg from '../assets/logo.svg'
import pauseIcon from '../assets/pause-icon.svg'
import playIcon from '../assets/play-icon.svg'
import volumeIcon from '../assets/volume.png'
import muteIcon from '../assets/mute.png'
import darkmodeIcon from '../assets/darkmode.png'
import lightmodeIcon from '../assets/lightmode.png'

export function renderHeader(state: AppState): string {
  const liveStats = state.gameData.gameState === 'playing' ? renderLiveStats(state) : ''
  const isPaused = state.gameData.isPaused

  return `
    <header class="topbar">
      <div class="brand">
        <img src="${logoSvg}" alt="MemFlip Logo" class="brand-logo">
      </div>
      <div class="live-stats" id="live-stats">${liveStats}</div>
      <div class="header-controls">
        ${state.gameData.gameState === 'playing' ? `
          <button class="icon-btn" id="btn-pause" title="${isPaused ? 'Resume' : 'Pause'}">
            <img src="${isPaused ? playIcon : pauseIcon}" alt="${isPaused ? 'Resume' : 'Pause'}" class="icon-svg">
          </button>
        ` : ''}
        <button class="icon-btn" id="btn-sound" title="Sound" data-active="${state.soundEnabled}">
          <img src="${state.soundEnabled ? volumeIcon : muteIcon}" alt="${state.soundEnabled ? 'Sound On' : 'Sound Off'}" class="icon-svg">
        </button>
        <button class="icon-btn" id="btn-dark" title="Dark Mode" data-active="${state.darkMode}">
          <img src="${state.darkMode ? darkmodeIcon : lightmodeIcon}" alt="${state.darkMode ? 'Dark Mode' : 'Light Mode'}" class="icon-svg">
        </button>
      </div>
    </header>
  `
}

function renderLiveStats(state: AppState): string {
  const { timeLeft, moves, score } = state.gameData
  const cfg = DIFFICULTIES[state.gameData.currentDifficulty]
  const { timeLimit } = cfg
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
