import { describe, it, expect } from 'vitest'
import { createWebsiteSchema } from '@/types'

describe('createWebsiteSchema', () => {
  it('accepts valid website creation input', () => {
    const validInput = {
      name: 'My Portfolio',
      description: 'A personal portfolio website',
      subdomain: 'my-portfolio',
    }
    const result = createWebsiteSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('My Portfolio')
      expect(result.data.description).toBe('A personal portfolio website')
      expect(result.data.subdomain).toBe('my-portfolio')
    }
  })

  it('accepts valid input without optional description', () => {
    const validInput = {
      name: 'My Website',
      subdomain: 'mywebsite',
    }
    const result = createWebsiteSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects input with missing name', () => {
    const invalidInput = {
      subdomain: 'my-site',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects input with empty name', () => {
    const invalidInput = {
      name: '',
      subdomain: 'my-site',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects subdomain with uppercase letters', () => {
    const invalidInput = {
      name: 'My Site',
      subdomain: 'My-Site',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects subdomain starting with a hyphen', () => {
    const invalidInput = {
      name: 'My Site',
      subdomain: '-my-site',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects subdomain ending with a hyphen', () => {
    const invalidInput = {
      name: 'My Site',
      subdomain: 'my-site-',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects subdomain shorter than 3 characters', () => {
    const invalidInput = {
      name: 'My Site',
      subdomain: 'ab',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects subdomain with special characters', () => {
    const invalidInput = {
      name: 'My Site',
      subdomain: 'my_site!',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 characters', () => {
    const invalidInput = {
      name: 'a'.repeat(101),
      subdomain: 'my-site',
    }
    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})
