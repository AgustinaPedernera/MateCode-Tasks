
import { describe, it, expect } from 'vitest'

describe('Mi primer test', () => {
  it('debería sumar dos números correctamente', () => {
    const resultado = 2 + 3

    expect(resultado).toBe(5)
  })
})
