/**
 * 프로젝트 목록 렌더링 및 필터링 스크립트 (projects.js)
 */

import { projectDataService } from './firebase-config.js';

let allPublishedProjects = [];
let activeTag = 'ALL';
let searchQuery = '';

/**
 * 초기화 및 프로젝트 로드
 */
async function initProjectsPage() {
  const container = document.getElementById('projects-grid-container');
  const emptyState = document.getElementById('projects-empty-state');
  const tagsContainer = document.getElementById('tag-filter-list');
  const searchInput = document.getElementById('projects-search-input');

  if (!container) return;

  try {
    // 공개 프로젝트 목록 불러오기
    allPublishedProjects = await projectDataService.getPublishedProjects();

    // 프로젝트가 없을 때 (기획서 3.3: 0개일 때 안내)
    if (!allPublishedProjects || allPublishedProjects.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (container) container.style.display = 'none';
      if (tagsContainer) tagsContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (container) container.style.display = 'grid';

    // 태그 목록 구성
    renderTags(allPublishedProjects);

    // 프로젝트 카드 렌더링
    renderProjectCards();

    // 검색 이벤트 등록
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderProjectCards();
      });
    }

  } catch (err) {
    console.error('프로젝트 목록 로드 실패:', err);
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.querySelector('.empty-state-title').textContent = '데이터를 불러오는 중입니다.';
    }
  }
}

/**
 * 필터 태그 렌더링
 */
function renderTags(projects) {
  const tagsContainer = document.getElementById('tag-filter-list');
  if (!tagsContainer) return;

  const tagSet = new Set();
  projects.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => {
        if (t && t.trim()) tagSet.add(t.trim());
      });
    }
  });

  const sortedTags = Array.from(tagSet).sort();
  let html = `<li><button type="button" class="tag-filter-btn active" data-tag="ALL">전체</button></li>`;

  sortedTags.forEach(tag => {
    html += `<li><button type="button" class="tag-filter-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button></li>`;
  });

  tagsContainer.innerHTML = html;

  // 태그 클릭 이벤트
  tagsContainer.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tagsContainer.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTag = btn.dataset.tag;
      renderProjectCards();
    });
  });
}

/**
 * 프로젝트 카드 렌더링
 */
function renderProjectCards() {
  const container = document.getElementById('projects-grid-container');
  const emptyFilterMsg = document.getElementById('projects-filter-empty');
  if (!container) return;

  // 필터링 적용
  const filtered = allPublishedProjects.filter(project => {
    // 태그 일치 여부
    const matchTag = activeTag === 'ALL' || (Array.isArray(project.tags) && project.tags.includes(activeTag));
    // 검색어 일치 여부
    const matchSearch = !searchQuery || 
      (project.title && project.title.toLowerCase().includes(searchQuery)) ||
      (project.summary && project.summary.toLowerCase().includes(searchQuery)) ||
      (Array.isArray(project.tags) && project.tags.some(t => t.toLowerCase().includes(searchQuery)));
    
    return matchTag && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyFilterMsg) emptyFilterMsg.style.display = 'block';
    return;
  }

  if (emptyFilterMsg) emptyFilterMsg.style.display = 'none';

  const cardsHtml = filtered.map(project => {
    const coverHtml = project.coverImageUrl
      ? `<img src="${escapeHtml(project.coverImageUrl)}" alt="${escapeHtml(project.title)} 대표 이미지" loading="lazy">`
      : `<div class="project-card-cover-placeholder">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
           <span>DATA PROJECT</span>
         </div>`;

    const tagsHtml = Array.isArray(project.tags) && project.tags.length > 0
      ? project.tags.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')
      : '';

    const formattedDate = project.createdAt ? formatDate(project.createdAt) : '';

    return `
      <a href="project.html?id=${encodeURIComponent(project.id)}" class="project-card">
        <div class="project-card-cover">
          ${coverHtml}
        </div>
        <div class="project-card-body">
          <div class="project-card-tags">
            ${tagsHtml}
          </div>
          <h2 class="project-card-title">${escapeHtml(project.title)}</h2>
          <p class="project-card-summary">${escapeHtml(project.summary)}</p>
          <div class="project-card-footer">
            <span>${formattedDate}</span>
            <span class="project-card-link-text">
              자세히 보기
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
        </div>
      </a>
    `;
  }).join('');

  container.innerHTML = cardsHtml;
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
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

document.addEventListener('DOMContentLoaded', initProjectsPage);

