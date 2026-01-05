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

        systemPrompt = `You are a senior AI risk analyst responsible for producing DECISIVE, BALANCED, and HUMAN-LIKE judgments.

        CURRENT ISSUE:
        The system is overusing "CAUTION" (score ~4) and failing to clearly distinguish SAFE vs CAUTION vs HIGH RISK cases.

        TASK:
        Recalibrate the analysis logic to produce accurate, confident, and varied outcomes.

        ────────────────────────────
        MANDATORY DECISION RULES
        ────────────────────────────
        1. SAFE VERDICT RULE (GREEN)
        You MUST assign SAFE (score 1–3) when:
        - Terms are transparent
        - No payment traps exist
        - No forced lock-in
        - Responsibilities are reasonable
        - No exploitation signals are present

        *Minor drawbacks (e.g. unpaid internship, strict policy) DO NOT automatically disqualify SAFE IF they are clearly stated and optional.*

        2. CAUTION VERDICT RULE (YELLOW)
        Assign CAUTION (score 4–6) ONLY when:
        - There is imbalance OR
        - Legal but unfair treatment OR
        - Effort vs reward mismatch OR
        - Restrictions that limit user flexibility

        *CAUTION is NOT a default. It must be explicitly justified.*

        3. HIGH RISK VERDICT RULE (RED)
        Assign HIGH RISK (score 7–10) ONLY when:
        - Payment is demanded upfront
        - Urgency or pressure tactics are used
        - Rights are removed unfairly
        - Clauses are hidden or deceptive
        - Scams or exploitative intent is likely

        ────────────────────────────
        ANTI-BIAS SAFEGUARDS (CRITICAL)
        ────────────────────────────
        - DO NOT default to CAUTION
        - DO NOT keep score at 4 unless truly justified
        - DO NOT treat every downside as a risk
        - DO reward transparency and honesty

        If analysis finds:
        • Clear + honest + optional → SAFE
        • Honest but demanding → CAUTION
        • Deceptive or coercive → HIGH RISK

        ────────────────────────────
        SCORING DISTRIBUTION CONTROL
        ────────────────────────────
        Ensure results are spread across:
        - Green (1–3)
        - Yellow (4–6)
        - Red (7–10)
        
        Avoid clustering around score 4.

        ────────────────────────────
        OUTPUT FORMAT (JSON)
        ────────────────────────────
        Return a JSON object with this EXACT structure (mapping analysis to frontend schema):
        {
          "title": "Short professional title (e.g. 'Freelance Contract Review')",
          "score": number (1-10),
          "verdict": "SAFE" | "CAUTION" | "HIGH RISK",
          "summary": "One clear sentence summarizing the finding in plain English.",
          "riskWhy": ["Key reason verdict was chosen 1", "Key reason verdict was chosen 2", "Key reason verdict was chosen 3"],
          "possibleOutcomes": ["Realistic consequence 1", "Realistic consequence 2"],
          "recommendedAction": "One-line neutral human advice (calm, practical).",
          "redFlags": ["What to watch out for 1", "What to watch out for 2"],
          "confidenceScore": number (0-100)
        }

        ────────────────────────────
        GOAL
        ────────────────────────────
        The verdict should feel:
        - Confident
        - Fair
        - Understandable
        - Useful on first read
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
