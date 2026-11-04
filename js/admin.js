/**
 * 관리자 페이지 로직 (admin.js)
 * 김아현 개인 웹사이트 구축 계획서 준수
 * Firebase Auth 연동 및 로컬 데모 모드 지원, CRUD 및 파일 메타데이터 관리
 */

import { projectDataService, isFirebaseConfigured } from './firebase-config.js';
import { showToast } from './navigation.js';

// 관리자 세션 키
const ADMIN_SESSION_KEY = "kim_ahyeon_admin_auth";

// 현재 편집 중인 프로젝트 ID (null이면 신규 등록)
let currentEditingId = null;

// 임시 첨부 파일 목록
let tempPreviewFiles = [];
let tempDownloadFiles = [];

/**
 * 초기화
 */
async function initAdminPage() {
  await projectDataService.init();

  checkAuthStatus();
  setupAuthHandlers();
  setupFormHandlers();
  setupAttachmentHandlers();
}

/**
 * 인증 상태 확인
 */
function checkAuthStatus() {
  const isLoggedIn = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const loginSection = document.getElementById("admin-login-section");
  const panelSection = document.getElementById("admin-panel-section");
  const modeBadge = document.getElementById("admin-mode-badge");

  if (isLoggedIn) {
    if (loginSection) loginSection.style.display = "none";
    if (panelSection) panelSection.style.display = "block";
    
    if (modeBadge) {
      if (isFirebaseConfigured()) {
        modeBadge.textContent = "Firebase 클라우드 모드";
        modeBadge.style.backgroundColor = "#EBF5EE";
        modeBadge.style.color = "#2A6E45";
      } else {
        modeBadge.textContent = "로컬 브라우저 모드";
        modeBadge.style.backgroundColor = "#F4EFE6";
        modeBadge.style.color = "#8C6A34";
      }
    }

    loadAdminProjects();
  } else {
    if (loginSection) loginSection.style.display = "block";
    if (panelSection) panelSection.style.display = "none";
  }
}

/**
 * 로그인/로그아웃 핸들러 설정
 */
function setupAuthHandlers() {
  const loginForm = document.getElementById("admin-login-form");
  const logoutBtn = document.getElementById("admin-logout-btn");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("admin-email").value.trim();
      const passwordInput = document.getElementById("admin-password").value;

      // Firebase Auth 연동 또는 기본 로컬 관리자 비밀번호
      if (isFirebaseConfigured()) {
        try {
          const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
          await signInWithEmailAndPassword(projectDataService.auth, emailInput, passwordInput);
          sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
          showToast("관리자 인증 성공 (Firebase)");
          checkAuthStatus();
        } catch (err) {
          console.error("Firebase 로그인 실패:", err);
          showToast("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
        }
      } else {
        // 로컬 모드: 초기 기본 비밀번호 안내 (사용자가 직접 설정 가능)
        // 김아현 본인 전용 기본 접속 암호: ahyeon2026 (또는 편한 테스트)
        if (passwordInput === "ahyeon2026" || passwordInput === "admin") {
          sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
          showToast("관리자로 로그인되었습니다 (로컬 모드)");
          checkAuthStatus();
        } else {
          showToast("비밀번호가 올바르지 않습니다. (로컬 기본 암호: ahyeon2026)");
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("관리자 로그아웃 하시겠습니까?")) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        showToast("로그아웃되었습니다.");
        checkAuthStatus();
      }
    });
  }
}

/**
 * 관리자 프로젝트 목록 불러오기
 */
