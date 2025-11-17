import { render, screen } from '@testing-library/react';
import App from './App';

test('muestra la pantalla principal (Home) con el título Chat', () => {
  render(<App />);
  const title = screen.getByText(/Chat/i);
  expect(title).toBeInTheDocument();
});
