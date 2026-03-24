// Vercel Serverless Function for AI Chat (Gemini)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, options, answer, explanation, userQuery } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    const prompt = `
당신은 공인중개사 시험 및 각종 자격증 시험을 돕는 유능한 학습 튜터입니다.
다음 문제와 해설을 바탕으로 사용자의 질문에 친절하고 전문적으로 답변해 주세요.

[문제 정보]
문제: ${question}
보기:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}
정답: ${answer}
기본 해설: ${explanation}

[사용자 질문]
${userQuery}

답변은 간결하면서도 핵심 내용을 포함해야 하며, 학습자에게 도움이 되는 말투로 작성해 주세요. 한국어로 답변해 주세요.
    `;

    const tryGenerate = async (modelName) => {
        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        return response;
    };

    try {
        let response = await tryGenerate('gemini-1.5-flash');

        // 만약 gemini-1.5-flash가 안 되면 gemini-pro로 시도
        if (!response.ok) {
            console.warn('gemini-1.5-flash failed, trying gemini-pro...');
            response = await tryGenerate('gemini-pro');
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return res.status(500).json({ error: 'Failed to call AI service after retries' });
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content) {
             return res.status(500).json({ error: 'Invalid response from AI' });
        }
        const reply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Internal Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
