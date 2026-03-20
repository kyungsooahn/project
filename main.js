(function() {
    // 즉시 실행 함수(IIFE)를 사용하여 초기 렌더링 시 깜빡임을 최소화합니다.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 전역에서 접근할 수 있도록 window 객체에 할당합니다.
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
        
        // 차트 등이 있는 경우 이벤트를 발생시켜 업데이트할 수 있게 합니다.
        window.dispatchEvent(new Event('themeChanged'));
    };
})();
