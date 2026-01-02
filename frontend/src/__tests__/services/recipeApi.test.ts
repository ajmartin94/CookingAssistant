/**
 * Recipe API Tests
 *
 * Tests recipe API service functions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { getRecipes, createRecipe, getRecipe, updateRecipe, deleteRecipe } from '../../services/recipeApi'

describe('recipeApi', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token')
  })

  describe('getRecipes', () => {
    it('fetches list of recipes', async () => {
      const result = await getRecipes()

      expect(result).toBeDefined()
      expect(result.recipes).toBeInstanceOf(Array)
      expect(result.recipes.length).toBeGreaterThan(0)
      expect(result.total).toBe(1)
    })

    it('returns pagination info', async () => {
      const result = await getRecipes()

      expect(result.page).toBe(1)
      expect(result.page_size).toBe(20)
      expect(result.total_pages).toBe(1)
    })
  })

  describe('createRecipe', () => {
    it('creates a new recipe', async () => {
      const recipeData = {
        title: 'New Recipe',
        ingredients: [{ name: 'salt', amount: '1', unit: 'tsp', notes: '' }],
        instructions: [{ step_number: 1, instruction: 'Add salt', duration_minutes: 1 }],
      }

      const result = await createRecipe(recipeData)

      expect(result).toBeDefined()
      expect(result.id).toBe('2')
      expect(result.title).toBe('New Recipe')
    })
  })

  describe('getRecipe', () => {
    it('fetches a single recipe by ID', async () => {
      const result = await getRecipe('1')

      expect(result).toBeDefined()
      expect(result.id).toBe('1')
      expect(result.title).toBe('Test Recipe')
    })
  })

  describe('updateRecipe', () => {
    it('updates an existing recipe', async () => {
      const updateData = { title: 'Updated Recipe' }

      const result = await updateRecipe('1', updateData)

      expect(result).toBeDefined()
      expect(result.title).toBe('Updated Recipe')
    })
  })

  describe('deleteRecipe', () => {
    it('deletes a recipe', async () => {
      await expect(deleteRecipe('1')).resolves.not.toThrow()
    })
  })
})
