import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ResultCard from './ResultCard';

const ChatArea = ({ messages, isTyping }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            {messages.length === 0 && (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.5,
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
                        Paste a contract, job offer, or message to check for risks.
                    </p>
                </div>
            )}

            {messages.map((msg, index) => (
                <div key={index}>
                    {msg.role === 'user' ? (
                        <MessageBubble message={msg} />
                    ) : (
                        msg.type === 'result' ? (
                            <ResultCard result={msg.content} />
                        ) : (
                            <MessageBubble message={msg} />
                        )
                    )}
                </div>
            ))}

            {isTyping && (
                <div className="fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '1rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem'
                }}>
                    <span>Analyzing risks</span>
                    <span className="dot-typing">...</span>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

export default ChatArea;
