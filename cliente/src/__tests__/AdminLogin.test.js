import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from '../components/AdminLogin';
import axios from 'axios';

jest.mock('axios');

test('realiza login y llama onLoginSuccess', async () => {
    const token = 'fake.token';
    axios.post.mockResolvedValueOnce({ data: { token } });

    const onLoginSuccess = jest.fn();
    const onBack = jest.fn();

    render(<AdminLogin onLoginSuccess={onLoginSuccess} onBack={onBack} />);

    const button = screen.getByRole('button', { name: /Acceder/i });
    fireEvent.click(button);

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(token, 'admin'));
});
