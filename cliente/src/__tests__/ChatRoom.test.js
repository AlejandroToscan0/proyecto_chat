import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoom from '../components/ChatRoom';

const makeSocket = () => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    id: 'socket-1'
});

test('muestra mensajes de texto y archivos, y emite send_message', () => {
    const socket = makeSocket();
    const chatInfo = {
        nickname: 'me',
        pin: '1234',
        roomType: 'Multimedia',
        history: [
            { nickname: 'me', tipo: 'texto', contenido: 'hola' },
            { nickname: 'other', tipo: 'archivo', nombre_archivo: 'file.pdf', url: '/uploads/file.pdf' },
            { nickname: 'other', tipo: 'archivo', nombre_archivo: 'image.png', url: '/uploads/image.png' },
        ],
        users: ['me', 'other']
    };

    const onLeave = jest.fn();
    render(<ChatRoom socket={socket} chatInfo={chatInfo} onLeave={onLeave} />);

    // Texto
    expect(screen.getByText(/hola/i)).toBeInTheDocument();

    // Archivo no imagen -> link
    expect(screen.getByText(/file.pdf/i)).toBeInTheDocument();

    // Imagen -> img element
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);

    // Enviar mensaje
    const input = screen.getByPlaceholderText(/Escribe un mensaje/i);
    fireEvent.change(input, { target: { value: 'mensaje de prueba' } });
    fireEvent.submit(input);
    expect(socket.emit).toHaveBeenCalledWith('send_message', { contenido: 'mensaje de prueba' });
});
