import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';
import './Chatbot.css';

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const showToast = (title, description, status) => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${status}`;
        toast.innerHTML = `
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${description}</p>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    };

    const sendMessage = () => {
        if (!input.trim()) {
            showToast("Empty message", "Please type something to send", "warning");
            return;
        }
        setMessages([...messages, { text: input, type: 'user' }]);
        setInput('');

        // Simulate typing indicator
        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: "typing...",
                type: 'bot',
                isTyping: true
            }]);
        }, 500);

        // Simulate bot response
        setTimeout(() => {
            setMessages(prev => prev.filter(msg => !msg.isTyping));
            setMessages(prev => [...prev, {
                text: "I'm analyzing your legal query. Please wait...",
                type: 'bot'
            }]);
        }, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
        >
            <div className="chatbot">
                <div className="chat-messages">
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: msg.type === 'user' ? 50 : -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: "spring", stiffness: 100 }}
                                className={`message ${msg.type} ${msg.isTyping ? 'typing' : ''}`}
                            >
                                <p>{msg.text}</p>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </AnimatePresence>
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your legal query..."
                        className="chat-input-field"
                    />
                    <button
                        onClick={sendMessage}
                        className="chat-send-button"
                    >
                        <FaPaperPlane className="send-icon" />
                        <span>Send</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default Chatbot;