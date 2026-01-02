/**
 * AuthContext Tests
 *
 * Tests authentication context functionality
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { act } from 'react'

// Test component to access auth context
function TestComponent() {
  const { user, login, logout, loading } = useAuth()

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.username : 'No User'}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides initial auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('updates user state after login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByRole('button', { name: 'Login' })

    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })
  })

  it('clears user state after logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Login first
    const loginButton = screen.getByRole('button', { name: 'Login' })
    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })

    // Then logout
    const logoutButton = screen.getByRole('button', { name: 'Logout' })
    await act(async () => {
      logoutButton.click()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })
})
