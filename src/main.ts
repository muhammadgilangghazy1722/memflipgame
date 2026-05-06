import './style.css'
import type { AppState, Difficulty } from './types'
import { renderHeader } from './components/Header'
import { renderDifficultyNav } from './components/DifficultyNav'
import { renderBoard } from './components/Board'
import { renderWinScreen, renderTimeoutScreen } from './components/WinScreen'
import { renderConfirmExit } from './components/ConfirmExit'
import { renderFooter } from './components/Footer'
import {
  DIFFICULTIES,
  FLIP_DELAY,
  MATCH_ANIM,
} from './utils/constants'
import { buildCards, calculateFinalScore } from './utils/gameLogic'
import { loadBestScores, saveBestScore, loadSettings, saveSettings } from './utils/storage'
import { playSound, setSoundEnabled } from './utils/sounds'

// ── Global State ───────────────────────────────────────────────────────────
let state: AppState = {
  currentView: 'home',
  gameData: {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    score: 0,
    timeLeft: 0,
    gameState: 'idle',
    currentDifficulty: 'easy',
    isChecking: false,
    isPaused: false,
    isPauseExitConfirm: false,
  },
  bestScores: {},
  soundEnabled: true,
  darkMode: false,
}

let timerInterval: ReturnType<typeof setInterval> | null = null
const app = document.querySelector<HTMLDivElement>('#app')!

// ── Initialization ─────────────────────────────────────────────────────────
function init() {
  const settings = loadSettings()
  state.bestScores = loadBestScores()
  state.soundEnabled = settings.soundEnabled
  state.darkMode = settings.darkMode

  setSoundEnabled(state.soundEnabled)
  applyDarkMode(state.darkMode)
  render()
  attachGlobalListeners()
}

function applyDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark-mode')
  } else {
    document.documentElement.classList.remove('dark-mode')
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  app.innerHTML = `
    ${renderHeader(state)}
    <div class="shell">
      ${state.currentView === 'detail-level' ? renderDifficultyNav(state) : ''}
      <main id="main-area">
        ${renderMainContent()}
      </main>
    </div>
    ${renderFooter()}
  `
  attachEventListeners()
}

function renderMainContent(): string {
  // Tampil halaman home
  if (state.currentView === 'home') {
    return renderHome()
  }

  // Tampil halaman detail level (dengan Play Now)
  if (state.currentView === 'detail-level' && state.gameData.gameState === 'idle') {
    return renderDifficultyDetail()
  }

  // Tampil board game
  let content = renderBoard(state)

  // Pause overlay
  if (state.gameData.isPaused) {
    if (state.gameData.isPauseExitConfirm) {
      // Show exit confirmation modal
      content += `
        <div class="pause-overlay">
          <div class="pause-modal">
            <div class="pause-title">Exit Game?</div>
            <p class="pause-subtitle">Are you sure you want to exit?</p>
            <div class="modal-buttons">
              <button class="play-btn" id="btn-confirm-pause-exit">Yes, Exit</button>
              <button class="ghost-btn" id="btn-cancel-pause-exit">No, Continue</button>
            </div>
          </div>
        </div>
      `
    } else {
      // Show pause modal
      content += `
        <div class="pause-overlay">
          <div class="pause-modal">
            <div class="pause-title">⏸ PAUSED</div>
            <div class="modal-buttons">
              <button class="play-btn" id="btn-resume-pause">Resume Game</button>
              <button class="ghost-btn" id="btn-pause-exit">Exit</button>
            </div>
          </div>
        </div>
      `
    }
  }

  if (state.gameData.gameState === 'won') {
    content += renderWinScreen(state)
  } else if (state.gameData.gameState === 'timeout') {
    content += renderTimeoutScreen(state)
  }

  if (state.currentView === 'confirm-exit') {
    content += renderConfirmExit()
  }

  return content
}

function renderHome(): string {
  return `
    <div class="home home--center">
      <div class="home-card">
        <div class="home-header">
          <span class="home-icon">🎮</span>
          <h1 class="home-title-main">MemFlip</h1>
        </div>
        <p class="home-subtitle">Test your memory skills!<br>Match all pairs to win</p>
        <button class="play-btn" id="btn-play">
          ▶ &nbsp;Play
        </button>
      </div>
    </div>
  `
}

