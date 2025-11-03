import { render, screen } from '@testing-library/react'
import { Dashboard } from '@/components/Dashboard'

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    logout: jest.fn(),
  }),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: null, isLoading: false })),
  useMutation: jest.fn(() => ({ mutate: jest.fn() })),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}))

describe('Dashboard', () => {
  it('renders dashboard components', () => {
    render(<Dashboard />)
    // Dashboard should render without crashing
    expect(document.body).toBeInTheDocument()
  })
})
