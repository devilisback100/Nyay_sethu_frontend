import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { IoMdSend } from "react-icons/io";
import { FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './LegalHelp.css';

function getChatDisplayName(chat) {
    if (chat.name && chat.name.trim()) return chat.name;
    if (chat.messages && Array.isArray(chat.messages) && chat.messages.length >= 3) {
        const thirdMessage = chat.messages[2];
        if (thirdMessage && thirdMessage.message_text) {
            let chatName = thirdMessage.message_text.trim();
            if (chatName.length > 30) chatName = chatName.substring(0, 30) + '...';
            return chatName;
        }
    }
    if (chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0) {
        const firstMessage = chat.messages[0];
        if (firstMessage && firstMessage.message_text) {
            let chatName = firstMessage.message_text.trim();
            if (chatName.length > 30) chatName = chatName.substring(0, 30) + '...';
            return chatName;
        }
    }
    if (!chat.created_at) return chat.is_ai_chat ? 'AI Legal Assistant' : 'User Chat';
    const created = new Date(chat.created_at);
    const now = new Date();
    const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msInDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((nowDay - createdDay) / msInDay);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return created.toLocaleDateString(undefined, { weekday: 'long' });
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 21) return '2 weeks ago';
    if (diffDays < 28) return '3 weeks ago';
    if (diffDays < 60) return '1 month ago';
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    if (years === 1) return '1 year ago';
    return `${years} years ago`;
}

