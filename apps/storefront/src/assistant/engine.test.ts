import { describe, it, expect } from 'vitest'
import { answer } from './engine'

describe('assistant engine', () => {
  it('answers a known policy question with a citation [Q01]', async () => {
    const res = await answer('How long does shipping take?')
    expect(res.kind).toBe('answer')
    expect(res.text.toLowerCase()).toContain('3')
    expect(res.cite).toBe('[Q02]')
  })

  it('politely refuses out-of-scope questions', async () => {
    const res = await answer('What is the capital of Mars?')
    expect(res.kind).toBe('refusal')
    expect(res.text.toLowerCase()).toContain('sorry')
  })
 
  it('detects an order id and includes status + [Q03]', async () => {
    const res = await answer('Where is my order 1A2B3C4D5E6F?')
    expect(res.kind).toBe('answer')
    expect(res.text.toLowerCase()).toMatch(/status:\s*(placed|packed|shipped|delivered)/i)
    expect(res.cite).toBe('[Q03]')
  })
})
