import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';

describe('AdminLogin - Renderizado básico', () => {
    test('renderiza campos de usuario y contraseña', () => {
        render(<AdminLogin onLoginSuccess={jest.fn()} onBack={jest.fn()} />);

        expect(screen.getByPlaceholderText(/Usuario/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByText(/Acceder/i)).toBeInTheDocument();
    }); test('muestra botón de volver', () => {
        render(<AdminLogin onLoginSuccess={jest.fn()} onBack={jest.fn()} />);
        expect(screen.getByText(/Volver/i)).toBeInTheDocument();
    });
});

describe('AdminDashboard - Renderizado básico', () => {
    test('renderiza título del dashboard', () => {
        render(<AdminDashboard token="fake-token" onLogout={jest.fn()} />);
        expect(screen.getByText(/Panel de Administración/i)).toBeInTheDocument();
    });

    test('muestra botones de crear sala y cerrar sesión', () => {
        render(<AdminDashboard token="fake-token" onLogout={jest.fn()} />);
        expect(screen.getByText(/Crear Sala/i)).toBeInTheDocument();
        expect(screen.getByText(/Cerrar Sesión/i)).toBeInTheDocument();
    });
});
