/**
 * Unit tests for OrderCreationModal component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderCreationModal } from '../order-creation-modal'

describe('OrderCreationModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Visibility', () => {
    it('should render when open prop is true', () => {
      render(
        <OrderCreationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Create Order')).toBeInTheDocument()
    })

    it('should not render when open prop is false', () => {
      const { container } = render(
        <OrderCreationModal
          open={false}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      const dialog = container.querySelector('[role="dialog"]')
      expect(dialog).not.toBeInTheDocument()
    })

    it('should call onOpenChange with false when escape key is pressed', async () => {
      const user = userEvent.setup()
      render(
        <OrderCreationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      await user.keyboard('{Escape}')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Tabs and Mode Switching', () => {
    it('should render Dialog and Tabs components correctly', () => {
      render(
        <OrderCreationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Sell Order')).toBeInTheDocument()
      expect(screen.getByText('Buy Order')).toBeInTheDocument()
    })

    it('should show sell mode description by default', () => {
      render(
        <OrderCreationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      expect(
        screen.getByText(
          'List your bond shares for sale on the secondary marketplace'
        )
      ).toBeInTheDocument()
    })

    it('should update description when switching to buy mode', async () => {
      const user = userEvent.setup()
      render(
        <OrderCreationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      const buyTab = screen.getByRole('tab', { name: 'Buy Order' })
      await user.click(buyTab)

      expect(
        screen.getByText(
          'Create a buy order at your desired price point'
        )
      ).toBeInTheDocument()
    })

    it('should allow switching between modes', async () => {
      const user = userEvent.setup()
      render(
        <OrderCreationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      const buyTab = screen.getByRole('tab', { name: 'Buy Order' })
      await user.click(buyTab)

      const sellTab = screen.getByRole('tab', { name: 'Sell Order' })
      await user.click(sellTab)

      expect(
        screen.getByText(
          'List your bond shares for sale on the secondary marketplace'
        )
      ).toBeInTheDocument()
    })
  })
})
