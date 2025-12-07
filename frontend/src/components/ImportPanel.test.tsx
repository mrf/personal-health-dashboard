import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportPanel } from './ImportPanel'
import type { ImportStatus } from '../services/api'

describe('ImportPanel Component', () => {
  const mockOnImportComplete = vi.fn()

  const idleStatus: ImportStatus = {
    status: 'idle',
    progress: 0,
    records_imported: 0,
    last_import: null,
    error_message: null,
    data_range: { min_date: null, max_date: null },
  }

  const parsingStatus: ImportStatus = {
    status: 'parsing',
    progress: 50,
    records_imported: 5000,
    last_import: null,
    error_message: null,
    data_range: { min_date: null, max_date: null },
  }

  const completeStatus: ImportStatus = {
    status: 'complete',
    progress: 100,
    records_imported: 10000,
    last_import: '2024-01-15T10:00:00Z',
    error_message: null,
    data_range: { min_date: '2023-01-01', max_date: '2024-01-15' },
  }

  const errorStatus: ImportStatus = {
    status: 'error',
    progress: 0,
    records_imported: 0,
    last_import: null,
    error_message: 'Failed to parse XML',
    data_range: { min_date: null, max_date: null },
  }

  it('should render upload UI when idle', () => {
    render(<ImportPanel status={idleStatus} onImportComplete={mockOnImportComplete} />)

    expect(screen.getByText(/import your health data/i)).toBeInTheDocument()
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/choose file/i)).toBeInTheDocument()
  })

  it('should show progress when parsing', () => {
    render(<ImportPanel status={parsingStatus} onImportComplete={mockOnImportComplete} />)

    expect(screen.getByText(/parsing health data/i)).toBeInTheDocument()
    expect(screen.getByText(/5,000 records processed/i)).toBeInTheDocument()
  })

  it('should show completion message when complete', () => {
    render(<ImportPanel status={completeStatus} onImportComplete={mockOnImportComplete} />)

    expect(screen.getByText(/import complete/i)).toBeInTheDocument()
    expect(screen.getByText(/10,000 records imported/i)).toBeInTheDocument()
    expect(screen.getByText(/view dashboard/i)).toBeInTheDocument()
  })

  it('should call onImportComplete when View Dashboard is clicked', () => {
    render(<ImportPanel status={completeStatus} onImportComplete={mockOnImportComplete} />)

    fireEvent.click(screen.getByText(/view dashboard/i))

    expect(mockOnImportComplete).toHaveBeenCalled()
  })

  it('should show error message when error status', () => {
    render(<ImportPanel status={errorStatus} onImportComplete={mockOnImportComplete} />)

    expect(screen.getByText(/failed to parse xml/i)).toBeInTheDocument()
  })

  it('should render export instructions', () => {
    render(<ImportPanel status={idleStatus} onImportComplete={mockOnImportComplete} />)

    expect(screen.getByText(/how to export from apple health/i)).toBeInTheDocument()
    // Check for the Health word which is inside a strong tag
    expect(screen.getByText('Health')).toBeInTheDocument()
  })
})
