import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, FileText, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InputArea = ({ onSend, isLoading }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if ((!text.trim() && !file) || isLoading) return;
        onSend({ text, file });
        setText('');
        setFile(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const textareaRef = useRef(null);

    // Auto-resize textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset to shrink
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; // Grow up to 200px
        }
    }, [text]);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`dock-container ${isFocused ? 'focused' : ''}`}
            style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: isFocused ?
                    '0 20px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)' :
                    'var(--shadow-floating)',
                padding: '12px',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
        >
            {/* File Review Preview */}
            <AnimatePresence>
                {file && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px',
                            background: 'var(--bg-surface-2)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{
                                width: '40px', height: '40px',
                                background: 'white', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <FileText size={20} color="var(--brand-accent)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{file.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>PDF Document</div>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                style={{
                                    padding: '6px', background: 'transparent', border: 'none',
                                    cursor: 'pointer', color: 'var(--text-tertiary)'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'background 0.2s',
                        marginBottom: '2px' // Align with text baselines
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <Paperclip size={20} />
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".pdf,.txt"
                />

                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Ask RealityCheck to analyze a contract..."
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        resize: 'none',
                        maxHeight: '200px',
                        minHeight: '24px',
                        padding: '12px 0',
                        fontSize: '16px',
                        lineHeight: '1.5',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        overflowY: 'auto'
                    }}
                    rows={1}
                />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={(!text.trim() && !file) || isLoading}
                    style={{
                        width: '40px', height: '40px',
                        borderRadius: '12px',
                        border: 'none',
                        background: (!text.trim() && !file) ? 'var(--bg-surface-3)' : 'var(--brand-primary)',
                        color: (!text.trim() && !file) ? 'var(--text-tertiary)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: (!text.trim() && !file) ? 'default' : 'pointer',
                        marginBottom: '4px',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                        />
                    ) : (
                        <ArrowUp size={20} />
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default InputArea;
