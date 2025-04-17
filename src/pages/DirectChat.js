import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaImage, FaVideo, FaPaperPlane, FaPlus } from 'react-icons/fa';
import './DirectChat.css';

export function DirectChat({ chatId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatDetails, setChatDetails] = useState(null);
    const [partnerDetails, setPartnerDetails] = useState(null);
    const [error, setError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(0);
    const [isUserActive, setIsUserActive] = useState(true);
    const [fetchingMessages, setFetchingMessages] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const pollingTimeoutRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { chat_id: chatIdFromParams } = useParams();
    const chatIdFromState = location?.state?.chat_id;

    const chat_id = chatId || chatIdFromParams || chatIdFromState;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const ACTIVE_POLLING_INTERVAL = 10000;
    const INACTIVE_POLLING_INTERVAL = 30000;

    const userType = localStorage.getItem('userType');
    const isNyaySathi = userType === 'nyaysathi';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '60px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight > 120 ? '120px' : `${scrollHeight}px`;
        }
    }, [newMessage]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication required. Please log in again.');
            navigate('/auth');
            return;
        }

        console.log('[DEBUG] Local storage on mount:', {
            userType: localStorage.getItem('userType'),
            userId: localStorage.getItem('userId'),
            email: localStorage.getItem('email')
        });

        if (chat_id) {
            fetchChatDetails(true);
        }

        const resetUserActivity = () => setIsUserActive(true);
        const markUserInactive = () => setIsUserActive(false);

        window.addEventListener('mousemove', resetUserActivity);
        window.addEventListener('keypress', resetUserActivity);
        window.addEventListener('click', resetUserActivity);
        window.addEventListener('scroll', resetUserActivity);

        const inactivityTimer = setTimeout(markUserInactive, 120000);

        return () => {
            window.removeEventListener('mousemove', resetUserActivity);
            window.removeEventListener('keypress', resetUserActivity);
            window.removeEventListener('click', resetUserActivity);
            window.removeEventListener('scroll', resetUserActivity);
            clearTimeout(inactivityTimer);
            clearTimeout(pollingTimeoutRef.current);
        };
    }, [chat_id, navigate]);

    useEffect(() => {
        if (!chat_id || !chatDetails) return;

        const scheduleNextFetch = () => {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = setTimeout(() => {
                if (!fetchingMessages) {
                    fetchChatDetails(false).finally(scheduleNextFetch);
                } else {
                    scheduleNextFetch();
                }
            }, isUserActive ? ACTIVE_POLLING_INTERVAL : INACTIVE_POLLING_INTERVAL);
        };

        scheduleNextFetch();

        return () => clearTimeout(pollingTimeoutRef.current);
    }, [chat_id, chatDetails, isUserActive, fetchingMessages]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setIsUserActive(true);
                fetchChatDetails(true);
            } else {
                setIsUserActive(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [chat_id]);

    useEffect(() => {
        if (!chatDetails) return;

        console.log('[DEBUG] Chat details in partner effect:', chatDetails);

        const partnerDetails = isNyaySathi ? chatDetails.user_details : chatDetails.nyaysathi_details;
        if (partnerDetails) {
            setPartnerDetails(partnerDetails);
            console.log('[INFO] Partner details set from chat:', partnerDetails);
        } else {
            console.error('[ERROR] Partner details missing in chat response:', {
                user_details: chatDetails.user_details,
                nyaysathi_details: chatDetails.nyaysathi_details,
                isNyaySathi
            });
            setError('Could not load partner details.');
        }
    }, [chatDetails, isNyaySathi]);

    const fetchChatDetails = async (fullRefresh = false) => {
        if (fetchingMessages) return;

        setFetchingMessages(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token missing');
            }

            const endpoint = fullRefresh
                ? `${BACKEND_URL}/api/chats/details`
                : `${BACKEND_URL}/api/chats/${chat_id}/messages`;

            console.log(`[DEBUG] Fetching chat details as ${isNyaySathi ? 'nyaysathi' : 'user'} for chat ${chat_id} (${fullRefresh ? 'full' : 'messages'})`);

            const response = await fetch(endpoint, {
                method: fullRefresh ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: fullRefresh ? JSON.stringify({ chat_id }) : undefined,
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error('[ERROR] API response error:', errData);
                throw new Error(`Fetch failed: ${response.status} ${errData.error || 'Unknown error'}`);
            }

            setLastFetchTime(Date.now());
            const data = await response.json();
            console.log('[INFO] Chat API response:', data);

            if (fullRefresh) {
                if (data && data.chat_id) {
                    setChatDetails(data);
                    setMessages(data.messages || []);
                    console.log('[DEBUG] Set chat details:', {
                        chat_id: data.chat_id,
                        user_id: data.user_id,
                        nyaysathi_id: data.nyaysathi_id,
                        user_details: data.user_details,
                        nyaysathi_details: data.nyaysathi_details
                    });
                } else {
                    console.error('[ERROR] Invalid chat data:', data);
                    setError('Invalid chat data received.');
                }
            } else {
                if (data.messages?.length) {
                    setMessages(prev => [...prev, ...data.messages]);
                }
            }
        } catch (err) {
            console.error('[ERROR] Error fetching chat details:', err);
            if (fullRefresh) {
                setError(`Could not load chat: ${err.message}`);
            }
        } finally {
            setFetchingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedImage) return;

        const senderId = localStorage.getItem('userId');
        let receiverId = isNyaySathi ? chatDetails?.user_id : chatDetails?.nyaysathi_id;

        // Validate userType against senderId and chatDetails
        let correctedUserType = userType;
        if (chatDetails && senderId) {
            if (senderId === chatDetails.nyaysathi_id && userType !== 'nyaysathi') {
                console.warn('[WARN] userType mismatch: expected nyaysathi, found user. Correcting...');
                correctedUserType = 'nyaysathi';
                localStorage.setItem('userType', 'nyaysathi');
            } else if (senderId === chatDetails.user_id && userType !== 'user') {
                console.warn('[WARN] userType mismatch: expected user, found nyaysathi. Correcting...');
                correctedUserType = 'user';
                localStorage.setItem('userType', 'user');
            }
        }

        // Recompute isNyaySathi and receiverId with corrected userType
        const isNyaySathiCorrected = correctedUserType === 'nyaysathi';
        receiverId = isNyaySathiCorrected ? chatDetails?.user_id : chatDetails?.nyaysathi_id;

        console.log('[DEBUG] Sender and receiver:', {
            senderId,
            receiverId,
            userType: correctedUserType,
            isNyaySathi: isNyaySathiCorrected,
            chatDetails: {
                user_id: chatDetails?.user_id,
                nyaysathi_id: chatDetails?.nyaysathi_id
            }
        });

        if (!senderId || !receiverId) {
            setError('Sender or receiver information missing. Please reload the chat.');
            console.error('[ERROR] Missing sender or receiver:', {
                senderId,
                receiverId,
                chatDetails,
                localStorage: {
                    userType: localStorage.getItem('userType'),
                    userId: localStorage.getItem('userId')
                }
            });
            return;
        }

        if (senderId === receiverId) {
            setError('Cannot send message to yourself.');
            console.error('[ERROR] Sender and receiver are the same:', { senderId, receiverId });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            if (newMessage.trim()) {
                console.log('[DEBUG] Sending message:', {
                    sender_id: senderId,
                    receiver_id: receiverId,
                    message_text: newMessage.trim(),
                });

                const res = await fetch(`${BACKEND_URL}/api/chats/messages/add/${chat_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        sender_id: senderId,
                        receiver_id: receiverId,
                        message_text: newMessage.trim(),
                        message_type: 'text',
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    console.error('[ERROR] Message send error:', errData);
                    throw new Error(`Text send failed: ${errData.error}`);
                }

                const newMsg = {
                    sender_id: senderId,
                    receiver_id: receiverId,
                    message_text: newMessage.trim(),
                    message_type: 'text',
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');
            }

            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                formData.append('sender_id', senderId);
                formData.append('receiver_id', receiverId);

                const res = await fetch(`${BACKEND_URL}/api/chats/messages/upload/${chat_id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!res.ok) {
                    const errData = await res.json();
                    console.error('[ERROR] Image upload error:', errData);
                    throw new Error(`Image upload failed: ${errData.error}`);
                }

                await fetchChatDetails(true);
                setSelectedImage(null);
            }

            setIsUserActive(true);
        } catch (err) {
            console.error('[ERROR] Error sending message:', err);
            setError(`Message failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
            setSelectedImage(file);
        } else {
            setError('Only images under 5MB allowed.');
        }
    };

    const isCurrentUserSender = (id) => {
        const currentId = localStorage.getItem('userId');
        return id && currentId && id.toString() === currentId.toString();
    };

    if (!chat_id) {
        return (
            <div className="direct-chat empty-state">
                <div className="empty-chat-container">
                    <h2>No Chat Selected</h2>
                    <p>Please go to your appointments and click "Start Chat".</p>
                    <button
                        className="new-chat-button"
                        onClick={() => navigate(isNyaySathi ? '/nyaysathi' : '/appointments')}
                    >
                        <FaPlus /> Go to Appointments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="direct-chat">
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
            <div className="chat-header">
                {chatDetails && partnerDetails ? (
                    <div className="chat-partner-info">
                        <div className="partner-preview">
                            <div className="preview-avatar">
                                {partnerDetails.profile_picture ? (
                                    <img src={partnerDetails.profile_picture} alt={partnerDetails.name} />
                                ) : (
                                    <span>{partnerDetails.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <div className="preview-details">
                                <h3>{partnerDetails.name || 'Unknown'}</h3>
                                {isNyaySathi ? (
                                    <p>Client</p>
                                ) : (
                                    <p>{partnerDetails.specialization || 'N/A'}</p>
                                )}
                                <p>{partnerDetails.location?.city || 'N/A'}, {partnerDetails.location?.state || 'N/A'}</p>
                            </div>
                        </div>
                        {chatDetails.appointment_date && (
                            <div className="appointment-info">
                                Appointment: {new Date(chatDetails.appointment_date).toLocaleString()}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>Loading chat information...</div>
                )}
            </div>

            <div className="chat-messages">
                {!chatDetails ? (
                    <p className="loading-messages">Loading chat...</p>
                ) : messages.length === 0 ? (
                    <p className="no-messages">No messages yet. Say hi 👋</p>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`message ${isCurrentUserSender(msg.sender_id) ? 'sent' : 'received'}`}>
                            {msg.message_type === 'image' && msg.image_url && (
                                <img
                                    src={msg.image_url}
                                    alt="shared"
                                    className="message-image"
                                    onClick={() => window.open(msg.image_url, '_blank')}
                                />
                            )}
                            {msg.message_text && <div className="message-text">{msg.message_text}</div>}
                            <span className="message-time">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                {selectedImage && (
                    <div className="image-preview">
                        <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                        <button onClick={() => setSelectedImage(null)}>✕</button>
                    </div>
                )}
                <div className="input-container">
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={loading || !chatDetails}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <div className="input-actions">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                        />
                        <button onClick={() => fileInputRef.current.click()} disabled={!chatDetails}>
                            <FaImage />
                        </button>
                        <button onClick={() => alert('Video call coming soon!')} disabled={!chatDetails}>
                            <FaVideo />
                        </button>
                        <button onClick={handleSendMessage} disabled={loading || (!newMessage.trim() && !selectedImage)}>
                            {loading ? '...' : <FaPaperPlane />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}