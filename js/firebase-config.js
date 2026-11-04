/**
 * Firebase 설정 및 통합 데이터 서비스 (firebase-config.js)
 * 김아현 개인 웹사이트 구축 계획서 준수
 * 
 * [안내]
 * 1. Firebase 콘솔(https://console.firebase.google.com/)에서 프로젝트 생성 후
 *    아래 firebaseConfig 객체의 값을 본인의 설정값으로 입력하세요.
 * 2. Firebase 키가 설정되지 않은 상태에서는 브라우저 로컬 저장소(LocalStorage) 모드로
 *    안전하고 유연하게 동작하여 즉시 테스트할 수 있습니다.
 * 3. 실제 연락처 및 GitHub 주소는 아래 CONTACT_CONFIG에 입력할 수 있습니다.
 */

// 사용자 연락처 및 외부 링크 설정 (확인 전 임의 생성 방지 원칙)
export const CONTACT_CONFIG = {
  name: "김아현",
  nameEn: "Kim Ahyeon",
  department: "데이터사이언스학부",
  grade: "2학년",
  email: "", // 실제 이메일 주소 입력 (예: "ahyeon@example.com")
  github: "", // 실제 GitHub 프로필 URL 입력 (예: "https://github.com/ahyeon-kim")
};

// Firebase 웹 앱 설정 (본인의 Firebase 프로젝트 설정값으로 교체)
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 활성화 여부 확인
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}

// 로컬 저장소 키
const LOCAL_STORAGE_KEY = "kim_ahyeon_projects_data";
const LOCAL_AUTH_KEY = "kim_ahyeon_admin_session";

/**
 * 프로젝트 데이터 서비스
 * Firebase Firestore 연동 + 미설정 시 로컬 저장소 자동 대체
 */
export class ProjectDataService {
  constructor() {
    this.isFirebase = isFirebaseConfigured();
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    if (this.isFirebase) {
      try {
        // Firebase Modular SDK 동적 로드 (CDN)
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
        const { getStorage } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js");

        const app = initializeApp(firebaseConfig);
        this.db = getFirestore(app);
        this.auth = getAuth(app);
        this.storage = getStorage(app);
        this.initialized = true;
        console.log("[DataService] Firebase Firestore & Auth 연결 성공");
        return;
      } catch (err) {
        console.warn("[DataService] Firebase 초기화 실패. 로컬 모드로 전환합니다.", err);
        this.isFirebase = false;
      }
    }

    // 로컬 모드 초기화
    this.initLocalStorage();
    this.initialized = true;
    console.log("[DataService] 로컬 브라우저 저장소 모드로 작동 중입니다.");
  }

