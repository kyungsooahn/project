(function() {
    console.log("main.js: Script started.");

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
                            <label for="auth-password">비밀번호</                            <input type="password" id="auth-password" placeholder="••••••••" required>
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
            if (exam && exam.sections) { // Add null check for exam and sections
                exam.sections.forEach(section => {
                    if (section && section.questions) { // Add null check for section and questions
                        section.questions.forEach((q, idx) => {
                            if (q.id === undefined) q.id = idx + 1;
                        });
                    }
                });
            }
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
        console.log("main.js: updateAuthUI called. Before initializeData. window.examData keys:", Object.keys(window.examData));
        window.initializeData();
        console.log("main.js: After initializeData. window.examData keys:", Object.keys(window.examData));
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
            console.log("main.js: updateAuthUI dispatching dataLoaded event.");
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
        location.removeItem('learning_streak');
        location.reload();
    };

    // --- 스트릭 관리 기능 ---
    window.updateStreak = function() {
        const STREAK_KEY = 'learning_streak';
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        let streakData = JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count": 0, "lastDate": ""}');
        
        if (streakData.lastDate === today) return streakData.count;

        const lastDate = new Date(streakData.lastDate);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (streakData.lastDate === yesterdayStr) {
            streakData.count += 1;
        } else {
            streakData.count = 1;
        }
        
        streakData.lastDate = today;
        localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
        return streakData.count;
    };

    window.getStreak = function() {
        const STREAK_KEY = 'learning_streak';
        const streakData = JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count": 0, "lastDate": ""}');
        if (streakData.count === 0) return 0;

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastDate = new Date(streakData.lastDate);
        
        // 오늘이 아니고 어제도 아니면 스트릭 종료
        const diffTime = Math.abs(now - lastDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (streakData.lastDate !== today && diffDays > 1) return 0;
        return streakData.count;
    };

    window.saveWrongQuestion = async function(q, examKey, examTitle) {
        const WRONG_KEY = 'wrong_questions';
        let wrongQuestions = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
        let itemIdx = wrongQuestions.findIndex(item => item.examKey === examKey && item.q === q.q);
        
        const now = new Date();
        const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 기본 1일 후

        if (itemIdx === -1) {
            const newItem = { 
                ...q, 
                examKey: examKey, 
                examTitle: examTitle, 
                savedAt: now.toISOString(),
                level: 1,
                nextReviewDate: nextReview.toISOString(),
                wrongCount: 1
            };
            wrongQuestions.push(newItem);
        } else {
            // 이미 있는 경우 레벨 리셋 및 시간 갱신
            wrongQuestions[itemIdx].level = 1;
            wrongQuestions[itemIdx].nextReviewDate = nextReview.toISOString();
            wrongQuestions[itemIdx].wrongCount = (wrongQuestions[itemIdx].wrongCount || 0) + 1;
        }

        localStorage.setItem(WRONG_KEY, JSON.stringify(wrongQuestions));
        window.updateStreak();
        const user = await window.checkUser();
        if (user && window.supabaseClient && q.sectionId) {
            await window.supabaseClient.from('user_items').upsert({
                user_id: user.id, exam_key: examKey, section_id: toNum(q.sectionId),
                question_id: toNum(q.id), item_type: 'wrong'
            }, { onConflict: 'user_id, exam_key, section_id, question_id, item_type' });
        }
    };

    window.updateReviewStatus = async function(q, examKey, isCorrect) {
        const WRONG_KEY = 'wrong_questions';
        let wrongQuestions = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
        let itemIdx = wrongQuestions.findIndex(item => item.examKey === examKey && item.q === q.q);

        if (itemIdx > -1) {
            const item = wrongQuestions[itemIdx];
            if (isCorrect) {
                // 맞히면 레벨업 (1일 -> 3일 -> 7일 -> 완료)
                item.level = (item.level || 1) + 1;
                let days = item.level === 2 ? 3 : (item.level === 3 ? 7 : 14);
                
                if (item.level > 3) {
                    // 3단계 완료 시 오답 노트에서 제거 (선택 사항)
                    // wrongQuestions.splice(itemIdx, 1); 
                    item.nextReviewDate = null; // 복습 완료
                } else {
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + days);
                    item.nextReviewDate = nextDate.toISOString();
                }
            } else {
                // 틀리면 1단계로 리셋
                item.level = 1;
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + 1);
                item.nextReviewDate = nextDate.toISOString();
                item.wrongCount = (item.wrongCount || 0) + 1;
            }
            localStorage.setItem(WRONG_KEY, JSON.stringify(wrongQuestions));
            window.updateStreak();
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
            window.updateStreak();
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

    // --- 4. TTS (음성 읽어주기) 기능 ---
    window.speakText = function(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // 진행 중인 음성 중단
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    // --- Functions moved from index.html ---
    window.WRONG_KEY = 'wrong_questions';
    window.PROGRESS_KEY = 'progress_data';
    let globalTotalQ = 0;

    window.getStats = function() {
        try {
            const wrongs = JSON.parse(localStorage.getItem(window.WRONG_KEY) || '[]');
            const progress = JSON.parse(localStorage.getItem(window.PROGRESS_KEY) || '{}');
            return { wrongs, progress };
        } catch (e) { return { wrongs: [], progress: {} }; }
    };

    window.renderExams = function() {
        console.log("main.js: renderExams called. window.examData keys:", Object.keys(window.examData));
        const financeGrid = document.getElementById('finance-grid');
        const propertyGrid = document.getElementById('property-grid');
        // const statsText = document.getElementById('total-stats'); // Removed as per index.html commented out line
        if (!financeGrid || !propertyGrid) return;

        const { wrongs, progress } = window.getStats();
        financeGrid.innerHTML = ''; propertyGrid.innerHTML = '';
        const categories = { finance: ['cim', 'fia'], property: ['crea1', 'crea2'] };

        // Ensure consistent order by sorting keys
        const sortedExamKeys = Object.keys(window.examData).sort();
        for (const key of sortedExamKeys) {
            const exam = window.examData[key];
            console.log("main.js: renderExams processing exam:", key, "Exam data:", exam);
            if (!exam || !exam.title || !exam.sections) {
                console.warn(`main.js: Skipping rendering for exam key ${key} due to missing or invalid data.`, exam);
                continue;
            }
            const grid = categories.finance.includes(key) ? financeGrid : propertyGrid;
            const card = document.createElement('div');
            card.className = 'exam-card';

            let sectionsHtml = exam.sections.map(s => {
                const sectionWrongCount = wrongs.filter(w => w.examKey === key && w.sectionId === s.id).length;
                const sectionCorrectCount = progress[`${key}_${s.id}`] || 0;
                const totalQ = s.questions ? s.questions.length : 0;
                globalTotalQ += totalQ;
                
                const percent = totalQ > 0 ? Math.round((sectionCorrectCount / totalQ) * 100) : 0;
                
                const attempted = sectionCorrectCount + sectionWrongCount;
                const accuracy = attempted > 0 ? Math.round((sectionCorrectCount / attempted) * 100) : 0;

                return `
                    <a href="quiz.html?exam=${key}&section=${s.id}" class="section-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                            <span style="font-weight: 500;">${s.name}</span>
                            <div class="stats-badge" style="flex-wrap: wrap; justify-content: flex-end;">
                                ${sectionWrongCount > 0 ? `<span class="badge badge-wrong">오답 ${sectionWrongCount}</span>` : ''}
                                ${attempted > 0 ? `<span class="badge" style="background:var(--primary); opacity:0.9;">정답 ${accuracy}%</span>` : ''}
                                <span class="badge badge-progress">${percent}%</span>
                                <span class="badge badge-q">${totalQ}</span>
                            </div>
                        </div>
                        <div class="progress-mini"><div class="progress-mini-fill" style="width: ${percent}%"></div></div>
                    </a>
                `;
            }).join('');

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h3 style="margin: 0;">${exam.title}</h3>
                    <a href="mock.html?exam=${key}" class="mock-btn-main" style="background: var(--primary); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; text-decoration: none; font-weight: bold;">⏱️ 실전 모의고사</a>
                </div>
                <div class="section-list">${sectionsHtml}</div>
            `;
            grid.appendChild(card);
        }
        // if (statsText) statsText.innerText = `현재 총 ${globalTotalQ.toLocaleString()}개의 문제가 준비되어 있습니다.`;
    };

    window.checkReviews = function() {
        const wrongs = JSON.parse(localStorage.getItem(window.WRONG_KEY) || '[]');
        const now = new Date();
        const dueReviews = wrongs.filter(w => w.nextReviewDate && new Date(w.nextReviewDate) <= now);
        
        const container = document.getElementById('review-alert-container');
        const countText = document.getElementById('review-count-text');
        
        if (dueReviews.length > 0) {
            container.style.display = 'block';
            countText.innerText = `에빙하우스 망각 곡선에 따른 복습 주기가 돌아온 문제가 ${dueReviews.length}개 있습니다.`;
        } else {
            container.style.display = 'none';
        }
    };

    window.updateStreakUI = function() {
        const streak = window.getStreak ? window.getStreak() : 0;
        const badge = document.getElementById('streak-badge');
        const count = document.getElementById('streak-count');
        if (streak > 0 && badge && count) {
            badge.style.display = 'flex';
            count.innerText = streak;
        }
    };

    window.examData = {}; // Explicitly initialize window.examData here to ensure it exists
    let expectedDataFiles = 4; // cim, fia, crea1, crea2
    let dataFilesLoaded = 0;
    console.log("main.js: Initializing data loading checks.");


    window.addEventListener('dataLoaded', (e) => {
        dataFilesLoaded++;
        console.log(`main.js: dataLoaded event received for ${e.detail.examKey}. Success: ${e.detail.success}. Total loaded: ${dataFilesLoaded}/${expectedDataFiles}`);
        if (e.detail && e.detail.success === false) {
            console.warn(`main.js: Failed to load data for ${e.detail.examKey}:`, e.detail.error);
            // Even on failure, we let the counter increment to ensure renderExams eventually runs.
            // The robust check inside renderExams will handle missing data.
        } else if (e.detail && e.detail.success === true) {
            console.log(`main.js: Successfully loaded data for ${e.detail.examKey}`);
        }

        if (dataFilesLoaded === expectedDataFiles) {
            console.log("main.js: All expected data files reported. Calling renderExams. Current window.examData state:", window.examData);
            window.renderExams();
            window.checkReviews();
            window.updateStreakUI();
        }
    });

    // window.addEventListener('DOMContentLoaded', () => {
    //     console.log("main.js: DOMContentLoaded fired. Checking if exams can be rendered early (for debug).");
    //     if (Object.keys(window.examData).length > 0) {
    //         console.log("main.js: window.examData has data on DOMContentLoaded. Rendering early.");
    //         window.renderExams();
    //         window.checkReviews();
    //         window.updateStreakUI();
    //     } else {
    //         console.log("main.js: window.examData is empty on DOMContentLoaded. Waiting for dataLoaded events.");
    //     }
    // });

    window.addEventListener('load', window.updateAuthUI);
})();
