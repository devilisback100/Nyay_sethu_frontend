import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaImage, FaVideo, FaPaperPlane, FaPlus, FaFilePdf, FaDownload } from 'react-icons/fa';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './DirectChat.css';

// Configure the workerSrc properly to ensure PDF.js workers are loaded correctly
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Add this helper function after imports
const truncateFileName = (fileName, maxLength = 12) => {
    if (!fileName) return '';
    if (fileName.length <= maxLength) return fileName;

    const extension = fileName.split('.').pop();
    const name = fileName.substring(0, maxLength);
    return `${name}...${extension ? '.' + extension : ''}`;
};

// Separate VideoPlayer component to handle video rendering and hooks
function VideoPlayer({ msg, msgId, isExpanded, videoRefs, toggleVideoPlayer, setError }) {
    const [videoSrc, setVideoSrc] = useState(null);
    const [useDirectUrl, setUseDirectUrl] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        let blobUrl;
        const fetchVideo = async () => {
            try {
                const response = await fetch(msg.file_url, {
                    headers: {
                        // Only include Authorization if explicitly required
                        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
                }

                const contentType = response.headers.get('Content-Type');

                if (!contentType?.startsWith('video/')) {
                    throw new Error(`Invalid Content-Type: ${contentType}`);
                }

                const blob = await response.blob();
                if (blob.size === 0) {
                    throw new Error('Empty video blob received');
                }

                blobUrl = URL.createObjectURL(blob);
                setVideoSrc(blobUrl);
                setFetchError(null);
            } catch (err) {
                setFetchError(err.message);
                setUseDirectUrl(true); // Fallback to direct URL
                setError(`Failed to load video: ${err.message}. Trying direct URL.`);
            }
        };

        if (isExpanded && !useDirectUrl) {
            fetchVideo();
        }

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [isExpanded, msg.file_url, useDirectUrl, setError, msgId]);

    const getMimeType = (url, fileType) => {
        if (fileType === 'mp4') return 'video/mp4'; // Fix for incorrect file_type
        if (fileType) return fileType;
        if (url.match(/\.mp4$/i)) return 'video/mp4';
        if (url.match(/\.webm$/i)) return 'video/webm';
        if (url.match(/\.ogg$/i)) return 'video/ogg';
        return 'video/mp4';
    };

    return (
        <div className="video-container">
            {isExpanded ? (
                <div className="video-expanded-view">
                    {videoSrc || (useDirectUrl && msg.file_url) ? (
                        <video
                            ref={el => videoRefs.current[msgId] = el}
                            controls
                            autoPlay
                            muted
                            playsInline
                            className="message-video"
                            onError={(e) => {
                                const errorDetails = {
                                    code: e.target.error?.code,
                                    message: e.target.error?.message || 'No error message provided',
                                    file_url: msg.file_url,
                                    file_type: msg.file_type,
                                    videoSrc: videoSrc || 'Direct URL'
                                };
                                let errorMessage = 'Error loading video.';
                                if (e.target.error) {
                                    switch (e.target.error.code) {
                                        case MediaError.MEDIA_ERR_ABORTED:
                                            errorMessage = 'Video loading was aborted.';
                                            break;
                                        case MediaError.MEDIA_ERR_NETWORK:
                                            errorMessage = 'Network error while loading video.';
                                            break;
                                        case MediaError.MEDIA_ERR_DECODE:
                                            errorMessage = 'Video decoding failed. Format may be unsupported.';
                                            break;
                                        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                            errorMessage = 'Video format or source not supported.';
                                            break;
                                        default:
                                            errorMessage = 'Unknown error loading video.';
                                    }
                                } else {
                                    errorMessage = 'Video failed to load. Check network or file format.';
                                }
                                setError(errorMessage);
                            }}
                            onLoadedData={() => {/* no-op */ }}
                        >
                            <source
                                src={useDirectUrl ? msg.file_url : videoSrc}
                                type={getMimeType(msg.file_url, msg.file_type)}
                            />
                            Your browser does not support the video tag.
                        </video>
                    ) : fetchError ? (
                        <div className="video-error">Error loading video: {fetchError}</div>
                    ) : (
                        <div>Loading video...</div>
                    )}
                    <div className="video-controls">
                        <button onClick={() => toggleVideoPlayer(msgId)} className="video-minimize-btn">
                            <span>Minimize</span>
                        </button>
                        <a
                            href={msg.file_url}
                            download={msg.original_name || 'video.mp4'}
                            className="video-download-btn"
                            title="Download video"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <FaDownload />
                        </a>
                    </div>
                </div>
            ) : (
                <div className="video-collapsed-view" onClick={() => toggleVideoPlayer(msgId)}>
                    <div className="video-preview">
                        <div className="video-placeholder">
                            <FaVideo className="video-icon" />
                            <span>{truncateFileName(msg.original_name) || 'Video'}</span>
                        </div>
                        <div className="video-play-button">
                            <span>▶</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function DirectChat({ chatId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatDetails, setChatDetails] = useState(null);
    const [partnerDetails, setPartnerDetails] = useState(null);
    const [error, setError] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [lastFetchTime, setLastFetchTime] = useState(0);
    const [isUserActive, setIsUserActive] = useState(true);
    const [fetchingMessages, setFetchingMessages] = useState(false);
    const [pdfViewers, setPdfViewers] = useState({});
    const [videoPlayers, setVideoPlayers] = useState({});
    // eslint-disable-next-line no-unused-vars
    const [lastMessageId, setLastMessageId] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [autoScroll, setAutoScroll] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const pollingTimeoutRef = useRef(null);
    const videoRefs = useRef({});
    const chatContainerRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { chat_id: chatIdFromParams } = useParams();
    const chatIdFromState = location?.state?.chat_id;

    const chat_id = chatId || chatIdFromParams || chatIdFromState;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

        const partnerDetails = isNyaySathi ? chatDetails.user_details : chatDetails.nyaysathi_details;
        if (partnerDetails) {
            setPartnerDetails(partnerDetails);
        } else {
            setError('Could not load partner details.');
        }
    }, [chatDetails, isNyaySathi]);

    const removeDuplicateMessages = (messageArray) => {
        const uniqueMessages = new Map();
        messageArray.forEach(msg => {
            const key = msg.id || `${msg.timestamp}-${msg.sender_id}-${msg.message_text}`;
            uniqueMessages.set(key, msg);
        });
        return Array.from(uniqueMessages.values());
    };

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

            const body = fullRefresh
                ? JSON.stringify({
                    chat_id,
                    appointment_id: chatDetails?.appointment_id || localStorage.getItem('appointmentId'),
                })
                : undefined;

            const response = await fetch(endpoint, {
                method: fullRefresh ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(`Fetch failed: ${response.status} ${errData.error || 'Unknown error'}`);
            }

            setLastFetchTime(Date.now());
            const data = await response.json();

            if (fullRefresh) {
                if (data && data.chat_id) {
                    setChatDetails(data);
                    const uniqueMessages = removeDuplicateMessages(data.messages || []);
                    setMessages(uniqueMessages);
                    setLastMessageId(uniqueMessages[uniqueMessages.length - 1]?.id);
                } else {
                    setError('Invalid chat data received.');
                }
            } else {
                if (data.messages?.length) {
                    const newMessages = data.messages.filter(msg =>
                        !messages.some(existingMsg =>
                            existingMsg.id === msg.id ||
                            (existingMsg.timestamp === msg.timestamp &&
                                existingMsg.sender_id === msg.sender_id &&
                                existingMsg.message_text === msg.message_text)
                        )
                    );
                    if (newMessages.length > 0) {
                        setMessages(prev => removeDuplicateMessages([...prev, ...newMessages]));
                        setLastMessageId(newMessages[newMessages.length - 1]?.id);
                    }
                }
            }
        } catch (err) {
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
                correctedUserType = 'nyaysathi';
                localStorage.setItem('userType', 'nyaysathi');
            } else if (senderId === chatDetails.user_id && userType !== 'user') {
                correctedUserType = 'user';
                localStorage.setItem('userType', 'user');
            }
        }

        // Recompute isNyaySathi and receiverId with corrected userType
        const isNyaySathiCorrected = correctedUserType === 'nyaysathi';
        receiverId = isNyaySathiCorrected ? chatDetails?.user_id : chatDetails?.nyaysathi_id;

        if (!senderId || !receiverId) {
            setError('Sender or receiver information missing. Please reload the chat.');
            return;
        }

        if (senderId === receiverId) {
            setError('Cannot send message to yourself.');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            if (newMessage.trim()) {
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
                formData.append('file', selectedImage);
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
                    throw new Error(`File upload failed: ${errData.error}`);
                }

                await fetchChatDetails(true);
                setSelectedImage(null);
            }

            setIsUserActive(true);
        } catch (err) {
            setError(`Message failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'video/mp4', 'application/pdf'];
        const maxFileSize = 10 * 1024 * 1024;

        if (!validFileTypes.includes(file.type)) {
            setError('Invalid file type. Only PNG, JPG, JPEG, MP4, and PDF are allowed.');
            return;
        }

        if (file.size > maxFileSize) {
            setError('File size exceeds 10MB.');
            return;
        }

        setSelectedImage(file);
    };

    const togglePdfPreview = (msgId) => {
        setPdfViewers(prev => ({
            ...prev,
            [msgId]: !prev[msgId]
        }));
    };

    const toggleVideoPlayer = (msgId) => {
        setVideoPlayers(prev => ({
            ...prev,
            [msgId]: !prev[msgId]
        }));

        Object.keys(videoRefs.current).forEach(key => {
            if (key !== msgId && videoRefs.current[key]) {
                videoRefs.current[key].pause();
            } else if (key === msgId && videoRefs.current[key] && !videoPlayers[msgId]) {
                videoRefs.current[key].play().catch(e => {
                    setError('Cannot play video. Please try manually.');
                });
            }
        });
    };

    const isCurrentUserSender = (id) => {
        const currentId = localStorage.getItem('userId');
        return id && currentId && id.toString() === currentId.toString();
    };

    const renderPdfPreview = (msg, msgId) => {
        const isExpanded = pdfViewers[msgId];

        return (
            <div className="pdf-container">
                {isExpanded ? (
                    <div className="pdf-expanded-view">
                        <Document
                            file={msg.file_url}
                            className="pdf-document"
                            onLoadError={(error) => {
                                setError('Error loading PDF. Please try again later.');
                            }}
                            loading={<div className="pdf-loading">Loading PDF...</div>}
                        >
                            <Page
                                pageNumber={1}
                                width={250}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                        </Document>
                        <div className="pdf-controls">
                            <button onClick={() => togglePdfPreview(msgId)} className="pdf-minimize-btn">
                                Minimize
                            </button>
                            <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pdf-download-btn"
                                download={msg.original_name || "document.pdf"}
                            >
                                <FaDownload /> Download
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="pdf-collapsed-view" onClick={() => togglePdfPreview(msgId)}>
                        <FaFilePdf className="pdf-icon" />
                        <div className="pdf-info">
                            <span className="pdf-name">{msg.original_name || 'Document.pdf'}</span>
                            <span className="pdf-action">Click to view</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setAutoScroll(isNearBottom);
    };

    const getFileDownloadConfig = (file) => {
        const fileType = file.file_type || file.format || '';
        const fileName = file.original_name || 'download';

        if (fileType.includes('pdf') || file.file_url?.endsWith('.pdf')) {
            return {
                extension: '.pdf',
                icon: <FaFilePdf />,
                contentType: 'application/pdf'
            };
        } else if (fileType.includes('video') || file.file_url?.match(/\.(mp4|webm|ogg)$/i)) {
            return {
                extension: '.mp4',
                icon: <FaVideo />,
                contentType: 'video/mp4'
            };
        } else if (fileType.includes('image') || file.file_url?.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return {
                extension: file.file_url?.split('.').pop() || '.png',
                icon: <FaImage />,
                contentType: 'image/*'
            };
        }
        return {
            extension: '',
            icon: <FaDownload />,
            contentType: 'application/octet-stream'
        };
    };

    const handleFileDownload = async (file) => {
        try {
            const config = getFileDownloadConfig(file);
            const response = await fetch(file.file_url);
            const blob = await response.blob();

            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${file.original_name || 'download'}${config.extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            setError('Failed to download file. Please try again.');
        }
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
                                {(partnerDetails.profile_picture?.secure_url || partnerDetails.profile_picture) ? (
                                    <img
                                        src={partnerDetails.profile_picture?.secure_url || partnerDetails.profile_picture}
                                        alt={partnerDetails.name || 'Profile'}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZmlsbD0iIzk0YTNiOCI+JHtwYXJ0bmVyRGV0YWlscy5uYW1lPy5jaGFyQXQoMCkgfHwgJz8nfTwvdGV4dD48L3N2Zz4=`;
                                        }}
                                    />
                                ) : (
                                    <span>{partnerDetails.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <div className="preview-details">
                                <h3>{partnerDetails.name || 'Unknown'}</h3>
                                {isNyaySathi ? (
                                    <p>Client</p>
                                ) : (
                                    partnerDetails.location && (
                                        <>
                                            <p>{partnerDetails.specialization || 'Legal Professional'}</p>
                                            <p>{`${partnerDetails.location.city || ''}, ${partnerDetails.location.state || ''}`}</p>
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                        {chatDetails.appointment_date && (
                            <div className="appointment-info">
                                {new Date(chatDetails.appointment_date).toLocaleString()}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>Loading chat information...</div>
                )}
            </div>

            <div
                className="chat-messages"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {!chatDetails ? (
                    <p className="loading-messages">Loading chat...</p>
                ) : messages.length === 0 ? (
                    <p className="no-messages">No messages yet. Say hi 👋</p>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={msg.id || `${msg.timestamp}-${msg.sender_id}-${i}`}
                            className={`message ${isCurrentUserSender(msg.sender_id) ? 'sent' : 'received'}`}
                        >
                            {msg.message_type === 'file' && msg.file_url && (
                                <>
                                    {msg.file_type === 'pdf' || msg.file_format === 'pdf' || msg.file_url.match(/\.pdf$/i) ? (
                                        <div className="file-attachment" onClick={() => handleFileDownload(msg)}>
                                            <FaFilePdf className="file-icon" />
                                            <span className="file-name">{truncateFileName(msg.original_name) || 'PDF Document'}</span>
                                            <button className="download-btn">
                                                <FaDownload /> PDF
                                            </button>
                                        </div>
                                    ) : msg.file_type?.startsWith('image/') || msg.file_url.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                        <div className="message-image-container">
                                            <img
                                                src={msg.file_url}
                                                alt={truncateFileName(msg.original_name) || 'Image'}
                                                className="message-image"
                                                onClick={() => handleFileDownload(msg)}
                                            />
                                            <button className="image-download-btn">
                                                <FaDownload /> Save
                                            </button>
                                        </div>
                                    ) : msg.file_type?.startsWith('video/') || msg.file_url.match(/\.(mp4|webm|ogg)$/i) ? (
                                        <div className="video-container">
                                            <VideoPlayer
                                                msg={msg}
                                                msgId={`msg-${i}`}
                                                isExpanded={videoPlayers[`msg-${i}`]}
                                                videoRefs={videoRefs}
                                                toggleVideoPlayer={toggleVideoPlayer}
                                                setError={setError}
                                                onDownload={() => handleFileDownload(msg)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="file-attachment">
                                            <FaDownload className="file-icon" />
                                            <span className="file-name">{truncateFileName(msg.original_name) || 'File'}</span>
                                            <button
                                                className="download-btn"
                                                onClick={() => handleFileDownload(msg)}
                                            >
                                                Download
                                            </button>
                                        </div>
                                    )}
                                </>
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
                <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows="1"
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
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                        accept=".jpg,.jpeg,.png,.mp4,.pdf"
                    />
                    <button
                        className="attachment-button"
                        onClick={() => fileInputRef.current.click()}
                        title="Attach file"
                    >
                        <FaImage />
                    </button>
                    <button
                        className="send-button"
                        onClick={handleSendMessage}
                        disabled={loading}
                        title="Send message"
                    >
                        <FaPaperPlane />
                    </button>
                </div>
                {selectedImage && (
                    <div className="selected-file-info">
                        <span>{selectedImage.name}</span>
                        <button onClick={() => setSelectedImage(null)}>Remove</button>
                    </div>
                )}
            </div>
        </div>
    );
}