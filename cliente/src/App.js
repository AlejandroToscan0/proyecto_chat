import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Importamos todos nuestros componentes
import HomePage from './components/HomePage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ChatRoom from './components/ChatRoom';
import './App.css'; 

// URL de tu backend
const SOCKET_URL = 'http://localhost:5001';

function App() {
    // --- ESTADO GLOBAL DE LA APP ---
    const [view, setView] = useState('home'); // 'home' | 'admin_login' | 'admin_dashboard' | 'chat'
    const [socket, setSocket] = useState(null);
    const [adminToken, setAdminToken] = useState(null);
    // { nickname, pin, roomType, history, users }
    const [chatInfo, setChatInfo] = useState(null); 

    // --- CONEXIÓN DE SOCKET.IO ---
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);
        console.log("Socket.IO conectado.");

        return () => {
            console.log("Desconectando socket...");
            newSocket.disconnect();
        };
    }, []); 

    // --- MANEJADORES DE NAVEGACIÓN ---

    const onAdminLoginSuccess = (token) => {
        setAdminToken(token);
        setView('admin_dashboard'); 
    };

    const onAdminLogout = () => {
        setAdminToken(null);
        setView('home'); 
    };
    
    // ¡MODIFICADO! Acepta 'users' para arreglar el bug
    const onJoinSuccess = (nickname, pin, roomType, history, users) => {
        setChatInfo({ nickname, pin, roomType, history, users }); 
        setView('chat'); 
    };
    
    // ¡MODIFICADO! Desconecta el socket al salir
    const onLeaveChat = () => {
        if (socket) {
            socket.disconnect(); 
        }
        setChatInfo(null);
        setView('home');
        // Opcional: recargar si la reconexión da problemas
        window.location.reload(); 
    };

    // --- RENDERIZADOR PRINCIPAL ---
    
    const renderContent = () => {
        switch (view) {
            case 'admin_login':
                return <AdminLogin 
                            onLoginSuccess={onAdminLoginSuccess} 
                            onBack={() => setView('home')} 
                        />;
            case 'admin_dashboard':
                return adminToken ? 
                    <AdminDashboard token={adminToken} onLogout={onAdminLogout} /> :
                    <AdminLogin onLoginSuccess={onAdminLoginSuccess} onBack={() => setView('home')} />;
            case 'chat':
                return <ChatRoom 
                            socket={socket} 
                            chatInfo={chatInfo} 
                            onLeave={onLeaveChat} 
                        />;
            case 'home':
            default:
                return <HomePage 
                            socket={socket} 
                            onJoinSuccess={onJoinSuccess}
                            onAdminClick={() => setView('admin_login')} 
                        />;
        }
    };

    return (
        <div className="App">
            {renderContent()}
        </div>
    );
}

export default App;