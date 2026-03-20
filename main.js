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

    // --- 모달 HTML 주입 ---
    const injectModal = () => {
        if (document.getElementById('auth-modal')) return;
        const modalHtml = `
            <div id="auth-modal" class="modal-overlay" onclick="if(event.target === this) closeModal()">
                <div class="modal-content">
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                    <div class="modal-header">
                        <h2 id="modal-title">로그인</h2>
                        <p id="modal-desc">학습 기록을 안전하게 보관하세요.</p>
                    </div>
                    <form class="auth-form" onsubmit="handleAuthSubmit(event)">
                        <div class="auth-input-group">
                            <label for="auth-email">이메일</label>
                            <input type="email" id="auth-email" placeholder="example@email.com" required>
                        </div>
                        <div class="auth-input-group">
                            <label for="auth-password">비밀번호</label>
                            <input type="password" id="auth-password" placeholder="••••••••" required>
                        </div>
                        <button type="submit" id="auth-submit-btn" class="auth-submit-btn">로그인</button>
                    </form>
                    <div class="auth-switch">
                        <span id="switch-text">계정이 없으신가요?</span>
                        <button onclick="switchAuthMode()" id="switch-btn">회원가입</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // --- 유틸리티 함수 ---
    const toNum = (id) => {
        if (typeof id === 'number') return id;
        if (!id) return 0;
        const num = parseInt(id.toString().replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    window.initializeData = function() {
        if (!window.examData) return;
        for (let examKey in window.examData) {
            const exam = window.examData[examKey];
            exam.sections.forEach(section => {
                section.questions.forEach((q, idx) => {
                    if (q.id === undefined) q.id = idx + 1;
                });
            });
        }
    };

    // --- 모달 제어 함수 ---
    let authMode = 'login'; // 'login' or 'signup'

    window.openLoginModal = function() {
        injectModal();
        authMode = 'login';
        updateModalUI();
        document.getElementById('auth-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    window.switchAuthMode = function() {
        authMode = authMode === 'login' ? 'signup' : 'login';
        updateModalUI();
    };

    const updateModalUI = () => {
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchText = document.getElementById('switch-text');
        const switchBtn = document.getElementById('switch-btn');

        if (authMode === 'login') {
            title.innerText = '반가워요! 👋';
            desc.innerText = '로그인하고 학습을 계속하세요.';
            submitBtn.innerText = '로그인';
            switchText.innerText = '계정이 없으신가요?';
            switchBtn.innerText = '회원가입';
        } else {
            title.innerText = '시작해볼까요? 🚀';
            desc.innerText = '계정을 만들고 진도율을 동기화하세요.';
            submitBtn.innerText = '회원가입 하기';
            switchText.innerText = '이미 계정이 있나요?';
            switchBtn.innerText = '로그인';
        }
    };

    window.handleAuthSubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const submitBtn = document.getElementById('auth-submit-btn');

        if (!email || !password) return;

        submitBtn.innerText = '처리 중...';
        submitBtn.disabled = true;

        try {
            if (authMode === 'login') {
                const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message === 'Invalid login credentials') {
                        if (confirm("계정이 없습니다. 회원가입으로 전환할까요?")) {
                            authMode = 'signup';
                            updateModalUI();
                            submitBtn.innerText = '회원가입 하기';
                            submitBtn.disabled = false;
                            return;
                        }
                    }
                    throw error;
                }
                location.reload();
            } else {
                const { error } = await window.supabaseClient.auth.signUp({ email, password });
                if (error) throw error;
                alert("회원가입 신청이 완료되었습니다! 이메일 인증 후 로그인해주세요.");
                authMode = 'login';
                updateModalUI();
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        } finally {
            submitBtn.innerText = authMode === 'login' ? '로그인' : '회원가입 하기';
            submitBtn.disabled = false;
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
        window.initializeData();
        const user = await window.checkUser();
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        if (user) {
            authContainer.innerHTML = `
                <span style="font-size: 0.8rem; opacity: 0.7;">${user.email}</span>
                <button onclick="logout()" class="theme-toggle" title="로그아웃">🔓</button>
            `;
            await window.loadSupabaseDataToLocal(user.id);
            await window.syncLocalDataToSupabase(user.id);
            window.dispatchEvent(new Event('dataLoaded'));
        } else {
            authContainer.innerHTML = `
                <button onclick="openLoginModal()" class="theme-toggle" title="로그인">🔒</button>
            `;
        }
    };

    // 기존 window.login 유지 (호환성용)
    window.login = window.openLoginModal;

    window.loadSupabaseDataToLocal = async function(userId) {
        if (!window.supabaseClient) return;
        try {
            const { data: progressData } = await window.supabaseClient
                .from('user_progress')
                .select('exam_key, section_id, correct_count')
                .eq('user_id', userId);

            if (progressData && progressData.length > 0) {
                const localProgress = JSON.parse(localStorage.getItem('progress_data') || '{}');
                progressData.forEach(p => {
                    const key = `${p.exam_key}_sec${p.section_id}`;
                    localProgress[key] = Math.max(localProgress[key] || 0, p.correct_count);
                });
                localStorage.setItem('progress_data', JSON.stringify(localProgress));
            }

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
        } catch (e) { console.error("데이터 로드 중 오류:", e); }
    };

    window.syncLocalDataToSupabase = async function(userId) {
        if (!window.supabaseClient) return;
        const localProgress = JSON.parse(localStorage.getItem('progress_data') || '{}');
        for (const key in localProgress) {
            const [examKey, sectionIdStr] = key.split('_');
            const count = localProgress[key];
            if (examKey && sectionIdStr) {
                await window.supabaseClient.from('user_progress').upsert({
                    user_id: userId, exam_key: examKey, section_id: toNum(sectionIdStr),
                    correct_count: count, updated_at: new Date()
                }, { onConflict: 'user_id, exam_key, section_id' });
            }
        }

        const syncItems = async (localKey, itemType) => {
            const items = JSON.parse(localStorage.getItem(localKey) || '[]');
            for (const item of items) {
                if (item.examKey && item.sectionId && item.id) {
                    await window.supabaseClient.from('user_items').upsert({
                        user_id: userId, exam_key: item.examKey, section_id: toNum(item.sectionId),
                        question_id: toNum(item.id), item_type: itemType
                    }, { onConflict: 'user_id, exam_key, section_id, question_id, item_type' });
                }
            }
        };
        await syncItems('wrong_questions', 'wrong');
        await syncItems('bookmarked_questions', 'bookmark');
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

    window.saveWrongQuestion = async function(q, examKey, examTitle) {
        const WRONG_KEY = 'wrong_questions';
        let wrongQuestions = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
        if (!wrongQuestions.some(item => item.examKey === examKey && item.q === q.q)) {
            const newItem = { ...q, examKey: examKey, examTitle: examTitle, savedAt: new Date().toISOString() };
            wrongQuestions.push(newItem);
            localStorage.setItem(WRONG_KEY, JSON.stringify(wrongQuestions));
            const user = await window.checkUser();
            if (user && window.supabaseClient && q.sectionId) {
                await window.supabaseClient.from('user_items').upsert({
                    user_id: user.id, exam_key: examKey, section_id: toNum(q.sectionId),
                    question_id: toNum(q.id), item_type: 'wrong'
                }, { onConflict: 'user_id, exam_key, section_id, question_id, item_type' });
            }
        }
    };

    window.saveSolvedQuestion = async function(q, examKey, examTitle) {
        const SOLVED_KEY = 'solved_questions';
        const PROGRESS_KEY = 'progress_data';
        let solvedQuestions = JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]');
        const isNew = !solvedQuestions.some(item => item.examKey === examKey && item.q === q.q);
        if (isNew) {
            solvedQuestions.push({ ...q, examKey: examKey, examTitle: examTitle, savedAt: new Date().toISOString() });
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
                        user_id: user.id, exam_key: examKey, section_id: toNum(q.sectionId),
                        correct_count: progress[key], updated_at: new Date()
                    }, { onConflict: 'user_id, exam_key, section_id' });
                }
            }
        }
    };

    window.addEventListener('load', window.updateAuthUI);
})();
