import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { IoMdSend } from "react-icons/io";
import { FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './LegalHelp.css';

// Helper to get chat display name with enhanced logic
function getChatDisplayName(chat) {
    // If chat has a custom name, use it
    if (chat.name && chat.name.trim()) return chat.name;

    // If chat has 3 or more messages, use the third message as the chat name
    if (chat.messages && Array.isArray(chat.messages) && chat.messages.length >= 3) {
        const thirdMessage = chat.messages[2];
        if (thirdMessage && thirdMessage.message_text) {
            let chatName = thirdMessage.message_text.trim();
            if (chatName.length > 30) {
                chatName = chatName.substring(0, 30) + '...';
            }
            return chatName;
        }
    }

    // If chat has at least 1 message, use the first message as the chat name
    if (chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0) {
        const firstMessage = chat.messages[0];
        if (firstMessage && firstMessage.message_text) {
            let chatName = firstMessage.message_text.trim();
            if (chatName.length > 30) {
                chatName = chatName.substring(0, 30) + '...';
            }
            return chatName;
        }
    }

    // If no messages, use time-based name
    if (!chat.created_at) return chat.is_ai_chat ? 'AI Legal Assistant' : 'User Chat';

    const created = new Date(chat.created_at);
    const now = new Date();

    // Remove time for comparison
    const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const msInDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((nowDay - createdDay) / msInDay);

    // Enhanced timeframe logic
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
        // Return day name (Monday, Tuesday, etc.)
        return created.toLocaleDateString(undefined, { weekday: 'long' });
    }
    if (diffDays < 14) {
        return '1 week ago';
    }
    if (diffDays < 21) {
        return '2 weeks ago';
    }
    if (diffDays < 28) {
        return '3 weeks ago';
    }
    if (diffDays < 60) {
        return '1 month ago';
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    // For dates older than a year
    const years = Math.floor(diffDays / 365);
    if (years === 1) {
        return '1 year ago';
    }
    return `${years} years ago`;
}

const formatAIResponse = (text) => {
    if (!text) return '';

    let formattedText = text
        // Convert triple asterisks to strong bold headings
        .replace(/\*\*\*(.*?)\*\*\*/g, '<h4 class="ai-heading">$1</h4>')
        // Convert double asterisks to bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert single asterisks to italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert numbered lists (1. 2. 3. etc.)
        .replace(/^\d+\.\s+(.+)$/gm, '<li class="ai-list-item">$1</li>')
        // Convert bullet points with * or -
        .replace(/^[*-]\s+(.+)$/gm, '<li class="ai-list-item">$1</li>')
        // Convert sections like "Section 302:" to highlighted format
        .replace(/Section\s+(\d+[A-Z]*)\s*:?\s*/gi, '<span class="legal-section">Section $1:</span> ')
        // Convert IPC references
        .replace(/(\d+[A-Z]*)\s+IPC/gi, '<span class="legal-reference">$1 IPC</span>')
        // Convert line breaks to HTML breaks
        .replace(/\n/g, '<br>');

    // Wrap consecutive list items in ul tags
    formattedText = formattedText.replace(
        /(<li class="ai-list-item">.*?<\/li>)(?:\s*<br>\s*<li class="ai-list-item">.*?<\/li>)*/gs,
        (match) => {
            return '<ul class="ai-list">' + match.replace(/<br>\s*/g, '') + '</ul>';
        }
    );

    // Handle emergency contacts and important numbers
    formattedText = formattedText.replace(
        /(police at \d+|helpline at \d+|contact \d+)/gi,
        '<span class="emergency-contact">$1</span>'
    );

    // Highlight important warnings
    formattedText = formattedText.replace(
        /(immediate danger|emergency|urgent|important)/gi,
        '<span class="important-warning">$1</span>'
    );

    return formattedText;
};

// Utility to generate a temporary chat id
function generateTempChatId() {
    return 'temp-' + Date.now();
}

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
    const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
    const messagesEndRef = useRef(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const MODEL_BACKEND_URL = process.env.REACT_APP_Model_Backend;
    const navigate = useNavigate();

    // Get user's location on component mount
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
                        setUserLocation(fullLocation || "Unknown location");
                    } catch (error) {
                        setUserLocation("Delhi, India"); // fallback
                    }
                },
                (error) => {
                    setUserLocation("Delhi, India"); // fallback
                }
            );
        } else {
            setUserLocation("Geolocation not supported");
        }
    }, []);

    const fetchChats = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.clear();
            navigate('/auth');
            return;
        }
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

            // Enhanced: Fetch messages for each chat to enable better naming
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
                            return { ...chat, messages: messagesData.messages || [] };
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
            setChatsLoaded(true);
        }
    };

    const createNewChat = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token) {
            localStorage.clear();
            navigate('/auth');
            return null;
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
                return null;
            }

            if (!response.ok) throw new Error('Failed to create new chat');

            const data = await response.json();
            const newChat = {
                chat_id: data.chat_id,
                is_ai_chat: true,
                messages: [],
                created_at: new Date().toISOString()
            };

            setChats((prev) => [newChat, ...prev]);
            setChatId(data.chat_id);
            setMessages([]);

            return data.chat_id;
        } catch (err) {
            console.error('Error creating new chat:', err);
            return null;
        }
    };

    // Auto-create new chat when component mounts
    useEffect(() => {
        // Only auto-create if chats are loaded, not already attempted, and there are no chats
        if (chatsLoaded && !autoCreateAttempted) {
            setAutoCreateAttempted(true);

            // Create a temp chat for instant UI feedback
            const tempId = generateTempChatId();
            const tempChat = {
                chat_id: tempId,
                is_ai_chat: true,
                messages: [],
                created_at: new Date().toISOString()
            };
            setChats([tempChat]);
            setChatId(tempId);
            setMessages([]);

            // Create real chat in backend and replace temp chat
            (async () => {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                if (!token) {
                    localStorage.clear();
                    navigate('/auth');
                    return;
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
                        return;
                    }
                    if (!response.ok) throw new Error('Failed to create new chat');
                    const data = await response.json();
                    const realChat = {
                        chat_id: data.chat_id,
                        is_ai_chat: true,
                        messages: [],
                        created_at: new Date().toISOString()
                    };
                    setChats((prev) => [realChat, ...prev.filter(c => c.chat_id !== tempId)]);
                    setChatId(data.chat_id);
                } catch (err) {
                    // Optionally handle error
                }
            })();
        }
        // No else/return: allow sending messages or starting new chat at any time
    }, [chatsLoaded, autoCreateAttempted, chats.length]);

    // Load chats on component mount
    useEffect(() => {
        const initializeChats = async () => {
            await fetchChats();
        };

        initializeChats();
    }, [BACKEND_URL, navigate]);

    const fetchMessages = async (chatId) => {
        const token = localStorage.getItem('token');
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
            setMessages(data.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        if (!chatId) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.clear();
            navigate('/auth');
            return;
        }

        const userId = localStorage.getItem('userId');
        const userMessage = newMessage.trim();

        const message = {
            sender_id: userId,
            receiver_id: 'ai_bot',
            message_text: userMessage,
            message_type: 'text',
        };

        // Add user message to UI immediately
        setMessages((prev) => [...prev, { ...message }]);
        setNewMessage('');
        setLoading(true);

        try {
            // Save the user message to backend
            const saveMessageResponse = await fetch(`${BACKEND_URL}/api/chats/messages/add/${chatId}`, {
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

            if (!saveMessageResponse.ok) {
                throw new Error('Failed to save message');
            }

            // Call the AI model chat endpoint
            const aiResponse = await fetch(`${MODEL_BACKEND_URL}/model_chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    location: userLocation,
                    preferred_language: preferredLanguage
                }),
            });

            if (!aiResponse.ok) {
                throw new Error('Failed to get AI response');
            }

            const aiData = await aiResponse.json();

            if (aiData.status === 'success' && aiData.response) {
                const aiMessage = {
                    sender_id: 'ai_bot',
                    receiver_id: userId,
                    message_text: aiData.response,
                    message_type: 'text',
                };

                setMessages((prev) => [...prev, aiMessage]);

                try {
                    await fetch(`${BACKEND_URL}/api/chats/messages/add/${chatId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(aiMessage),
                    });

                    // Update chat list with new messages for better naming
                    fetchChats();
                } catch (saveError) {
                    console.error('Error saving AI message:', saveError);
                }
            } else {
                const errorMessage = {
                    sender_id: 'ai_bot',
                    receiver_id: userId,
                    message_text: aiData.response || 'I apologize, but I encountered an error. Please try again.',
                    message_type: 'text',
                };
                setMessages((prev) => [...prev, errorMessage]);

                try {
                    await fetch(`${BACKEND_URL}/api/chats/messages/add/${chatId}`, {
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

        } catch (err) {
            console.error('Error sending message:', err);

            const errorMessage = {
                sender_id: 'ai_bot',
                receiver_id: userId,
                message_text: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact emergency services if you need immediate help.',
                message_type: 'text',
            };
            setMessages((prev) => [...prev, errorMessage]);

            try {
                await fetch(`${BACKEND_URL}/api/chats/messages/add/${chatId}`, {
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
        } finally {
            setLoading(false);
        }
    };

    const deleteChat = async (chatIdToDelete) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${BACKEND_URL}/api/chats/delete/${chatIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to delete chat');

            setChats((prev) => prev.filter((chat) => chat.chat_id !== chatIdToDelete));
            if (chatIdToDelete === chatId) {
                // Create a new chat when current chat is deleted
                await createNewChat();
            }
        } catch (err) {
            console.error('Error deleting chat:', err);
        }
    };

    useEffect(() => {
        if (chatId) fetchMessages(chatId);
    }, [chatId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);

    return (
        <div className="legal-help">
            {/* Sidebar Overlay for mobile */}
            <div
                className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
                style={{ display: sidebarOpen ? 'block' : 'none' }}
            />

            {/* Sidebar */}
            <div className={`chat-sidebar${sidebarOpen ? ' open' : ''}`} style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
                <button className="new-chat-button" onClick={createNewChat}>
                    <FaPlus /> New Chat
                </button>

                {/* Settings section */}
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
                    // Enhanced display name logic
                    let displayName = '';
                    const currentUserId = localStorage.getItem('userId');

                    // Check for other users first (for regular chats)
                    if (Array.isArray(chat.users)) {
                        const otherUser = chat.users.find(u => u.user_id !== currentUserId);
                        if (otherUser && otherUser.name) {
                            displayName = otherUser.name;
                        }
                    }

                    // If no other user name, use enhanced chat naming logic
                    if (!displayName) {
                        displayName = getChatDisplayName(chat) || 'AI Legal Assistant';
                    }

                    return (
                        <div
                            key={chat.chat_id}
                            className={`chat-item ${chat.chat_id === chatId ? 'active' : ''}`}
                            onClick={() => setChatId(chat.chat_id)}
                        >
                            <p title={displayName}>{displayName}</p>
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
                    );
                })}
            </div>

            {/* Sidebar Toggle Floating Arrow */}
            <button
                className={`sidebar-toggle${sidebarOpen ? ' right' : ''}`}
                onClick={handleSidebarToggle}
                aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                style={{
                    left: sidebarOpen ? 'auto' : 24,
                    right: sidebarOpen ? 24 : 'auto',
                    top:'9%'                }}
            >
                <span className="arrow-icon">
                    {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
                </span>
            </button>

            {/* Main Chat Area */}
            <div className={`chat-main${!sidebarOpen ? ' sidebar-closed' : ''}`}>
                {/* Show welcome message at the top if there are no messages yet */}
                {chatsLoaded && messages.length === 0 && (
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
                    </div>
                )}
                {/* Show loading message only if chats are not loaded yet */}
                {!chatsLoaded && (
                    <div className="welcome-message">
                        <h2>Welcome to Legal Help Assistant</h2>
                        <p>Setting up your new chat...</p>
                    </div>
                )}
                {/* Chat messages and input */}
                {chatsLoaded && (
                    <>
                        <div className="messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.sender_id === 'ai_bot' ? 'ai' : 'user'}`}>
                                    <div className="message-content">
                                        {msg.sender_id === 'ai_bot' ? (
                                            <div
                                                className="message-text ai-formatted"
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(formatAIResponse(msg.message_text))
                                                }}
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
                                placeholder="Describe your legal concern here"
                                disabled={loading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                        
                                style={{display:"flex"}}
                            />
                            <button
                                className="send-button"
                                onClick={sendMessage}
                                disabled={loading || !newMessage.trim()}
                                style={{backgroundColor:"purple",opacity:"1",alignSelf:"center",scale:"1.08"}}
                            >
                                {loading ? 'Sending...' :<div style={{color:"white",width:"100%"}} > <   IoMdSend /> </div>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}