// Vercel Serverless Function for AI Chat (Gemini)
export default async function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).send("AI Chat API is Live! Please use POST method to chat.");
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, options, answer, explanation, userQuery } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }
    
    // API 키 공백 제거
    apiKey = apiKey.trim();

    const prompt = `
당신은 시험 학습 튜터입니다. 문제와 해설을 바탕으로 질문에 답하세요.
문제: ${question}
보기: ${options.join(', ')}
정답: ${answer}
해설: ${explanation}
사용자 질문: ${userQuery}
    `;

    // 시도할 모델 조합 확장 (최신 Gemini 3.x 모델 우선 적용)
    const attempts = [
        { ver: 'v1beta', model: 'gemini-3.1-pro-preview' },
        { ver: 'v1beta', model: 'gemini-3.1-flash-lite-preview' },
        { ver: 'v1beta', model: 'gemini-3-pro-preview' },
        { ver: 'v1beta', model: 'gemini-3-flash-preview' },
        { ver: 'v1beta', model: 'gemini-2.5-flash' },
        { ver: 'v1beta', model: 'gemini-2.0-flash' }
    ];

    for (const attempt of attempts) {
        try {
            const url = `https://generativelanguage.googleapis.com/${attempt.ver}/models/${attempt.model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
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
                console.warn(`Failed ${attempt.model} (${attempt.ver}):`, errorData.error?.message);
            }
        } catch (error) {
            console.error(`Error with ${attempt.model}:`, error);
        }
    }

    // 모든 시도 실패 시 가용한 모델 목록을 로그에 찍어 원인 파악 (진단용)
    try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listRes.ok) {
            const listData = await listRes.json();
            console.log("Available models for this key:", listData.models?.map(m => m.name).join(', '));
        }
    } catch (e) {}

    return res.status(500).json({ error: 'AI 모델 호출에 모두 실패했습니다. 로그를 확인해 주세요.' });
}
