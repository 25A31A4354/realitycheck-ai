import React from 'react';
import { motion } from 'framer-motion';

const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3, margin: "0px 0px -50px 0px" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '24px',
            }}
        >
            <div style={{
                maxWidth: '85%',
                padding: '16px 20px',
                borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px', // Modern uneven bubble radius
                background: isUser ? 'var(--bg-surface-2)' : 'transparent',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontSize: '15px',
                // For user messages, using a subtle surface. For AI (intro text), it's transparent.
                border: isUser ? '1px solid var(--border-subtle)' : 'none'
            }}>
                {message.content}
            </div>
        </motion.div>
    );
};

export default MessageBubble;
