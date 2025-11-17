import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoom from '../components/ChatRoom';

const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    id: 'test-socket-id',
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ChatRoom - Renderizado de mensajes', () => {
    test('muestra mensajes del sistema correctamente', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [
                { nickname: 'Sistema', tipo: 'texto', contenido: 'Alice se ha unido a la sala.' }
            ],
            users: ['Alice'],
            nickname: 'Alice'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);
        expect(screen.getByText(/Alice se ha unido a la sala./i)).toBeInTheDocument();
    });

    test('muestra el PIN y tipo de sala en el header', () => {
        const chatInfo = {
            pin: '5678',
            roomType: 'Multimedia',
            history: [],
            users: ['Bob'],
            nickname: 'Bob'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);
        expect(screen.getByText(/PIN: 5678/i)).toBeInTheDocument();
        expect(screen.getByText(/Tipo: Multimedia/i)).toBeInTheDocument();
    });

    test('renderiza archivo PDF como enlace (no imagen)', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Multimedia',
            history: [
                { nickname: 'Charlie', tipo: 'archivo', nombre_archivo: 'documento.pdf', url: '/uploads/documento.pdf' }
            ],
            users: ['Charlie'],
            nickname: 'Charlie'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);

        // debe haber un enlace con el nombre del archivo
        const link = screen.getByText(/documento.pdf/i);
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe('A');
    });

    test('distingue entre mensajes propios y de otros', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [
                { nickname: 'Alice', tipo: 'texto', contenido: 'Hola desde Alice' },
                { nickname: 'Bob', tipo: 'texto', contenido: 'Hola desde Bob' }
            ],
            users: ['Alice', 'Bob'],
            nickname: 'Alice' // Alice es el usuario actual
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);

        // ambos mensajes deben estar presentes
        expect(screen.getByText(/Hola desde Alice/i)).toBeInTheDocument();
        expect(screen.getByText(/Hola desde Bob/i)).toBeInTheDocument();

        // Bob aparece múltiples veces (en mensaje y lista usuarios)
        const bobElements = screen.getAllByText('Bob');
        expect(bobElements.length).toBeGreaterThan(0);
    });
});

describe('ChatRoom - Interacciones', () => {
    test('limpia el input después de enviar mensaje', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [],
            users: ['TestUser'],
            nickname: 'TestUser'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);

        const input = screen.getByPlaceholderText(/Escribe un mensaje.../i);
        fireEvent.change(input, { target: { value: 'Mensaje de prueba' } });
        expect(input.value).toBe('Mensaje de prueba');

        fireEvent.submit(input.closest('form'));

        // después de enviar, el input debe estar vacío
        expect(input.value).toBe('');
    });

    test('no envía mensajes vacíos', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [],
            users: ['User1'],
            nickname: 'User1'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);

        const input = screen.getByPlaceholderText(/Escribe un mensaje.../i);
        fireEvent.change(input, { target: { value: '   ' } }); // solo espacios
        fireEvent.submit(input.closest('form'));

        // no debería llamar a emit porque el mensaje está vacío
        expect(mockSocket.emit).not.toHaveBeenCalledWith('send_message', expect.anything());
    });

    test('botón de salir llama a onLeave', () => {
        const mockOnLeave = jest.fn();
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [],
            users: ['User1'],
            nickname: 'User1'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={mockOnLeave} />);

        const leaveButton = screen.getByText(/Salir/i);
        fireEvent.click(leaveButton);

        expect(mockOnLeave).toHaveBeenCalledTimes(1);
    });

    test('muestra botón de adjuntar solo en salas Multimedia', () => {
        const chatInfoMultimedia = {
            pin: '1234',
            roomType: 'Multimedia',
            history: [],
            users: ['User1'],
            nickname: 'User1'
        };

        const { rerender } = render(<ChatRoom socket={mockSocket} chatInfo={chatInfoMultimedia} onLeave={jest.fn()} />);
        expect(screen.getByText('📎')).toBeInTheDocument();

        // cambiar a sala de texto
        const chatInfoTexto = { ...chatInfoMultimedia, roomType: 'Texto' };
        rerender(<ChatRoom socket={mockSocket} chatInfo={chatInfoTexto} onLeave={jest.fn()} />);

        expect(screen.queryByText('📎')).not.toBeInTheDocument();
    });
});

describe('ChatRoom - Lista de usuarios', () => {
    test('muestra el número correcto de usuarios conectados', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [],
            users: ['Alice', 'Bob', 'Charlie'],
            nickname: 'Alice'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);
        expect(screen.getByText(/Usuarios Conectados \(3\)/i)).toBeInTheDocument();
    });

    test('marca el usuario actual con "(Tú)"', () => {
        const chatInfo = {
            pin: '1234',
            roomType: 'Texto',
            history: [],
            users: ['Alice', 'Bob'],
            nickname: 'Alice'
        };

        render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);
        expect(screen.getByText(/Alice.*\(Tú\)/i)).toBeInTheDocument();
    });
});
