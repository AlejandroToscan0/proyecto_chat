import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 

const API_URL = 'http://localhost:5001/api';

const ChatRoom = ({ socket, chatInfo, onLeave }) => {
    
    const [messages, setMessages] = useState(chatInfo.history || []);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState(chatInfo.users || []);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    // --- EFECTOS (HOOKS) ---

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };
        socket.on('new_message', handleNewMessage);

        const handleUserList = (userList) => {
            setUsers(userList);
        };
        socket.on('update_user_list', handleUserList);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('update_user_list', handleUserList);
        };
    }, [socket]);

    // --- MANEJADORES DE EVENTOS ---

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !socket) return;

        socket.emit('send_message', {
            contenido: newMessage,
        });
        setNewMessage('');
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('socket_id', socket.id);

        try {
            await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } catch (err) {
            console.error("Error al subir archivo:", err);
            const errorMsg = err.response?.data?.error || "Error desconocido";
            setUploadError(`Fallo al subir: ${errorMsg}`);
        } finally {
            setUploading(false);
            event.target.value = null;
        }
    };

    // --- ¡NUEVO! Función para chequear si es imagen ---
    const isImageFile = (filename) => {
        if (!filename) return false;
        // Obtenemos la extensión y la pasamos a minúsculas
        const extension = filename.split('.').pop().toLowerCase();
        // Chequeamos contra la lista de extensiones de imagen permitidas
        return ['png', 'jpg', 'jpeg', 'gif'].includes(extension);
    };

    // --- RENDERIZADO (¡MODIFICADO!) ---
    const renderMessage = (msg, index) => {
        const isMe = msg.nickname === chatInfo.nickname;
        
        // Mensaje del sistema
        if (msg.nickname === 'Sistema') {
            return (
                <div key={index} style={styles.systemMessage}>
                    <em>{msg.contenido}</em>
                </div>
            );
        }

        // ¡LÓGICA DE ARCHIVO MODIFICADA!
        if (msg.tipo === 'archivo') {
            const fileUrl = `http://localhost:5001${msg.url}`;
            
            // Si es una IMAGEN, muestra <img>
            if (isImageFile(msg.nombre_archivo)) {
                return (
                    <div key={index} style={isMe ? styles.myMessage : styles.otherMessage}>
                        {!isMe && <strong style={styles.nickname}>{msg.nickname}</strong>}
                        <div style={{...styles.messageContent, padding: '5px', backgroundColor: isMe ? '#007bff' : '#f0f0f0'}}>
                            {/* Hacemos la imagen un link para verla en grande */}
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                <img 
                                    src={fileUrl} 
                                    alt={msg.nombre_archivo} 
                                    style={styles.imagePreview} // ¡Nuevo estilo!
                                />
                            </a>
                            <p style={{margin: '5px 0 0 5px', fontSize: '0.9rem', color: isMe ? '#fff' : '#333'}}>
                                {msg.nombre_archivo}
                            </p>
                        </div>
                    </div>
                );
            } 
            
            // Si NO es imagen (PDF, TXT, etc.), muestra el enlace <a>
            return (
                <div key={index} style={isMe ? styles.myMessage : styles.otherMessage}>
                    {!isMe && <strong style={styles.nickname}>{msg.nickname}</strong>}
                    <div style={{...styles.messageContent, backgroundColor: isMe ? '#007bff' : '#f0f0f0', color: isMe ? 'white' : '#333'}}>
                        <p style={{margin: 0, fontWeight: 'bold'}}>Archivo Adjunto:</p>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{color: isMe ? '#fff' : '#007bff', textDecoration: 'underline'}}
                        >
                            {msg.nombre_archivo}
                        </a>
                    </div>
                </div>
            );
        }
        
        // Mensaje de texto normal
        return (
            <div key={index} style={isMe ? styles.myMessage : styles.otherMessage}>
                {!isMe && <strong style={styles.nickname}>{msg.nickname}</strong>}
                <p style={styles.messageContent}>{msg.contenido}</p>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Sala de Chat (PIN: {chatInfo.pin}) - Tipo: {chatInfo.roomType}</h2>
                <button onClick={onLeave} style={styles.leaveButton}>Salir</button>
            </div>
            
            <div style={styles.mainContent}>
                <div style={styles.chatArea}>
                    <div style={styles.chatWindow}>
                        {messages.map(renderMessage)}
                        <div ref={chatEndRef} />
                    </div>
                    
                    <form onSubmit={handleSendMessage} style={styles.inputArea}>
                        {chatInfo.roomType === 'Multimedia' && (
                            <>
                                <button 
                                    type="button" 
                                    onClick={triggerFileInput} 
                                    style={styles.attachButton} 
                                    disabled={uploading}
                                >
                                    {uploading ? '...' : '📎'}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }} 
                                />
                            </>
                        )}
                        
                        <input 
                            type="text" 
                            placeholder="Escribe un mensaje..." 
                            style={styles.textInput}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" style={styles.sendButton}>Enviar</button>
                    </form>
                    {uploadError && <p style={styles.uploadError}>{uploadError}</p>}
                </div>

                <div style={styles.userList}>
                    <h3>Usuarios Conectados ({users.length})</h3>
                    <ul>
                        {users.map((user, index) => (
                            <li key={index} style={user === chatInfo.nickname ? styles.myNickname : {}}>
                                {user} {user === chatInfo.nickname && "(Tú)"}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// --- ESTILOS ---
// (Se añade un nuevo estilo 'imagePreview')
const styles = {
    container: {
        width: '100vw', // Ocupa toda la ventana
        height: '100vh',
        margin: '0',
        borderRadius: '0',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#2f3136' // Dark 2
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#2f3136',
        borderBottom: '1px solid #202225',
        color: '#ffffff'
    },
    title: {
        margin: 0,
        fontSize: '1.2rem'
    },
    leaveButton: {
        padding: '8px 15px',
        backgroundColor: '#f04747',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    mainContent: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
    },
    chatArea: {
        flex: 1, // Ocupa todo el espacio menos la lista de usuarios
        display: 'flex',
        flexDirection: 'column',
    },
    chatWindow: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#36393f' // Dark 1
    },
    userList: {
        flexBasis: '240px', // Ancho fijo para la lista de usuarios
        padding: '10px 20px',
        backgroundColor: '#2f3136', // Dark 2
        overflowY: 'auto',
        color: '#b9bbbe',
        borderLeft: '1px solid #202225'
    },
    userListUl: {
        listStyle: 'none',
        paddingLeft: 0,
    },
    myNickname: {
        fontWeight: 'bold',
        color: '#ffffff',
        padding: '5px 0'
    },
    otherNickname: {
        padding: '5px 0',
        color: '#b9bbbe'
    },
    inputArea: {
        display: 'flex',
        padding: '10px 20px',
        backgroundColor: '#36393f', // Dark 1
    },
    textInput: {
        flex: 1,
        padding: '12px',
        border: 'none',
        borderRadius: '5px',
        fontSize: '15px',
        backgroundColor: '#40444b',
        color: 'white'
    },
    sendButton: {
        padding: '10px 20px',
        backgroundColor: '#5865F2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        marginLeft: '10px'
    },
    attachButton: {
        padding: '10px 15px',
        backgroundColor: '#40444b',
        color: '#b9bbbe',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        marginRight: '10px'
    },
    uploadError: {
        color: '#f04747',
        padding: '0 20px 5px 20px',
        fontSize: '0.8rem',
        backgroundColor: '#36393f'
    },
    imagePreview: {
        maxWidth: '100%',
        maxHeight: '300px',
        borderRadius: '5px',
        display: 'block',
        cursor: 'pointer',
        marginTop: '5px'
    },
    myMessage: {
        textAlign: 'right',
        margin: '10px 0',
    },
    otherMessage: {
        textAlign: 'left',
        margin: '10px 0',
    },
    messageContent: {
        display: 'inline-block',
        padding: '8px 12px',
        borderRadius: '10px',
        margin: '2px 0 0 0',
        maxWidth: '70%',
        wordWrap: 'break-word',
        backgroundColor: '#40444b', // Burbuja de otros
        color: '#b9bbbe',
        textAlign: 'left'
    },
    nickname: {
        fontSize: '0.9rem',
        color: '#ffffff',
        marginLeft: '5px',
        fontWeight: 'bold'
    },
    systemMessage: {
        textAlign: 'center',
        color: '#b9bbbe',
        fontStyle: 'italic',
        fontSize: '0.9rem',
        margin: '10px 0'
    }
};

styles.myMessage.messageContent = {
    ...styles.messageContent,
    backgroundColor: '#5865F2', // Burbuja mía (Blurple)
    color: 'white',
};

export default ChatRoom;