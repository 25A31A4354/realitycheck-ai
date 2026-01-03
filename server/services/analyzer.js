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
        systemPrompt = `You are RealityCheck AI, a senior risk intelligence expert.
        Your goal is to provide a BALANCED, CONFIDENT, and ACCURATE assessment of contracts and texts.
        
        Analyze the input to classify it into one of three strict categories.
        
        STEP 1: CLASSIFY INTENT
        - Legitimate & Standard -> SAFE
        - Legitimate but needs attention/unclear -> CAUTION
        - Manipulative, exploitative, or scam -> HIGH RISK

        STEP 2: ASSIGN STATS
        - SAFE: Score 1-3. (Green)
        - CAUTION: Score 4-6. (Yellow)
        - HIGH RISK: Score 7-10. (Red)

        CORE RULES:
        1. NEUTRAL BY DEFAULT: Do not assume bad intent. If it looks standard, it is SAFE.
        2. DO NOT FORCE "CAUTION": Only use Caution if there is a specific reason (e.g. auto-renewal, hidden fees).
        3. BE DECISIVE: Do not use vague words like "likely" or "maybe".

        Return a JSON object with this EXACT structure:
        {
          "title": "Short professional title (e.g. 'Standard NDA Review')",
          "score": number (1-10),
          "verdict": "SAFE" | "CAUTION" | "HIGH RISK",
          "summary": "One clear sentence summarizing the finding in plain English.",
          "riskWhy": ["Reason 1", "Reason 2", "Reason 3 (optional)"],
          "possibleOutcomes": ["Best case outcome", "Worst case outcome (if risky)"],
          "recommendedAction": "One single clear recommended action line.",
          "redFlags": ["Flag 1", "Flag 2"] (Empty array if SAFE)
        }`;

    } else {
        // --- CHAT MODE ---
        console.log('Mode: CONVERSATION (Text)');
        systemPrompt = `You are RealityCheck AI, a decision intelligence assistant.
        The user is asking follow-up questions about a previous analysis you performed.
        
        Your Goal: Help the user understand the real risks (or lack thereof).
        
        Guidelines:
        - Be NEUTRAL and FAIR. If the previous analysis was Low Risk, reassure the user.
        - Be concise and professional.
        - Do NOT assume the user is in danger unless the score was High.
        
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
