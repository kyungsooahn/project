// Vercel Serverless Function for AI Chat (Gemini)
export default async function handler(req, res) {
    // 테스트용 GET 요청 허용
    if (req.method === 'GET') {
        return res.status(200).send("AI Chat API is Live! Please use POST method to chat.");
    }

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

    // 시도할 모델과 API 버전 조합들 (가장 호환성이 높은 순서)
    const attempts = [
        { ver: 'v1beta', model: 'gemini-1.5-flash' },
        { ver: 'v1', model: 'gemini-1.5-flash' },
        { ver: 'v1beta', model: 'gemini-pro' },
        { ver: 'v1', model: 'gemini-pro' }
    ];

    for (const attempt of attempts) {
        try {
            console.log(`Trying Gemini API ${attempt.ver} with model ${attempt.model}...`);
            const url = `https://generativelanguage.googleapis.com/${attempt.ver}/models/${attempt.model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
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

            if (response.ok) {
                const data = await response.json();
                if (data.candidates && data.candidates[0].content) {
                    const reply = data.candidates[0].content.parts[0].text;
                    console.log(`Success with ${attempt.model} (${attempt.ver})`);
                    return res.status(200).json({ reply });
                }
            } else {
                const errorData = await response.json();
                console.warn(`Attempt with ${attempt.model} (${attempt.ver}) failed:`, errorData.error?.message || response.statusText);
            }
        } catch (error) {
            console.error(`Error during attempt with ${attempt.model}:`, error);
        }
    }

    return res.status(500).json({ error: '모든 AI 모델 호출에 실패했습니다. Vercel의 Environment Variables에서 GEMINI_API_KEY가 정확한지 확인해 주세요.' });
}
