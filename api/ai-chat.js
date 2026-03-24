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

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return res.status(500).json({ error: 'Failed to call AI service' });
        }

        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Internal Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
