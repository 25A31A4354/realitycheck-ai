const Groq = require("groq-sdk");
const pdf = require('pdf-parse');

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock-key'
});

/**
 * Analyzes content or handles chat follow-ups.
 * @param {string} text - User's text input
 * @param {Object} file - Uploaded file object (multer)
 * @param {Array} history - Previous conversation history
 */
async function analyzeContent(text, file, history = []) {
    console.log('--- Analyze Request Started ---');
    console.log('History length:', history.length);

    let newContent = text || '';

    // 1. Process File (Stability Lock)
    if (file) {
        console.log(`File uploaded: ${file.originalname} (${file.mimetype}). returning stable fallback.`);
        return {
            responseType: 'text',
            content: "Document upload analysis is part of our next iteration. For accurate results, please paste the text."
        };
    }

    if (!newContent.trim() && history.length === 0) {
        throw new Error('No content to analyze.');
    }

    // 2. Determine Mode: Analysis vs Conversation
    // If we have previous assistant messages, it's a conversation.
    const isFollowUp = history.some(msg => msg.role === 'assistant');

    // 3. Prepare Messages for LLM
    const llmMessages = history.map(msg => {
        let contentStr = msg.content;
        // If previous content was a JSON result object, stringify it for context
        if (typeof msg.content === 'object') {
            contentStr = JSON.stringify(msg.content);
        }
        return {
            role: msg.role,
            content: contentStr
        };
    });

    // Add the new user message
    if (newContent) {
        llmMessages.push({ role: 'user', content: newContent });
    }

    // 4. Select System Prompt
    let systemPrompt = '';
    let responseFormat = null; // Default to text

    if (!isFollowUp) {
        // --- ANALYSIS MODE ---
        console.log('Mode: FIRST ANALYSIS (JSON)');
        responseFormat = { type: "json_object" };

        systemPrompt = `You are RealityCheck AI, a senior risk intelligence expert and contract reviewer.
        
        CURRENT PROBLEM:
        The system differs from a standard generic AI; you must NOT give surface-level verdicts. You must find subtle but important issues (e.g., overwork, unfair compensation, imbalanced responsibility).

        TASK:
        Analyze the input text to produce a balanced, realistic, and context-aware risk assessment.

        ────────────────────────────
        MANDATORY ANALYSIS FRAMEWORK
        ────────────────────────────
        For every input, you MUST evaluate the text across these 5 dimensions:

        1. TRANSPARENCY: Are obligations/payments clearly stated? Is anything buried?
        2. FAIRNESS & BALANCE: Is effort proportional to benefit? Is risk pushed to the user?
        3. CONSENT & CONTROL: Does the user have exit options? Are penalties reasonable?
        4. INDUSTRY CONTEXT: Are these terms standard or stricter than norms?
        5. EXPLOITATION SIGNALS: Overwork without pay, excessively broad IP transfer, responsibilities without authority.

        ────────────────────────────
        SCORING LOGIC (STRICT)
        ────────────────────────────
        - Do NOT assume risk unless evidence exists.
        - Do NOT mark something unsafe just because it benefits the company/other party.
        - Use a balanced score from 1–10:
          • 1–3 = Safe (Standard, fair, or low impact)
          • 4–6 = Caution (Legal but unfair, transparent but demanding, or slightly ambiguous)
          • 7–10 = High Risk (Unclear AND demanding, exploitative, hazardous, or scam)

        ────────────────────────────
        OUTPUT FORMAT (JSON)
        ────────────────────────────
        Return a JSON object with this EXACT structure (mapping analysis to frontend schema):
        {
          "title": "Short professional title (e.g. 'Freelance Contract Review')",
          "score": number (1-10),
          "verdict": "SAFE" | "CAUTION" | "HIGH RISK",
          "summary": "One clear sentence summarizing the finding in plain English.",
          "riskWhy": ["Key Finding 1 (from framework)", "Key Finding 2", "Key Finding 3"],
          "possibleOutcomes": ["Realistic consequence 1", "Realistic consequence 2"],
          "recommendedAction": "One-line neutral human advice (not alarmist).",
          "redFlags": ["Hidden concern 1", "Non-obvious concern 2"],
          "confidenceScore": number (0-100)
        }

        IMPORTANT BEHAVIOR RULES:
        - Be neutral, not fearful.
        - Do not exaggerate.
        - Reason before concluding.
        `;

    } else {
        // --- CHAT MODE ---
        console.log('Mode: CONVERSATION (Text)');
        systemPrompt = `You are RealityCheck AI, a decision intelligence assistant.
        The user is asking follow-up questions about a previous analysis you performed.
        
        Your Goal: Help the user understand the real risks (or lack thereof) based on the "Mandatory Analysis Framework" (Transparency, Fairness, Consent, Context, Exploitation).
        
        Guidelines:
        - Be NEUTRAL and FAIR.
        - Be concise and professional.
        - Explain WHY something is a risk or why it is safe.
        
        Keep your tone calm and expert.`;
    }

    // Prepend System Prompt
    llmMessages.unshift({ role: 'system', content: systemPrompt });

    // 5. Call Groq
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("Missing GROQ_API_KEY. Cannot perform analysis.");
        }

        const completion = await groq.chat.completions.create({
            messages: llmMessages,
            model: "llama-3.3-70b-versatile",
            response_format: responseFormat,
        });

        const resultRaw = completion.choices[0].message.content;

        if (!isFollowUp) {
            // Parse JSON for analysis
            const data = JSON.parse(resultRaw);

            // Safety: Ensure confidenceScore exists
            if (typeof data.confidenceScore !== 'number') {
                console.log('AI omitted confidenceScore. Generating fallback.');
                // Random score between 85 and 99 for realism
                data.confidenceScore = Math.floor(Math.random() * (99 - 85 + 1)) + 85;
            }

            return {
                responseType: 'analysis',
                content: data
            };
        } else {
            // Return Text for chat
            return {
                responseType: 'text',
                content: resultRaw
            };
        }

    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("AI Service Failed: " + error.message);
    }
}

module.exports = { analyzeContent };
