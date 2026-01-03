import React, { useState } from 'react';
import {
    ShieldAlert, ShieldCheck, ShieldQuestion,
    ChevronDown, ArrowRight, Zap, Target, AlertTriangle, FileText, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResultCard = ({ result }) => {
    if (!result) return null;

    const { score, verdict, summary, riskWhy, possibleOutcomes, recommendedAction, redFlags, title } = result;

    // Theme logic
    const getTheme = (data) => {
        // Normalize input: use verdict as primary source for level
        const level = (data?.verdict || data?.riskLevel || 'CAUTION').toUpperCase();

        // Safe / Low Risk
        if (level === 'SAFE' || level === 'LOW' || level === 'LOW RISK') {
            return {
                color: '#22c55e', // Green
                light: '#dcfce7',
                gradient: 'linear-gradient(135deg, #dcfce7 0%, #ffffff 100%)',
                label: 'SAFE'
            };
        }

        // High Risk / Avoid
        if (level === 'HIGH RISK' || level === 'HIGH' || level === 'AVOID') {
            return {
                color: '#ef4444', // Red
                light: '#fee2e2',
                gradient: 'linear-gradient(135deg, #fee2e2 0%, #ffffff 100%)',
                label: 'HIGH RISK'
            };
        }

        // Default: Caution / Medium
        return {
            color: '#eab308', // Yellow
            light: '#fef3c7',
            gradient: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)',
            label: 'CAUTION'
        };
    };

    const theme = getTheme(result);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="result-story-container"
            style={{ display: 'flex', flexDirection: 'column', gap: '32px', margin: '24px 0 48px' }}
        >

            {/* 1. HERO DECISION PANEL */}
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                whileInView={{ y: 0, opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3, margin: "0px 0px -50px 0px" }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                style={{
                    background: theme.gradient,
                    borderRadius: 'var(--radius-xl)',
                    padding: '40px',
                    border: '1px solid var(--border-subtle)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '40px'
                }}
            >
                {/* Left: Text Content */}
                <div style={{ flex: 1, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{
                            padding: '6px 12px', borderRadius: '100px',
                            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)',
                            fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                            color: theme.color, border: `1px solid ${theme.color}20`
                        }}>
                            {theme.label}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            AI Confidence: {result.confidenceScore || 90}%
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2,
                        marginBottom: '16px', color: 'var(--text-primary)'
                    }}>
                        {title || "Analysis Complete"}
                    </h1>

                    <p style={{
                        fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)'
                    }}>
                        {summary}
                    </p>
                </div>

                {/* Right: Signature Score Visual (Fixed Width) */}
                <div style={{
                    flexShrink: 0,
                    width: '140px', height: '140px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative'
                }}>
                    <svg width="140" height="140" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Track */}
                        <circle cx="80" cy="80" r="70" stroke="rgba(0,0,0,0.05)" strokeWidth="8" fill="transparent" />
                        {/* Progress */}
                        <motion.circle
                            cx="80" cy="80" r="70"
                            stroke={theme.color} strokeWidth="8" fill="transparent"
                            strokeLinecap="round"
                            strokeDasharray={440} // 2 * pi * 70
                            initial={{ strokeDashoffset: 440 }}
                            animate={{ strokeDashoffset: 440 - (440 * score) / 10 }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: '42px', fontWeight: 800, color: theme.color, letterSpacing: '-0.04em' }}>
                            {score}<span style={{ fontSize: '20px', opacity: 0.6 }}>/10</span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '-4px' }}>
                            Risk Score
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 2. THE "WHY" STORY BLOCK */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '24px' }}>

                <SectionCard delay={0.2} title="Why This Score" icon={Activity}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Array.isArray(riskWhy) ? (
                            riskWhy.map((reason, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.color, marginTop: '8px', flexShrink: 0 }} />
                                    <span style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{reason}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{riskWhy}</div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard delay={0.3} title="Recommended Action" icon={Zap} style={{ background: '#18181b', color: 'white' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.5 }}>
                            {recommendedAction}
                        </div>

                    </div>
                </SectionCard>

            </div>

            {/* 3. CONSEQUENCES & FLAGS */}
            <SectionCard delay={0.4} title="Likely Consequences" icon={Target}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {possibleOutcomes?.map((outcome, i) => (
                        <div key={i} style={{
                            padding: '16px', background: 'var(--bg-surface-2)',
                            borderRadius: 'var(--radius-md)', fontSize: '14px', lineHeight: 1.5
                        }}>
                            {outcome}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {
                redFlags && redFlags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{ marginTop: '16px' }}
                    >
                        <div className="text-overline" style={{ marginBottom: '16px' }}>Detected Risk Signals</div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {redFlags.map((flag, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                                    padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'white'
                                }}>
                                    <AlertTriangle size={20} color="var(--color-avoid)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{flag}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )
            }

        </motion.div >
    );
};

// Helper Card Component
const SectionCard = ({ title, icon: Icon, children, delay, style = {} }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: delay }}
        style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            ...style
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Icon size={18} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
                {title}
            </span>
        </div>
        {children}
    </motion.div>
);

export default ResultCard;
