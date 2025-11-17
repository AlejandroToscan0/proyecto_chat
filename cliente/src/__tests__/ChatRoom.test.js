import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoom from '../components/ChatRoom';

const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    id: 'socket-1',
};

const chatInfo = {
    pin: '1234',
    roomType: 'Multimedia',
    history: [
        { nickname: 'Alice', tipo: 'texto', contenido: 'Hola' },
        { nickname: 'Bob', tipo: 'archivo', nombre_archivo: 'pic.png', url: '/uploads/pic.png' }
    ],
    users: ['Alice', 'Bob'],
    nickname: 'Bob'
};

test('muestra mensajes y preview de imagen cuando es imagen', () => {
    render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);
    expect(screen.getByText(/Hola/)).toBeInTheDocument();
    // la imagen debe existir con alt igual al nombre del archivo
    expect(screen.getByAltText('pic.png')).toBeInTheDocument();
});

test('enviar mensaje dispara socket.emit', () => {
    render(<ChatRoom socket={mockSocket} chatInfo={chatInfo} onLeave={jest.fn()} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje.../i);
    fireEvent.change(input, { target: { value: 'hola mundo' } });
    fireEvent.submit(input.closest('form'));
    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', { contenido: 'hola mundo' });
});