  initLocalStorage() {
    if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
      // 초기 공개 시 등록된 프로젝트가 없을 수 있음 (기획서 3.1 & 3.3)
      // 빈 배열로 안전하게 초기화
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    }
  }

  /**
   * 공개된 프로젝트 목록 조회 (일반 방문자용)
   */
  async getPublishedProjects() {
    await this.init();

    if (this.isFirebase) {
      try {
        const { collection, query, where, getDocs, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const q = query(
          collection(this.db, "projects"),
          where("status", "==", "published")
        );
        const snapshot = await getDocs(q);
        const projects = [];
        snapshot.forEach((doc) => {
          projects.push({ id: doc.id, ...doc.data() });
        });
        // 최신순 정렬
        return projects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } catch (err) {
        console.error("Firebase 목록 조회 오류:", err);
        return [];
      }
    } else {
      const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      return data
        .filter((item) => item.status === "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  /**
   * 모든 프로젝트 목록 조회 (관리자용 - draft 포함)
   */
  async getAllProjects() {
    await this.init();

    if (this.isFirebase) {
      try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const snapshot = await getDocs(collection(this.db, "projects"));
        const projects = [];
        snapshot.forEach((doc) => {
          projects.push({ id: doc.id, ...doc.data() });
        });
        return projects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } catch (err) {
        console.error("Firebase 전체 목록 조회 오류:", err);
        return [];
      }
    } else {
      const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  /**
   * 프로젝트 단건 상세 조회
   */
  async getProjectById(id) {
    await this.init();
    if (!id) return null;

    if (this.isFirebase) {
      try {
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const docRef = doc(this.db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } catch (err) {
        console.error("Firebase 프로젝트 상세 조회 오류:", err);
        return null;
      }
    } else {
      const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      return data.find((item) => item.id === id) || null;
    }
  }

  /**
   * 프로젝트 추가 또는 수정 (관리자 전용)
   */
  async saveProject(projectData, existingId = null) {
    await this.init();

    const timestamp = new Date().toISOString();
    const payload = {
      title: projectData.title || "",
      summary: projectData.summary || "",
      objective: projectData.objective || "",
      dataDescription: projectData.dataDescription || "",
      methods: Array.isArray(projectData.methods) ? projectData.methods : (projectData.methods || "").split(",").map(s => s.trim()).filter(Boolean),
      process: projectData.process || "",
      results: projectData.results || "",
      reflection: projectData.reflection || "",
      tags: Array.isArray(projectData.tags) ? projectData.tags : (projectData.tags || "").split(",").map(s => s.trim()).filter(Boolean),
      coverImageUrl: projectData.coverImageUrl || null,
      previewFiles: projectData.previewFiles || [],
      downloadFiles: projectData.downloadFiles || [],
      status: projectData.status === "published" ? "published" : "draft",
      updatedAt: timestamp
    };

    if (this.isFirebase) {
      try {
        const { collection, doc, setDoc, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        if (existingId) {
          const docRef = doc(this.db, "projects", existingId);
          await setDoc(docRef, payload, { merge: true });
          return existingId;
        } else {
          payload.createdAt = timestamp;
          const docRef = await addDoc(collection(this.db, "projects"), payload);
          return docRef.id;
        }
      } catch (err) {
        console.error("Firebase 저장 오류:", err);
        throw err;
      }
    } else {
      const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      if (existingId) {
        const index = data.findIndex(item => item.id === existingId);
        if (index !== -1) {
          data[index] = { ...data[index], ...payload };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return existingId;
        }
      }
      const newId = "proj_" + Date.now();
      payload.id = newId;
      payload.createdAt = timestamp;
      data.unshift(payload);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return newId;
    }
  }

  /**
   * 프로젝트 삭제 (관리자 전용)
   */
  async deleteProject(id) {
    await this.init();
    if (!id) return false;

    if (this.isFirebase) {
      try {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        await deleteDoc(doc(this.db, "projects", id));
        return true;
      } catch (err) {
        console.error("Firebase 삭제 오류:", err);
        throw err;
      }
    } else {
      let data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      data = data.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return true;
    }
  }

  /**
   * 샘플 프로젝트 1개 생성 (테스트 및 둘러보기용)
   */
  async addSampleProject() {
    const sample = {
      title: "기온 및 전력 소비 패턴 탐색적 데이터 분석(EDA)",
      summary: "기상청 공공데이터와 전력소비량 데이터를 연계하여 여름철 폭염에 따른 전력 수요 급증 패턴을 분석하고 시각화한 프로젝트입니다.",
      objective: "여름철 기온 변화가 산업용 및 가정용 전력 소비량에 미치는 영향을 다각도로 검증하고, 기온 임계값 도달 시 전력 피크치 패턴을 정량화합니다.",
      dataDescription: "기상청 기상자료개방포털 일별 기온 데이터(2021~2024년) 및 한국전력공사 전력빅데이터센터 시도별 전력사용량 데이터셋 (약 4만 행 정제 활용)",
      methods: ["Python", "Pandas", "Matplotlib", "Seaborn", "Scipy"],
      process: "1. 결측치 및 이상치 식별 후 보간 처리\n2. 계절별·시간대별 소비량 통계량 산출\n3. 최고기온과 일일 전력사용량 간 비선형 상관관계 모델링\n4. 이상기후 발생 주간의 전력 피크 시간대 집중 분석",
      results: "일 최고기온이 30℃를 초과할 때마다 시간당 전력 소비 증가율이 급격히 가속화되는 비선형 패턴을 확인하였으며, 주요 상관계수 시각화 차트를 도출했습니다.",
      reflection: "정형 시계열 데이터의 전처리 및 계절성 분해 기법을 체득할 수 있었으며, 다음 단계로는 다변량 회귀 및 시계열 머신러닝 예측 모델로의 확장을 계획하고 있습니다.",
      tags: ["EDA", "Python", "Data Science", "시계열"],
      coverImageUrl: null,
      previewFiles: [],
      downloadFiles: [],
      status: "published"
    };
    return await this.saveProject(sample);
  }
}

// 싱글톤 인스턴스
export const projectDataService = new ProjectDataService();

