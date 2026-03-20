(function() {
    // 1. 테마 초기화
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 2. Supabase 설정 (사용자님의 정보로 교체 필요)
    const SUPABASE_URL = 'https://pvanrojtiqnmiavqidrx.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_HJR9tBUyXxKiKQuyWkml0w_d6pBmvSV';
    
    // CDN을 통해 로드된 supabase 객체가 있는지 확인 후 초기화
    let supabaseClient = null;
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    window.supabaseClient = supabaseClient;

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

    // 로그인/로그아웃 관련 로직
    window.checkUser = async function() {
        if (!window.supabaseClient) return null;
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        return user;
    };

    window.updateAuthUI = async function() {
        const user = await window.checkUser();
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        if (user) {
            authContainer.innerHTML = `
                <span style="font-size: 0.8rem; opacity: 0.7;">${user.email}</span>
                <button onclick="logout()" class="theme-toggle" title="로그아웃">🔓</button>
            `;
            // 1. 먼저 DB 데이터를 로컬로 불러오기 (다른 기기 데이터 복구)
            await window.loadSupabaseDataToLocal(user.id);
            // 2. 그 다음 로컬 데이터를 DB로 동기화 (현재 기기 데이터 백업)
            await window.syncLocalDataToSupabase(user.id);
            
            // 데이터 로드가 완료되었음을 알림 (인덱스나 통계 페이지 리렌더링용)
            window.dispatchEvent(new Event('dataLoaded'));
        } else {
            authContainer.innerHTML = `
                <button onclick="login()" class="theme-toggle" title="로그인">🔒</button>
            `;
        }
    };

    // Supabase DB 데이터를 localStorage로 덮어쓰는 함수
    window.loadSupabaseDataToLocal = async function(userId) {
        if (!window.supabaseClient) return;
        console.log("DB 데이터 불러오는 중...");

        // 1. 진도율 불러오기
        const { data: progressData } = await window.supabaseClient
            .from('user_progress')
            .select('exam_key, section_id, correct_count')
            .eq('user_id', userId);

        if (progressData) {
            const localProgress = {};
            progressData.forEach(p => {
                localProgress[`${p.exam_key}_${p.section_id}`] = p.correct_count;
            });
            localStorage.setItem('progress_data', JSON.stringify(localProgress));
        }

        // 2. 오답 및 즐겨찾기 불러오기
        const { data: itemsData } = await window.supabaseClient
            .from('user_items')
            .select('exam_key, section_id, question_id, item_type')
            .eq('user_id', userId);

        if (itemsData) {
            const wrongs = [];
            const bookmarks = [];

            itemsData.forEach(item => {
                // 실제 문제 데이터와 결합하기 위해 최소 정보만 저장
                // 상세 데이터는 각 페이지에서 .js 파일을 통해 결합됨
                const exam = window.examData ? window.examData[item.exam_key] : null;
                const section = exam ? exam.sections.find(s => s.id == item.section_id) : null;
                const question = section ? section.questions.find(q => q.id == item.question_id) : null;

                if (question) {
                    const fullItem = {
                        ...question,
                        examKey: item.exam_key,
                        examTitle: exam ? exam.title : '',
                        sectionId: item.section_id,
                        savedAt: new Date().toISOString()
                    };
                    if (item.item_type === 'wrong') wrongs.push(fullItem);
                    else bookmarks.push(fullItem);
                }
            });

            localStorage.setItem('wrong_questions', JSON.stringify(wrongs));
            localStorage.setItem('bookmarked_questions', JSON.stringify(bookmarks));
        }
        console.log("DB 데이터 로드 완료!");
    };

    // 로컬 데이터를 Supabase로 동기화하는 핵심 함수
    window.syncLocalDataToSupabase = async function(userId) {
        if (!window.supabaseClient) return;

        console.log("동기화 시작...");

        // 1. 진도율(Progress) 동기화
        const localProgress = JSON.parse(localStorage.getItem('progress_data') || '{}');
        for (const key in localProgress) {
            const [examKey, sectionId] = key.split('_');
            const count = localProgress[key];
            if (examKey && sectionId) {
                await window.supabaseClient
                    .from('user_progress')
                    .upsert({
                        user_id: userId,
                        exam_key: examKey,
                        section_id: parseInt(sectionId),
                        correct_count: count,
                        updated_at: new Date()
                    }, { onConflict: 'user_id, exam_key, section_id' });
            }
        }

        // 2. 오답(Wrongs) 및 즐겨찾기(Bookmarks) 동기화
        const syncItems = async (localKey, itemType) => {
            const items = JSON.parse(localStorage.getItem(localKey) || '[]');
            for (const item of items) {
                // 기존 데이터 구조: { examKey, sectionId, questionId, ... }
                if (item.examKey && item.sectionId && item.id !== undefined) {
                    await window.supabaseClient
                        .from('user_items')
                        .upsert({
                            user_id: userId,
                            exam_key: item.examKey,
                            section_id: parseInt(item.sectionId),
                            question_id: parseInt(item.id),
                            item_type: itemType
                        }, { onConflict: 'user_id, exam_key, section_id, question_id, item_type' });
                }
            }
        };

        await syncItems('wrong_questions', 'wrong');
        await syncItems('bookmarked_questions', 'bookmark');

        console.log("동기화 완료!");
    };

    window.login = async function() {
        // 간단한 프롬프트를 통한 이메일 로그인 (실제 서비스에서는 모달이나 별도 페이지 권장)
        const email = prompt("이메일을 입력하세요:");
        if (!email) return;
        const password = prompt("비밀번호를 입력하세요:");
        if (!password) return;

        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (error.message === 'Invalid login credentials') {
                if (confirm("계정이 없습니다. 회원가입 하시겠습니까?")) {
                    const { error: signUpError } = await window.supabaseClient.auth.signUp({
                        email,
                        password
                    });
                    if (signUpError) alert("회원가입 실패: " + signUpError.message);
                    else alert("회원가입 성공! 이메일 인증 후 로그인해주세요.");
                }
            } else {
                alert("로그인 실패: " + error.message);
            }
        } else {
            location.reload();
        }
    };

    window.logout = async function() {
        if (!window.supabaseClient) return;
        await window.supabaseClient.auth.signOut();
        // 로그아웃 시 로컬 데이터 삭제 (보안 및 데이터 정합성)
        localStorage.removeItem('progress_data');
        localStorage.removeItem('wrong_questions');
        localStorage.removeItem('bookmarked_questions');
        localStorage.removeItem('solved_questions');
        location.reload();
    };

    // --- 데이터 저장 공용 함수 ---

    window.saveWrongQuestion = async function(q, examKey, examTitle) {
        const WRONG_KEY = 'wrong_questions';
        let wrongQuestions = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');

        // 이미 저장된 오답인지 확인 (중복 방지)
        if (!wrongQuestions.some(item => item.examKey === examKey && item.q === q.q)) {
            wrongQuestions.push({
                ...q,
                examKey: examKey,
                examTitle: examTitle,
                savedAt: new Date().toISOString()
            });
            localStorage.setItem(WRONG_KEY, JSON.stringify(wrongQuestions));
            
            const user = await window.checkUser();
            if (user && window.supabaseClient && q.sectionId) {
                await window.supabaseClient.from('user_items').upsert({
                    user_id: user.id,
                    exam_key: examKey,
                    section_id: parseInt(q.sectionId),
                    question_id: parseInt(q.id),
                    item_type: 'wrong'
                });
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
                    await window.supabaseClient.from('user_progress').upsert({
                        user_id: user.id,
                        exam_key: examKey,
                        section_id: parseInt(q.sectionId),
                        correct_count: progress[key],
                        updated_at: new Date()
                    }, { onConflict: 'user_id, exam_key, section_id' });
                }
            }
        }
    };

    // 페이지 로드 시 UI 업데이트
    window.addEventListener('DOMContentLoaded', window.updateAuthUI);
})();
