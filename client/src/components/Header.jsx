import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = () => {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 0 1rem',
                textAlign: 'center'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
            }}>
                <ShieldCheck size={24} color="var(--text-primary)" />
                <h1 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>RealityCheck AI</h1>
            </div>
            <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
            }}>Risk Intelligence</p>
        </motion.header>
    );
};

export default Header;
