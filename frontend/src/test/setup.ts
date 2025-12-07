import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock fetch globally
;(globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn() as typeof fetch

// Mock ResizeObserver (used by Recharts)
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
