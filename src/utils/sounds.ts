let soundEnabled = true

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled
}

function playSound(type: 'flip' | 'match' | 'wrong' | 'win'): void {
  if (!soundEnabled) return

  // Create audio context and play simple tones
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  switch (type) {
    case 'flip':
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime)
      oscillator.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.1)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
      break

    case 'match':
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      break

    case 'wrong':
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
      oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      break

    case 'win':
      const notes = [800, 1000, 1200]
      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.05, audioContext.currentTime + i * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.15)
        osc.start(audioContext.currentTime + i * 0.1)
        osc.stop(audioContext.currentTime + i * 0.1 + 0.15)
      })
      break
  }
}

export { playSound }
