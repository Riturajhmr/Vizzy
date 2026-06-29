import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '@/features/chat/components/message-bubble'
import type { Message } from '@/types/plugin'

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'test-id',
    role: 'user',
    content: 'Hello, Vizzy!',
    createdAt: new Date('2025-01-01T12:00:00Z').toISOString(),
    ...overrides,
  }
}

describe('MessageBubble', () => {
  it('renders message content', () => {
    render(<MessageBubble message={makeMessage({ content: 'Create a sunset poster' })} />)
    expect(screen.getByText('Create a sunset poster')).toBeInTheDocument()
  })

  it('applies user alignment for user messages', () => {
    const { container } = render(<MessageBubble message={makeMessage({ role: 'user' })} />)
    const wrapper = container.querySelector('[data-role="user"]')
    expect(wrapper).toHaveClass('flex-row-reverse')
  })

  it('applies assistant alignment for assistant messages', () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: 'assistant', content: 'Here is your poster.' })} />,
    )
    const wrapper = container.querySelector('[data-role="assistant"]')
    expect(wrapper).not.toHaveClass('flex-row-reverse')
    expect(wrapper).toHaveClass('flex-row')
  })

  it('renders avatar for assistant messages', () => {
    render(
      <MessageBubble message={makeMessage({ role: 'assistant', content: 'Response' })} />,
    )
    expect(screen.getByLabelText('Vizzy')).toBeInTheDocument()
  })

  it('does not render an avatar label for user messages', () => {
    render(<MessageBubble message={makeMessage({ role: 'user' })} />)
    expect(screen.queryByLabelText('Vizzy')).not.toBeInTheDocument()
  })

  it('renders a time element with dateTime attribute', () => {
    const iso = '2025-01-01T12:00:00.000Z'
    render(<MessageBubble message={makeMessage({ createdAt: iso })} />)
    const time = screen.getByRole('time')
    expect(time).toHaveAttribute('dateTime', iso)
  })

  it('renders nothing for an empty assistant placeholder', () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: 'assistant', content: '' })} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders an empty user message normally', () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: 'user', content: '' })} />,
    )
    expect(container.querySelector('[data-role="user"]')).toBeInTheDocument()
  })
})
