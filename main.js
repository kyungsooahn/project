(function() {
    // 1. 테마 초기화
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 2. Supabase 설정
    const SUPABASE_URL = 'https://pvanrojtiqnmiavqidrx.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_HJR9tBUyXxKiKQuyWkml0w_d6pBmvSV';
    
    let supabaseClient = null;
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    window.supabaseClient = supabaseClient;

    // --- 유틸리티 함수 ---
    
    // "sec1" -> 1 형식으로 변환하는 헬퍼
    const toNum = (id) => {
        if (typeof id === 'number') return id;
        if (!id) return 0;
        const num = parseInt(id.toString().replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // 모든 문제에 고유 ID(인덱스) 부여 및 섹션 ID 숫자화
    window.initializeData = function() {
        if (!window.examData) return;
        for (let examKey in window.examData) {
            const exam = window.examData[examKey];
            exam.sections.forEach(section => {
                section.questions.forEach((q, idx) => {
                    // 고유 ID가 없으면 인덱스 + 1 부여
                    if (q.id === undefined) q.id = idx + 1;
                });
            });
        }
    };

    // 3. 전역 함수들
    window.toggleTheme = function() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            html.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        window.dispatchEvent(new Event('themeChanged'));
    };

    window.checkUser = async function() {
        if (!window.supabaseClient) return null;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            return user;
        } catch (e) { return null; }
    };

    window.updateAuthUI = async function() {
        // 데이터 초기화 (ID 부여 등)
        window.initializeData();
        
        const user = await window.checkUser();
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        if (user) {
            authContainer.innerHTML = `
                <span style="font-size: 0.8rem; opacity: 0.7;">${user.email}</span>
                <button onclick="logout()" class="theme-toggle" title="로그아웃">🔓</button>
            `;
            // 데이터 동기화 (불러오기 후 백업)
            await window.loadSupabaseDataToLocal(user.id);
            await window.syncLocalDataToSupabase(user.id);
            
            window.dispatchEvent(new Event('dataLoaded'));
        } else {
            authContainer.innerHTML = `
                <button onclick="login()" class="theme-toggle" title="로그인">🔒</button>
            `;
        }
    };

    window.loadSupabaseDataToLocal = async function(userId) {
        if (!window.supabaseClient) return;
        console.log("DB 데이터 확인 중...");

        try {
            // 1. 진도율 불러오기 및 머지
            const { data: progressData } = await window.supabaseClient
                .from('user_progress')
                .select('exam_key, section_id, correct_count')
                .eq('user_id', userId);

            if (progressData && progressData.length > 0) {
                const localProgress = JSON.parse(localStorage.getItem('progress_data') || '{}');
                progressData.forEach(p => {
                    const key = `${p.exam_key}_sec${p.section_id}`;
                    // 로컬보다 큰 값이면 업데이트 (머지 전략)
                    localProgress[key] = Math.max(localProgress[key] || 0, p.correct_count);
                });
                localStorage.setItem('progress_data', JSON.stringify(localProgress));
            }

            // 2. 오답 및 즐겨찾기 불러오기 및 머지
            const { data: itemsData } = await window.supabaseClient
                .from('user_items')
                .select('exam_key, section_id, question_id, item_type')
                .eq('user_id', userId);

            if (itemsData && itemsData.length > 0) {
                const localWrongs = JSON.parse(localStorage.getItem('wrong_questions') || '[]');
                const localBookmarks = JSON.parse(localStorage.getItem('bookmarked_questions') || '[]');

                itemsData.forEach(item => {
                    const exam = window.examData ? window.examData[item.exam_key] : null;
                    const section = exam ? exam.sections.find(s => toNum(s.id) === item.section_id) : null;
                    const question = section ? section.questions.find(q => q.id === item.question_id) : null;

                    if (question) {
                        const targetList = item.item_type === 'wrong' ? localWrongs : localBookmarks;
                        const exists = targetList.some(q => q.examKey === item.exam_key && q.id === item.question_id);
                        
                        if (!exists) {
                            targetList.push({
                                ...question,
                                examKey: item.exam_key,
                                examTitle: exam ? exam.title : '',
                                sectionId: section ? section.id : `sec${item.section_id}`,
                                savedAt: new Date().toISOString()
                            });
                        }
                    }
                });

                localStorage.setItem('wrong_questions', JSON.stringify(localWrongs));
                localStorage.setItem('bookmarked_questions', JSON.stringify(localBookmarks));
            }
            console.log("DB 데이터 머지 완료!");
        } catch (e) {
            console.error("데이터 로드 중 오류:", e);
        }
    };

    window.syncLocalDataToSupabase = async function(userId) {
        if (!window.supabaseClient) return;
        console.log("로컬 데이터를 DB로 동기화 중...");

        const localProgress = JSON.parse(localStorage.getItem('progress_data') || '{}');
        for (const key in localProgress) {
            const [examKey, sectionIdStr] = key.split('_');
            const count = localProgress[key];
            if (examKey && sectionIdStr) {
                await window.supabaseClient.from('user_progress').upsert({
                    user_id: userId,
                    exam_key: examKey,
                    section_id: toNum(sectionIdStr),
                    correct_count: count,
                    updated_at: new Date()
                }, { onConflict: 'user_id, exam_key, section_id' });
            }
        }

        const syncItems = async (localKey, itemType) => {
            const items = JSON.parse(localStorage.getItem(localKey) || '[]');
            for (const item of items) {
                if (item.examKey && item.sectionId && item.id) {
                    await window.supabaseClient.from('user_items').upsert({
                        user_id: userId,
                        exam_key: item.examKey,
                        section_id: toNum(item.sectionId),
                        question_id: toNum(item.id),
                        item_type: itemType
                    }, { onConflict: 'user_id, exam_key, section_id, question_id, item_type' });
                }
            }
        };

        await syncItems('wrong_questions', 'wrong');
        await syncItems('bookmarked_questions', 'bookmark');
        console.log("백업 완료!");
    };

    window.login = async function() {
        const email = prompt("이메일을 입력하세요:");
        if (!email) return;
        const password = prompt("비밀번호를 입력하세요:");
        if (!password) return;

        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message === 'Invalid login credentials') {
                if (confirm("계정이 없습니다. 회원가입 하시겠습니까?")) {
                    const { error: signUpError } = await window.supabaseClient.auth.signUp({ email, password });
                    if (signUpError) alert("회원가입 실패: " + signUpError.message);
                    else alert("회원가입 성공! 이메일 인증 후 로그인해주세요.");
                }
            } else { alert("로그인 실패: " + error.message); }
        } else { location.reload(); }
    };

    window.logout = async function() {
        if (!window.supabaseClient) return;
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem('progress_data');
        localStorage.removeItem('wrong_questions');
        localStorage.removeItem('bookmarked_questions');
        localStorage.removeItem('solved_questions');
        location.reload();
    };

    // --- 데이터 저장 공용 함수 (Supabase 오류 수정) ---

    window.saveWrongQuestion = async function(q, examKey, examTitle) {
        const WRONG_KEY = 'wrong_questions';
        let wrongQuestions = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');

        if (!wrongQuestions.some(item => item.examKey === examKey && item.q === q.q)) {
            const newItem = {
                ...q,
                examKey: examKey,
                examTitle: examTitle,
                savedAt: new Date().toISOString()
            };
            wrongQuestions.push(newItem);
            localStorage.setItem(WRONG_KEY, JSON.stringify(wrongQuestions));
            
            const user = await window.checkUser();
            if (user && window.supabaseClient && q.sectionId) {
                const { error } = await window.supabaseClient.from('user_items').upsert({
                    user_id: user.id,
                    exam_key: examKey,
                    section_id: toNum(q.sectionId),
                    question_id: toNum(q.id),
                    item_type: 'wrong'
                }, { onConflict: 'user_id, exam_key, section_id, question_id, item_type' });
                if (error) console.error("Supabase 저장 실패 (Wrong):", error);
            }
        }
    };

    window.saveSolvedQuestion = async function(q, examKey, examTitle) {
        const SOLVED_KEY = 'solved_questions';
        const PROGRESS_KEY = 'progress_data';
        
        let solvedQuestions = JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]');
        const isNew = !solvedQuestions.some(item => item.examKey === examKey && item.q === q.q);

        if (isNew) {
            solvedQuestions.push({
                ...q,
                examKey: examKey,
                examTitle: examTitle,
                savedAt: new Date().toISOString()
            });
            localStorage.setItem(SOLVED_KEY, JSON.stringify(solvedQuestions));

            if (q.sectionId) {
                let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
                const key = `${examKey}_${q.sectionId}`;
                if (!progress[key]) progress[key] = 0;
                progress[key] += 1;
                localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

                const user = await window.checkUser();
                if (user && window.supabaseClient) {
                    const { error } = await window.supabaseClient.from('user_progress').upsert({
                        user_id: user.id,
                        exam_key: examKey,
                        section_id: toNum(q.sectionId),
                        correct_count: progress[key],
                        updated_at: new Date()
                    }, { onConflict: 'user_id, exam_key, section_id' });
                    if (error) console.error("Supabase 저장 실패 (Progress):", error);
                }
            }
        }
    };

    // 페이지 로드 시 UI 업데이트
    window.addEventListener('load', window.updateAuthUI);
})();