const formatAIResponse = (text) => {
    if (!text) return '';
    let formattedText = text
        .replace(/\*\*\*(.*?)\*\*\*/g, '<h4 class="ai-heading">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\d+\.\s+(.+)$/gm, '<li class="ai-list-item">$1</li>')
        .replace(/^[*-]\s+(.+)$/gm, '<li class="ai-list-item">$1</li>')
        .replace(/Section\s+(\d+[A-Z]*)\s*:?\s*/gi, '<span class="legal-section">Section $1:</span> ')
        .replace(/(\d+[A-Z]*)\s+IPC/gi, '<span class="legal-reference">$1 IPC</span>')
        .replace(/\n/g, '<br>');
    formattedText = formattedText.replace(
        /(<li class="ai-list-item">.*?<\/li>)(?:\s*<br>\s*<li class="ai-list-item">.*?<\/li>)*/gs,
        (match) => '<ul class="ai-list">' + match.replace(/<br>\s*/g, '') + '</ul>'
    );
    formattedText = formattedText.replace(
        /(police at \d+|helpline at \d+|contact \d+)/gi,
        '<span class="emergency-contact">$1</span>'
    );
    formattedText = formattedText.replace(
        /(immediate danger|emergency|urgent|important)/gi,
        '<span class="important-warning">$1</span>'
    );
    return formattedText;
};

export function LegalHelp() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState([]);
    const [userLocation, setUserLocation] = useState('Delhi, India');
    const [preferredLanguage, setPreferredLanguage] = useState('English');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatsLoaded, setChatsLoaded] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [showSidebarHint, setShowSidebarHint] = useState(true);
    const [isGuest, setIsGuest] = useState(!localStorage.getItem('token'));
    const [guestMessageCount, setGuestMessageCount] = useState(0);
    const messagesEndRef = useRef(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const MODEL_BACKEND_URL = process.env.REACT_APP_Model_Backend;
    const navigate = useNavigate();

    const getOrCreateUserId = () => {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = `anon_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('userId', userId);
        }
        return userId;
    };

    useEffect(() => {
        // Ensure userId is set before any API calls
        getOrCreateUserId();
        fetchChats();
    }, [BACKEND_URL, navigate]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();
                        const city = data.address.city || data.address.town || data.address.village || "";
                        const state = data.address.state || "";
                        const country = data.address.country || "";
                        const fullLocation = [city, state, country].filter(Boolean).join(", ");
                        setUserLocation(fullLocation || "Delhi, India");
                    } catch (error) {
                        setUserLocation("Delhi, India");
                    }
                },
                () => setUserLocation("Delhi, India")
            );
        } else {
            setUserLocation("Geolocation not supported");
        }
    }, []);

    const fetchChats = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || getOrCreateUserId();

        if (!token) {
            setIsGuest(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/chats/guest/${userId}/chats`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) throw new Error('Failed to fetch guest chats');
                const data = await response.json();

                // Apply consistent formatting to guest messages
                const formattedChats = data.map(chat => ({
                    ...chat,
                    messages: (chat.messages || []).map(msg => {
                        // Keep original message text for all messages
                        return {
                            ...msg,
                            message_text: msg.message_text
                        };
                    })
                }));

                const totalMessages = formattedChats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);
                setChats(formattedChats);
                setGuestMessageCount(totalMessages);
                setChatsLoaded(true);
            } catch (err) {
                console.error('Error fetching guest chats:', err);
                setChatsLoaded(true);
            }
            return;
        }

        // For registered users - make sure to set isGuest to false
        setIsGuest(false);

        try {
            const response = await fetch(`${BACKEND_URL}/api/chats/list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.status === 401) {
                localStorage.clear();
                navigate('/auth');
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch chats');
            const data = await response.json();

            const chatsWithMessages = await Promise.all(
                data.map(async (chat) => {
                    try {
                        const messagesResponse = await fetch(`${BACKEND_URL}/api/chats/${chat.chat_id}/messages`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                        if (messagesResponse.ok) {
                            const messagesData = await messagesResponse.json();

                            // CRITICAL FIX: Apply consistent formatting to all messages
                            const formattedMessages = (messagesData.messages || []).map(msg => {
                                // Keep original message text for all messages, formatting happens in render
                                return {
                                    ...msg,
                                    message_text: msg.message_text
                                };
                            });

                            return { ...chat, messages: formattedMessages };
                        }
                        return { ...chat, messages: [] };
                    } catch (error) {
                        return { ...chat, messages: [] };
                    }
                })
            );
            setChats(chatsWithMessages);
            setChatsLoaded(true);
        } catch (err) {
            console.error('Error fetching chats:', err);
            setChatsLoaded(true);
        }
    };


    const createNewChat = async () => {
        if (isCreatingChat || (isGuest && guestMessageCount >= 15)) return null;
        setIsCreatingChat(true);
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || getOrCreateUserId();

        if (!token) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/chats/guest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_ai_chat: true, guest_id: userId }),
                });
                if (!response.ok) throw new Error('Failed to create guest chat');
                const data = await response.json();
                const newChat = {
                    chat_id: data.chat_id,
                    is_ai_chat: true,
                    messages: [],
                    created_at: new Date().toISOString(),
                    guest_id: userId,
                };
                setChats((prev) => [newChat, ...prev]);
                setChatId(data.chat_id);
                setMessages([]);
                setIsCreatingChat(false);
                return data.chat_id;
            } catch (err) {
                console.error('Error creating guest chat:', err);
                setIsCreatingChat(false);
                return null;
            }
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/chats/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    is_ai_chat: true,
                    user_id: userId,
                    messages: [],
                    status: 'active',
                }),
            });
            if (response.status === 401) {
                localStorage.clear();
                navigate('/auth');
                setIsCreatingChat(false);
                return null;
            }
            if (!response.ok) throw new Error('Failed to create new chat');
            const data = await response.json();
            const newChat = {
                chat_id: data.chat_id,
                is_ai_chat: true,
                messages: [],
                created_at: new Date().toISOString(),
            };
            setChats((prev) => [newChat, ...prev]);
            setChatId(data.chat_id);
            setMessages([]);
            setIsCreatingChat(false);
            return data.chat_id;
        } catch (err) {
            console.error('Error creating new chat:', err);
            setIsCreatingChat(false);
            return null;
        }
    };

    const createChatOnFirstMessage = async () => {
        if (isCreatingChat || (isGuest && guestMessageCount >= 15)) return null;
        setIsCreatingChat(true);
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || getOrCreateUserId();

        if (!token) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/chats/guest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_ai_chat: true, guest_id: userId }),
                });
                if (!response.ok) throw new Error('Failed to create guest chat');
                const data = await response.json();
                const newChat = {
                    chat_id: data.chat_id,
                    is_ai_chat: true,
                    messages: [],
                    created_at: new Date().toISOString(),
                    guest_id: userId,
                };
                setChats((prev) => [newChat, ...prev]);
                setChatId(data.chat_id);
                setIsCreatingChat(false);
                return data.chat_id;
            } catch (err) {
                console.error('Error creating guest chat:', err);
                setIsCreatingChat(false);
                return null;
            }
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/chats/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    is_ai_chat: true,
                    user_id: userId,
                    messages: [],
                    status: 'active',
                }),
            });
            if (response.status === 401) {
                localStorage.clear();
                navigate('/auth');
                setIsCreatingChat(false);
                return null;
            }
            if (!response.ok) throw new Error('Failed to create new chat');
            const data = await response.json();
            const newChat = {
                chat_id: data.chat_id,
                is_ai_chat: true,
                messages: [],
                created_at: new Date().toISOString(),
            };
            setChats((prev) => [newChat, ...prev]);
            setChatId(data.chat_id);
            setIsCreatingChat(false);
            return data.chat_id;
        } catch (err) {
            console.error('Error creating chat on first message:', err);
            setIsCreatingChat(false);
            return null;
        }
    };

    useEffect(() => {
        if (chatsLoaded && chats.length > 0 && !chatId) {
            const firstChat = chats[0];
            setChatId(firstChat.chat_id);

            if (isGuest) {
                // For guest users - use messages from chat object
                const formattedMessages = (firstChat.messages || []).map(msg => {
                    // Keep original message text for all messages, formatting happens in render
                    return {
                        ...msg,
                        message_text: msg.message_text
                    };
                });
                setMessages(formattedMessages);
            } else {
                // For registered users - fetch messages from API
                fetchMessages(firstChat.chat_id);
            }
        }
    }, [chatsLoaded, chats, chatId, isGuest]);
    const fetchMessages = async (chatId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch messages');
            const data = await response.json();

            // CRITICAL FIX: Apply consistent formatting to ALL messages
            const formattedMessages = (data.messages || []).map(msg => {
                // Keep original message text for all messages, formatting happens in render
                return {
                    ...msg,
                    message_text: msg.message_text
                };
            });

            setMessages(formattedMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };
    const sendMessage = async () => {
        if (!newMessage.trim() || loading || isCreatingChat || (isGuest && guestMessageCount >= 15)) return;

        const userId = localStorage.getItem('userId') || getOrCreateUserId();
        const userMessage = newMessage.trim();
        let currentChatId = chatId;

        if (!currentChatId) {
            currentChatId = await createChatOnFirstMessage();
            if (!currentChatId) {
                console.error('Failed to create chat');
                return;
            }
        }

        const message = {
            sender_id: userId,
            receiver_id: 'ai_bot',
            message_text: userMessage,
            message_type: 'text',
        };

        setMessages((prev) => [...prev, { ...message }]);
        setNewMessage('');
        setLoading(true);
        if (isGuest) setGuestMessageCount((prev) => prev + 1);

        try {
            const token = localStorage.getItem('token');
            if (isGuest) {
                const saveMessageResponse = await fetch(`${BACKEND_URL}/api/chats/guest/messages/add/${currentChatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...message, guest_id: userId }),
                });
                if (saveMessageResponse.status === 403) {
                    setGuestMessageCount(15);
                    setMessages((prev) => [...prev, {
                        sender_id: 'ai_bot',
                        receiver_id: userId,
                        message_text: 'Guest message limit reached. Please sign up to continue.',
                        message_type: 'text',
                    }]);
                    setLoading(false);
                    return;
                }
                if (!saveMessageResponse.ok) throw new Error('Failed to save guest message');
            } else if (token) {
                const saveMessageResponse = await fetch(`${BACKEND_URL}/api/chats/messages/add/${currentChatId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(message),
                });
                if (saveMessageResponse.status === 401) {
                    localStorage.clear();
                    navigate('/auth');
                    return;
                }
                if (!saveMessageResponse.ok) throw new Error('Failed to save message');
            }

            const aiResponse = await fetch(`${MODEL_BACKEND_URL}/model_chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    location: userLocation,
                    preferred_language: preferredLanguage,
                }),
            });
            if (!aiResponse.ok) throw new Error('Failed to get AI response');
            const aiData = await aiResponse.json();

            if (aiData.status === 'success' && aiData.response) {
                const aiMessage = {
                    sender_id: 'ai_bot',
                    receiver_id: userId,
                    message_text: aiData.response,
                    message_type: 'text',
                };
                setMessages((prev) => [...prev, aiMessage]);
                if (isGuest) setGuestMessageCount((prev) => prev + 1);

                if (isGuest) {
                    const saveAIResponse = await fetch(`${BACKEND_URL}/api/chats/guest/messages/add/${currentChatId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...aiMessage, guest_id: userId }),
                    });
                    if (saveAIResponse.status === 403) {
                        setGuestMessageCount(15);
                        setMessages((prev) => [...prev, {
                            sender_id: 'ai_bot',
                            receiver_id: userId,
                            message_text: 'Guest message limit reached. Please sign up to continue.',
                            message_type: 'text',
                        }]);
                        return;
                    }
                    if (!saveAIResponse.ok) throw new Error('Failed to save AI response');
                    await fetchChats();
                } else if (token) {
                    await fetch(`${BACKEND_URL}/api/chats/messages/add/${currentChatId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(aiMessage),
                    });
                    if (messages.length === 0) await fetchChats();
                }
            } else {
                const errorMessage = {
                    sender_id: 'ai_bot',
                    receiver_id: userId,
                    message_text: aiData.response || 'I apologize, but I encountered an error. Please try again.',
                    message_type: 'text',
                };
                setMessages((prev) => [...prev, errorMessage]);
                if (isGuest) setGuestMessageCount((prev) => prev + 1);

                if (isGuest) {
                    const saveErrorResponse = await fetch(`${BACKEND_URL}/api/chats/guest/messages/add/${currentChatId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...errorMessage, guest_id: userId }),
                    });
                    if (saveErrorResponse.status === 403) {
                        setGuestMessageCount(15);
                        setMessages((prev) => [...prev, {
                            sender_id: 'ai_bot',
                            receiver_id: userId,
                            message_text: 'Guest message limit reached. Please sign up to continue.',
                            message_type: 'text',
                        }]);
                        return;
                    }
                    if (!saveErrorResponse.ok) throw new Error('Failed to save error message');
                } else if (token) {
                    await fetch(`${BACKEND_URL}/api/chats/messages/add/${currentChatId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(errorMessage),
                    });
                }
            }
        } catch (err) {
            console.error('Error sending message:', err);
            const errorMessage = {
                sender_id: 'ai_bot',
                receiver_id: userId,
                message_text: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact emergency services if you need immediate help.',
                message_type: 'text',
            };
            const token = localStorage.getItem('token')
            setMessages((prev) => [...prev, errorMessage]);
            if (isGuest) setGuestMessageCount((prev) => prev + 1);

            if (isGuest) {
                const saveErrorResponse = await fetch(`${BACKEND_URL}/api/chats/guest/messages/add/${currentChatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...errorMessage, guest_id: userId }),
                });
                if (saveErrorResponse.status === 403) {
                    setGuestMessageCount(15);
                    setMessages((prev) => [...prev, {
                        sender_id: 'ai_bot',
                        receiver_id: userId,
                        message_text: 'Guest message limit reached. Please sign up to continue.',
                        message_type: 'text',
                    }]);
                    return;
                }
                if (!saveErrorResponse.ok) console.error('Error saving error message:', err);
            } else if (token) {
                try {
                    await fetch(`${BACKEND_URL}/api/chats/messages/add/${currentChatId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(errorMessage),
                    });
                } catch (saveError) {
                    console.error('Error saving error message:', saveError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteChat = async (chatIdToDelete) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/chats/delete/${chatIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to delete chat');
            setChats((prev) => prev.filter((chat) => chat.chat_id !== chatIdToDelete));
            if (chatIdToDelete === chatId) {
                setChatId(null);
                setMessages([]);
                const remainingChats = chats.filter((chat) => chat.chat_id !== chatIdToDelete);
                if (remainingChats.length > 0) {
                    setChatId(remainingChats[0].chat_id);
                    if (isGuest) {
                        setMessages(remainingChats[0].messages || []);
                    } else {
                        fetchMessages(remainingChats[0].chat_id);
                    }
                }
            }
        } catch (err) {
            console.error('Error deleting chat:', err);
        }
    };

    const handleChatSelection = (selectedChatId) => {
        setChatId(selectedChatId);
        const selectedChat = chats.find((chat) => chat.chat_id === selectedChatId);

        if (isGuest && selectedChat) {
            // For guest users, use messages from the chat object directly
            const formattedMessages = (selectedChat.messages || []).map(msg => {
                // Keep original message text for all messages, formatting happens in render
                return {
                    ...msg,
                    message_text: msg.message_text
                };
            });
            setMessages(formattedMessages);
        } else {
            // For registered users, fetch messages from API
            fetchMessages(selectedChatId);
        }
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
        setShowSidebarHint(false);
    };

    const handleSignupRedirect = () => {
        navigate('/auth', { state: { guestId: localStorage.getItem('userId') } });
    };

    return (
        <div className="legal-help">
            <div
                className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
                style={{ display: sidebarOpen ? 'block' : 'none' }}
            />
            <div className={`chat-sidebar${sidebarOpen ? ' open' : ''}`} style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
                {!isGuest && (
                    <button
                        className="new-chat-button"
                        onClick={createNewChat}
                        disabled={isCreatingChat}
                    >
                        <FaPlus /> {isCreatingChat ? 'Creating...' : 'New Chat'}
                    </button>
                )}
                {isGuest && guestMessageCount >= 15 && (
                    <p className="guest-limit-message" style={{ color: 'red', padding: '10px', textAlign: 'center' }}>
                        Guest message limit reached. Please sign up to continue.
                    </p>
                )}
                {isGuest && (
                    <button
                        className="signup-button"
                        onClick={handleSignupRedirect}
                        style={{ margin: '10px', padding: '8px 16px', backgroundColor: 'purple', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Sign Up to Save Chats
                    </button>
                )}
                <div className="chat-settings">
                    <div className="setting-group">
                        <label htmlFor="location">Location:</label>
                        <input
                            id="location"
                            type="text"
                            value={userLocation}
                            onChange={(e) => setUserLocation(e.target.value)}
                            placeholder="Enter your location"
                        />
                    </div>
                    <div className="setting-group">
                        <label htmlFor="language">Language:</label>
                        <select
                            id="language"
                            value={preferredLanguage}
                            onChange={(e) => setPreferredLanguage(e.target.value)}
                        >
                            <option value="English">English</option>
                            <option value="Assamese">অসমীয়া (Assamese)</option>
                            <option value="Bengali">বাংলা (Bengali)</option>
                            <option value="Bodo">बड़ो (Bodo)</option>
                            <option value="Dogri">डोगरी (Dogri)</option>
                            <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                            <option value="Hindi">हिन्दी (Hindi)</option>
                            <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                            <option value="Kashmiri">کٜşükرلات (Kashmiri)</option>
                            <option value="Konkani">कोंकणी (Konkani)</option>
                            <option value="Maithili">मैथिली (Maithili)</option>
                            <option value="Malayalam">മലയാളം (Malayalam)</option>
                            <option value="Manipuri">মেইতেই লোন (Manipuri)</option>
                            <option value="Marathi">मराठी (Marathi)</option>
                            <option value="Nepali">नेपाली (Nepali)</option>
                            <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
                            <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                            <option value="Sanskrit">संस्कृतम् (Sanskrit)</option>
                            <option value="Santali">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</option>
                            <option value="Sindhi">سنڌي (Sindhi)</option>
                            <option value="Tamil">தமிழ் (Tamil)</option>
                            <option value="Telugu">తెలుగు (Telugu)</option>
                            <option value="Urdu">اُردُو (Urdu)</option>
                        </select>
                    </div>
                </div>
                {chats.map((chat) => {
                    let displayName = '';
                    const currentUserId = localStorage.getItem('userId') || chat.guest_id;
                    if (Array.isArray(chat.users)) {
                        const otherUser = chat.users.find((u) => u.user_id !== currentUserId);
                        if (otherUser && otherUser.name) displayName = otherUser.name;
                    }
                    if (!displayName) displayName = getChatDisplayName(chat) || 'AI Legal Assistant';
                    return (
                        <div
                            key={chat.chat_id}
                            className={`chat-item ${chat.chat_id === chatId ? 'active' : ''}`}
                            onClick={() => handleChatSelection(chat.chat_id)}
                        >
                            <p title={displayName}>{displayName}</p>
                            {!isGuest && (
                                <button
                                    className="delete-chat-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteChat(chat.chat_id);
                                    }}
                                >
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <button
                className={`sidebar-toggle${sidebarOpen ? ' right' : ''}`}
                onClick={handleSidebarToggle}
                aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                style={{ left: sidebarOpen ? 'auto' : 24, right: sidebarOpen ? 24 : 'auto', top: '11%' }}
            >
                <span className="arrow-icon">{sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}</span>
                {chatsLoaded && chats.length <= 3 && showSidebarHint && !sidebarOpen && (
                    <span className="sidebar-hint-label" onClick={() => setShowSidebarHint(false)}>
                        history / choose your lang
                    </span>
                )}
            </button>
            <div className={`chat-main${!sidebarOpen ? ' sidebar-closed' : ''}`}>
                {chatsLoaded && (!chatId || messages.length === 0) && (
                    <div className="welcome-message">
                        <h2>Welcome to Legal Help Assistant</h2>
                        <p>I can help you with:</p>
                        <ul>
                            <li>Understanding your legal rights</li>
                            <li>Relevant IPC sections for your situation</li>
                            <li>Steps to take for legal remedies</li>
                            <li>Emergency contact information</li>
                            <li>Guidance in multiple Indian languages</li>
                        </ul>
                        {!chatId && (
                            <p><strong>Start typing your legal question below to begin a new conversation.</strong></p>
                        )}
                        {isGuest && (
                            <p><strong>Note: As a guest, you have {15 - guestMessageCount} messages left. Sign up to save your conversations.</strong></p>
                        )}
                        {isGuest && (
                            <button
                                onClick={handleSignupRedirect}
                                style={{ padding: '8px 16px', backgroundColor: 'purple', color: 'white', border: 'none', borderRadius: '4px' }}
                            >
                                Sign Up to Save Chats
                            </button>
                        )}
                    </div>
                )}
                {!chatsLoaded && (
                    <div className="welcome-message">
                        <h2>Welcome to Legal Help Assistant</h2>
                        <p>Loading your conversations...</p>
                    </div>
                )}
                {chatsLoaded && (
                    <>
                        <div className="messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${i % 2 === 0 ? 'user' : 'ai'}`}>
                                    <div className="message-content">
                                        {i % 2 === 1 ? (
                                            <div
                                                className="message-text ai-formatted"
                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatAIResponse(msg.message_text)) }}
                                            />
                                        ) : (
                                            <div className="message-text">{msg.message_text}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message ai">
                                    <div className="message-content">
                                        <div className="message-text typing-indicator">
                                            <span>AI is thinking...</span>
                                            <div className="typing-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="message-input">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={isGuest && guestMessageCount >= 15 ? 'Message limit reached. Please sign up.' : 'Describe your legal concern here'}
                                disabled={loading || isCreatingChat || (isGuest && guestMessageCount >= 15)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                style={{ display: 'flex' }}
                            />
                            <button
                                className="send-button"
                                onClick={sendMessage}
                                disabled={loading || !newMessage.trim() || isCreatingChat || (isGuest && guestMessageCount >= 15)}
                                style={{ backgroundColor: 'purple', opacity: '1', alignSelf: 'center', scale: '1.08' }}
                            >
                                {loading ? 'Sending...' : isCreatingChat ? 'Creating...' : <div style={{ color: 'white', width: '100%' }}><IoMdSend /></div>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}