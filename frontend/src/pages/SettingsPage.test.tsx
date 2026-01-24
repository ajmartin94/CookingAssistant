import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockUser } from '../test/mocks/data';

const BASE_URL = 'http://localhost:8000';

describe('SettingsPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Component: renders with empty defaults for new user', () => {
    it('should show empty dietary restrictions when user has none', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'newuser',
            email: 'new@example.com',
            full_name: 'New User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        // No dietary restriction checkboxes should be checked
        const vegetarianCheckbox = screen.getByRole('checkbox', { name: /vegetarian/i });
        expect(vegetarianCheckbox).not.toBeChecked();
      });

      const veganCheckbox = screen.getByRole('checkbox', { name: /vegan/i });
      expect(veganCheckbox).not.toBeChecked();

      const glutenFreeCheckbox = screen.getByRole('checkbox', { name: /gluten-free/i });
      expect(glutenFreeCheckbox).not.toBeChecked();
    });

    it('should show beginner skill level selected by default', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'newuser',
            email: 'new@example.com',
            full_name: 'New User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        const skillSelect = screen.getByRole('combobox', { name: /skill level/i });
        expect(skillSelect).toHaveValue('beginner');
      });
    });

    it('should show default servings of 4', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'newuser',
            email: 'new@example.com',
            full_name: 'New User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
        expect(servingsInput).toHaveValue(4);
      });
    });
  });

  describe('Component: loads and displays existing preferences', () => {
    it('should display saved dietary restrictions as checked', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: ['vegetarian', 'gluten-free'],
            skill_level: 'intermediate',
            default_servings: 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeChecked();
      });
      expect(screen.getByRole('checkbox', { name: /gluten-free/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /vegan/i })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: /dairy-free/i })).not.toBeChecked();
    });

    it('should display saved skill level as selected', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'advanced',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /skill level/i })).toHaveValue('advanced');
      });
    });

    it('should display saved default servings value', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      await waitFor(() => {
        const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
        expect(servingsInput).toHaveValue(8);
      });
    });

    it('should render all dietary restriction options', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      const dietaryOptions = [
        'vegetarian',
        'vegan',
        'gluten-free',
        'dairy-free',
        'keto',
        'paleo',
        'low-carb',
        'nut-free',
        'soy-free',
      ];

      for (const option of dietaryOptions) {
        expect(screen.getByRole('checkbox', { name: new RegExp(option, 'i') })).toBeInTheDocument();
      }
    });

    it('should render all skill level options', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /skill level/i })).toBeInTheDocument();
      });

      const skillSelect = screen.getByRole('combobox', { name: /skill level/i });
      const options = skillSelect.querySelectorAll('option');
      const optionValues = Array.from(options).map((o) => o.getAttribute('value'));
      expect(optionValues).toEqual(['beginner', 'intermediate', 'advanced']);
    });
  });

  describe('Component: submitting preferences calls API with correct payload', () => {
    it('should send correct dietary restrictions in request body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          const user = mockUser();
          return HttpResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.fullName,
            dietary_restrictions: capturedBody.dietary_restrictions,
            skill_level: capturedBody.skill_level,
            default_servings: capturedBody.default_servings,
            created_at: user.createdAt,
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      // Select dietary restrictions
      await user.click(screen.getByRole('checkbox', { name: /vegetarian/i }));
      await user.click(screen.getByRole('checkbox', { name: /keto/i }));

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
        expect(capturedBody!.dietary_restrictions).toEqual(
          expect.arrayContaining(['vegetarian', 'keto'])
        );
      });
    });

    it('should send correct skill level in request body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          const user = mockUser();
          return HttpResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.fullName,
            dietary_restrictions: capturedBody.dietary_restrictions,
            skill_level: capturedBody.skill_level,
            default_servings: capturedBody.default_servings,
            created_at: user.createdAt,
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /skill level/i })).toBeInTheDocument();
      });

      // Select skill level
      await user.selectOptions(screen.getByRole('combobox', { name: /skill level/i }), 'advanced');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
        expect(capturedBody!.skill_level).toBe('advanced');
      });
    });

    it('should send correct default servings in request body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          const user = mockUser();
          return HttpResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.fullName,
            dietary_restrictions: capturedBody.dietary_restrictions,
            skill_level: capturedBody.skill_level,
            default_servings: capturedBody.default_servings,
            created_at: user.createdAt,
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: /default servings/i })).toBeInTheDocument();
      });

      // Change servings
      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '12');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
        expect(capturedBody!.default_servings).toBe(12);
      });
    });
  });

  describe('Component: validation prevents invalid servings', () => {
    it('should show validation error when servings is less than 1', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: /default servings/i })).toBeInTheDocument();
      });

      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '0');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/servings must be between 1 and 100/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when servings is greater than 100', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: /default servings/i })).toBeInTheDocument();
      });

      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '101');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/servings must be between 1 and 100/i)).toBeInTheDocument();
      });
    });

    it('should not submit the form when validation fails', async () => {
      let apiCalled = false;

      server.use(
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async () => {
          apiCalled = true;
          return HttpResponse.json({});
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: /default servings/i })).toBeInTheDocument();
      });

      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '0');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Wait a bit and verify API was NOT called
      await waitFor(() => {
        expect(screen.getByText(/servings must be between 1 and 100/i)).toBeInTheDocument();
      });
      expect(apiCalled).toBe(false);
    });

    it('should clear validation error when valid value is entered', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: /default servings/i })).toBeInTheDocument();
      });

      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });

      // Enter invalid value and submit
      await user.clear(servingsInput);
      await user.type(servingsInput, '0');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/servings must be between 1 and 100/i)).toBeInTheDocument();
      });

      // Enter valid value
      await user.clear(servingsInput);
      await user.type(servingsInput, '5');

      await waitFor(() => {
        expect(screen.queryByText(/servings must be between 1 and 100/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Component: success message shown after save', () => {
    it('should display success message after preferences are saved', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should display error message when save fails', async () => {
      server.use(
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, () => {
          return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save preferences/i)).toBeInTheDocument();
      });
    });

    it('should hide success message after a few seconds', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Success message appears
      await waitFor(() => {
        expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
      });

      // Success message disappears after timeout
      await waitFor(
        () => {
          expect(screen.queryByText(/preferences saved successfully/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Integration: full save/reload cycle shows persisted values', () => {
    it('should persist preferences across page reloads', async () => {
      // Track what was saved so the next GET returns it
      let savedPreferences = {
        dietary_restrictions: [] as string[],
        skill_level: 'beginner',
        default_servings: 4,
      };

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: savedPreferences.dietary_restrictions,
            skill_level: savedPreferences.skill_level,
            default_servings: savedPreferences.default_servings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }),
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
          const body = (await request.json()) as typeof savedPreferences;
          savedPreferences = {
            dietary_restrictions:
              body.dietary_restrictions ?? savedPreferences.dietary_restrictions,
            skill_level: body.skill_level ?? savedPreferences.skill_level,
            default_servings: body.default_servings ?? savedPreferences.default_servings,
          };
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            ...savedPreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();

      // First render: make changes and save
      const { unmount } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      // Set preferences
      await user.click(screen.getByRole('checkbox', { name: /vegan/i }));
      await user.click(screen.getByRole('checkbox', { name: /nut-free/i }));
      await user.selectOptions(screen.getByRole('combobox', { name: /skill level/i }), 'advanced');

      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '10');

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
      });

      // Unmount (simulate leaving the page)
      unmount();

      // Re-render (simulate coming back to the page)
      render(<SettingsPage />);

      // Verify persisted values are displayed
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegan/i })).toBeChecked();
      });
      expect(screen.getByRole('checkbox', { name: /nut-free/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /vegetarian/i })).not.toBeChecked();
      expect(screen.getByRole('combobox', { name: /skill level/i })).toHaveValue('advanced');
      expect(screen.getByRole('spinbutton', { name: /default servings/i })).toHaveValue(10);
    });
  });
});
