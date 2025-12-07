import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Correlations } from './Correlations'
import type { CorrelationInsight } from '../../services/api'

describe('Correlations Component', () => {
  const mockCorrelations: CorrelationInsight[] = [
    { metric1: 'steps', metric2: 'sleep', correlation: 0.45, description: 'More steps may improve sleep quality', strength: 'moderate' },
    { metric1: 'workouts', metric2: 'calories', correlation: 0.72, description: 'Workouts burn more calories', strength: 'strong' },
  ]

  it('should render empty state when no correlations', () => {
    render(<Correlations correlations={[]} />)

    expect(screen.getByText(/no significant correlations/i)).toBeInTheDocument()
  })

  it('should render correlation items', () => {
    render(<Correlations correlations={mockCorrelations} />)

    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Sleep')).toBeInTheDocument()
    expect(screen.getByText('Workouts')).toBeInTheDocument()
    expect(screen.getByText('Calories')).toBeInTheDocument()
  })

  it('should display descriptions', () => {
    render(<Correlations correlations={mockCorrelations} />)

    expect(screen.getByText('More steps may improve sleep quality')).toBeInTheDocument()
    expect(screen.getByText('Workouts burn more calories')).toBeInTheDocument()
  })

  it('should display strength indicators', () => {
    render(<Correlations correlations={mockCorrelations} />)

    expect(screen.getByText(/moderate \(45%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/strong \(72%\)/i)).toBeInTheDocument()
  })
})
