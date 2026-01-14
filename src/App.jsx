import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const presetMinutes = [5, 10, 15]

const soundOptions = [
  { value: 'none', label: 'Nessun suono' },
  { value: 'rain', label: 'Pioggia' },
  { value: 'forest', label: 'Foresta' },
  { value: 'bell', label: 'Campana tibetana' },
]

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function App() {
  const [minutesInput, setMinutesInput] = useState('10')
  const [initialSeconds, setInitialSeconds] = useState(600)
  const [remainingSeconds, setRemainingSeconds] = useState(600)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedSound, setSelectedSound] = useState('none')

  const audioRefs = useRef(null)
  const alarmRef = useRef(null)
  const prevRemainingRef = useRef(remainingSeconds)

  if (!audioRefs.current) {
    const createAudio = (sources, { loop = true, volume = 0.35 } = {}) => {
      let index = 0
      const audio = new Audio(sources[index])
      audio.loop = loop
      audio.volume = volume

      const tryNext = () => {
        if (index >= sources.length - 1) return
        index += 1
        audio.src = sources[index]
        audio.load()
        audio.play().catch(() => {})
      }

      audio.addEventListener('error', tryNext)
      return audio
    }

    audioRefs.current = {
      rain: createAudio(['/sounds/rain.mp3', '/sounds/rain.wav']),
      forest: createAudio([
        '/sounds/Forest sound.mp3',
        '/sounds/Forest%20sound.mp3',
        '/sounds/Forest sound.wav',
        '/sounds/Forest%20sound.wav',
        '/sounds/Forest sound.WAV',
        '/sounds/Forest%20sound.WAV',
      ]),
      bell: createAudio(['/sounds/bell.mp3', '/sounds/bell.wav']),
    }

    alarmRef.current = createAudio(['/sounds/bell.mp3', '/sounds/bell.wav'], {
      loop: false,
      volume: 0.6,
    })
  }

  const stopAllAudio = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    if (alarmRef.current) {
      alarmRef.current.pause()
      alarmRef.current.currentTime = 0
    }
  }

  useEffect(() => {
    stopAllAudio()

    if (isRunning && selectedSound !== 'none') {
      const currentAudio = audioRefs.current[selectedSound]
      currentAudio?.play().catch(() => {})
    }
  }, [isRunning, selectedSound])

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, remainingSeconds])

  useEffect(() => {
    if (prevRemainingRef.current > 0 && remainingSeconds === 0) {
      alarmRef.current?.play().catch(() => {})
    }
    prevRemainingRef.current = remainingSeconds
  }, [remainingSeconds])

  const handleMinutesChange = (value) => {
    setMinutesInput(value)
    const numericValue = Number(value)
    if (Number.isNaN(numericValue) || numericValue < 0) return

    const seconds = Math.round(numericValue * 60)
    setInitialSeconds(seconds)
    setRemainingSeconds(seconds)
    setIsRunning(false)
    stopAllAudio()
  }

  const handlePreset = (minutes) => {
    setMinutesInput(String(minutes))
    const seconds = minutes * 60
    setInitialSeconds(seconds)
    setRemainingSeconds(seconds)
    setIsRunning(false)
    stopAllAudio()
  }

  const handleStart = () => {
    if (initialSeconds === 0) return
    setRemainingSeconds((prev) => (prev === 0 ? initialSeconds : prev))
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setRemainingSeconds(initialSeconds)
    stopAllAudio()
  }

  const statusText = useMemo(() => {
    if (remainingSeconds === 0) return 'Completato'
    return isRunning ? 'In corso' : 'In pausa'
  }, [isRunning, remainingSeconds])

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Meditation App</p>
        <h1>Respira, rilassati, resta presente</h1>
        <p className="lede">
          Imposta il timer, scegli un suono di sottofondo e lascia che il ritmo
          ti accompagni nella tua pratica.
        </p>
      </header>

      <main className="layout">
        <section className="card timer-card">
          <div className="timer-display">
            <p className="label">Tempo rimanente</p>
            <div className="time">{formatTime(remainingSeconds)}</div>
            <span className={`status ${isRunning ? 'running' : 'paused'}`}>
              {statusText}
            </span>
          </div>

          <div className="controls-grid">
            <div className="field">
              <label htmlFor="minutes">Durata (minuti)</label>
              <input
                id="minutes"
                type="number"
                min="0"
                step="1"
                value={minutesInput}
                onChange={(e) => handleMinutesChange(e.target.value)}
              />
              <div className="presets">
                {presetMinutes.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className="chip"
                    onClick={() => handlePreset(minutes)}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="sound">Suono di sottofondo</label>
              <select
                id="sound"
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
              >
                {soundOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="hint">Il suono parte e si ripete mentre il timer e attivo.</p>
            </div>
          </div>

          <div className="actions">
            <button className="primary" type="button" onClick={handleStart}>
              Avvia
            </button>
            <button className="ghost" type="button" onClick={handlePause}>
              Pausa
            </button>
            <button className="ghost" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </section>

        <section className="card tips-card">
          <div className="tips-header">
            <p className="eyebrow">Come meditare</p>
            <h2>Un rituale semplice</h2>
          </div>
          <ul className="tips">
            <li>Trova una posizione comoda con la schiena eretta ma rilassata.</li>
            <li>Chiudi gli occhi, inspira dal naso e lascia andare l'aria lentamente.</li>
            <li>Segui il respiro: se la mente vaga, riportala con gentilezza al presente.</li>
            <li>Nota le sensazioni nel corpo senza giudicarle, come onde che vanno e vengono.</li>
            <li>Al termine, riapri gli occhi lentamente e prenditi un momento per ricentrarti.</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        (c) {new Date().getFullYear()} Ardelean Jonathan
      </footer>
    </div>
  )
}

export default App
