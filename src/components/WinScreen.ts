import type { AppState } from '../types'

export function renderWinScreen(state: AppState): string {
  const best = state.bestScores[state.gameData.currentDifficulty] ?? 0
  const isRecord = state.gameData.score >= best
  const { score, moves, timeLeft } = state.gameData

  return `
    <div class="modal-bg">
      <div class="modal modal--win">
        <div class="modal-top">${isRecord ? '🏆' : '🎉'}</div>
        <h2 class="modal-title">${isRecord ? 'New Record!' : 'You Win!'}</h2>
        <div class="modal-scores">
          <div class="score-block">
            <div class="score-val">${score}</div>
            <div class="score-lbl">Score</div>
          </div>
          <div class="score-block">
            <div class="score-val">${moves}</div>
            <div class="score-lbl">Moves</div>
          </div>
          <div class="score-block">
            <div class="score-val">${timeLeft}s</div>
            <div class="score-lbl">Left</div>
          </div>
        </div>
        <div class="modal-buttons">
          <button class="play-btn play-btn--sm" id="btn-play-again">▶ Play Again</button>
          <button class="ghost-btn" id="btn-menu">Main Menu</button>
        </div>
      </div>
    </div>
  `
}

export function renderTimeoutScreen(state: AppState): string {
  const { matchedPairs } = state.gameData
  const { pairs } = state.gameData.currentDifficulty

  return `
    <div class="modal-bg">
      <div class="modal modal--timeout">
        <div class="modal-top">⏰</div>
        <h2 class="modal-title">Time's Up!</h2>
        <p class="modal-sub">You matched <strong>${matchedPairs}</strong> of <strong>${pairs}</strong> pairs</p>
        <div class="modal-buttons">
          <button class="play-btn play-btn--sm" id="btn-retry">▶ Try Again</button>
          <button class="ghost-btn" id="btn-menu-timeout">Main Menu</button>
        </div>
      </div>
    </div>
  `
}