function renderDifficultyDetail(): string {
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
        <p class="home-hint">Flip two cards & find the matching pair!</p>
      </div>

      <div class="preview-grid" style="--cols:${cfg.cols}">
        ${Array.from({ length: cfg.cols * cfg.rows })
          .map((_, i) => `<div class="preview-card" style="animation-delay:${i * 0.04}s"></div>`)
          .join('')}
      </div>
    </div>
  ` 
}

// ── Game Logic ─────────────────────────────────────────────────────────────
function startGame() {
  const cfg = DIFFICULTIES[state.gameData.currentDifficulty]
  state.gameData.cards = buildCards(state.gameData.currentDifficulty)
  state.gameData.flippedCards = []
  state.gameData.matchedPairs = 0
  state.gameData.moves = 0
  state.gameData.score = 0
  state.gameData.isChecking = false
  state.gameData.timeLeft = cfg.timeLimit
  state.gameData.gameState = 'playing'
  state.currentView = 'game'

  render()
  playSound('flip')
  
  // Langsung mulai timer tanpa preview
  startTimer()
}



function updateLiveStats() {
  const el = document.getElementById('live-stats')
  if (!el) return

  const cfg = DIFFICULTIES[state.gameData.currentDifficulty]
  const pct = (state.gameData.timeLeft / cfg.timeLimit) * 100
  const urgent = state.gameData.timeLeft <= 20

  el.innerHTML = `
    <div class="stat-chip ${urgent ? 'urgent' : ''}">⏱ <strong>${state.gameData.timeLeft}</strong></div>
    <div class="timer-bar-wrap">
      <div class="timer-bar-fill" style="width:${pct}%;background:${urgent ? '#ef4444' : '#4ade80'}"></div>
    </div>
    <div class="stat-chip">↩ <strong>${state.gameData.moves}</strong></div>
    <div class="stat-chip chip-score">⭐ <strong>${state.gameData.score}</strong></div>
  `
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)

  timerInterval = setInterval(() => {
    if (!state.gameData.isPaused) {
      state.gameData.timeLeft--
      updateLiveStats()

      if (state.gameData.timeLeft <= 0) {
        clearInterval(timerInterval!)
        handleTimeout()
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
}

function pauseGame() {
  if (state.gameData.gameState !== 'playing') return
  state.gameData.isPaused = true
  render()
}

function resumeGame() {
  if (state.gameData.gameState !== 'playing') return
  state.gameData.isPaused = false
  state.gameData.isPauseExitConfirm = false
  render()
}

function showPauseExitConfirm() {
  state.gameData.isPauseExitConfirm = true
  render()
}

function cancelPauseExit() {
  state.gameData.isPaused = false
  state.gameData.isPauseExitConfirm = false
  render()
}

function confirmPauseExit() {
  stopTimer()
  state.gameData.gameState = 'idle'
  state.gameData.isPaused = false
  state.gameData.isPauseExitConfirm = false
  state.currentView = 'detail-level'
  render()
}

function handleTimeout() {
  stopTimer()
  state.gameData.gameState = 'timeout'
  render()
}

function flipCard(id: number) {
  if (state.gameData.isChecking) return
  if (state.gameData.flippedCards.length >= 2) return
  if (state.gameData.flippedCards.includes(id)) return

  const card = state.gameData.cards[id]
  if (!card || card.matched || card.flipped) return

  card.flipped = true
  state.gameData.flippedCards.push(id)
  playSound('flip')

  const el = document.querySelector(`.card[data-id="${id}"]`)
  el?.classList.add('is-flipped')
  el?.classList.add('card--tap')

  setTimeout(() => el?.classList.remove('card--tap'), 200)

  if (state.gameData.flippedCards.length === 2) {
    state.gameData.moves++
    updateLiveStats()
    checkMatch()
  }
}

function checkMatch() {
  state.gameData.isChecking = true
  const [a, b] = state.gameData.flippedCards
  const cardA = state.gameData.cards[a]
  const cardB = state.gameData.cards[b]

  setTimeout(() => {
    if (cardA.pairId === cardB.pairId) {
      // ✅ Match!
      cardA.matched = cardB.matched = true
      state.gameData.matchedPairs++
      state.gameData.score += Math.max(10, Math.floor(state.gameData.timeLeft / 5))
      playSound('match')

      document.querySelector(`.card[data-id="${a}"]`)?.classList.add('is-matched')
      document.querySelector(`.card[data-id="${b}"]`)?.classList.add('is-matched')

      updateLiveStats()
      state.gameData.flippedCards = []
      state.gameData.isChecking = false

      if (state.gameData.matchedPairs === DIFFICULTIES[state.gameData.currentDifficulty].pairs) {
        setTimeout(handleWin, MATCH_ANIM)
      }
    } else {
      // ❌ No match
      cardA.flipped = cardB.flipped = false
      playSound('wrong')

      document.querySelector(`.card[data-id="${a}"]`)?.classList.remove('is-flipped')
      document.querySelector(`.card[data-id="${b}"]`)?.classList.remove('is-flipped')

      state.gameData.score = Math.max(0, state.gameData.score - 1)
      updateLiveStats()
      state.gameData.flippedCards = []
      state.gameData.isChecking = false
    }
  }, FLIP_DELAY)
}

function handleWin() {
  stopTimer()
  const finalScore = calculateFinalScore(
    state.gameData.score,
    state.gameData.timeLeft,
    state.gameData.moves,
    state.gameData.currentDifficulty
  )
  state.gameData.score = finalScore
  state.gameData.gameState = 'won'
  saveBestScore(state.gameData.currentDifficulty, finalScore)
  state.bestScores = loadBestScores()
  playSound('win')
  render()
}

function goMenu() {
  stopTimer()
  state.gameData.gameState = 'idle'
  state.currentView = 'home'
  render()
}

function showConfirmExit() {
  state.currentView = 'confirm-exit'
  render()
}

function cancelExit() {
  state.currentView = 'game'
  render()
}

// ── Event Listeners ────────────────────────────────────────────────────────
function attachGlobalListeners() {
  // Difficulty buttons - selalu bisa diklik untuk switch level (saat idle atau playing)
  document.addEventListener('click', (e: Event) => {
    const btn = (e.target as HTMLElement).closest('.level-btn')
    if (btn) {
      const diff = btn.getAttribute('data-diff') as Difficulty
      changeDifficulty(diff)
    }
  })

  // Back to menu with confirmation
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && state.gameData.gameState === 'playing') {
      showConfirmExit()
    }
  })
}

function attachEventListeners() {
  // Play button (home → detail-level)
  document.getElementById('btn-play')?.addEventListener('click', () => {
    state.currentView = 'detail-level'
    render()
  })

  // Start game
  document.getElementById('btn-start')?.addEventListener('click', startGame)

  // Play again
  document.getElementById('btn-play-again')?.addEventListener('click', () => {
    state.currentView = 'game'
    startGame()
  })

  // Menu
  document.getElementById('btn-menu')?.addEventListener('click', goMenu)
  document.getElementById('btn-menu-timeout')?.addEventListener('click', goMenu)

  // Retry after timeout
  document.getElementById('btn-retry')?.addEventListener('click', startGame)

  // Board click
  document.getElementById('board')?.addEventListener('click', (e: Event) => {
    const card = (e.target as HTMLElement).closest('.card') as HTMLElement
    if (card) flipCard(parseInt(card.dataset.id!))
  })

  // Confirm exit
  document.getElementById('btn-continue')?.addEventListener('click', cancelExit)
  document.getElementById('btn-confirm-exit')?.addEventListener('click', goMenu)
  document.getElementById('confirm-exit-bg')?.addEventListener('click', (e: Event) => {
    if (e.target === document.getElementById('confirm-exit-bg')) cancelExit()
  })

  // Sound toggle
  document.getElementById('btn-sound')?.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled
    setSoundEnabled(state.soundEnabled)
    saveSettings(state.soundEnabled, state.darkMode)
    render()
  })

  // Dark mode toggle
  document.getElementById('btn-dark')?.addEventListener('click', () => {
    state.darkMode = !state.darkMode
    saveSettings(state.soundEnabled, state.darkMode)
    applyDarkMode(state.darkMode)
    render()
  })

  // Pause toggle
  document.getElementById('btn-pause')?.addEventListener('click', () => {
    if (state.gameData.isPaused) {
      resumeGame()
    } else {
      pauseGame()
    }
  })

  // Resume from pause modal
  document.getElementById('btn-resume-pause')?.addEventListener('click', () => {
    resumeGame()
  })

  // Exit from pause modal
  document.getElementById('btn-pause-exit')?.addEventListener('click', () => {
    showPauseExitConfirm()
  })

  // Pause exit confirmation
  document.getElementById('btn-confirm-pause-exit')?.addEventListener('click', () => {
    confirmPauseExit()
  })

  document.getElementById('btn-cancel-pause-exit')?.addEventListener('click', () => {
    cancelPauseExit()
  })
}

function changeDifficulty(diff: Difficulty) {
  // Stop timer jika sedang bermain
  stopTimer()
  
  state.gameData.currentDifficulty = diff
  state.gameData.gameState = 'idle'
  state.currentView = 'detail-level'
  render()
}

init()
