/**
 * Accessibility tests using axe-core.
 * Run with: npm test -- accessibility.test.tsx
 */

import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Dashboard } from '../components/Dashboard'
import { LoginForm } from '../components/LoginForm'
import { EmptyState } from '../components/EmptyState'
import { WorkflowBuilder } from '../components/WorkflowBuilder'
import { NotificationProvider } from '../components/NotificationProvider'

expect.extend(toHaveNoViolations)

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}))

// Mock auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    checkAuth: jest.fn(),
    logout: jest.fn(),
  }),
}))

describe('Accessibility Tests', () => {
  it('Dashboard should have no accessibility violations', async () => {
    const { container } = render(
      <NotificationProvider>
        <Dashboard />
      </NotificationProvider>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('LoginForm should have no accessibility violations', async () => {
    const { container } = render(<LoginForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('EmptyState should have no accessibility violations', async () => {
    const { container } = render(
      <EmptyState
        title="Test Title"
        description="Test description"
        action={{ label: 'Test Action', onClick: jest.fn() }}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('WorkflowBuilder should have no accessibility violations', async () => {
    const { container } = render(<WorkflowBuilder />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
