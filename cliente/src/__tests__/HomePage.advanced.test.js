import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../components/HomePage';

const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('HomePage - Validaciones de entrada', () => {
    test('permite solo números en el campo PIN', () => {
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);
        const input = screen.getByPlaceholderText(/PIN de la Sala/i);

        // intentar ingresar letras
        fireEvent.change(input, { target: { value: 'abcd' } });
        expect(input.value).toBe(''); // no debería aceptar letras

        // ingresar números
        fireEvent.change(input, { target: { value: '1234' } });
        expect(input.value).toBe('1234');
    });

    test('limita el PIN a 4 dígitos máximo', () => {
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);
        const input = screen.getByPlaceholderText(/PIN de la Sala/i);

        // el componente filtra caracteres no numéricos, pero maxLength controla longitud
        fireEvent.change(input, { target: { value: '1234' } });
        expect(input.value).toBe('1234');

        // Si intentamos poner más, el maxLength del input debería limitar
        // pero fireEvent.change puede saltarse ese límite, así que verificamos el comportamiento real
        expect(input).toHaveAttribute('maxLength', '4');
    }); test('muestra paso de nickname después de PIN válido', () => {
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);
        const pinInput = screen.getByPlaceholderText(/PIN de la Sala/i);

        fireEvent.change(pinInput, { target: { value: '1234' } });
        fireEvent.submit(pinInput.closest('form'));

        // debería mostrar el input de nickname
        expect(screen.getByPlaceholderText(/Nickname/i)).toBeInTheDocument();
    });

    test('muestra error si nickname está vacío', () => {
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);
        const pinInput = screen.getByPlaceholderText(/PIN de la Sala/i);

        // paso 1: ingresar PIN válido
        fireEvent.change(pinInput, { target: { value: '5678' } });
        fireEvent.submit(pinInput.closest('form'));

        // paso 2: intentar enviar nickname vacío
        const nicknameInput = screen.getByPlaceholderText(/Nickname/i);
        fireEvent.change(nicknameInput, { target: { value: '' } });
        fireEvent.submit(nicknameInput.closest('form'));

        expect(screen.getByText(/Debes ingresar un nickname/i)).toBeInTheDocument();
    });

    test('emite join_room con PIN y nickname correctos', () => {
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);

        // paso 1: PIN
        const pinInput = screen.getByPlaceholderText(/PIN de la Sala/i);
        fireEvent.change(pinInput, { target: { value: '9999' } });
        fireEvent.submit(pinInput.closest('form'));

        // paso 2: nickname
        const nicknameInput = screen.getByPlaceholderText(/Nickname/i);
        fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
        fireEvent.submit(nicknameInput.closest('form'));

        expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
            pin: '9999',
            nickname: 'TestUser'
        });
    });

    test('llama a onAdminClick cuando se hace clic en botón admin', () => {
        const mockAdminClick = jest.fn();
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={mockAdminClick} />);

        const adminButton = screen.getByText(/Iniciar Sesión \(Admin\)/i);
        fireEvent.click(adminButton);

        expect(mockAdminClick).toHaveBeenCalledTimes(1);
    });

    test('muestra estado de carga mientras se une', async () => {
        render(<HomePage socket={mockSocket} onJoinSuccess={jest.fn()} onAdminClick={jest.fn()} />);

        // completar PIN y nickname
        const pinInput = screen.getByPlaceholderText(/PIN de la Sala/i);
        fireEvent.change(pinInput, { target: { value: '1111' } });
        fireEvent.submit(pinInput.closest('form'));

        const nicknameInput = screen.getByPlaceholderText(/Nickname/i);
        fireEvent.change(nicknameInput, { target: { value: 'User1' } });

        const submitButton = screen.getByText(/¡Unirse!/i);
        fireEvent.click(submitButton);

        // debería mostrar "Entrando..."
        await waitFor(() => {
            expect(screen.getByText(/Entrando.../i)).toBeInTheDocument();
        });
    });
});
