import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageCircle, CheckCircle2, ClipboardList, Notebook, Sun, Moon, Info, Sparkles, Trash2, Plus, Download, KeyRound, Lock, Unlock } from 'lucide-react'
import Particles from 'react-tsparticles'
import { loadFull } from 'tsparticles'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Theme
function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('dark') !== 'false')
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('dark', String(dark))
  }, [dark])
  return [dark, setDark]
}

// Simple sound engine using WebAudio (no external assets)
function useSound() {
  const ctxRef = useRef(null)
  const ensure = () => {
    if (!ctxRef.current) {
      const A = window.AudioContext || window.webkitAudioContext
      ctxRef.current = new A()
    }
    return ctxRef.current
  }
  const playBeep = (freq = 880, duration = 0.06, type = 'sawtooth', gain = 0.02) => {
    const ctx = ensure()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = gain
    o.connect(g).connect(ctx.destination)
    const now = ctx.currentTime
    o.start(now)
    o.stop(now + duration)
  }
  const playType = () => playBeep(1200, 0.03, 'square', 0.015)
  const playDenied = () => playBeep(200, 0.12, 'square', 0.05)
  const playBootHum = () => {
    const ctx = ensure()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(70, ctx.currentTime)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 2.1)
  }
  const playGranted = () => {
    playBeep(740, 0.08, 'triangle', 0.03)
    setTimeout(()=> playBeep(980, 0.08, 'triangle', 0.03), 80)
  }
  return { playBeep, playType, playDenied, playBootHum, playGranted }
}

// Crypto utils: store PIN as salted SHA-256 hash
async function sha256Hex(msg) {
  const enc = new TextEncoder()
  const data = enc.encode(msg)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')
}
function randomSalt(len=8) {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('')
}
async function hashPin(pin, salt) {
  return sha256Hex(pin + ':' + salt)
}

// Gating Context to trigger splash replay
const GateContext = createContext(null)
function useGate(){ return useContext(GateContext) }

function Layout({ children }) {
  const [dark, setDark] = useDarkMode()
  const [quote, setQuote] = useState('')
  const { triggerReplay } = useGate()

  useEffect(() => {
    fetch(`${API_BASE}/api/ai/daily-quote`).then(r => r.json()).then(d => setQuote(d.quote || '')).catch(()=>{})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a0000] text-red-100 relative overflow-hidden font-['Source_Code_Pro',monospace]">
      <GridOverlay />
      <ParticlesBackground />
      <header className="relative z-10 backdrop-blur bg-black/40 border-b border-red-900/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-red-300 hover:text-red-200 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 shadow-lg shadow-red-900/50" />
            <span className="font-bold tracking-wide font-['Orbitron',sans-serif]">SiddMind</span>
          </Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <NavLink to="/tasks" icon={<ClipboardList size={16}/>} label="Tasks" />
            <NavLink to="/notes" icon={<Notebook size={16}/>} label="Notes" />
            <NavLink to="/chat" icon={<MessageCircle size={16}/>} label="AI Chat" />
            <NavLink to="/about" icon={<Info size={16}/>} label="About" />
            <button onClick={()=>setDark(!dark)} className="p-2 rounded-lg border border-red-900/50 hover:bg-red-900/20 transition">
              {dark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <button onClick={triggerReplay} className="px-2 py-1 rounded-lg border border-red-900/50 hover:bg-red-900/20 transition text-xs">
              Replay Intro
            </button>
          </nav>
        </div>
      </header>
      {quote && (
        <div className="relative z-10 text-center text-xs text-red-300/80 py-2 bg-gradient-to-r from-red-950/60 via-black to-red-950/60 border-b border-red-900/30">
          <Sparkles size={14} className="inline -mt-1 mr-1"/> {quote}
        </div>
      )}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}

function GridOverlay(){
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.15] -z-0" aria-hidden>
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#7f1d1d" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

function NavLink({ to, icon, label }) {
  return (
    <Link to={to} className="px-3 py-2 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-900/40 text-red-200/90">
      <span className="inline-flex items-center gap-2">{icon} {label}</span>
    </Link>
  )
}

function ParticlesBackground() {
  const options = useMemo(()=>({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 60 },
      color: { value: ['#ef4444', '#7f1d1d', '#b91c1c'] },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.08, max: 0.4 } },
      size: { value: { min: 1, max: 2 } },
      links: { enable: true, color: '#7f1d1d', opacity: 0.25 },
      move: { enable: true, speed: 0.5 },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: 'repulse' }, onClick: { enable: true, mode: 'push' } },
      modes: { repulse: { distance: 80 }, push: { quantity: 2 } }
    }
  }), [])

  const init = async (main) => { await loadFull(main) }

  return (
    <div className="absolute inset-0 -z-0">
      <Particles id="tsparticles" init={init} options={options} />
    </div>
  )
}

