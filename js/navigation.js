/**
 * 공통 내비게이션 및 푸터 스크립트 (navigation.js)
 * 모바일 반응형 메뉴, 활성 메뉴 표시, 연락처 연동 관리
 */

import { CONTACT_CONFIG } from './firebase-config.js';

// SVG 아이콘
const ICONS = {
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

/**
 * 토스트 메시지 알림 함수
 */
export function showToast(message, duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/**
 * 헤더 및 내비게이션 렌더링
 */
export function renderHeader(activePage = '') {
  const headerElem = document.querySelector('.site-header');
  if (!headerElem) return;

  const navItems = [
    { name: 'HOME', href: 'index.html', key: 'home' },
    { name: 'ABOUT', href: 'about.html', key: 'about' },
    { name: 'PROJECTS', href: 'projects.html', key: 'projects' },
    { name: 'SKILLS', href: 'skills.html', key: 'skills' },
    { name: 'HOBBY', href: 'hobby.html', key: 'hobby' }
  ];

  const currentPath = window.location.pathname.toLowerCase();
  const currentFile = currentPath.split('/').pop() || 'index.html';

  const navHtml = navItems.map(item => {
    const isActive = activePage === item.key || currentFile === item.href;
    return `<li><a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">${item.name}</a></li>`;
  }).join('');

  headerElem.innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="logo" aria-label="김아현 포트폴리오 홈">
        KIM AHYEON<span>DATA SCIENCE</span>
      </a>
      
      <button class="mobile-nav-toggle" aria-label="메뉴 열기/닫기" aria-expanded="false">
        ${ICONS.menu}
      </button>

      <ul class="nav-links" id="primary-navigation">
        ${navHtml}
        <li><a href="admin.html" class="nav-link-admin" title="관리자 전용">ADMIN</a></li>
      </ul>
    </div>
  `;

  // 모바일 메뉴 토글 이벤트 등록
  const toggleBtn = headerElem.querySelector('.mobile-nav-toggle');
  const navLinks = headerElem.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav-open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
      toggleBtn.innerHTML = isOpen ? ICONS.close : ICONS.menu;
    });

    // 화면 바깥 클릭 또는 링크 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!headerElem.contains(e.target) && navLinks.classList.contains('nav-open')) {
        navLinks.classList.remove('nav-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = ICONS.menu;
      }
    });

    // ESC 키 입력 시 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('nav-open')) {
        navLinks.classList.remove('nav-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = ICONS.menu;
      }
    });
  }
}

/**
 * 푸터 렌더링
 */
export function renderFooter() {
  const footerElem = document.querySelector('.site-footer');
  if (!footerElem) return;

  footerElem.innerHTML = `
    <div class="container footer-inner">
      <div class="footer-name">KIM AHYEON</div>
      
      <div class="footer-social-links">
        <a href="#" class="footer-icon-link js-contact-mail" title="이메일 문의" aria-label="이메일">
          ${ICONS.mail}
        </a>
        <a href="#" class="footer-icon-link js-contact-github" title="GitHub 프로필" aria-label="GitHub">
          ${ICONS.github}
        </a>
      </div>

      <div class="footer-copyright">
        © 2026 Kim Ahyeon. All rights reserved.
      </div>
    </div>
  `;

  // 연락처 클릭 핸들러 (실제 정보 미입력 시 허위 링크 방지 정책)
  setupContactLinks();
}

/**
 * 연락처 링크 동작 연결
 */
export function setupContactLinks() {
  // 이메일 링크
  const mailLinks = document.querySelectorAll('.js-contact-mail');
  mailLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (CONTACT_CONFIG.email && CONTACT_CONFIG.email.trim() !== '') {
        link.href = `mailto:${CONTACT_CONFIG.email.trim()}`;
      } else {
        e.preventDefault();
        showToast('공개 이메일 주소 등록 전입니다.');
      }
    });
  });

  // GitHub 링크
  const githubLinks = document.querySelectorAll('.js-contact-github');
  githubLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (CONTACT_CONFIG.github && CONTACT_CONFIG.github.trim() !== '') {
        link.href = CONTACT_CONFIG.github.trim();
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        e.preventDefault();
        showToast('GitHub 프로필 주소 등록 전입니다.');
      }
    });
  });
}

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
});

