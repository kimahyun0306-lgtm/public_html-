/**
 * 프로젝트 상세 페이지 스크립트 (project-detail.js)
 * 기획서 3.3의 8대 필수 구성 항목 렌더링 및 모달 뷰어 지원
 */

import { projectDataService } from './firebase-config.js';

let currentProject = null;

async function initProjectDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const isPreview = urlParams.get('preview') === 'true';

  const container = document.getElementById('project-detail-container');
  const errorContainer = document.getElementById('project-error-state');

  if (!projectId) {
    showError('프로젝트 ID가 지정되지 않았습니다.');
    return;
  }

  try {
    currentProject = await projectDataService.getProjectById(projectId);

    if (!currentProject) {
      showError('요청하신 프로젝트를 찾을 수 없습니다.');
      return;
    }

    // 초안 문서인 경우 일반 방문자 차단 (preview 파라미터가 없으면 숨김)
    if (currentProject.status === 'draft' && !isPreview) {
      showError('비공개(초안) 상태의 프로젝트입니다.');
      return;
    }

    renderProjectDetail(currentProject, isPreview);
    setupLightbox();

  } catch (err) {
    console.error('프로젝트 상세 로드 실패:', err);
    showError('프로젝트 정보를 불러오는 도중 오류가 발생했습니다.');
  }
}

function showError(msg) {
  const container = document.getElementById('project-detail-container');
  const errorContainer = document.getElementById('project-error-state');
  if (container) container.style.display = 'none';
  if (errorContainer) {
    errorContainer.style.display = 'block';
    const desc = errorContainer.querySelector('.empty-state-desc');
    if (desc) desc.textContent = msg;
  }
}

