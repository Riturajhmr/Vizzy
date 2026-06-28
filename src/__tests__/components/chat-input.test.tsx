import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from '@/features/chat/components/chat-input'

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    render(<ChatInput onSubmit={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /chat input/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('send button becomes enabled when input has content', async () => {
    render(<ChatInput onSubmit={vi.fn()} />)
    const textarea = screen.getByRole('textbox', { name: /chat input/i })
    await userEvent.type(textarea, 'Hello')
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
  })

  it('calls onSubmit with trimmed value when Enter is pressed', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} />)
    const textarea = screen.getByRole('textbox', { name: /chat input/i })
    await userEvent.type(textarea, '  Create a poster  ')
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false })
    expect(onSubmit).toHaveBeenCalledWith('Create a poster')
  })

  it('does not submit on Shift+Enter', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} />)
    const textarea = screen.getByRole('textbox', { name: /chat input/i })
    await userEvent.type(textarea, 'Hello')
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onSubmit with whitespace-only input', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} />)
    const textarea = screen.getByRole('textbox', { name: /chat input/i })
    await userEvent.type(textarea, '   ')
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the input after successful submit', async () => {
    render(<ChatInput onSubmit={vi.fn()} />)
    const textarea = screen.getByRole('textbox', { name: /chat input/i })
    await userEvent.type(textarea, 'Create a logo')
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false })
    expect(textarea).toHaveValue('')
  })

  it('disables input and button when isLoading is true', () => {
    render(<ChatInput onSubmit={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })
})
