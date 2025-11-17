import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '../components/HomePage';

const MockSocket = () => ({ on: jest.fn(), off: jest.fn(), emit: jest.fn() });

test('valida PIN y muestra siguiente paso', () => {
    const socket = MockSocket();
    const onJoinSuccess = jest.fn();
    const onAdminClick = jest.fn();

    render(<HomePage socket={socket} onJoinSuccess={onJoinSuccess} onAdminClick={onAdminClick} />);

    // Input PIN inválido
    const input = screen.getByPlaceholderText(/PIN de la Sala/i);
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.submit(input);
    expect(screen.getByText(/El PIN debe tener exactamente 4 números./i)).toBeInTheDocument();

    // Input PIN válido
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.submit(input);

    // Ahora debe aparecer el input de nickname
    const nickInput = screen.getByPlaceholderText(/Nickname/i);
    expect(nickInput).toBeInTheDocument();
});