function Hero() {
  return (
    <div className="relative">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <Spline scene="https://prod.spline.design/XuAg4PYWfzmy0iW1/scene.splinecode" />
      </div>
      <div className="max-w-6xl mx-auto px-6 py-20 relative">
        <motion.h1 initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="text-4xl md:text-6xl font-extrabold text-red-100 drop-shadow font-['Orbitron',sans-serif]">
          Think. Track. Talk.
        </motion.h1>
        <p className="mt-4 text-red-300/90 max-w-2xl">
          A focused red-black workspace for tasks, notes, and an AI that listens and speaks.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/tasks" className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/30">Manage Tasks</Link>
          <Link to="/notes" className="px-4 py-2 rounded-lg bg-red-900/30 text-red-200 border border-red-900/50">Open Notes</Link>
          <Link to="/chat" className="px-4 py-2 rounded-lg bg-red-700/40 text-red-100 border border-red-900/50 inline-flex items-center gap-2"><Mic size={16}/> Voice Chat</Link>
        </div>
      </div>
    </div>
  )
}

// Tasks UI
function Tasks() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [due, setDue] = useState('')

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/tasks`)
    const data = await res.json()
    data.sort((a,b)=> (a.completed===b.completed? 0 : a.completed?1:-1))
    setItems(data)
  }
  useEffect(()=>{load()},[])

  const add = async () => {
    if(!title.trim()) return
    await fetch(`${API_BASE}/api/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, description, due_date: due? new Date(due): null, completed:false }) })
    setTitle(''); setDescription(''); setDue('');
    load()
  }
  const toggle = async (id) => {
    await fetch(`${API_BASE}/api/tasks/${id}/toggle`, { method:'PATCH' })
    load()
  }
  const remove = async (id) => {
    await fetch(`${API_BASE}/api/tasks/${id}`, { method:'DELETE' })
    load()
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-red-100 mb-4 inline-flex items-center gap-2"><ClipboardList/> Tasks</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-red-950/40 border border-red-900/40 rounded-2xl p-4">
          <div className="grid sm:grid-cols-3 gap-2">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="bg-black/40 border border-red-900/50 rounded-lg px-3 py-2 text-red-100 placeholder-red-400/40"/>
            <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="bg-black/40 border border-red-900/50 rounded-lg px-3 py-2 text-red-100 placeholder-red-400/40"/>
            <input type="date" value={due} onChange={e=>setDue(e.target.value)} className="bg-black/40 border border-red-900/50 rounded-lg px-3 py-2 text-red-100"/>
          </div>
          <button onClick={add} className="mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white inline-flex items-center gap-2"><Plus size={16}/> Add Task</button>

          <div className="mt-6 grid gap-3">
            {items.map(t=> (
              <motion.div key={t._id} layout className={`rounded-2xl p-3 border ${t.completed? 'bg-red-900/20 border-red-900/40 opacity-80':'bg-red-950/60 border-red-900/60'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={()=>toggle(t._id)} className={`mt-1 p-1 rounded-full border ${t.completed? 'border-green-600 text-green-500':'border-red-700 text-red-200'}`}>
                    <CheckCircle2 size={18}/>
                  </button>
                  <div className="flex-1">
                    <div className="font-semibold text-red-100">{t.title}</div>
                    {t.description && <div className="text-sm text-red-300/80">{t.description}</div>}
                  </div>
                  <button onClick={()=>remove(t._id)} className="p-2 text-red-300/70 hover:text-red-200"><Trash2 size={16}/></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="bg-red-950/40 border border-red-900/40 rounded-2xl p-4">
          <h3 className="font-semibold text-red-200 mb-2">Export</h3>
          <a className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-900/60 inline-flex items-center gap-2" href={`${API_BASE}/api/export`} download>
            <Download size={16}/> Export JSON
          </a>
        </div>
      </div>
    </section>
  )
}

// Notes UI
function Notes() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/notes`)
    const data = await res.json()
    data.sort((a,b)=> (a.pinned===b.pinned?0:a.pinned?-1:1))
    setNotes(data)
  }
  useEffect(()=>{load()},[])

  const add = async () => {
    if(!title.trim()) return
    await fetch(`${API_BASE}/api/notes`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, content, pinned:false }) })
    setTitle(''); setContent('');
    load()
  }
  const togglePin = async (id) => {
    await fetch(`${API_BASE}/api/notes/${id}/pin`, { method:'PATCH' })
    load()
  }
  const remove = async (id) => {
    await fetch(`${API_BASE}/api/notes/${id}`, { method:'DELETE' })
    load()
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-red-100 mb-4 inline-flex items-center gap-2"><Notebook/> Notes</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-red-950/40 border border-red-900/40 rounded-2xl p-4">
          <div className="grid sm:grid-cols-3 gap-2">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="bg-black/40 border border-red-900/50 rounded-lg px-3 py-2 text-red-100 placeholder-red-400/40"/>
            <input value={content} onChange={e=>setContent(e.target.value)} placeholder="Content" className="sm:col-span-2 bg-black/40 border border-red-900/50 rounded-lg px-3 py-2 text-red-100 placeholder-red-400/40"/>
          </div>
          <button onClick={add} className="mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white inline-flex items-center gap-2"><Plus size={16}/> Add Note</button>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {notes.map(n=> (
              <motion.div key={n._id} layout className="rounded-2xl p-3 border bg-red-950/60 border-red-900/60">
                <div className="flex items-start gap-3">
                  <button onClick={()=>togglePin(n._id)} className={`mt-1 p-1 rounded border ${n.pinned? 'border-yellow-500 text-yellow-400':'border-red-700 text-red-200'}`}>
                    <Sparkles size={18}/>
                  </button>
                  <div className="flex-1">
                    <div className="font-semibold text-red-100">{n.title}</div>
                    {n.content && <div className="text-sm text-red-300/80">{n.content}</div>}
                  </div>
                  <button onClick={()=>remove(n._id)} className="p-2 text-red-300/70 hover:text-red-200"><Trash2 size={16}/></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="bg-red-950/40 border border-red-900/40 rounded-2xl p-4">
          <h3 className="font-semibold text-red-200 mb-2">Export</h3>
          <a className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-900/60 inline-flex items-center gap-2" href={`${API_BASE}/api/export`} download>
            <Download size={16}/> Export JSON
          </a>
        </div>
      </div>
    </section>
  )
}

// Chat UI with STT/TTS
function Chat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const send = async (text) => {
    const content = text ?? input
    if(!content.trim()) return
    const userMsg = { role:'user', text: content }
    setMessages(m=>[...m, userMsg])
    setInput('')
    try {
      const r = await fetch(`${API_BASE}/api/ai/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: content }) })
      const d = await r.json()
      const reply = d.reply || '...'
      const aiMsg = { role:'assistant', text: reply }
      setMessages(m=>[...m, aiMsg])
      speak(reply)
    } catch(e){
      setMessages(m=>[...m, { role:'assistant', text: 'Error contacting AI.' }])
    }
  }

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    setSpeaking(true)
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = 1
    utter.pitch = 1
    utter.onend = ()=> setSpeaking(false)
    speechSynthesis.speak(utter)
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SR) return alert('SpeechRecognition not supported in this browser')
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e)=> {
      const t = e.results[0][0].transcript
      setInput(t)
      send(t)
    }
    rec.onerror = ()=> setListening(false)
    rec.onend = ()=> setListening(false)
    setListening(true)
    rec.start()
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-red-100 mb-4 inline-flex items-center gap-2"><MessageCircle/> AI Chat</h2>
      <div className="bg-red-950/50 border border-red-900/60 rounded-2xl p-4">
        <div className="h-80 overflow-y-auto space-y-3 pr-2">
          {messages.map((m,i)=> (
            <div key={i} className={`px-3 py-2 rounded-xl max-w-[85%] ${m.role==='user'? 'ml-auto bg-red-700/40 text-red-100':'bg-black/40 border border-red-900/50 text-red-200'}`}>{m.text}</div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type your message..." className="flex-1 bg-black/40 border border-red-900/60 rounded-lg px-3 py-2 text-red-100 placeholder-red-400/40"/>
          <button onClick={()=>send()} className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white">Send</button>
          <button onClick={startListening} className={`p-2 rounded-lg border ${listening? 'border-green-600 text-green-400':'border-red-900/60 text-red-200'}`}><Mic size={18}/></button>
        </div>
      </div>
    </section>
  )
}

function About() {
  const { triggerReplay } = useGate()
  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-red-100 mb-4 inline-flex items-center gap-2"><Info/> About App</h2>
      <div className="bg-red-950/50 border border-red-900/60 rounded-2xl p-4 text-red-200 space-y-3">
        <p>App Made by Siddharth Anand Mishra</p>
        <p>Version: 1.0.1</p>
        <p>Credits: Gemini by Google, React, FastAPI, Tailwind, and community icons/animations.</p>
        <button onClick={triggerReplay} className="mt-2 px-3 py-2 rounded-lg border border-red-900/60 hover:bg-red-900/20 transition inline-flex items-center gap-2">
          <Sparkles size={16}/> Replay Startup Animation
        </button>
      </div>
    </section>
  )
}

function Home() {
  return (<Hero/>)
}

// PIN Lock + Splash Gate
function PinGate({ children }){
  const [stage, setStage] = useState('lock') // 'lock' | 'splash' | 'app'
  const [hasPin, setHasPin] = useState(false)
  const sound = useSound()

  useEffect(()=>{
    const stored = localStorage.getItem('siddmind_pin')
    setHasPin(!!stored)
    setStage('lock')
  }, [])

  const onUnlock = () => {
    setStage('splash')
    sound.playBootHum()
  }

  return (
    <AnimatePresence mode="wait">
      {stage === 'lock' && (
        <motion.div key="lock" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <LockScreen hasPin={hasPin} onSuccess={onUnlock} />
        </motion.div>
      )}
      {stage === 'splash' && (
        <motion.div key="splash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <SplashScreen onComplete={()=> setStage('app')} />
        </motion.div>
      )}
      {stage === 'app' && (
        <motion.div key="app" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LockScreen({ hasPin, onSuccess }){
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const sound = useSound()

  const press = async (d) => {
    sound.playBeep(900,0.04,'square',0.03)
    if (hasPin) {
      const v = (input + d).slice(0,4)
      setInput(v)
      if (v.length === 4) {
        const stored = JSON.parse(localStorage.getItem('siddmind_pin'))
        const h = await hashPin(v, stored.salt)
        if (h === stored.hash) {
          sound.playGranted()
          setTimeout(()=> onSuccess(), 150)
        } else {
          setError('ACCESS DENIED')
          sound.playDenied()
          setShake(true)
          setTimeout(()=> setShake(false), 300)
          setTimeout(()=> setInput(''), 250)
        }
      }
    } else {
      const v = (pin + d).slice(0,4)
      setPin(v)
    }
  }
  const back = () => setInput(s=>s.slice(0,-1))

  const savePin = async () => {
    if (pin.length !== 4 || pin2.length !== 4) return setError('Enter and confirm 4 digits')
    if (pin !== pin2) return setError('PINs do not match')
    const salt = randomSalt(8)
    const hash = await hashPin(pin, salt)
    localStorage.setItem('siddmind_pin', JSON.stringify({ hash, salt }))
    sound.playGranted()
    onSuccess()
  }

  return (
    <div className="min-h-screen bg-black text-red-100 relative overflow-hidden">
      <GridOverlay/>
      <ParticlesBackground/>
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div animate={shake? {x:[0,-8,8,-6,6,-3,3,0]}: {}} className="w-full max-w-sm bg-red-950/50 border border-red-900/60 rounded-2xl p-6 backdrop-blur">
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-900 shadow-red-900/50 shadow flex items-center justify-center"><KeyRound/></div>
            <h3 className="mt-2 font-['Orbitron',sans-serif] tracking-widest">{hasPin? 'ENTER PIN':'SET 4-DIGIT PIN'}</h3>
          </div>
          {hasPin ? (
            <div className="text-center">
              <div className="flex justify-center gap-3 mb-4">
                {[0,1,2,3].map(i=> (
                  <div key={i} className={`w-4 h-4 rounded-full ${input.length>i? 'bg-red-500':'bg-red-900 border border-red-800'}`}></div>
                ))}
              </div>
              <Keypad onPress={press} onBack={back}/>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-red-300 mb-1">New PIN</label>
              <input value={pin} onChange={e=> setPin(e.target.value.replace(/\D/g,'').slice(0,4))} className="w-full bg-black/40 border border-red-900/60 rounded-lg px-3 py-2 text-center tracking-[0.4em]" />
              <label className="block text-sm text-red-300 mt-3 mb-1">Confirm PIN</label>
              <input value={pin2} onChange={e=> setPin2(e.target.value.replace(/\D/g,'').slice(0,4))} className="w-full bg-black/40 border border-red-900/60 rounded-lg px-3 py-2 text-center tracking-[0.4em]" />
              <button onClick={savePin} className="mt-4 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white inline-flex items-center justify-center gap-2"><Unlock size={16}/> Save PIN</button>
            </div>
          )}
          {error && <div className="mt-3 text-center text-red-400 text-sm">{error}</div>}
        </motion.div>
      </div>
    </div>
  )
}

function Keypad({ onPress, onBack }){
  const nums = [[1,2,3],[4,5,6],[7,8,9],['',0,'<']]
  return (
    <div className="grid grid-cols-3 gap-3">
      {nums.flat().map((n,i)=> (
        <button key={i} disabled={n===''} onClick={()=> n==='<'? onBack(): onPress(String(n))} className={`h-12 rounded-xl border border-red-900/60 hover:bg-red-900/30 transition ${n===''? 'opacity-0 pointer-events-none':''}`}>
          <span className="font-['Orbitron',sans-serif]">{n}</span>
        </button>
      ))}
    </div>
  )
}

function SplashScreen({ onComplete }){
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const sound = useSound()
  const lines = [
    'Initializing SiddMind OS...',
    'Loading AI modules...',
    'Establishing neural link...',
    'Access Granted 🔓'
  ]

  useEffect(()=>{
    let i = 0
    const tick = () => {
      setStep(s=> s+1)
      sound.playType()
      i++
      if (i < lines.length) {
        setTimeout(tick, 700)
      } else {
        sound.playGranted()
        setDone(true)
        setTimeout(()=> onComplete(), 800)
      }
    }
    sound.playBootHum()
    const t = setTimeout(tick, 400)
    return ()=> clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-black text-red-100 relative overflow-hidden">
      <HexGridFX/>
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-black/40 border border-red-900/70 rounded-2xl p-6 backdrop-blur">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 shadow-red-900/50 shadow"/>
              <h2 className="text-xl font-['Orbitron',sans-serif] tracking-[0.2em]">SiddMind Boot Sequence</h2>
            </div>
          </div>
          <div className="font-mono text-red-300/90 space-y-2">
            {lines.map((l, idx)=> (
              <TypeLine key={idx} text={l} active={step>idx} />
            ))}
          </div>
          <AnimatePresence>
            {done && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="mt-6 text-center text-green-400 font-['Orbitron',sans-serif]">Transitioning...</motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function HexGridFX(){
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 opacity-20 mix-blend-screen" style={{backgroundImage:`radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15), transparent 60%)`}}/>
      <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z" fill="none" stroke="#7f1d1d" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>
      <div className="absolute inset-0 animate-pulse [animation-duration:3s] bg-gradient-to-b from-transparent via-red-900/5 to-transparent"/>
    </div>
  )
}

function TypeLine({ text, active }){
  const [shown, setShown] = useState('')
  useEffect(()=>{
    if (!active) return
    let i = 0
    const id = setInterval(()=>{
      i++
      setShown(text.slice(0,i))
      if (i >= text.length) clearInterval(id)
    }, 15)
    return ()=> clearInterval(id)
  }, [active, text])
  return (
    <div className="relative">
      <span>{shown}</span>
      {shown.length < text.length && <span className="ml-1 text-red-400 animate-pulse">▌</span>}
    </div>
  )
}

function RouterShell(){
  // Provide gate context with replay support
  const [replayFlag, setReplayFlag] = useState(0)
  const triggerReplay = () => setReplayFlag(f=> f+1)

  return (
    <GateContext.Provider value={{ triggerReplay }}>
      <BrowserRouter>
        <GateController replayKey={replayFlag}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/tasks" element={<Tasks/>} />
              <Route path="/notes" element={<Notes/>} />
              <Route path="/chat" element={<Chat/>} />
              <Route path="/about" element={<About/>} />
            </Routes>
          </Layout>
        </GateController>
      </BrowserRouter>
    </GateContext.Provider>
  )
}

function GateController({ children, replayKey }){
  // Controls first-launch lock + splash, and replay
  const [showReplay, setShowReplay] = useState(false)
  useEffect(()=>{
    if (replayKey > 0) {
      setShowReplay(true)
    }
  }, [replayKey])

  return (
    <div className="relative">
      <PinGate>{children}</PinGate>
      <AnimatePresence>
        {showReplay && (
          <motion.div key="replay" className="fixed inset-0 z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onAnimationComplete={()=>{}}>
            <SplashScreen onComplete={()=> setShowReplay(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RouterShell
