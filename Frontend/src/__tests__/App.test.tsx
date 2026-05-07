/// <reference types="vitest" />

import { render } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  test('renderiza correctamente', () => {
    render(<App />)

    expect(document.body).toBeInTheDocument()
  })
})