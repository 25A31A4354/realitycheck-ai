import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import './styles/main.css';

function App() {
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('reality_check_sessions');
        return saved ? JSON.parse(saved) : [];
    });

    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Persist sessions
    useEffect(() => {
        localStorage.setItem('reality_check_sessions', JSON.stringify(sessions));
    }, [sessions]);

    // Initialize with a new session if empty or select most recent
    useEffect(() => {
        if (sessions.length === 0 && !currentSessionId) {
            createNewSession();
        } else if (sessions.length > 0 && !currentSessionId) {
            setCurrentSessionId(sessions[0].id);
        }
    }, []);

    const createNewSession = () => {
        const newSession = {
            id: Date.now().toString(),
            title: 'New Analysis',
            messages: [],
            timestamp: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        return newSession.id;
    };

    const updateCurrentSession = (updater, logicSessionId = currentSessionId) => {
        setSessions(prev => prev.map(s =>
            s.id === logicSessionId ? updater(s) : s
        ));
    };

    const deleteSession = (e, sessionId) => {
        e.stopPropagation();
        setSessions(prev => {
            const newSessions = prev.filter(s => s.id !== sessionId);
            // If we deleted the current session, switch to the first available one or null
            if (sessionId === currentSessionId) {
                if (newSessions.length > 0) {
                    setCurrentSessionId(newSessions[0].id);
                } else {
                    setCurrentSessionId(null);
                }
            }
            return newSessions;
        });
    };

    const handleSend = async ({ text, file }) => {
        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
            activeSessionId = createNewSession();
        }

        // Add user message
        const userMsg = {
            role: 'user',
            content: file ? `Uploaded file: ${file.name}\n${text}` : text,
            timestamp: Date.now()
        };

        // We need to use the Updated state for the API call, so we calculate it here
        // Use activeSessionId instead of currentSessionId
        const updatedMessages = activeSessionId
            ? [...(sessions.find(s => s.id === activeSessionId)?.messages || []), userMsg]
            : [userMsg];

        updateCurrentSession(s => ({
            ...s,
            messages: [...s.messages, userMsg]
        }), activeSessionId);

        setIsLoading(true);

        try {
            const formData = new FormData();
            if (text) formData.append('text', text);
            if (file) formData.append('file', file);

            // Send history for context
            const historyToSend = updatedMessages.slice(0, -1);
            formData.append('history', JSON.stringify(historyToSend));

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/analyze`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();

            // Handle different response types
            const aiMsg = {
                role: 'assistant',
                timestamp: Date.now()
            };

            if (data.responseType === 'analysis') {
                aiMsg.type = 'result';
                aiMsg.content = data.content; // The structured JSON
            } else {
                aiMsg.type = 'text';
                aiMsg.content = data.content; // The string response
            }

            // Update session
            updateCurrentSession(s => {
                const isCreatingTitle = s.title === 'New Analysis' && data.responseType === 'analysis' && data.content.title;
                return {
                    ...s,
                    title: isCreatingTitle ? data.content.title : s.title,
                    messages: [...s.messages, aiMsg]
                };
            }, activeSessionId);

        } catch (error) {
            console.error(error);
            const errorMsg = {
                role: 'assistant',
                type: 'text',
                content: "I'm sorry, I encountered an issue. Please try again.",
                timestamp: Date.now()
            };
            updateCurrentSession(s => ({ ...s, messages: [...s.messages, errorMsg] }), activeSessionId);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Auto-Analysis from Chrome Extension
    useEffect(() => {
        // Read directly from window location
        const searchParams = new URLSearchParams(window.location.search);
        const textParam = searchParams.get('text');

        if (textParam) {
            // Decode URI component just in case, although URLSearchParams does this automatically
            // But sometimes double encoding happens
            const decodedText = decodeURIComponent(textParam);

            // Remove the param immediately
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);

            // Trigger analysis
            handleSend({ text: decodedText });
        }
    }, []);

    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="app-shell">
            <Sidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={setCurrentSessionId}
                onNewSession={createNewSession}
                onDeleteSession={deleteSession}
            />

            <div className="main-shell">
                {/* Header */}
                <div className="header-shell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Analysis /</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {currentSession?.title || "New Session"}
                        </span>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-viewport">
                    <div className="chat-content-width">
                        {currentSession ? (
                            <ChatArea
                                messages={currentSession.messages}
                                isTyping={isLoading}
                            />
                        ) : (
                            <div className="flex-center" style={{ height: '400px', color: 'var(--text-tertiary)' }}>
                                Loading workspace...
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Dock */}
                <div className="dock-region">
                    <div className="dock-content">
                        <InputArea onSend={handleSend} isLoading={isLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
