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

  describe('Component: Settings page renders preference controls', () => {
    it('should render dietary restriction checkboxes, skill level select, and servings input', async () => {
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

      // Wait for form to load and verify dietary restriction checkboxes render
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      // Verify all dietary options are present
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

      // Verify existing preferences are loaded correctly
      expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /gluten-free/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /vegan/i })).not.toBeChecked();

      // Verify skill level select renders with all options and correct value
      const skillSelect = screen.getByRole('combobox', { name: /skill level/i });
      expect(skillSelect).toBeInTheDocument();
      expect(skillSelect).toHaveValue('intermediate');
      const options = skillSelect.querySelectorAll('option');
      const optionValues = Array.from(options).map((o) => o.getAttribute('value'));
      expect(optionValues).toEqual(['beginner', 'intermediate', 'advanced']);

      // Verify servings input renders with correct value
      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      expect(servingsInput).toBeInTheDocument();
      expect(servingsInput).toHaveValue(6);
    });
  });

  describe('Component: Saving preferences calls API with correct payload', () => {
    it('should send dietary restrictions, skill level, and servings in the request body', async () => {
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

      // Select skill level
      await user.selectOptions(screen.getByRole('combobox', { name: /skill level/i }), 'advanced');

      // Change servings
      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '12');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify API was called with correct payload
      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });

      expect(capturedBody!.dietary_restrictions).toEqual(
        expect.arrayContaining(['vegetarian', 'keto'])
      );
      expect(capturedBody!.skill_level).toBe('advanced');
      expect(capturedBody!.default_servings).toBe(12);
    });
  });

  describe('Component: Success message shown after save', () => {
    it('should display success message after preferences are saved', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify success message appears
      await waitFor(() => {
        expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration: Full save/reload cycle shows persisted values', () => {
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
