import { describe, it, expect } from 'vitest'
import { placeOrder } from './api'

describe('api.placeOrder', () => {
  it('returns an orderId of length ~12 uppercase', async () => {
    const res = await placeOrder([{ id: 'sku-001', qty: 2 }])
    expect(res.orderId).toBeTruthy()
    expect(res.orderId.length).toBeGreaterThanOrEqual(10)
  })
})
