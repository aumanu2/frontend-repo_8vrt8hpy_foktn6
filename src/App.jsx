import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageCircle, CheckCircle2, ClipboardList, Notebook, Sun, Moon, Info, Sparkles, Trash2, Pencil, Plus, Upload, Download } from 'lucide-react'
import Particles from 'react-tsparticles'
import { loadFull } from 'tsparticles'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('dark') !== 'false')
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('dark', String(dark))
  }, [dark])
  return [dark, setDark]
}

function Layout({ children }) {
  const [dark, setDark] = useDarkMode()
  const [quote, setQuote] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/ai/daily-quote`).then(r => r.json()).then(d => setQuote(d.quote || '')).catch(()=>{})
  }, [])

  return (
    <div className="min-h-screen bg-black text-red-100 relative overflow-hidden">
      <ParticlesBackground />
      <header className="relative z-10 backdrop-blur bg-black/40 border-b border-red-900/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-red-300 hover:text-red-200 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 shadow-lg shadow-red-900/50" />
            <span className="font-bold tracking-wide">SiddMind</span>
          </Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <NavLink to="/tasks" icon={<ClipboardList size={16}/>} label="Tasks" />
            <NavLink to="/notes" icon={<Notebook size={16}/>} label="Notes" />
            <NavLink to="/chat" icon={<MessageCircle size={16}/>} label="AI Chat" />
            <NavLink to="/about" icon={<Info size={16}/>} label="About" />
            <button onClick={()=>setDark(!dark)} className="p-2 rounded-lg border border-red-900/50 hover:bg-red-900/20 transition">
              {dark ? <Sun size={16}/> : <Moon size={16}/>}
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
      number: { value: 50 },
      color: { value: ['#ef4444', '#7f1d1d', '#b91c1c'] },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.1, max: 0.5 } },
      size: { value: { min: 1, max: 3 } },
      links: { enable: true, color: '#7f1d1d', opacity: 0.3 },
      move: { enable: true, speed: 0.6 },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: 'repulse' }, onClick: { enable: true, mode: 'push' } },
      modes: { repulse: { distance: 80 }, push: { quantity: 2 } }
    }
  }), [])

  const init = async (main) => {
    await loadFull(main)
  }

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
        <motion.h1 initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="text-4xl md:text-6xl font-extrabold text-red-100 drop-shadow">
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
    // order: incomplete first then due date
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
    // pinned first
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
            <div key={i} className={`px-3 py-2 rounded-xl max-w-[85%] ${m.role==='user'?'ml-auto bg-red-700/40 text-red-100':'bg-black/40 border border-red-900/50 text-red-200'}`}>{m.text}</div>
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
  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-red-100 mb-4 inline-flex items-center gap-2"><Info/> About App</h2>
      <div className="bg-red-950/50 border border-red-900/60 rounded-2xl p-4 text-red-200">
        <p className="mb-3">App Made by Siddharth Anand Mishra</p>
        <p className="mb-3">Version: 1.0.0</p>
        <p>Credits: Gemini by Google, React, FastAPI, Tailwind, and community icons/animations.</p>
      </div>
    </section>
  )
}

function Home() {
  return (
    <>
      <Hero/>
    </>
  )
}

function RouterShell(){
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/tasks" element={<Tasks/>} />
          <Route path="/notes" element={<Notes/>} />
          <Route path="/chat" element={<Chat/>} />
          <Route path="/about" element={<About/>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default RouterShell