async function loadAdminProjects() {
  const tableBody = document.getElementById("admin-projects-tbody");
  const emptyRow = document.getElementById("admin-table-empty");
  if (!tableBody) return;

  try {
    const projects = await projectDataService.getAllProjects();

    if (!projects || projects.length === 0) {
      tableBody.innerHTML = "";
      if (emptyRow) emptyRow.style.display = "table-row";
      return;
    }

    if (emptyRow) emptyRow.style.display = "none";

    const rowsHtml = projects.map(p => {
      const isPublished = p.status === "published";
      const badgeClass = isPublished ? "status-published" : "status-draft";
      const badgeText = isPublished ? "공개" : "초안";
      const dateText = p.createdAt ? formatDate(p.createdAt) : "-";

      return `
        <tr data-id="${p.id}">
          <td style="font-weight: 600;">${escapeHtml(p.title)}</td>
          <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
          <td>${dateText}</td>
          <td>
            <div class="admin-actions-cell">
              <a href="project.html?id=${encodeURIComponent(p.id)}&preview=true" class="btn btn-secondary btn-sm" target="_blank">미리보기</a>
              <button type="button" class="btn btn-secondary btn-sm js-edit-btn" data-id="${p.id}">수정</button>
              <button type="button" class="btn btn-secondary btn-sm js-delete-btn" data-id="${p.id}" style="color: var(--color-danger); border-color: #F0D0D0;">삭제</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tableBody.innerHTML = rowsHtml;

    // 수정 / 삭제 이벤트 연결
    tableBody.querySelectorAll(".js-edit-btn").forEach(btn => {
      btn.addEventListener("click", () => startEditProject(btn.dataset.id));
    });

    tableBody.querySelectorAll(".js-delete-btn").forEach(btn => {
      btn.addEventListener("click", () => handleDeleteProject(btn.dataset.id));
    });

  } catch (err) {
    console.error("관리자 목록 로드 실패:", err);
    showToast("목록을 불러오는 중 오류가 발생했습니다.");
  }
}

/**
 * 프로젝트 수정 모드 진입
 */
async function startEditProject(id) {
  const p = await projectDataService.getProjectById(id);
  if (!p) {
    showToast("프로젝트를 찾을 수 없습니다.");
    return;
  }

  currentEditingId = p.id;
  document.getElementById("form-card-title").textContent = "프로젝트 수정";
  document.getElementById("cancel-edit-btn").style.display = "inline-flex";

  // 폼 채우기
  document.getElementById("proj-title").value = p.title || "";
  document.getElementById("proj-status").value = p.status || "draft";
  document.getElementById("proj-tags").value = Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || "");
  document.getElementById("proj-summary").value = p.summary || "";
  document.getElementById("proj-objective").value = p.objective || "";
  document.getElementById("proj-data-desc").value = p.dataDescription || "";
  document.getElementById("proj-methods").value = Array.isArray(p.methods) ? p.methods.join(", ") : (p.methods || "");
  document.getElementById("proj-process").value = p.process || "";
  document.getElementById("proj-results").value = p.results || "";
  document.getElementById("proj-reflection").value = p.reflection || "";
  document.getElementById("proj-cover-url").value = p.coverImageUrl || "";

  // 첨부 파일 목록 채우기
  tempPreviewFiles = Array.isArray(p.previewFiles) ? [...p.previewFiles] : [];
  tempDownloadFiles = Array.isArray(p.downloadFiles) ? [...p.downloadFiles] : [];

  renderTempAttachments();

  // 폼 위치로 스크롤
  document.getElementById("admin-project-form").scrollIntoView({ behavior: "smooth" });
}

/**
 * 프로젝트 삭제 처리
 */
async function handleDeleteProject(id) {
  if (!confirm("정말 이 프로젝트를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
    return;
  }

  try {
    await projectDataService.deleteProject(id);
    showToast("프로젝트가 삭제되었습니다.");
    if (currentEditingId === id) {
      resetProjectForm();
    }
    loadAdminProjects();
  } catch (err) {
    console.error("삭제 실패:", err);
    showToast("삭제 도중 오류가 발생했습니다.");
  }
}

/**
 * 폼 전송 및 취소 핸들러
 */
function setupFormHandlers() {
  const form = document.getElementById("admin-project-form");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const addSampleBtn = document.getElementById("add-sample-btn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("proj-title").value.trim();
      const summary = document.getElementById("proj-summary").value.trim();
      const status = document.getElementById("proj-status").value;
      const tags = document.getElementById("proj-tags").value;
      const objective = document.getElementById("proj-objective").value.trim();
      const dataDescription = document.getElementById("proj-data-desc").value.trim();
      const methods = document.getElementById("proj-methods").value;
      const process = document.getElementById("proj-process").value.trim();
      const results = document.getElementById("proj-results").value.trim();
      const reflection = document.getElementById("proj-reflection").value.trim();
      const coverImageUrl = document.getElementById("proj-cover-url").value.trim() || null;

      if (!title || !summary) {
        showToast("제목과 한 줄 요약은 필수 입력 항목입니다.");
        return;
      }

      const projectData = {
        title,
        summary,
        status,
        tags,
        objective,
        dataDescription,
        methods,
        process,
        results,
        reflection,
        coverImageUrl,
        previewFiles: tempPreviewFiles,
        downloadFiles: tempDownloadFiles
      };

      try {
        const savedId = await projectDataService.saveProject(projectData, currentEditingId);
        showToast(currentEditingId ? "프로젝트가 성공적으로 수정되었습니다." : "새 프로젝트가 등록되었습니다.");
        resetProjectForm();
        loadAdminProjects();
      } catch (err) {
        console.error("저장 실패:", err);
        showToast("저장 중 오류가 발생했습니다.");
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      resetProjectForm();
      showToast("편집이 취소되었습니다.");
    });
  }

  if (addSampleBtn) {
    addSampleBtn.addEventListener("click", async () => {
      if (confirm("테스트용 샘플 EDA 프로젝트 1건을 등록하시겠습니까?")) {
        try {
          await projectDataService.addSampleProject();
          showToast("샘플 프로젝트가 등록되었습니다.");
          loadAdminProjects();
        } catch (err) {
          console.error("샘플 추가 실패:", err);
          showToast("샘플 프로젝트 추가 실패");
        }
      }
    });
  }
}

/**
 * 폼 초기화
 */
function resetProjectForm() {
  currentEditingId = null;
  const form = document.getElementById("admin-project-form");
  if (form) form.reset();

  document.getElementById("form-card-title").textContent = "새 프로젝트 등록";
  document.getElementById("cancel-edit-btn").style.display = "none";
  tempPreviewFiles = [];
  tempDownloadFiles = [];
  renderTempAttachments();
}

/**
 * 첨부파일 UI 핸들러 (미리보기 및 다운로드 파일 추가/삭제)
 */
function setupAttachmentHandlers() {
  // 1. 시각화/미리보기 파일 추가
  const addPreviewBtn = document.getElementById("add-preview-file-btn");
  if (addPreviewBtn) {
    addPreviewBtn.addEventListener("click", () => {
      const name = document.getElementById("new-preview-name").value.trim();
      const type = document.getElementById("new-preview-type").value;
      const url = document.getElementById("new-preview-url").value.trim();

      if (!name || !url) {
        showToast("파일명과 파일 URL/경로를 입력하세요.");
        return;
      }

      tempPreviewFiles.push({ name, type, url });
      document.getElementById("new-preview-name").value = "";
      document.getElementById("new-preview-url").value = "";
      renderTempAttachments();
    });
  }

  // 2. 다운로드 원본 파일 추가
  const addDownloadBtn = document.getElementById("add-download-file-btn");
  if (addDownloadBtn) {
    addDownloadBtn.addEventListener("click", () => {
      const name = document.getElementById("new-download-name").value.trim();
      const type = document.getElementById("new-download-type").value.trim() || "FILE";
      const size = document.getElementById("new-download-size").value.trim() || "";
      const url = document.getElementById("new-download-url").value.trim();

      if (!name || !url) {
        showToast("파일명과 다운로드 URL/경로를 입력하세요.");
        return;
      }

      tempDownloadFiles.push({ name, type, size, url });
      document.getElementById("new-download-name").value = "";
      document.getElementById("new-download-size").value = "";
      document.getElementById("new-download-url").value = "";
      renderTempAttachments();
    });
  }
}

/**
 * 임시 첨부 파일 목록 렌더링
 */
function renderTempAttachments() {
  const previewListElem = document.getElementById("preview-files-list");
  const downloadListElem = document.getElementById("download-files-list");

  if (previewListElem) {
    if (tempPreviewFiles.length === 0) {
      previewListElem.innerHTML = `<span style="font-size: 0.82rem; color: var(--color-text-muted);">추가된 미리보기 파일이 없습니다.</span>`;
    } else {
      previewListElem.innerHTML = tempPreviewFiles.map((file, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--color-bg-subtle); border: 1px solid var(--color-border-light); border-radius: 4px; margin-bottom: 6px; font-size: 0.85rem;">
          <span>[${file.type.toUpperCase()}] <strong>${escapeHtml(file.name)}</strong> (${escapeHtml(file.url)})</span>
          <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.removeTempPreviewFile(${idx})">삭제</button>
        </div>
      `).join("");
    }
  }

  if (downloadListElem) {
    if (tempDownloadFiles.length === 0) {
      downloadListElem.innerHTML = `<span style="font-size: 0.82rem; color: var(--color-text-muted);">추가된 다운로드 파일이 없습니다.</span>`;
    } else {
      downloadListElem.innerHTML = tempDownloadFiles.map((file, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--color-bg-subtle); border: 1px solid var(--color-border-light); border-radius: 4px; margin-bottom: 6px; font-size: 0.85rem;">
          <span>[${escapeHtml(file.type)}] <strong>${escapeHtml(file.name)}</strong> (${escapeHtml(file.size || '크기 미지정')})</span>
          <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.removeTempDownloadFile(${idx})">삭제</button>
        </div>
      `).join("");
    }
  }
}

// 전역 삭제 헬퍼 노출
window.removeTempPreviewFile = (index) => {
  tempPreviewFiles.splice(index, 1);
  renderTempAttachments();
};

window.removeTempDownloadFile = (index) => {
  tempDownloadFiles.splice(index, 1);
  renderTempAttachments();
};

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "-";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch (e) {
    return "-";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", initAdminPage);

