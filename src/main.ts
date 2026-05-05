import './style.css'

// ── Types ──────────────────────────────────────────────────────────────────
type Difficulty = 'easy' | 'medium' | 'hard'
type GameState = 'idle' | 'playing' | 'won'

interface Card {
  id: number
  emoji: string
  pairId: number
  flipped: boolean
  matched: boolean
}

interface DifficultyConfig {
  label: string
  icon: string
  cols: number
  rows: number
  pairs: number
  timeLimit: number
  color: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy:   { label: 'Easy',   icon: '', cols: 4, rows: 4, pairs: 8,  timeLimit: 120, color: '#22c55e' },
  medium: { label: 'Medium', icon: '', cols: 5, rows: 4, pairs: 10, timeLimit: 150, color: '#0793DE' },
  hard:   { label: 'Hard',   icon: '', cols: 6, rows: 6, pairs: 18, timeLimit: 210, color: '#ef4444' },
}

const EMOJIS = [
  '🐶','🐱','🦊','🐻','🐼','🦁','🐯','🐨','🐸','🦋',
  '🦄','🐙','🦑','🦈','🐬','🦅','🦚','🦜','🐢','🦎',
  '🐝','🐛','🦩','🐧','🦆','🦉','🐺','🦝','🦦','🦥',
  '🐗','🦌','🐑','🐐','🦓','🦏','🐘','🦒','🦘','🐊',
]

const FLIP_DELAY = 900
const MATCH_ANIM = 400

// ── State ──────────────────────────────────────────────────────────────────
let cards: Card[] = []
let flippedCards: number[] = []
let matchedPairs = 0
let moves = 0
let score = 0
let gameState: GameState = 'idle'
let currentDifficulty: Difficulty = 'easy'
let timerInterval: ReturnType<typeof setInterval> | null = null
let timeLeft = 0
let isChecking = false
let bestScores: Partial<Record<Difficulty, number>> = {}

const app = document.querySelector<HTMLDivElement>('#app')!

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  loadBestScores()
  renderApp()
}

function loadBestScores() {
  try {
    const saved = localStorage.getItem('memGame_v2')
    if (saved) bestScores = JSON.parse(saved)
  } catch {}
}

