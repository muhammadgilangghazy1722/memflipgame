import type { Card } from '../types'

export function renderCard(card: Card): string {
  const cls = [
    'card',
    card.flipped ? 'is-flipped' : '',
    card.matched ? 'is-matched' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `
    <button class="${cls}" data-id="${card.id}" aria-label="Memory card">
      <span class="card-face card-face--front">
        <span class="card-dot">⭐</span>
      </span>
      <span class="card-face card-face--back">${card.emoji}</span>
    </button>
  `
}
