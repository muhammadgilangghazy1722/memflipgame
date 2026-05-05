export function renderConfirmExit(): string {
  return `
    <div class="modal-bg" id="confirm-exit-bg">
      <div class="modal modal--confirm">
        <div class="modal-top">⚠️</div>
        <h2 class="modal-title">Keluar dari game?</h2>
        <p class="modal-sub">Progress kamu akan hilang</p>
        <div class="modal-buttons">
          <button class="ghost-btn" id="btn-continue">❌ Lanjut main</button>
          <button class="play-btn play-btn--sm" id="btn-confirm-exit">✅ Keluar</button>
        </div>
      </div>
    </div>
  `
}