function saveBestScore(d: Difficulty, s: number) {
  if (s > (bestScores[d] ?? 0)) {
    bestScores[d] = s
    localStorage.setItem('memGame_v2', JSON.stringify(bestScores))
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderApp() {
  const cfg = DIFFICULTIES[currentDifficulty]
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand-icon">🃏</span>
          <span class="brand-name">MemFlip</span>
        </div>
        <div class="live-stats" id="live-stats"></div>
      </header>

      <nav class="level-nav">
        ${(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => {
          const dc = DIFFICULTIES[d]
          const best = bestScores[d]
          return `
            <button class="level-btn ${d === currentDifficulty ? 'active' : ''}"
                    data-diff="${d}"
                    style="--lc:${dc.color}">
              <span class="level-icon">${dc.icon}</span>
              <span class="level-label">${dc.label}</span>
              ${best !== undefined ? `<span class="level-best">${best}pt</span>` : ''}
            </button>
          `
        }).join('')}
      </nav>

      <main id="main-area">
        ${gameState === 'idle' ? renderHome(cfg) : renderBoard()}
      </main>
    </div>
  `
  attachListeners()
  if (gameState === 'playing') updateLiveStats()
}

function renderHome(cfg: DifficultyConfig) {
  const best = bestScores[currentDifficulty]
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
        ${best !== undefined ? `
          <div class="home-best">🏆 Best: <strong>${best} pts</strong></div>
        ` : ''}
        <button class="play-btn" id="btn-start">
          ▶ &nbsp;Play Now
        </button>
        <p class="home-hint">Flip two cards — find the matching pair!</p>
      </div>

      <div class="preview-grid" style="--cols:${cfg.cols}">
        ${Array.from({length: cfg.cols * cfg.rows}).map((_, i) => `
          <div class="preview-card" style="animation-delay:${i * 0.04}s"></div>
        `).join('')}
      </div>
    </div>
  `
}

function renderBoard() {
  const cfg = DIFFICULTIES[currentDifficulty]
  return `
    <div class="board-wrap">
      <div class="board" id="board" style="--cols:${cfg.cols}">
        ${cards.map(renderCard).join('')}
      </div>
    </div>
    ${gameState === 'won' ? renderWin() : ''}
  `
}

function renderCard(card: Card) {
  const cls = ['card', card.flipped ? 'is-flipped' : '', card.matched ? 'is-matched' : ''].filter(Boolean).join(' ')
  return `
    <button class="${cls}" data-id="${card.id}" aria-label="Memory card">
      <span class="card-face card-face--front">
        <span class="card-dot"></span>
      </span>
      <span class="card-face card-face--back">${card.emoji}</span>
    </button>
  `
}

function renderWin() {
  const best = bestScores[currentDifficulty] ?? 0
  const isRecord = score >= best
  return `
    <div class="modal-bg">
      <div class="modal">
        <div class="modal-top">${isRecord ? '🏆' : '🎉'}</div>
        <h2 class="modal-title">${isRecord ? 'New Record!' : 'You Win!'}</h2>
        <div class="modal-scores">
          <div class="score-block"><div class="score-val">${score}</div><div class="score-lbl">Score</div></div>
          <div class="score-block"><div class="score-val">${moves}</div><div class="score-lbl">Moves</div></div>
          <div class="score-block"><div class="score-val">${timeLeft}s</div><div class="score-lbl">Left</div></div>
        </div>
        <button class="play-btn play-btn--sm" id="btn-play-again">▶ Play Again</button>
        <button class="ghost-btn" id="btn-menu">Main Menu</button>
      </div>
    </div>
  `
}

function renderTimeout() {
  const area = document.getElementById('main-area')
  if (!area) return
  const el = document.createElement('div')
  el.className = 'modal-bg'
  el.innerHTML = `
    <div class="modal modal--timeout">
      <div class="modal-top">⏰</div>
      <h2 class="modal-title">Time's Up!</h2>
      <p class="modal-sub">You matched <strong>${matchedPairs}</strong> of <strong>${DIFFICULTIES[currentDifficulty].pairs}</strong> pairs</p>
      <button class="play-btn play-btn--sm" id="btn-retry">▶ Try Again</button>
      <button class="ghost-btn" id="btn-menu2">Main Menu</button>
    </div>
  `
  area.appendChild(el)
  el.querySelector('#btn-retry')?.addEventListener('click', startGame)
  el.querySelector('#btn-menu2')?.addEventListener('click', goMenu)
}

function updateLiveStats() {
  const el = document.getElementById('live-stats')
  if (!el) return
  const pct = (timeLeft / DIFFICULTIES[currentDifficulty].timeLimit) * 100
  const urgent = timeLeft <= 20
  el.innerHTML = `
    <div class="stat-chip ${urgent ? 'urgent' : ''}">⏱ <strong>${timeLeft}</strong></div>
    <div class="timer-bar-wrap">
      <div class="timer-bar-fill" style="width:${pct}%;background:${urgent ? '#ef4444' : '#4ade80'}"></div>
    </div>
    <div class="stat-chip">↩ <strong>${moves}</strong></div>
    <div class="stat-chip chip-score">⭐ <strong>${score}</strong></div>
  `
}

// ── Game Logic ─────────────────────────────────────────────────────────────
function buildCards(d: Difficulty): Card[] {
  const { pairs } = DIFFICULTIES[d]
  const pool = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs)
  // Assign pairId by index (not indexOf) to avoid collision when emoji appears twice
  const doubled = [
    ...pool.map((emoji, idx) => ({ emoji, pairId: idx })),
    ...pool.map((emoji, idx) => ({ emoji, pairId: idx })),
  ].sort(() => Math.random() - 0.5)
  return doubled.map(({ emoji, pairId }, i) => ({
    id: i, emoji, pairId,
    flipped: false, matched: false,
  }))
}

function startGame() {
  cards = buildCards(currentDifficulty)
  flippedCards = []; matchedPairs = 0; moves = 0; score = 0
  isChecking = false
  timeLeft = DIFFICULTIES[currentDifficulty].timeLimit
  gameState = 'playing'
  renderApp()
  startTimer()
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timeLeft--
    updateLiveStats()
    if (timeLeft <= 0) {
      clearInterval(timerInterval!)
      gameState = 'idle'
      renderTimeout()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
}

function flipCard(id: number) {
  // Guard: already checking, already have 2 flipped, or card already in flipped list
  if (isChecking) return
  if (flippedCards.length >= 2) return
  if (flippedCards.includes(id)) return
  const card = cards[id]
  if (!card || card.matched || card.flipped) return
  card.flipped = true
  flippedCards.push(id)
  const el = document.querySelector(`.card[data-id="${id}"]`)
  el?.classList.add('is-flipped')
  el?.classList.add('card--tap')
  setTimeout(() => el?.classList.remove('card--tap'), 200)
  if (flippedCards.length === 2) { moves++; updateLiveStats(); checkMatch() }
}

function resetTurn() {
  flippedCards = []
  isChecking = false
}

function checkMatch() {
  isChecking = true
  const [a, b] = flippedCards
  const ca = cards[a], cb = cards[b]

  setTimeout(() => {
    if (ca.pairId === cb.pairId) {
      // ✅ Match!
      ca.matched = cb.matched = true
      matchedPairs++
      score += Math.max(10, Math.floor(timeLeft / 5))
      document.querySelector(`.card[data-id="${a}"]`)?.classList.add('is-matched')
      document.querySelector(`.card[data-id="${b}"]`)?.classList.add('is-matched')
      updateLiveStats()
      resetTurn()
      if (matchedPairs === DIFFICULTIES[currentDifficulty].pairs) {
        setTimeout(handleWin, MATCH_ANIM)
      }
    } else {
      // ❌ No match — flip back
      ca.flipped = cb.flipped = false
      document.querySelector(`.card[data-id="${a}"]`)?.classList.remove('is-flipped')
      document.querySelector(`.card[data-id="${b}"]`)?.classList.remove('is-flipped')
      score = Math.max(0, score - 1)
      updateLiveStats()
      resetTurn()
    }
  }, FLIP_DELAY)
}

function handleWin() {
  stopTimer()
  score += timeLeft * 2
  gameState = 'won'
  saveBestScore(currentDifficulty, score)
  renderApp()
}

function goMenu() {
  stopTimer(); gameState = 'idle'; renderApp()
}

function attachListeners() {
  document.querySelectorAll<HTMLButtonElement>('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDifficulty = btn.dataset.diff as Difficulty
      stopTimer(); gameState = 'idle'; renderApp()
    })
  })
  document.getElementById('btn-start')?.addEventListener('click', startGame)
  document.getElementById('btn-play-again')?.addEventListener('click', startGame)
  document.getElementById('btn-menu')?.addEventListener('click', goMenu)
  document.getElementById('board')?.addEventListener('click', e => {
    const el = (e.target as HTMLElement).closest('.card') as HTMLElement
    if (el) flipCard(parseInt(el.dataset.id!))
  })
}

init()
