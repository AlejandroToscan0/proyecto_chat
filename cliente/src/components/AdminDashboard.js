import React, { useState, useEffect, useCallback } from 'react'; // <-- ¡Añadir useCallback!
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

const AdminDashboard = ({ token, onLogout }) => {
    // --- Estados para la creación de salas ---
    const [tipo, setTipo] = useState('Texto');
    const [salaInfo, setSalaInfo] = useState(null);
    const [loadingCreate, setLoadingCreate] = useState(false);
    
    // --- Estados para la lista de salas ---
    const [salas, setSalas] = useState([]);
    const [loadingSalas, setLoadingSalas] = useState(false);
    const [error, setError] = useState('');
    
    // --- Estados para el modal de historial ---
    const [historialSala, setHistorialSala] = useState(null); 
    const [loadingHistorial, setLoadingHistorial] = useState(false);

    // --- Encabezados de autorización (Auth Headers) ---
    // Lo definimos aquí para usarlo en las dependencias
    const authHeaders = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // --- ¡ARREGLO! Envolvemos fetchSalas en useCallback ---
    // Le decimos a React que esta función solo debe cambiar si 'token' cambia.
    const fetchSalas = useCallback(async () => {
        setLoadingSalas(true);
        setError('');
        try {
            // Usamos una variable local para authHeaders por consistencia
            const localAuthHeaders = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${BASE_URL}/admin/salas`, localAuthHeaders);
            setSalas(response.data);
        } catch (err) {
            console.error("Error al cargar salas:", err);
            setError(err.response?.data?.error || "Error al cargar lista de salas.");
        } finally {
            setLoadingSalas(false);
        }
    }, [token]); // <-- La función ahora depende de 'token'

    // --- ¡ARREGLO! Añadimos fetchSalas al array de dependencias ---
    useEffect(() => {
        fetchSalas();
    }, [fetchSalas]); // <-- Ahora es una dependencia válida

    // --- Función para crear una sala ---
    const handleCrearSala = async (e) => {
        e.preventDefault();
        setError('');
        setSalaInfo(null);
        setLoadingCreate(true);
        try {
            const response = await axios.post(
                `${BASE_URL}/crear-sala`,
                { tipo },
                authHeaders
            );
            setSalaInfo(response.data); 
            fetchSalas(); // Recarga la lista
        } catch (err) {
            setError(err.response?.data?.error || "Error al crear sala.");
        } finally {
            setLoadingCreate(false);
        }
    };

    // --- Función para ver el historial ---
    const handleVerHistorial = async (id_sala) => {
        setLoadingHistorial(true);
        setError('');
        try {
            const response = await axios.get(`${BASE_URL}/admin/sala/${id_sala}`, authHeaders);
            setHistorialSala(response.data); 
        } catch (err) {
            setError(err.response?.data?.error || "Error al cargar historial.");
        } finally {
            setLoadingHistorial(false);
        }
    };

    // --- Función para eliminar una sala ---
    const handleEliminarSala = async (id_sala) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la sala ${id_sala}? Esta acción es irreversible.`)) {
            return;
        }
        setError('');
        try {
            await axios.delete(`${BASE_URL}/admin/sala/${id_sala}`, authHeaders);
            fetchSalas(); // Recarga la lista
        } catch (err) {
            setError(err.response?.data?.error || "Error al eliminar la sala.");
        }
    };

    // --- Renderizado del componente ---
    return (
        <div style={styles.container}>
            {/* --- Modal de Historial --- */}
            {historialSala && (
                <HistorialModal 
                    sala={historialSala} 
                    onClose={() => setHistorialSala(null)} 
                />
            )}

            {/* --- Cabecera --- */}
            <div style={styles.header}>
                <h2 style={styles.title}>Panel de Administración</h2>
                <button onClick={onLogout} style={styles.logoutButton}>Cerrar Sesión</button>
            </div>
            
            {/* --- Sección de Crear Sala --- */}
            <div style={styles.section}>
                <h3 style={styles.subtitle}>Crear Nueva Sala</h3>
                <form onSubmit={handleCrearSala} style={styles.form}>
                    <label style={styles.label}>Tipo de Sala:</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={styles.select}>
                        <option value="Texto">Texto (solo mensajes)</option>
                        <option value="Multimedia">Multimedia (mensajes y archivos)</option>
                    </select>
                    <button type="submit" disabled={loadingCreate} style={styles.button}>
                        {loadingCreate ? 'Creando...' : 'Crear Sala'}
                    </button>
                </form>
                {salaInfo && (
                    <div style={styles.infoBox}>
                        <h3 style={styles.infoTitle}>Sala Creada con Éxito</h3>
                        <p><strong>PIN de Acceso:</strong> <span style={styles.pin}>{salaInfo.pin}</span></p>
                    </div>
                )}
            </div>

            {/* --- Lista de Salas --- */}
            <div style={styles.section}>
                <h3 style={styles.subtitle}>Salas Activas ({salas.length})</h3>
                <button onClick={fetchSalas} disabled={loadingSalas} style={styles.refreshButton}>
                    {loadingSalas ? 'Cargando...' : 'Refrescar Lista'}
                </button>
                {error && <p style={styles.error}>{error}</p>}
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>ID Sala</th>
                            <th>PIN</th>
                            <th>Tipo</th>
                            <th>Usuarios</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salas.map((sala) => (
                            <tr key={sala.id_sala}>
                                <td>{sala.id_sala}</td>
                                <td>{sala.pin}</td>
                                <td>{sala.tipo}</td>
                                <td>{sala.usuarios_conectados.length}</td>
                                <td style={styles.actionsCell}>
                                    <button 
                                        onClick={() => handleVerHistorial(sala.id_sala)} 
                                        style={styles.actionButtonView}
                                        disabled={loadingHistorial}
                                    >
                                        Ver Historial
                                    </button>
                                    <button 
                                        onClick={() => handleEliminarSala(sala.id_sala)} 
                                        style={styles.actionButtonDelete}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Componente Modal ---
const HistorialModal = ({ sala, onClose }) => {
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h3>Historial de la Sala: {sala.id_sala}</h3>
                    <button onClick={onClose} style={styles.modalCloseButton}>&times;</button>
                </div>
                <div style={styles.modalBody}>
                    {sala.mensajes.length === 0 ? (
                        <p>No hay mensajes en esta sala.</p>
                    ) : (
                        sala.mensajes.map((msg, index) => (
                            <div key={index} style={styles.messageItem}>
                                <strong>{msg.nickname}</strong> 
                                <span style={styles.messageTimestamp}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                                </span>
                                <p style={styles.messageContent}>
                                    {msg.tipo === 'archivo' ? 
                                        `[Archivo] ${msg.nombre_archivo}` : 
                                        msg.contenido}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


// --- ESTILOS ---
const styles = {
    container: {
        maxWidth: '900px',
        margin: '30px auto',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#2f3136',
        color: '#ffffff',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    title: {
        color: '#ffffff',
    },
    logoutButton: {
        padding: '8px 15px',
        backgroundColor: '#f04747',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    section: {
        marginBottom: '30px',
        paddingBottom: '30px',
        borderBottom: '1px dashed #40444b'
    },
    subtitle: {
        color: '#ffffff',
        borderBottom: '1px solid #40444b',
        paddingBottom: '10px'
    },
    error: {
        color: '#f04747',
        marginTop: '15px',
        fontWeight: 'bold'
    },
    form: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
    },
    label: {
        fontWeight: 'bold',
        color: '#b9bbbe'
    },
    select: {
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #202225',
        fontSize: '16px',
        flex: 1,
        backgroundColor: '#40444b',
        color: 'white'
    },
    button: {
        padding: '10px 15px',
        backgroundColor: '#43b581',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    infoBox: {
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#202225',
        borderRadius: '6px',
    },
    infoTitle: {
        margin: 0,
        color: '#5865F2',
    },
    pin: {
        fontWeight: 'bold',
        color: '#ffffff',
        fontSize: '18px',
        backgroundColor: '#40444b',
        padding: '2px 8px',
        borderRadius: '4px'
    },
    refreshButton: {
        padding: '8px 12px',
        backgroundColor: '#5865F2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '15px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        border: '1px solid #40444b',
        padding: '10px',
        textAlign: 'left',
        backgroundColor: '#202225',
    },
    td: {
        border: '1px solid #40444b',
        padding: '10px',
        textAlign: 'left',
    },
    actionsCell: {
        display: 'flex',
        gap: '5px'
    },
    actionButtonView: {
        padding: '5px 8px',
        backgroundColor: '#5865F2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    actionButtonDelete: {
        padding: '5px 8px',
        backgroundColor: '#f04747',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '80%',
        maxWidth: '700px',
        maxHeight: '80vh',
        backgroundColor: '#2f3136',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
    },
    modalHeader: {
        padding: '15px 20px',
        borderBottom: '1px solid #40444b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalCloseButton: {
        fontSize: '24px',
        fontWeight: 'bold',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'white'
    },
    modalBody: {
        padding: '20px',
        overflowY: 'auto'
    },
    messageItem: {
        borderBottom: '1px solid #40444b',
        padding: '10px 0',
    },
    messageTimestamp: {
        fontSize: '0.8rem',
        color: '#b9bbbe',
        marginLeft: '10px'
    },
    messageContent: {
        margin: '5px 0 0 0',
        color: 'white',
        wordWrap: 'break-word'
    }
};

export default AdminDashboard;