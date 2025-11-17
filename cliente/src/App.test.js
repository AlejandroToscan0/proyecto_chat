import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza la aplicación correctamente', () => {
  render(<App />);
  // Verifica que existe el título ChatESPE
  expect(screen.getByText(/Chat/i)).toBeInTheDocument();
  expect(screen.getByText(/ESPE/i)).toBeInTheDocument();
});
