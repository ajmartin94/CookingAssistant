import { APIRequestContext } from '@playwright/test';

// E2E uses port 8001 to avoid conflicts with dev server on 8000
const E2E_BACKEND_PORT = 8001;

export class APIHelper {
  constructor(
    private request: APIRequestContext,
    private baseURL: string = `http://localhost:${E2E_BACKEND_PORT}`
  ) {}

  async registerUser(username: string, email: string, password: string, fullName?: string) {
    const response = await this.request.post(`${this.baseURL}/api/v1/users/register`, {
      data: {
        username,
        email,
        password,
        full_name: fullName || username,
      },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Registration failed: ${text}`);
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<string> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.request.post(`${this.baseURL}/api/v1/users/login`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Login failed: ${text}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async createRecipe(token: string, recipeData: any) {
    const response = await this.request.post(`${this.baseURL}/api/v1/recipes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: recipeData,
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Recipe creation failed: ${text}`);
    }

    return response.json();
  }

  async deleteRecipe(token: string, recipeId: string) {
    const response = await this.request.delete(`${this.baseURL}/api/v1/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Recipe deletion failed: ${text}`);
    }
  }

  async getRecipe(token: string, recipeId: string) {
    const response = await this.request.get(`${this.baseURL}/api/v1/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get recipe: ${text}`);
    }

    return response.json();
  }

  async getRecipes(token: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseURL}/api/v1/recipes`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await this.request.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get recipes: ${text}`);
    }

    return response.json();
  }

  // Library API methods
  async createLibrary(token: string, libraryData: {
    name: string;
    description?: string;
    is_public?: boolean;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/v1/libraries`, {
      headers: { Authorization: `Bearer ${token}` },
      data: libraryData,
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Library creation failed: ${text}`);
    }

    return response.json();
  }

  async getLibraries(token: string) {
    const response = await this.request.get(`${this.baseURL}/api/v1/libraries`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get libraries: ${text}`);
    }

    return response.json();
  }

  async getLibrary(token: string, libraryId: string) {
    const response = await this.request.get(`${this.baseURL}/api/v1/libraries/${libraryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get library: ${text}`);
    }

    return response.json();
  }

  async updateLibrary(token: string, libraryId: string, libraryData: {
    name?: string;
    description?: string;
    is_public?: boolean;
  }) {
    const response = await this.request.put(`${this.baseURL}/api/v1/libraries/${libraryId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: libraryData,
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Library update failed: ${text}`);
    }

    return response.json();
  }

  async deleteLibrary(token: string, libraryId: string) {
    const response = await this.request.delete(`${this.baseURL}/api/v1/libraries/${libraryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Library deletion failed: ${text}`);
    }
  }

  async addRecipeToLibrary(token: string, libraryId: string, recipeId: string) {
    const response = await this.request.post(
      `${this.baseURL}/api/v1/libraries/${libraryId}/recipes/${recipeId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to add recipe to library: ${text}`);
    }

    return response.json();
  }

  async removeRecipeFromLibrary(token: string, libraryId: string, recipeId: string) {
    const response = await this.request.delete(
      `${this.baseURL}/api/v1/libraries/${libraryId}/recipes/${recipeId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to remove recipe from library: ${text}`);
    }
  }

  // Sharing API methods
  async createShare(token: string, data: {
    recipe_id?: string;
    library_id?: string;
    permission?: 'view' | 'edit';
  }) {
    const response = await this.request.post(`${this.baseURL}/api/v1/shares`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Share creation failed: ${text}`);
    }

    return response.json();
  }

  async getSharedRecipe(shareToken: string) {
    const response = await this.request.get(
      `${this.baseURL}/api/v1/shares/token/${shareToken}/recipe`
    );

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get shared recipe: ${text}`);
    }

    return response.json();
  }

  async getMyShares(token: string) {
    const response = await this.request.get(`${this.baseURL}/api/v1/shares/my-shares`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get shares: ${text}`);
    }

    return response.json();
  }

  async revokeShare(token: string, shareId: string) {
    const response = await this.request.delete(`${this.baseURL}/api/v1/shares/${shareId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to revoke share: ${text}`);
    }
  }

  // User Preferences API methods
  async getUserPreferences(token: string) {
    const response = await this.request.get(`${this.baseURL}/api/v1/users/me/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to get user preferences: ${text}`);
    }

    return response.json();
  }

  async updateUserPreferences(token: string, preferences: {
    dietary_restrictions?: string[];
    skill_level?: string;
    default_servings?: number;
  }) {
    const response = await this.request.patch(`${this.baseURL}/api/v1/users/me/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
      data: preferences,
    });

    if (!response.ok()) {
      const text = await response.text();
      throw new Error(`Failed to update user preferences: ${text}`);
    }

    return response.json();
  }
}
