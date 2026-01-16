import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import SettingsPage from './SettingsPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockUser } from '../test/mocks/data';

const BASE_URL = 'http://localhost:8000';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SettingsPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Page Structure', () => {
    it('should render settings heading', async () => {
      render(<SettingsPage />);

      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });

    it('should render profile section', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/profile/i)).toBeInTheDocument();
      });
    });

    it('should render preferences section', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/preferences/i)).toBeInTheDocument();
      });
    });

    it('should render account section', async () => {
      render(<SettingsPage />);

      // Wait for page to load (check profile section first which loads sooner)
      await waitFor(() => {
        expect(screen.getByText(/profile/i)).toBeInTheDocument();
      });

      // Account heading should be present
      expect(screen.getByRole('heading', { name: /account/i })).toBeInTheDocument();
    });
  });

  describe('Profile Section', () => {
    it('should display current username', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json(mockUser({ username: 'johndoe' }));
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });
    });

    it('should display current email', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json(mockUser({ email: 'john@example.com' }));
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      });
    });

    it('should display current full name', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json(mockUser({ fullName: 'John Doe' }));
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });
    });

    it('should allow editing profile fields', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });

      const fullNameInput = screen.getByLabelText(/full name/i);
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      expect(fullNameInput).toHaveValue('Jane Smith');
    });

    it('should save profile changes when save button is clicked', async () => {
      let capturedBody: unknown = null;

      server.use(
        http.put(`${BASE_URL}/api/v1/users/me`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockUser({ fullName: 'Updated Name' }));
        })
      );

      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });

      const fullNameInput = screen.getByLabelText(/full name/i);
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        // Body includes both full_name and email (current email value)
        expect(capturedBody).toHaveProperty('full_name', 'Updated Name');
      });
    });

    it('should show success message after saving', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Preferences Section', () => {
    it('should have default servings input', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/default servings/i)).toBeInTheDocument();
      });
    });

    it('should allow changing default servings', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/default servings/i)).toBeInTheDocument();
      });

      const servingsInput = screen.getByLabelText(/default servings/i) as HTMLInputElement;
      // For number inputs, we need to clear via selecting all and then typing
      await user.click(servingsInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('6');

      expect(servingsInput).toHaveValue(6);
    });
  });

  describe('Account Section', () => {
    it('should have change password button', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
      });
    });

    it('should have delete account button', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
      });
    });

    it('should show password modal when change password is clicked', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
      });

      const changePasswordBtn = screen.getByRole('button', { name: /change password/i });
      await user.click(changePasswordBtn);

      // Modal should appear - look for the modal dialog role
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should show confirmation modal when delete account is clicked', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: /delete account/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });

    it('should close delete modal when cancel is clicked', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: /delete account/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      const { user } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // The error message contains "valid email" in "Please enter a valid email address"
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching user data', async () => {
      const { container } = render(<SettingsPage />);

      // Should show loading indicator initially
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
