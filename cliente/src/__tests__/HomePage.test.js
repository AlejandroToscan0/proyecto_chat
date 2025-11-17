import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '../components/HomePage';

const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
};

test('renderiza input de PIN y botón admin', () => {
    render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);
    expect(screen.getByPlaceholderText(/PIN de la Sala/i)).toBeInTheDocument();
    expect(screen.getByText(/Iniciar Sesión \(Admin\)/i)).toBeInTheDocument();
});

test('muestra error cuando el PIN no tiene 4 dígitos', () => {
    render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);
    const input = screen.getByPlaceholderText(/PIN de la Sala/i);
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.submit(input.closest('form'));
    expect(screen.getByText(/El PIN debe tener exactamente 4 números\./i)).toBeInTheDocument();
});