function renderProjectDetail(p, isPreview) {
  document.title = `${escapeHtml(p.title)} | 김아현 포트폴리오`;

  // 태그 목록
  const tagsHtml = Array.isArray(p.tags) && p.tags.length > 0
    ? p.tags.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')
    : '';

  // 날짜
  const dateStr = p.createdAt ? formatDate(p.createdAt) : '';

  // 1. 커버 이미지
  const coverHtml = p.coverImageUrl
    ? `<div class="detail-cover-container">
         <img src="${escapeHtml(p.coverImageUrl)}" alt="${escapeHtml(p.title)} 대표 이미지" class="detail-cover-img js-lightbox-trigger">
       </div>`
    : '';

  // 2. 분석 목적 및 사용 데이터
  let objectiveHtml = '';
  if (p.objective || p.dataDescription) {
    objectiveHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">01. 분석 목적 및 데이터 정의</h2>
        ${p.objective ? `
          <div class="form-group">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--color-accent-dark);">분석 목적</h3>
            <p class="detail-text-block">${escapeHtml(p.objective)}</p>
          </div>
        ` : ''}
        ${p.dataDescription ? `
          <div class="form-group" style="margin-top: 24px;">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--color-accent-dark);">사용 데이터 명세</h3>
            <p class="detail-text-block">${escapeHtml(p.dataDescription)}</p>
          </div>
        ` : ''}
      </section>
    `;
  }

  // 3. 사용 기술 및 분석 방법
  let methodsHtml = '';
  const methodsArray = Array.isArray(p.methods) ? p.methods : (p.methods ? [p.methods] : []);
  if (methodsArray.length > 0) {
    methodsHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">02. 사용 기술 및 분석 방법론</h2>
        <div class="methods-chip-list">
          ${methodsArray.map(m => `<span class="method-chip">${escapeHtml(m)}</span>`).join('')}
        </div>
      </section>
    `;
  }

  // 4. 진행 과정
  let processHtml = '';
  if (p.process) {
    processHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">03. 분석 및 연구 진행 과정</h2>
        <p class="detail-text-block">${escapeHtml(p.process)}</p>
      </section>
    `;
  }

  // 5. 주요 결과 및 시각화 이미지
  let resultsHtml = '';
  if (p.results) {
    resultsHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">04. 주요 분석 결과</h2>
        <p class="detail-text-block">${escapeHtml(p.results)}</p>
      </section>
    `;
  }

  // 6. 보고서 / 발표자료 미리보기 (PDF / Image Preview)
  let previewHtml = '';
  if (Array.isArray(p.previewFiles) && p.previewFiles.length > 0) {
    const fileItems = p.previewFiles.map(file => {
      const isPdf = file.type === 'pdf' || (file.url && file.url.toLowerCase().endsWith('.pdf'));
      if (isPdf) {
        return `
          <div style="margin-top: 20px;">
            <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 8px;">${escapeHtml(file.name || '보고서 미리보기')}</h4>
            <iframe src="${escapeHtml(file.url)}" class="pdf-viewer-frame" title="${escapeHtml(file.name || 'PDF Document')}"></iframe>
          </div>
        `;
      } else {
        return `
          <div class="gallery-item">
            <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name || '결과 시각화')}" class="js-lightbox-trigger">
            <div class="gallery-caption">${escapeHtml(file.name || '시각화 결과')}</div>
          </div>
        `;
      }
    }).join('');

    previewHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">05. 산출물 및 시각화 미리보기</h2>
        <div class="detail-gallery">
          ${fileItems}
        </div>
      </section>
    `;
  }

  // 7. 원본 파일 다운로드
  let downloadsHtml = '';
  if (Array.isArray(p.downloadFiles) && p.downloadFiles.length > 0) {
    const downloadCards = p.downloadFiles.map(file => {
      return `
        <div class="file-card">
          <div class="file-info">
            <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <div class="file-texts">
              <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
              <div class="file-meta">${escapeHtml(file.type || 'FILE')} ${file.size ? `• ${escapeHtml(file.size)}` : ''}</div>
            </div>
          </div>
          <a href="${escapeHtml(file.url)}" download="${escapeHtml(file.name)}" class="file-action-btn" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            다운로드
          </a>
        </div>
      `;
    }).join('');

    downloadsHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">06. 원본 자료 및 보고서 다운로드</h2>
        <div class="files-grid">
          ${downloadCards}
        </div>
      </section>
    `;
  }

  // 8. 느낀 점, 한계 및 개선 방향
  let reflectionHtml = '';
  if (p.reflection) {
    reflectionHtml = `
      <section class="detail-section">
        <h2 class="detail-section-title">07. 느낀 점 및 향후 개선 방향</h2>
        <p class="detail-text-block">${escapeHtml(p.reflection)}</p>
      </section>
    `;
  }

  const container = document.getElementById('project-detail-container');
  container.innerHTML = `
    <!-- Back to List -->
    <a href="projects.html" class="detail-back-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      PROJECTS 목록으로 돌아가기
    </a>

    <!-- Detail Header -->
    <header class="detail-header">
      <div class="detail-tags">
        ${tagsHtml}
        ${p.status === 'draft' ? `<span class="status-badge status-draft">초안 (Draft) 미리보기</span>` : ''}
      </div>
      <h1 class="detail-title">${escapeHtml(p.title)}</h1>
      ${p.summary ? `<p class="detail-summary">${escapeHtml(p.summary)}</p>` : ''}
      <div class="detail-meta-bar">
        <span>작성자: 김아현</span>
        ${dateStr ? `<span>등록일: ${dateStr}</span>` : ''}
      </div>
    </header>

    <!-- Cover Image -->
    ${coverHtml}

    <!-- Content Sections -->
    <div class="detail-content">
      ${objectiveHtml}
      ${methodsHtml}
      ${processHtml}
      ${resultsHtml}
      ${previewHtml}
      ${downloadsHtml}
      ${reflectionHtml}
    </div>
  `;
}

/**
 * 이미지 라이트박스(확대 보기) 이벤트 설정
 */
function setupLightbox() {
  const overlay = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  if (!overlay || !modalImg) return;

  document.querySelectorAll('.js-lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => {
      modalImg.src = img.src;
      modalImg.alt = img.alt || '이미지 확대';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch (e) {
    return '';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', initProjectDetailPage);

