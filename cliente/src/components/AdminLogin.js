import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

// Añadimos 'onBack'
const AdminLogin = ({ onLoginSuccess, onBack }) => {
    const [usuario, setUsuario] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${BASE_URL}/admin-login`, {
                usuario,
                password,
            });
            onLoginSuccess(response.data.token, usuario);
        } catch (err) {
            setError(err.response?.data?.error || "Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Fondo blanco para que contraste
        <div style={{...styles.container, backgroundColor: '#fff', color: '#333'}}>
            
            {/* Botón de Volver */}
            <button onClick={onBack} style={styles.backButton}>&larr; Volver</button>

            <h2 style={styles.title}>Login de Administrador</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="text"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                />
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Cargando...' : 'Acceder'}
                </button>
            </form>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
};

// --- ¡NUEVOS ESTILOS! ---
const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '30px',
        borderRadius: '8px',
        backgroundColor: '#2f3136', // Dark 2
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'transparent',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        color: '#b9bbbe'
    },
    title: {
        marginBottom: '20px',
        color: '#ffffff'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    input: {
        padding: '12px',
        borderRadius: '5px',
        border: '1px solid #202225',
        fontSize: '16px',
        backgroundColor: '#40444b',
        color: 'white'
    },
    button: {
        padding: '12px',
        backgroundColor: '#5865F2', // Blurple
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    error: {
        color: '#f04747', // Red
        marginTop: '15px'
    }
};

export default AdminLogin;