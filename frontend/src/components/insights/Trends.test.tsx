import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Trends } from './Trends'
import type { TrendInsight } from '../../services/api'

describe('Trends Component', () => {
  const mockTrends: TrendInsight[] = [
    { metric: 'steps', current_avg: 8000, previous_avg: 7500, change_percent: 6.7, trend: 'up' },
    { metric: 'sleep', current_avg: 7.5, previous_avg: 7.0, change_percent: 7.1, trend: 'up' },
    { metric: 'heart_rate', current_avg: 62, previous_avg: 65, change_percent: -4.6, trend: 'down' },
  ]

  it('should render empty state when no trends', () => {
    render(<Trends trends={[]} />)

    expect(screen.getByText(/not enough data/i)).toBeInTheDocument()
  })

  it('should render trend items', () => {
    render(<Trends trends={mockTrends} />)

    expect(screen.getByText('Daily Steps')).toBeInTheDocument()
    expect(screen.getByText('Sleep Duration')).toBeInTheDocument()
    expect(screen.getByText('Resting Heart Rate')).toBeInTheDocument()
  })

  it('should display change percentages', () => {
    render(<Trends trends={mockTrends} />)

    expect(screen.getByText('6.7%')).toBeInTheDocument()
    expect(screen.getByText('7.1%')).toBeInTheDocument()
    expect(screen.getByText('4.6%')).toBeInTheDocument()
  })

  it('should display current averages', () => {
    render(<Trends trends={mockTrends} />)

    expect(screen.getByText('8,000')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('62')).toBeInTheDocument()
  })
})
