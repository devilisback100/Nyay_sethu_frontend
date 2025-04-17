import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { FaPlus, FaTrash, FaPaperPlane, FaBars, FaTimes } from 'react-icons/fa';
import './LegalHelp.css';

export function LegalHelp() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    const navigate = useNavigate();

    const validateToken = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication required. Please login.');
            localStorage.clear();
            navigate('/auth');
            return false;
        }
        return true;
    };

    useEffect(() => {
        const fetchChats = async () => {
            if (!validateToken()) return;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${BACKEND_URL}/api/chats/list`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    console.error('[ERROR] Token expired or invalid');
                    setError('Session expired. Please login again.');
                    localStorage.clear();
                    navigate('/auth');
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch chats');
                }

                const data = await response.json();
                setChats(Array.isArray(data) ? data : []);
                console.log('[INFO] Chats fetched:', data);
            } catch (err) {
                console.error('[ERROR] Error fetching chats:', err);
                setError(err.message || 'Failed to load chats. Please try again.');
                setTimeout(() => setError(null), 5000);
            }
        };

        fetchChats();
    }, [BACKEND_URL, navigate]);

    const fetchMessages = async (chatId) => {
        if (chatId.startsWith('temp_')) {
            console.warn('[WARN] Skipping fetch for temporary chat ID:', chatId);
            return;
        }

        if (!validateToken()) return;

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            const nyaysathiId = localStorage.getItem('nyaysathiId');
            const userType = localStorage.getItem('userType');
            console.log('[DEBUG] Fetching messages for chat:', chatId, { userId, nyaysathiId, userType, token });

            const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[ERROR] Fetch messages failed:', errorData);
                throw new Error(errorData.error || 'Failed to fetch messages');
            }

            const data = await response.json();
            setMessages(data.messages || []);
            console.log('[INFO] Messages fetched for chat:', chatId, data);
        } catch (err) {
            console.error('[ERROR] Error fetching messages:', err);
            setError(err.message || 'Failed to load messages.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !validateToken()) return;

        const isNewChat = !chatId || chatId?.startsWith('temp_');
        setLoading(true);

        try {
            let actualChatId = chatId;
            const userId = localStorage.getItem('userId');
            const nyaysathiId = localStorage.getItem('nyaysathiId');
            const userType = localStorage.getItem('userType');
            const chatUserId = userType === 'nyaysathi' ? nyaysathiId : userId;
            if (!chatUserId) {
                throw new Error('User or NyaySathi ID not found in localStorage');
            }

            if (isNewChat) {
                const payload = {
                    is_ai_chat: true,
                    messages: [],
                    status: 'active',
                    user_id: chatUserId,
                };
                console.log('[DEBUG] Creating new chat with payload:', payload);

                const chatResponse = await fetch(`${BACKEND_URL}/api/chats/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (!chatResponse.ok) {
                    const errorData = await chatResponse.json();
                    console.error('[ERROR] Chat creation failed:', errorData);
                    throw new Error(errorData.error || 'Failed to create chat');
                }

                const chatData = await chatResponse.json();
                actualChatId = chatData.chat_id;
                setChatId(actualChatId);

                setChats(prev => [
                    {
                        chat_id: actualChatId,
                        is_ai_chat: true,
                        created_at: new Date().toISOString(),
                        last_message: { message_text: newMessage, timestamp: new Date().toISOString() },
                        user_id: chatUserId,
                    },
                    ...prev,
                ]);
            }

            const messagePayload = {
                receiver_id: 'ai_bot',
                message_text: newMessage,
                message_type: 'text',
            };

            const userMessage = {
                ...messagePayload,
                sender_id: chatUserId,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, userMessage]);
            setNewMessage('');

            const response = await fetch(`${BACKEND_URL}/api/chats/messages/add/${actualChatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(userMessage),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[ERROR] Message addition failed:', errorData);
                throw new Error(errorData.error || 'Failed to add message to chat');
            }

            console.log('[INFO] Message added successfully:', userMessage);

            const modelResponse = await fetch(`${process.env.REACT_APP_Model_Backend}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage,
                    history: [...messages, userMessage].map(msg => ({
                        type: msg.sender_id === 'ai_bot' ? 'bot' : 'user',
                        content: msg.message_text,
                    })),
                    location: localStorage.getItem('city') || 'Unknown',
                    preferred_language: localStorage.getItem('preferred_language') || 'English',
                }),
            });

            if (!modelResponse.ok) {
                const errorData = await modelResponse.json();
                throw new Error(errorData.error || 'Failed to get AI response');
            }
            const modelData = await modelResponse.json();

            const botMessage = {
                sender_id: 'ai_bot',
                receiver_id: chatUserId,
                message_text: modelData.response,
                message_type: 'text',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, botMessage]);

            setChats(prev =>
                prev.map(chat =>
                    chat.chat_id === actualChatId
                        ? {
                            ...chat,
                            last_message: {
                                message_text: modelData.response,
                                timestamp: new Date().toISOString(),
                            },
                        }
                        : chat
                )
            );
        } catch (err) {
            console.error('[ERROR] Error sending message:', err);
            setError(err.message || 'Failed to send message');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const deleteChat = async (chatId) => {
        if (!validateToken()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/chats/delete/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete chat');
            }

            setChats(prev => prev.filter(chat => chat.chat_id !== chatId));
            if (chatId === chatId) setChatId(null);
            console.log('[INFO] Chat deleted:', chatId);
        } catch (err) {
            console.error('[ERROR] Error deleting chat:', err);
            setError(err.message || 'Failed to delete chat');
            setTimeout(() => setError(null), 5000);
        }
    };

    const createNewChat = () => {
        const tempId = `temp_${Date.now()}`;
        const newChat = {
            chat_id: tempId,
            is_ai_chat: true,
            created_at: new Date().toISOString(),
            messages: [],
            last_message: { message_text: "New conversation" },
            user_id: localStorage.getItem('userId') || localStorage.getItem('nyaysathiId'),
        };

        setChats(prev => [newChat, ...prev]);
        setChatId(tempId);
        setMessages([]);
        setIsSidebarOpen(false);
        console.log('[INFO] New temporary chat created:', tempId);
    };

    const handleFirstMessage = async (tempChatId) => {
        if (!validateToken()) return null;

        try {
            const userId = localStorage.getItem('userId');
            const nyaysathiId = localStorage.getItem('nyaysathiId');
            const userType = localStorage.getItem('userType');
            const chatUserId = userType === 'nyaysathi' ? nyaysathiId : userId;
            if (!chatUserId) {
                throw new Error('User or NyaySathi ID not found in localStorage');
            }

            const response = await fetch(`${BACKEND_URL}/api/chats/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    is_ai_chat: true,
                    messages: [],
                    status: 'active',
                    user_id: chatUserId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create chat');
            }

            const data = await response.json();
            setChats(prev => prev.map(chat =>
                chat.chat_id === tempChatId ? { ...chat, chat_id: data.chat_id } : chat
            ));
            setChatId(data.chat_id);
            console.log('[INFO] Permanent chat created:', data.chat_id);
            return data.chat_id;
        } catch (err) {
            console.error('[ERROR] Error creating permanent chat:', err);
            setError(err.message || 'Failed to create chat');
            setTimeout(() => setError(null), 5000);
            throw err;
        }
    };

    const handleChatClick = (selectedChatId) => {
        if (chatId !== selectedChatId) {
            setChatId(selectedChatId);
            setMessages([]);
            console.log('[INFO] Selected chat:', selectedChatId);
        }
    };

    useEffect(() => {
        if (chatId) {
            fetchMessages(chatId);
        }
    }, [chatId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const getChatPreview = (chat) => {
        if (!chat.last_message?.message_text && (!chat.messages || chat.messages.length === 0)) {
            return "Start a new conversation";
        }

        const lastMessage = chat.last_message?.message_text || chat.messages?.[chat.messages.length - 1]?.message_text || 'New conversation';
        const words = lastMessage.split(/\s+/);
        if (words.length <= 3) {
            return lastMessage.length > 25 ? lastMessage.slice(0, 25) + '...' : lastMessage;
        }
        return words.slice(0, 3).join(' ') + '...';
    };

    const getChatName = (chat) => {
        if (!chat.created_at) return "New Chat";

        const timestamp = new Date(chat.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        const preview = chat.last_message?.message_text || "New conversation";
        const truncatedPreview = preview.length > 20 ? `${preview.slice(0, 20)}...` : preview;

        return `${truncatedPreview} (${timestamp})`;
    };

    return (
        <div className="legal-help">
            {error && (
                <div className="error-toast">
                    {error}
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}
            <div className={`chat-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <button
                    className="sidebar-toggle"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
                <button className="new-chat-button" onClick={createNewChat}>
                    <FaPlus /> New Chat
                </button>
                {chats.map((chat) => (
                    <div
                        key={chat.chat_id}
                        className={`chat-item ${chat.chat_id === chatId ? 'active' : ''}`}
                        onClick={() => handleChatClick(chat.chat_id)}
                    >
                        <div className="chat-item-content">
                            <p className="chat-name">{getChatName(chat)}</p>
                            <div className="chat-preview">
                                {getChatPreview(chat)}
                            </div>
                        </div>
                        <button
                            className="delete-chat-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(chat.chat_id);
                            }}
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>
            <div className={`chat-main ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
                <div className="messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.sender_id === 'ai_bot' ? 'ai' : 'user'}`}>
                            <div className="message-content">
                                {msg.sender_id === 'ai_bot' ? (
                                    <div
                                        className="message-text"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message_text) }}
                                    />
                                ) : (
                                    <div className="message-text">{msg.message_text}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="message-input">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your legal query here..."
                        disabled={loading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <button
                        className="send-button"
                        onClick={sendMessage}
                        disabled={loading || !newMessage.trim()}
                    >
                        {loading ? 'Sending...' : <FaPaperPlane />}
                    </button>
                </div>
            </div>
        </div>
    );
}