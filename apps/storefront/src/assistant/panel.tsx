import { useState, useRef, useEffect } from 'react'
import { answer } from './engine'

export default function AssistantPanel() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [a, setA] = useState<string | null>(null)

  const closePanel = () => {
    setOpen(false)
    setQ('')
    setA(null)
  }

  const ask = async () => {
    if (!q.trim()) return
    setA('Thinking…')
    const res = await answer(q)
    setA(`${res.text}${res.cite ? ' ' + res.cite : ''}`)
  }

  // basic focus trap when open + keyboard handlers
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const first = panelRef.current?.querySelector('textarea, button, input') as HTMLElement | null
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePanel()
      }
    }
    first?.focus()
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      prev?.focus()
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => {
          if (open) closePanel()
          else setOpen(true)
        }}
        className="fixed bottom-4 right-4 rounded-full bg-blue-600 text-white px-4 py-2 shadow-lg flex items-center gap-2"
      >
        {open ? (<><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> <span>Close</span></>) : (<><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> <span>Ask Support</span></>)}
      </button>

      {open && (
        <div ref={panelRef} className="fixed bottom-16 right-4 bg-white border rounded-2xl shadow-xl w-80 p-4" role="dialog" aria-label="Ask Support">
          <h2 className="text-lg font-semibold mb-2">Ask Support</h2>
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            rows={3}
            placeholder="Ask about shipping, returns, or your order ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, unless Shift+Enter
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask()
              }
            }}
          />
          <button
            onClick={ask}
            className="mt-2 w-full bg-blue-600 text-white rounded-md py-1 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 2l-7 20l-4-9l-9-4l20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Send
          </button>
          {a && <p className="mt-3 text-sm whitespace-pre-wrap border-t pt-2">{a}</p>}
        </div>
      )}
    </>
  )
}
