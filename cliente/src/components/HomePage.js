import React, { useState, useEffect } from 'react';

const HomePage = ({ socket, onJoinSuccess, onAdminClick }) => {
    const [step, setStep] = useState('pin'); 
    const [pin, setPin] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (!socket) return;

        const handleError = (data) => {
            setError(data.error);
            setLoading(false);
            setStep('pin'); 
        };

        const handleSuccess = (data) => {
            setLoading(false);
            onJoinSuccess(
                nickname, 
                pin, 
                data.roomType, 
                data.history,
                data.users
            ); 
        };

        socket.on('join_error', handleError);
        socket.on('chat_history', handleSuccess); 

        return () => {
            socket.off('join_error', handleError);
            socket.off('chat_history', handleSuccess);
        };
    }, [socket, nickname, pin, onJoinSuccess]);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        // ¡VALIDACIÓN! Asegura que el PIN tenga 4 dígitos
        if (pin.length !== 4) {
            setError("El PIN debe tener exactamente 4 números.");
            return;
        }
        
        setStep('nickname');
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        setError('');

        // ¡VALIDACIÓN! Asegura que el nickname no esté vacío
        if (nickname.trim() === '') {
            setError("Debes ingresar un nickname.");
            return;
        }
        
        if (!socket) {
            setError("No se pudo conectar al servidor. Intenta de nuevo.");
            return;
        }
        setLoading(true);
        socket.emit('join_room', { pin, nickname });
    };

    // ¡NUEVO! Función para validar el PIN en tiempo real
    const handlePinChange = (e) => {
        const val = e.target.value;
        // Solo permite números usando una Expresión Regular
        if (/^[0-9]*$/.test(val)) {
            setPin(val);
        }
    };

    // ¡NUEVO! Función para validar el Nickname en tiempo real
    const handleNicknameChange = (e) => {
        const val = e.target.value;
        // Solo permite letras, números, espacios, guiones bajos y guiones
        if (/^[a-zA-Z0-9\s_-]*$/.test(val)) {
            setNickname(val);
        }
    };

    return (
        <div style={styles.fullscreen}>
            <header style={styles.header}>
                <button onClick={onAdminClick} style={styles.adminButton}>
                    Iniciar Sesión (Admin)
                </button>
            </header>

            <main style={styles.main}>
                <h1 style={styles.title}>
                    <span style={styles.brandPart1}>Chat</span>
                    <span style={styles.brandPart2}>ESPE</span>
                </h1>

                {step === 'pin' && (
                    <form onSubmit={handlePinSubmit} style={styles.form}>
                        <input
                            type="text" 
                            inputMode="numeric" 
                            placeholder="PIN de la Sala"
                            value={pin}
                            onChange={handlePinChange} // ¡MODIFICADO!
                            maxLength={4} // ¡NUEVO!
                            style={styles.input}
                        />
                        <button type="submit" style={styles.button}>
                            Ingresar
                        </button>
                    </form>
                )}

                {step === 'nickname' && (
                    <form onSubmit={handleJoinSubmit} style={styles.form}>
                         <input
                            type="text"
                            placeholder="Nickname"
                            value={nickname}
                            onChange={handleNicknameChange} // ¡MODIFICADO!
                            maxLength={20} // ¡NUEVO!
                            autoFocus
                            style={styles.input}
                        />
                        <button type="submit" disabled={loading} style={styles.button}>
                            {loading ? 'Entrando...' : '¡Unirse!'}
                        </button>
                    </form>
                )}
                {error && <p style={styles.error}>{error}</p>}
            </main>
        </div>
    );
};

// ... (Los estilos son los mismos de antes)
const styles = {
    fullscreen: {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#36393f',
        color: 'white',
    },
    header: {
        width: '100%',
        padding: '20px',
        textAlign: 'right',
    },
    adminButton: {
        backgroundColor: 'transparent',
        border: '1px solid #b9bbbe',
        color: '#b9bbbe',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    title: {
        fontSize: '3.5rem',
        fontWeight: 'bold',
        marginBottom: '40px',
        color: '#ffffff'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '300px',
    },
    input: {
        padding: '15px',
        borderRadius: '5px',
        border: 'none',
        fontSize: '1.2rem',
        textAlign: 'center',
        fontWeight: 'bold',
        backgroundColor: '#40444b',
        color: 'white',
    },
    button: {
        padding: '15px',
        backgroundColor: '#5865F2', // Blurple
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1.2rem',
        fontWeight: 'bold',
    },
    error: {
        color: '#f04747', // Red
        marginTop: '15px',
        fontWeight: 'bold',
    }
};

export default HomePage;