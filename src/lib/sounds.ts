import { useAppStore } from '../store/useAppStore'

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContext) return null
  return new AudioContext()
}

const audioCtx = getAudioContext()

function playTone(freq: number, type: OscillatorType, duration: number, volumeKey: 'correct'|'wrong'|'flip'|'complete', customVol?: number) {
  if (!audioCtx) return
  
  const { settings } = useAppStore.getState()
  if (settings.muted) return

  const volume = customVol || settings.volumes[volumeKey] || 0.1

  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000)
    osc.start()
    osc.stop(audioCtx.currentTime + duration / 1000)
  } catch(e) {}
}

export const sounds = {
  correct: () => {
    playTone(523, 'sine', 80, 'correct')
    setTimeout(() => playTone(659, 'sine', 80, 'correct'), 90)
    setTimeout(() => playTone(784, 'sine', 120, 'correct'), 180)
  },
  wrong: () => playTone(200, 'sawtooth', 150, 'wrong'),
  flip: () => playTone(440, 'sine', 30, 'flip'),
  flag: () => playTone(880, 'triangle', 60, 'flip'),
  complete: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 120, 'complete'), i * 110))
  },
  select: () => playTone(660, 'sine', 40, 'flip', 0.05),
  match: () => {
    playTone(784, 'sine', 60, 'correct')
    setTimeout(() => playTone(1047, 'sine', 100, 'correct'), 70)
  }
}
