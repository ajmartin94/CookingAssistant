import { APIRequestContext } from '@playwright/test';

export class APIHelper {
  constructor(
    private request: APIRequestContext,
    private baseURL: string = 'http://localhost:8000'
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
}
