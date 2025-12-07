import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonalRecords } from './PersonalRecords'
import type { PersonalRecord } from '../../services/api'

describe('PersonalRecords Component', () => {
  const mockRecords: PersonalRecord[] = [
    { metric: 'steps', value: 15000, date: '2024-01-10', unit: 'steps' },
    { metric: 'sleep', value: 9.5, date: '2024-01-12', unit: 'hours' },
    { metric: 'active_calories', value: 850, date: '2024-01-08', unit: 'kcal' },
  ]

  it('should render empty state when no records', () => {
    render(<PersonalRecords records={[]} />)

    expect(screen.getByText(/no records yet/i)).toBeInTheDocument()
  })

  it('should render record items', () => {
    render(<PersonalRecords records={mockRecords} />)

    expect(screen.getByText('Most Steps')).toBeInTheDocument()
    expect(screen.getByText('Longest Sleep')).toBeInTheDocument()
    expect(screen.getByText('Most Calories Burned')).toBeInTheDocument()
  })

  it('should display record values with units', () => {
    render(<PersonalRecords records={mockRecords} />)

    expect(screen.getByText('15,000 steps')).toBeInTheDocument()
    expect(screen.getByText('9.5 hours')).toBeInTheDocument()
    expect(screen.getByText('850 kcal')).toBeInTheDocument()
  })

  it('should display dates', () => {
    render(<PersonalRecords records={mockRecords} />)

    // Dates should be formatted (includes day of week) - all 3 records have January dates
    const dateElements = screen.getAllByText(/january.*2024/i)
    expect(dateElements.length).toBe(3)
  })
})
