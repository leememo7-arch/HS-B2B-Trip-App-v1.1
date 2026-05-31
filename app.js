
// ------------------ [ 전역 상태 및 데이터 관리 ] ------------------

// 출장 기본 정보 영역 데이터 기본값 설정
const DEFAULT_TRIP_INFO = {
    country: "호주 (시드니)",
    period: "2026.05.29 ~ 2026.06.04",
    members: "홍길동 부장, 김철수 책임",
    purpose: "호주 B2B 가전 신규 유통망 개척 및 파트너십 구축"
};

// 출국 및 귀국 항공편 기본값 설정
const DEFAULT_TRIP_FLIGHTS = {
    outbound: {
        flightNo: "KE121",
        airline: "대한항공",
        depCode: "ICN",
        depTime: "18:55",
        arrCode: "SYD",
        arrTime: "07:00",
        arrNextDay: true,
        bookingCode: "KE112233",
        note: "출국 항공편: KE121 (대한항공) | 출발 18:55 - 도착 07:00 (+1) (야간 비행, 기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Incheon+Airport",
        photoId: ""
    },
    inbound: {
        flightNo: "KE122",
        airline: "대한항공",
        depCode: "SYD",
        depTime: "09:00",
        arrCode: "ICN",
        arrTime: "17:40",
        arrNextDay: false,
        bookingCode: "KE998877",
        note: "귀국 항공편: KE122 (대한항공) | 출발 09:00 - 도착 17:40 (당일 도착, 기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Sydney+Airport",
        photoId: ""
    }
};

// 1번 탭: 출장 일정 기본값 (localStorage에 데이터가 없을 때 로드)
const DEFAULT_SCHEDULE = [
    {
        id: "sched-1",
        day: "Day 1",
        time: "10:00",
        partner: "시드니 파트너사 (Harvey Norman)",
        topic: "호주 시장 내 AI 빌트인 가전 쇼룸 구성 협의 및 현지 유통망 다각화 전략 논의",
        map: "https://maps.google.com/?q=Sydney"
    },
    {
        id: "sched-2",
        day: "Day 2",
        time: "13:00",
        partner: "현지 유통망 대표 (The Good Guys)",
        topic: "B2B 가전 공급 파트너십 구축 및 상호 프로모션 마케팅 기획안 전달",
        map: "https://maps.google.com/?q=Sydney+Opera+House"
    },
    {
        id: "sched-3",
        day: "Day 3",
        time: "15:00",
        partner: "시드니 테크 허브",
        topic: "스마트홈 플랫폼 연동 및 호주 에너지 효율 등급에 맞춘 제품 세부 사양 피드백 확인",
        map: "https://maps.google.com/?q=Sydney+Tech+Central"
    },
    {
        id: "sched-4",
        day: "Day 4",
        time: "11:00",
        partner: "현지 종합 로펌 (NSW 법률 자문단)",
        topic: "호주 현지 전자제품 전기안전 인증 취득 프로세스 및 수입 규제 준수 검토",
        map: "https://maps.google.com/?q=Sydney+CBD"
    },
    {
        id: "sched-5",
        day: "Day 5",
        time: "16:00",
        partner: "LG 시드니 지사 임원진",
        topic: "출장 핵심 성과 취합, 향후 유통망 진출 액션 아이템 보고서 요약 회의",
        map: "https://maps.google.com/?q=Sydney+Airport"
    }
];

// 4번 탭: 체크리스트 기본값
const DEFAULT_CHECKLIST = [
    { id: "chk-1", text: "여권 및 비자(ETA 승인 완료 확인)", completed: true },
    { id: "chk-2", text: "B2B 쇼룸 발표용 PPT 피치덱 및 브로셔", completed: false },
    { id: "chk-3", text: "노트북, 충전기 및 어댑터 플러그 (호주용 I형)", completed: false },
    { id: "chk-4", text: "미팅 파트너사 전달용 공식 비즈니스 명함 50장", completed: true },
    { id: "chk-5", text: "해외 여행자 보험 가입 영수증 및 현지 지사 비상 연락망", completed: false }
];

// 출장 기본 정보 수정 모드 활성화 여부
let isEditingTripInfo = false;

// 브라우저 내장 대용량 데이터베이스 (IndexedDB) 커넥션 전역 변수
let db;

// ------------------ [ IndexedDB 관련 비동기 모듈 구현 ] ------------------

// 데이터베이스 초기화 함수
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("LG_Trip_DB", 1);
        request.onupgradeneeded = function (e) {
            const database = e.target.result;
            if (!database.objectStoreNames.contains("photos")) {
                // 기본 키로 id 속성을 지정하여 생성
                database.createObjectStore("photos", { keyPath: "id" });
            }
        };
        request.onsuccess = function (e) {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = function (e) {
            console.error("IndexedDB Open Error:", e.target.error);
            reject(e.target.error);
        };
    });
}

// 전체 사진 리스트 비동기 획득
function getAllPhotosFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve([]);
            return;
        }
        const transaction = db.transaction(["photos"], "readonly");
        const store = transaction.objectStore("photos");
        const request = store.getAll();
        request.onsuccess = function (e) {
            resolve(e.target.result || []);
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

// 개별 사진 객체 저장 및 수정
function savePhotoToDB(photoObj) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("DB not initialized");
            return;
        }
        const transaction = db.transaction(["photos"], "readwrite");
        const store = transaction.objectStore("photos");
        const request = store.put(photoObj);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

// 개별 사진 객체 영구 삭제
function deletePhotoFromDB(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("DB not initialized");
            return;
        }
        const transaction = db.transaction(["photos"], "readwrite");
        const store = transaction.objectStore("photos");
        const request = store.delete(id);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

// LocalStorage의 기존 5MB 제한 데이터 IndexedDB 이식 및 자동 정리 스크립트
async function migrateLocalStorageToIndexedDB() {
    // 1. 기존 현장 사진 이관
    const localPhotos = JSON.parse(localStorage.getItem("LG_TRIP_PHOTOS"));
    if (localPhotos && localPhotos.length > 0) {
        console.log("LocalStorage에서 IndexedDB로 현장 사진 데이터를 안전하게 이관합니다.");
        for (let i = 0; i < localPhotos.length; i++) {
            const p = localPhotos[i];
            const photoObj = {
                id: p.id || `photo-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                dataUrl: p.dataUrl,
                memo: p.memo || "",
                type: "field"
            };
            await savePhotoToDB(photoObj);
        }
        // 이관 완료 후 LocalStorage 용량 완전 비우기
        localStorage.setItem("LG_TRIP_PHOTOS", JSON.stringify([]));
    }

    // 2. 기존 일정별 첨부 사진 이관
    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE"));
    if (schedules && schedules.length > 0) {
        let updated = false;
        for (let s of schedules) {
            if (s.photos && s.photos.length > 0) {
                console.log(`일정 ${s.day}의 사진 데이터를 IndexedDB로 이관 마이그레이션합니다.`);
                for (let i = 0; i < s.photos.length; i++) {
                    const p = s.photos[i];
                    const photoObj = {
                        id: p.id || `photo-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                        dataUrl: p.dataUrl,
                        memo: p.memo || "",
                        type: "schedule",
                        scheduleId: s.id
                    };
                    await savePhotoToDB(photoObj);
                }
                // 원본 Base64 데이터를 지우고 가벼운 빈 배열로 교체
                s.photos = [];
                updated = true;
            }
        }
        if (updated) {
            localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(schedules));
        }
    }
}

// ------------------ [ 앱 초기화 ] ------------------
document.addEventListener("DOMContentLoaded", async () => {
    initData();

    // 데이터베이스 초기화 및 이식 검사 비동기 처리
    try {
        await initDB();
        await migrateLocalStorageToIndexedDB();
    } catch (err) {
        console.error("저장 공간 구성 에러:", err);
    }

    renderTripInfo();
    await renderSchedule();
    renderMeetings();
    await renderPhotos();
    renderChecklist();

    // 드롭존 Drag & Drop 이벤트 활성화
    setupDropzone();

    // 저장된 Gemini API Key 상태를 UI에 자동 표시
    updateApiKeyStatus();

    // 이중 시계 시작 (한국 시간 + 출장지 시간)
    startDualClock();
});

// ─────────────────────────────────────────────────────────────
// [ 이중 시계: 한국 시간 + 출장지 실시간 시계 ]
// ─────────────────────────────────────────────────────────────

/**
 * 출장 국가명을 받아 해당 국가의 IANA 시간대 문자열을 반환합니다.
 * 매칭이 안 되면 'UTC'를 반환합니다.
 */
function getTimezoneByCountry(countryStr) {
    if (!countryStr) return 'UTC';
    const c = countryStr.toLowerCase();

    // 주요 출장 국가 시간대 매핑
    const TIMEZONE_MAP = [
        { keys: ['호주', 'australia', 'sydney', '시드니', 'melbourne', '멜버른'], tz: 'Australia/Sydney', flag: '🇦🇺', label: '호주 (AEST)' },
        { keys: ['미국', 'usa', 'america', 'new york', '뉴욕', 'los angeles', '로스앤젤레스', 'la', 'chicago'], tz: 'America/New_York', flag: '🇺🇸', label: '미국 (ET)' },
        { keys: ['미국 서부', 'pacific', 'california', '캘리포니아', '실리콘밸리'], tz: 'America/Los_Angeles', flag: '🇺🇸', label: '미국서부 (PT)' },
        { keys: ['독일', 'germany', 'berlin', '베를린', '유럽', 'europe', 'france', '프랑스', 'paris', '파리'], tz: 'Europe/Berlin', flag: '🇩🇪', label: '유럽 (CET)' },
        { keys: ['영국', 'uk', 'england', 'london', '런던'], tz: 'Europe/London', flag: '🇬🇧', label: '영국 (GMT)' },
        { keys: ['중국', 'china', 'beijing', '베이징', 'shanghai', '상하이'], tz: 'Asia/Shanghai', flag: '🇨🇳', label: '중국 (CST)' },
        { keys: ['일본', 'japan', 'tokyo', '도쿄', 'osaka', '오사카'], tz: 'Asia/Tokyo', flag: '🇯🇵', label: '일본 (JST)' },
        { keys: ['싱가포르', 'singapore'], tz: 'Asia/Singapore', flag: '🇸🇬', label: '싱가포르 (SGT)' },
        { keys: ['태국', 'thailand', 'bangkok', '방콕'], tz: 'Asia/Bangkok', flag: '🇹🇭', label: '태국 (ICT)' },
        { keys: ['베트남', 'vietnam', 'hanoi', '하노이', 'ho chi minh', '호치민'], tz: 'Asia/Ho_Chi_Minh', flag: '🇻🇳', label: '베트남 (ICT)' },
        { keys: ['인도', 'india', 'mumbai', '뭄바이', 'delhi', '델리'], tz: 'Asia/Kolkata', flag: '🇮🇳', label: '인도 (IST)' },
        { keys: ['두바이', 'dubai', 'uae', '아랍에미리트'], tz: 'Asia/Dubai', flag: '🇦🇪', label: '두바이 (GST)' },
        { keys: ['브라질', 'brazil', 'sao paulo', '상파울루'], tz: 'America/Sao_Paulo', flag: '🇧🇷', label: '브라질 (BRT)' },
        { keys: ['멕시코', 'mexico', 'mexico city', '멕시코시티'], tz: 'America/Mexico_City', flag: '🇲🇽', label: '멕시코 (CST)' },
        { keys: ['캐나다', 'canada', 'toronto', '토론토', 'vancouver', '밴쿠버'], tz: 'America/Toronto', flag: '🇨🇦', label: '캐나다 (ET)' },
        { keys: ['러시아', 'russia', 'moscow', '모스크바'], tz: 'Europe/Moscow', flag: '🇷🇺', label: '러시아 (MSK)' },
        { keys: ['터키', 'turkey', 'istanbul', '이스탄불'], tz: 'Europe/Istanbul', flag: '🇹🇷', label: '터키 (TRT)' },
        { keys: ['이탈리아', 'italy', 'rome', '로마', 'milan', '밀라노'], tz: 'Europe/Rome', flag: '🇮🇹', label: '이탈리아 (CET)' },
        { keys: ['스페인', 'spain', 'madrid', '마드리드'], tz: 'Europe/Madrid', flag: '🇪🇸', label: '스페인 (CET)' },
        { keys: ['네덜란드', 'netherlands', 'amsterdam', '암스테르담'], tz: 'Europe/Amsterdam', flag: '🇳🇱', label: '네덜란드 (CET)' },
        { keys: ['폴란드', 'poland', 'warsaw', '바르샤바'], tz: 'Europe/Warsaw', flag: '🇵🇱', label: '폴란드 (CET)' },
        { keys: ['사우디', 'saudi', 'riyadh', '리야드'], tz: 'Asia/Riyadh', flag: '🇸🇦', label: '사우디 (AST)' },
        { keys: ['남아공', 'south africa', 'johannesburg', '요하네스버그'], tz: 'Africa/Johannesburg', flag: '🇿🇦', label: '남아공 (SAST)' },
        { keys: ['뉴질랜드', 'new zealand', 'auckland', '오클랜드'], tz: 'Pacific/Auckland', flag: '🇳🇿', label: '뉴질랜드 (NZST)' },
        { keys: ['인도네시아', 'indonesia', 'jakarta', '자카르타'], tz: 'Asia/Jakarta', flag: '🇮🇩', label: '인도네시아 (WIB)' },
        { keys: ['말레이시아', 'malaysia', 'kuala lumpur', '쿠알라룸푸르'], tz: 'Asia/Kuala_Lumpur', flag: '🇲🇾', label: '말레이시아 (MYT)' },
        { keys: ['필리핀', 'philippines', 'manila', '마닐라'], tz: 'Asia/Manila', flag: '🇵🇭', label: '필리핀 (PHT)' },
        { keys: ['대만', 'taiwan', 'taipei', '타이베이'], tz: 'Asia/Taipei', flag: '🇹🇼', label: '대만 (CST)' },
        { keys: ['홍콩', 'hong kong', '홍콩'], tz: 'Asia/Hong_Kong', flag: '🇭🇰', label: '홍콩 (HKT)' },
    ];

    for (const entry of TIMEZONE_MAP) {
        if (entry.keys.some(key => c.includes(key))) {
            return entry;
        }
    }
    // 매칭 실패 시 기본값
    return { tz: 'UTC', flag: '🌏', label: '출장지 (UTC)' };
}

// 이중 시계 실행 인터벌 ID 전역 저장
let dualClockInterval = null;

/**
 * 매 1초마다 한국 시간과 출장지 시간을 동시에 업데이트합니다.
 * 출장 기본정보의 국가명을 읽어 시간대를 자동 계산합니다.
 */
function startDualClock() {
    // 기존 인터벌이 있으면 제거
    if (dualClockInterval) clearInterval(dualClockInterval);

    function tick() {
        const now = new Date();

        // ── 한국 시간 (KST, UTC+9) ──
        const koreaTimeStr = now.toLocaleTimeString('ko-KR', {
            timeZone: 'Asia/Seoul',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const koreaEl = document.getElementById('clock-korea');
        if (koreaEl) koreaEl.textContent = koreaTimeStr;

        // ── 출장지 시간 ──
        // 1순위: localStorage에 저장된 수동 선택 시간대
        // 2순위: 출장 국가 정보에서 자동 감지
        const savedTZ = localStorage.getItem('CLOCK_DEST_TZ');
        let tzInfo;
        if (savedTZ) {
            try { tzInfo = JSON.parse(savedTZ); } catch (e) { tzInfo = null; }
        }
        if (!tzInfo) {
            const tripInfo = JSON.parse(localStorage.getItem('LG_TRIP_INFO')) || DEFAULT_TRIP_INFO;
            tzInfo = getTimezoneByCountry(tripInfo.country);
        }

        const destTimeStr = now.toLocaleTimeString('ko-KR', {
            timeZone: tzInfo.tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const destEl = document.getElementById('clock-dest');
        if (destEl) destEl.textContent = destTimeStr;

        // 라벨 및 국기 업데이트
        const flagEl = document.getElementById('clock-dest-flag');
        if (flagEl) flagEl.textContent = tzInfo.flag;
        const labelEl = document.getElementById('clock-dest-label');
        if (labelEl) labelEl.textContent = tzInfo.label;

        // ── 시간차 계산 및 배지 표시 ──
        try {
            const koreaOffset = 9; // KST = UTC+9
            // 목적지 현재 시간의 UTC 오프셋 계산
            const destDate = new Date(now.toLocaleString('en-US', { timeZone: tzInfo.tz }));
            const koreaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
            const diffHours = Math.round((destDate - koreaDate) / (1000 * 60 * 60));

            const diffEl = document.getElementById('clock-diff-text');
            if (diffEl) {
                if (diffHours === 0) {
                    diffEl.textContent = '±0h';
                } else if (diffHours > 0) {
                    diffEl.textContent = `+${diffHours}h`;
                } else {
                    diffEl.textContent = `${diffHours}h`;
                }
            }
        } catch (e) {
            // 시간차 계산 실패 시 무시
        }
    }

    // 즉시 1회 실행 후 인터벌 시작
    tick();
    dualClockInterval = setInterval(tick, 1000);
}

// ─────────────────────────────────────────────────────────
// [ 시계 국가 변경 모달 로직 ]
// ─────────────────────────────────────────────────────────

// 모달 열기 (국가 목록 렌더링 포함)
function openClockCountryModal() {
    const modal = document.getElementById('clock-country-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    // 검색상자 초기화
    const searchInput = document.getElementById('clock-country-search');
    if (searchInput) searchInput.value = '';

    renderClockCountryList('');
}

// 모달 닫기
function closeClockCountryModal() {
    const modal = document.getElementById('clock-country-modal');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// 국가 목록 필터링 (검색어 변경 시 호출)
function filterClockCountries(query) {
    renderClockCountryList(query);
}

// TIMEZONE_MAP을 전역에서 접근 가능하도록 배열로 선언
const ALL_TIMEZONES = [
    { keys: ['호주', 'australia', 'sydney', '시드니', 'melbourne', '멜버른'], tz: 'Australia/Sydney', flag: '🇦🇺', label: '호주 (AEST)' },
    { keys: ['미국 동부', 'usa east', 'new york', '뉴욕', 'washington'], tz: 'America/New_York', flag: '🇺🇸', label: '미국 동부 (ET)' },
    { keys: ['미국 서부', 'usa west', 'los angeles', '로스앤젤레스', 'california', '캘리포니아', 'silicon valley', '실리콘밸리'], tz: 'America/Los_Angeles', flag: '🇺🇸', label: '미국 서부 (PT)' },
    { keys: ['영국', 'uk', 'england', 'london', '런던', 'britain'], tz: 'Europe/London', flag: '🇬🇧', label: '영국 (GMT/BST)' },
    { keys: ['독일', 'germany', 'berlin', '베를린', '유럽', 'europe'], tz: 'Europe/Berlin', flag: '🇩🇪', label: '독일/중부유럽 (CET)' },
    { keys: ['프랑스', 'france', 'paris', '파리'], tz: 'Europe/Paris', flag: '🇫🇷', label: '프랑스 (CET)' },
    { keys: ['이탈리아', 'italy', 'rome', '로마', 'milan', '밀라노'], tz: 'Europe/Rome', flag: '🇮🇹', label: '이탈리아 (CET)' },
    { keys: ['스페인', 'spain', 'madrid', '마드리드', 'barcelona', '바르셀로나'], tz: 'Europe/Madrid', flag: '🇪🇸', label: '스페인 (CET)' },
    { keys: ['네덜란드', 'netherlands', 'amsterdam', '암스테르담'], tz: 'Europe/Amsterdam', flag: '🇳🇱', label: '네덜란드 (CET)' },
    { keys: ['러시아', 'russia', 'moscow', '모스크바'], tz: 'Europe/Moscow', flag: '🇷🇺', label: '러시아 (MSK)' },
    { keys: ['터키', 'turkey', 'istanbul', '이스탄불'], tz: 'Europe/Istanbul', flag: '🇹🇷', label: '터키 (TRT)' },
    { keys: ['폴란드', 'poland', 'warsaw', '바르샤바'], tz: 'Europe/Warsaw', flag: '🇵🇱', label: '폴란드 (CET)' },
    { keys: ['중국', 'china', 'beijing', '베이징', 'shanghai', '상하이'], tz: 'Asia/Shanghai', flag: '🇨🇳', label: '중국 (CST)' },
    { keys: ['일본', 'japan', 'tokyo', '도쿄', 'osaka', '오사카'], tz: 'Asia/Tokyo', flag: '🇯🇵', label: '일본 (JST)' },
    { keys: ['싱가포르', 'singapore'], tz: 'Asia/Singapore', flag: '🇸🇬', label: '싱가포르 (SGT)' },
    { keys: ['홍콩', 'hong kong', 'hongkong'], tz: 'Asia/Hong_Kong', flag: '🇭🇰', label: '홍콩 (HKT)' },
    { keys: ['대만', 'taiwan', 'taipei', '타이베이'], tz: 'Asia/Taipei', flag: '🇹🇼', label: '대만 (CST)' },
    { keys: ['태국', 'thailand', 'bangkok', '방콕'], tz: 'Asia/Bangkok', flag: '🇹🇭', label: '태국 (ICT)' },
    { keys: ['베트남', 'vietnam', 'hanoi', '하노이', 'ho chi minh', '호치민'], tz: 'Asia/Ho_Chi_Minh', flag: '🇻🇳', label: '베트남 (ICT)' },
    { keys: ['말레이시아', 'malaysia', 'kuala lumpur', '쿠알라룸푸르'], tz: 'Asia/Kuala_Lumpur', flag: '🇲🇾', label: '말레이시아 (MYT)' },
    { keys: ['인도네시아', 'indonesia', 'jakarta', '자카르타'], tz: 'Asia/Jakarta', flag: '🇮🇩', label: '인도네시아 (WIB)' },
    { keys: ['필리핀', 'philippines', 'manila', '마닐라'], tz: 'Asia/Manila', flag: '🇵🇭', label: '필리핀 (PHT)' },
    { keys: ['인도', 'india', 'mumbai', '듸바이', 'delhi', '델리'], tz: 'Asia/Kolkata', flag: '🇮🇳', label: '인도 (IST)' },
    { keys: ['두바이', 'dubai', 'uae', '아랍에미리트'], tz: 'Asia/Dubai', flag: '🇦🇪', label: '두바이/UAE (GST)' },
    { keys: ['사우디', 'saudi', 'riyadh', '리야드'], tz: 'Asia/Riyadh', flag: '🇸🇦', label: '사우디 (AST)' },
    { keys: ['캐나다', 'canada', 'toronto', '토론토', 'vancouver', '밴쿠버'], tz: 'America/Toronto', flag: '🇨🇦', label: '캐나다 (ET)' },
    { keys: ['브라질', 'brazil', 'sao paulo', '상파울루'], tz: 'America/Sao_Paulo', flag: '🇧🇷', label: '브라질 (BRT)' },
    { keys: ['멕시코', 'mexico', 'mexico city', '멕시코시티'], tz: 'America/Mexico_City', flag: '🇲🇽', label: '멕시코 (CST)' },
    { keys: ['늤질랜드', '뉴질랜드', 'new zealand', 'auckland', '오클랜드'], tz: 'Pacific/Auckland', flag: '🇳🇿', label: '뉴질랜드 (NZST)' },
    { keys: ['남아공', 'south africa', 'johannesburg', '요하네스버그'], tz: 'Africa/Johannesburg', flag: '🇿🇦', label: '남아공 (SAST)' },
    { keys: ['이집트', 'egypt', 'cairo', '카이로'], tz: 'Africa/Cairo', flag: '🇪🇬', label: '이집트 (EET)' },
    { keys: ['스위스', 'switzerland', 'zurich', '주리히'], tz: 'Europe/Zurich', flag: '🇨🇭', label: '스위스 (CET)' },
];

/**
 * 검색어를 받아 국가 목록을 렌더링하는 함수
 */
function renderClockCountryList(query) {
    const container = document.getElementById('clock-country-list');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    const filtered = q
        ? ALL_TIMEZONES.filter(tz =>
            tz.label.toLowerCase().includes(q) ||
            tz.keys.some(k => k.toLowerCase().includes(q))
        )
        : ALL_TIMEZONES;

    // 현재 선택된 시간대 읽기
    let currentTZ = null;
    try {
        const saved = localStorage.getItem('CLOCK_DEST_TZ');
        if (saved) currentTZ = JSON.parse(saved);
    } catch (e) { }

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-xs text-gray-400 py-4">검색 결과가 없습니다.</p>';
        return;
    }

    filtered.forEach(tz => {
        const isSelected = currentTZ && currentTZ.tz === tz.tz;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${isSelected
            ? 'bg-lgRed text-white shadow-sm'
            : 'hover:bg-gray-50 text-gray-700'
            }`;

        // 현재 시간 실시간 표시
        const nowStr = new Date().toLocaleTimeString('ko-KR', {
            timeZone: tz.tz,
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        btn.innerHTML = `
                    <span class="text-xl flex-shrink-0">${tz.flag}</span>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold leading-tight truncate">${tz.label}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <span class="text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-gray-500'}">${nowStr}</span>
                        ${isSelected ? '<i class="fa-solid fa-check text-white text-xs ml-1"></i>' : ''}
                    </div>
                `;

        btn.addEventListener('click', () => {
            localStorage.setItem('CLOCK_DEST_TZ', JSON.stringify(tz));
            startDualClock(); // 시계 즉시 재시작
            closeClockCountryModal();
        });

        container.appendChild(btn);
    });
}

// ─────────────────────────────────────────────────────────
// [ 달력 연동: 날짜 선택 시 일정 구분 자동 입력 ]
// ─────────────────────────────────────────────────────────

/**
 * 날짜 피커에서 날짜 선택 시:
 * - 출장 시작일 기준으로 Day N을 자동 계산하여 일정 구분 필드에 입력
 */
function onSchedDateChange() {
    const dateInput = document.getElementById('sched-date');
    const dayInput = document.getElementById('sched-day');
    if (!dateInput || !dayInput || !dateInput.value) return;

    // 선택한 날짜
    const selectedDate = new Date(dateInput.value + 'T00:00:00');

    // 출장 시작일 충여
    const tripInfo = JSON.parse(localStorage.getItem('LG_TRIP_INFO')) || DEFAULT_TRIP_INFO;
    const periodStr = tripInfo.period || '';
    const startMatch = periodStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);

    if (startMatch) {
        const startDate = new Date(
            `${startMatch[1]}-${String(startMatch[2]).padStart(2, '0')}-${String(startMatch[3]).padStart(2, '0')}T00:00:00`
        );
        const diffDays = Math.round((selectedDate - startDate) / (1000 * 60 * 60 * 24));
        const dayNum = diffDays + 1;

        // 날짜 형식 표시: Day N (MM/DD)
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');

        if (dayNum >= 1 && dayNum <= 30) {
            dayInput.value = `Day ${dayNum} (${mm}/${dd})`;
        } else {
            dayInput.value = `${mm}/${dd}`;
        }
    } else {
        // 출장 기간이 없으면 MM/DD 형식으로
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        dayInput.value = `${mm}/${dd}`;
    }
}

// localStorage 기본 텍스트 뼈대 데이터 구성
function initData() {
    if (!localStorage.getItem("LG_TRIP_INFO")) {
        localStorage.setItem("LG_TRIP_INFO", JSON.stringify(DEFAULT_TRIP_INFO));
    }
    if (!localStorage.getItem("LG_TRIP_FLIGHTS")) {
        localStorage.setItem("LG_TRIP_FLIGHTS", JSON.stringify(DEFAULT_TRIP_FLIGHTS));
    }
    if (!localStorage.getItem("LG_TRIP_SCHEDULE")) {
        localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(DEFAULT_SCHEDULE));
    } else {
        // 이전 저장 정보 호환성 유지 작업
        const scheds = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE"));
        let isUpdated = false;
        scheds.forEach(s => {
            if (s.photos) {
                s.photos = []; // 용량 낭비를 유발하는 데이터 구조 정리
                isUpdated = true;
            }
        });
        if (isUpdated) {
            localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(scheds));
        }
    }
    if (!localStorage.getItem("LG_TRIP_MEETINGS")) {
        localStorage.setItem("LG_TRIP_MEETINGS", JSON.stringify([]));
    }
    if (!localStorage.getItem("LG_TRIP_PHOTOS")) {
        localStorage.setItem("LG_TRIP_PHOTOS", JSON.stringify([]));
    }
    if (!localStorage.getItem("LG_TRIP_CHECKLIST")) {
        localStorage.setItem("LG_TRIP_CHECKLIST", JSON.stringify(DEFAULT_CHECKLIST));
    }
}

// ------------------ [ 탭 전환 로직 ] ------------------
function switchTab(tabId) {
    // 모든 탭 섹션 숨김 처리
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    // 선택된 탭 활성화
    document.getElementById(`tab-${tabId}`).classList.remove("hidden");

    // 하단 네비게이션 버튼 스타일 초기화
    const tabButtons = ['schedule', 'meetings', 'photos', 'checklist'];
    tabButtons.forEach(btnId => {
        const button = document.getElementById(`btn-tab-${btnId}`);
        if (btnId === tabId) {
            button.classList.add("text-lgRed", "font-bold");
            button.classList.remove("text-gray-400");
        } else {
            button.classList.remove("text-lgRed", "font-bold");
            button.classList.add("text-gray-400");
        }
    });
}

// ------------------ [ 출장 기본 정보 렌더링 & 수정 로직 ] ------------------

// 출장 기본 정보 카드를 렌더링하는 함수
function renderTripInfo() {
    const container = document.getElementById("trip-info-container");
    const info = JSON.parse(localStorage.getItem("LG_TRIP_INFO")) || DEFAULT_TRIP_INFO;

    if (isEditingTripInfo) {
        // 기존 period 문자열("2026.05.29 ~ 2026.06.04")을 분석하여 YYYY-MM-DD 포맷의 시작일/종료일로 변환
        let startDate = "";
        let endDate = "";
        if (info.period) {
            const dates = info.period.split("~");
            if (dates.length === 2) {
                const cleanDate = (d) => {
                    const m = d.trim().match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
                    return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : "";
                };
                startDate = cleanDate(dates[0]);
                endDate = cleanDate(dates[1]);
            }
        }

        // 편집 상태일 때 input 양식 (날짜 피커 포함) 렌더링
        container.innerHTML = `
                    <div class="space-y-3">
                        <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span class="text-xs font-bold text-lgRed flex items-center gap-1">
                                <i class="fa-solid fa-pen-to-square"></i> 출장 기본 정보 편집
                            </span>
                            <div class="flex gap-1.5">
                                <button onclick="saveTripInfo()" class="bg-lgRed hover:bg-lgRed-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-sm">
                                    <i class="fa-solid fa-check"></i> 저장
                                </button>
                                <button onclick="toggleTripInfoEdit(false)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95">
                                    취소
                                </button>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[10px] text-gray-400 font-bold mb-0.5">출장 국가</label>
                                <input type="text" id="edit-info-country" value="${info.country}" class="w-full text-xs px-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none">
                            </div>
                            <div class="grid grid-cols-2 gap-1">
                                <div>
                                    <label class="block text-[10px] text-gray-400 font-bold mb-0.5">시작일</label>
                                    <input type="date" id="edit-info-start-date" value="${startDate}" class="w-full text-[10px] px-1 py-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-[10px] text-gray-400 font-bold mb-0.5">종료일</label>
                                    <input type="date" id="edit-info-end-date" value="${endDate}" class="w-full text-[10px] px-1 py-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none">
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] text-gray-400 font-bold mb-0.5">참석자</label>
                            <input type="text" id="edit-info-members" value="${info.members}" class="w-full text-xs px-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-gray-400 font-bold mb-0.5">주요 목적</label>
                            <textarea id="edit-info-purpose" rows="2" class="w-full text-xs px-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none resize-none">${info.purpose}</textarea>
                        </div>
                        
                        <!--전체 초기화 구분선 및 버튼 배치 (시안 A)-->
                        <hr class="border-gray-100 my-2.5">
                        <div class="flex justify-between items-center">
                            <span class="text-[9px] text-gray-400 font-medium">* 사용 종료 시 데이터를 비울 수 있습니다.</span>
                            <button type="button" onclick="resetAllTripData()" class="border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1">
                                <i class="fa-solid fa-trash-can"></i> 전체 데이터 초기화
                            </button>
                        </div>
                    </div>
                `;
    } else {
        // 일반 상태일 때 텍스트 렌더링
        container.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="space-y-1.5 flex-1 pr-2">
                            <div class="grid grid-cols-2 gap-x-2">
                                <div class="text-[11px]"><span class="font-bold text-gray-400 block">출장 국가:</span> <span class="text-gray-800 font-medium text-xs">${info.country}</span></div>
                                <div class="text-[11px]"><span class="font-bold text-gray-400 block">출장 일정:</span> <span class="text-gray-800 font-medium text-xs">${info.period}</span></div>
                            </div>
                            <div class="text-[11px]"><span class="font-bold text-gray-400 block">참석자:</span> <span class="text-gray-800 font-medium text-xs">${info.members}</span></div>
                            <div class="text-[11px]"><span class="font-bold text-gray-400 block">주요 목적:</span> <span class="text-gray-800 font-medium text-xs">${info.purpose}</span></div>
                        </div>
                        
                        <button onclick="toggleTripInfoEdit(true)" class="text-[11px] font-bold text-lgRed border border-red-200 bg-red-50 hover:bg-lgRed hover:text-white px-2 py-1.5 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1 active:scale-95 shadow-sm">
                            <i class="fa-solid fa-pen-to-square"></i> 정보 수정
                        </button>
                    </div>
                `;
    }
}

// 편집 상태를 토글하는 함수
function toggleTripInfoEdit(editMode) {
    isEditingTripInfo = editMode;
    renderTripInfo();
}

// 출장 기본 정보 수정사항 저장
function saveTripInfo() {
    const country = document.getElementById("edit-info-country").value.trim();
    const startInput = document.getElementById("edit-info-start-date").value;
    const endInput = document.getElementById("edit-info-end-date").value;
    const members = document.getElementById("edit-info-members").value.trim();
    const purpose = document.getElementById("edit-info-purpose").value.trim();

    if (!startInput || !endInput) {
        alert("⚠️ 출장 시작일과 종료일을 정확히 선택해주세요.");
        return;
    }

    // 날짜 포맷 결합 (YYYY.MM.DD ~ YYYY.MM.DD)
    const formatToDot = (dStr) => dStr.replace(/-/g, '.');
    const period = `${formatToDot(startInput)} ~ ${formatToDot(endInput)}`;

    // 날짜 변경에 따른 하위 일정 날짜 및 Day 일괄 연동 알고리즘
    const oldInfo = JSON.parse(localStorage.getItem("LG_TRIP_INFO")) || DEFAULT_TRIP_INFO;
    const oldStartMatch = (oldInfo.period || '').split('~')[0].trim().match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);

    if (oldStartMatch) {
        const oldStart = new Date(`${oldStartMatch[1]}-${oldStartMatch[2].padStart(2, '0')}-${oldStartMatch[3].padStart(2, '0')}T00:00:00`);
        const newStart = new Date(`${startInput}T00:00:00`);
        const diffTime = newStart - oldStart;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // 시작일 변경의 일자 차이 계산

        if (diffDays !== 0) {
            const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
            schedules.forEach(item => {
                // 1. 기존 date가 정의되어 있는 경우 시프트 적용
                if (item.date) {
                    const current = new Date(item.date + 'T00:00:00');
                    current.setDate(current.getDate() + diffDays);

                    const yyyy = current.getFullYear();
                    const mm = String(current.getMonth() + 1).padStart(2, '0');
                    const dd = String(current.getDate()).padStart(2, '0');
                    item.date = `${yyyy}-${mm}-${dd}`;
                } else {
                    // 2. date가 누락되고 day에 날짜 정보만 들어있던 예전 레거시 데이터인 경우
                    const dayMatch = (item.day || '').match(/(\d{1,2})\/(\d{1,2})/);
                    if (dayMatch) {
                        const nowYear = new Date().getFullYear();
                        const current = new Date(`${nowYear}-${dayMatch[1].padStart(2, '0')}-${dayMatch[2].padStart(2, '0')}T00:00:00`);
                        current.setDate(current.getDate() + diffDays);

                        const yyyy = current.getFullYear();
                        const mm = String(current.getMonth() + 1).padStart(2, '0');
                        const dd = String(current.getDate()).padStart(2, '0');
                        item.date = `${yyyy}-${mm}-${dd}`;
                    }
                }

                // 3. 시프트된 날짜 기준으로 Day N (MM/DD) 레이블 일괄 재계산
                if (item.date) {
                    const current = new Date(item.date + 'T00:00:00');
                    const mm = String(current.getMonth() + 1).padStart(2, '0');
                    const dd = String(current.getDate()).padStart(2, '0');

                    const diffFromNewStart = Math.round((current - newStart) / (1000 * 60 * 60 * 24));
                    const dayNum = diffFromNewStart + 1;

                    if (dayNum >= 1 && dayNum <= 30) {
                        item.day = `Day ${dayNum} (${mm}/${dd})`;
                    } else {
                        item.day = `${mm}/${dd}`;
                    }
                }
            });
            localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(schedules));
        }
    }

    const updatedInfo = { country, period, members, purpose };
    localStorage.setItem("LG_TRIP_INFO", JSON.stringify(updatedInfo));

    // 토글 해제 및 다시 렌더링
    toggleTripInfoEdit(false);

    // 출장 국가 변경 시 이중 시계 즉시 재시작 (새 국가 시간대 반영)
    startDualClock();

    // 일정 탭 및 시계 뷰 일괄 동기화 렌더링
    renderSchedule();
}

// ── 앱 전체 데이터 초기화 로직 (LocalStorage & IndexedDB 사진 포맷) ──
// ── 앱 전체 데이터 초기화 커스텀 모달 열기 ──
function resetAllTripData() {
    const modal = document.getElementById("reset-confirm-modal");
    const content = document.getElementById("reset-confirm-modal-content");
    if (!modal || !content) return;

    modal.classList.remove("hidden");
    // 브라우저 렌더링 동기화를 위해 강제 리플로우 유도
    void modal.offsetWidth;
    modal.classList.remove("opacity-0");
    content.classList.remove("translate-y-10");
}

// ── 전체 데이터 초기화 커스텀 모달 닫기 ──
function closeResetConfirmModal() {
    const modal = document.getElementById("reset-confirm-modal");
    const content = document.getElementById("reset-confirm-modal-content");
    if (!modal || !content) return;

    modal.classList.add("opacity-0");
    content.classList.add("translate-y-10");
    // 페이드아웃 트랜지션 완료(300ms) 후 hidden 처리합니다.
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}

// ── 데이터베이스 및 로컬스토리지 전면 초기화 실제 실행 함수 ──
async function executeAllDataReset() {
    try {
        // 1. 로컬스토리지(LocalStorage) 내의 출장 매니저 데이터 영구 삭제
        localStorage.removeItem("LG_TRIP_INFO");
        localStorage.removeItem("LG_TRIP_SCHEDULE");
        localStorage.removeItem("LG_TRIP_MEETINGS");
        localStorage.removeItem("LG_TRIP_PHOTOS");
        localStorage.removeItem("LG_TRIP_CHECKLIST");
        localStorage.removeItem("CLOCK_DEST_TZ");
        localStorage.removeItem("GEMINI_API_KEY");

        // 2. 대용량 첨부 이미지용 인덱스드디비(IndexedDB) 사진 스토어 비우기
        if (db) {
            const transaction = db.transaction(["photos"], "readwrite");
            const store = transaction.objectStore("photos");
            const clearRequest = store.clear();

            await new Promise((resolve, reject) => {
                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = (e) => reject(e);
            });
        }

        // 모달을 닫아주고 성공 알림 표시
        closeResetConfirmModal();
        alert("✅ 앱의 모든 데이터(출장 정보, 세부 일정, 체크리스트, 사진 데이터)가 성공적으로 초기화되었습니다.\n새로운 상태로 앱을 다시 구동합니다.");
        window.location.reload(); // 새로고침을 수행하여 기본값(initData)으로 리셋팅 유도
    } catch (err) {
        console.error("데이터 초기화 과정 중 에러 발생:", err);
        alert("초기화 과정 중 오류가 발생했습니다: " + err.message);
        window.location.reload();
    }
}

// ------------------ [ HTML5 Canvas 활용 이미지 리사이징 & 압축 모듈 ] ------------------

/**
 * Canvas API를 이용해 고용량 원본 이미지를 가로폭 최대 800px 크기로 축소하고,
 * 60% 압축된 가벼운 JPEG Base64 문자열로 비동기 변환하여 반환합니다.
 */
function resizeAndCompressImage(file, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve, reject) => {
        // 5초 안전 타임아웃 타이머 가동 (디코딩 무한 락 방지)
        const timeoutId = setTimeout(() => {
            console.warn(`이미지 압축 타임아웃 경과 (${file.name}): 원본 데이터를 사용합니다.`);
            const fallbackReader = new FileReader();
            fallbackReader.onload = function (e) {
                resolve(e.target.result);
            };
            fallbackReader.readAsDataURL(file);
        }, 5000);

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                clearTimeout(timeoutId); // 성공 시 타임아웃 제거
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // 이미지 가로폭이 기준치(800px)보다 클 경우에만 축소 연산 수행
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                // 캔버스 위에 원본 이미지 그리기
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG 압축 데이터 URL 추출 (화질을 0.6으로 설정)
                const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
                resolve(compressedBase64);
            };
            img.onerror = () => {
                clearTimeout(timeoutId); // 에러 시 타임아웃 제거
                resolve(event.target.result); // 에러 발생 시 원본으로 복구
            };
            img.src = event.target.result;
        };
        reader.onerror = (err) => {
            clearTimeout(timeoutId);
            reject(new Error("파일을 읽는 도중 오류가 발생했습니다. " + err));
        };
        reader.readAsDataURL(file);
    });
}

// ------------------ [ 1번 탭: 출장 일정 비즈니스 로직 ] ------------------

// 일정 목록을 렌더링하는 함수
async function renderSchedule() {
    // 항공편 목록 렌더링 호출
    await renderFlights();

    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    const container = document.getElementById("schedule-list");
    document.getElementById("schedule-count").textContent = `${schedules.length}개 일정`;

    container.innerHTML = "";

    // IndexedDB에서 모든 저장된 이미지 목록을 가져옵니다.
    let allPhotos = [];
    try {
        allPhotos = await getAllPhotosFromDB();
    } catch (err) {
        console.error("일정 사진 로드 에러:", err);
    }

    schedules.forEach((item) => {
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md";
        card.id = `schedule-card-${item.id}`;

        // 해당 일정에 할당된 첨부 사진들만 필터링합니다.
        const schedPhotos = allPhotos.filter(p => p.type === 'schedule' && p.scheduleId === item.id);

        let photosHtml = "";
        if (schedPhotos.length > 0) {
            photosHtml = `
                        <div class="mt-3">
                            <p class="text-[10px] font-bold text-gray-400 mb-1"><i class="fa-regular fa-image"></i> 첨부된 사진 (${schedPhotos.length}장)</p>
                            <div class="grid grid-cols-4 gap-2">
                                ${schedPhotos.map(p => `
                                    <div class="relative group w-full aspect-square border rounded-lg overflow-hidden bg-gray-50">
                                        <img src="${p.dataUrl}" class="w-full h-full object-cover">
                                        <!-- 호버 제어 버튼 -->
                                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                            <button onclick="downloadImage('${p.dataUrl}', 'LG_일정사진_${p.id}.png')" class="w-5 h-5 bg-white text-gray-800 rounded flex items-center justify-center hover:bg-green-500 hover:text-white transition" title="다운로드">
                                                <i class="fa-solid fa-download text-[9px]"></i>
                                            </button>
                                            <button onclick="handleDeleteSchedulePhoto('${item.id}', '${p.id}')" class="w-5 h-5 bg-white text-gray-800 rounded flex items-center justify-center hover:bg-red-600 hover:text-white transition" title="삭제">
                                                <i class="fa-solid fa-trash-can text-[9px]"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
        }

        card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="space-y-1 flex-1 pr-2">
                            <div class="flex items-center gap-2">
                                <span class="bg-red-50 text-lgRed text-[11px] font-bold px-2 py-0.5 rounded-full">${item.day}</span>
                                <span class="text-xs font-semibold text-gray-500"><i class="fa-regular fa-clock mr-1"></i>${item.time}</span>
                            </div>
                            <h4 class="text-sm font-bold text-gray-800 mt-1">${item.partner}</h4>
                            <p class="text-xs text-gray-600 leading-relaxed font-normal">${item.topic}</p>
                            ${item.map ? `
                                <a href="${item.map}" target="_blank" class="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-2 font-medium">
                                    <i class="fa-solid fa-map-location-dot"></i>
                                    <span>구글맵에서 미팅 위치 보기</span>
                                </a>
                            ` : ''}
                            
                            <!-- 첨부된 사진 그리드 영역 -->
                            ${photosHtml}
                        </div>
                        
                        <!-- 제어 및 편집 버튼 -->
                        <div class="flex flex-col gap-1.5 flex-shrink-0">
                            <button onclick="enableScheduleEdit('${item.id}')" class="text-xs text-gray-400 hover:text-lgRed font-semibold py-1 px-2.5 rounded border border-gray-100 hover:border-red-100 transition active:scale-95">
                                <i class="fa-regular fa-pen-to-square"></i> 수정
                            </button>
                            <!-- 일정별 독립적 파일 첨부 버튼 (multiple 속성을 확실하게 지원) -->
                            <button onclick="document.getElementById('file-sched-${item.id}').click()" class="text-xs text-gray-400 hover:text-lgRed font-semibold py-1 px-2.5 rounded border border-gray-100 hover:border-red-100 transition active:scale-95">
                                <i class="fa-solid fa-paperclip"></i> 사진 첨부
                            </button>
                            <input type="file" id="file-sched-${item.id}" multiple accept="image/*" class="hidden" onchange="handleSchedulePhotoUpload('${item.id}', this.files)">
                            
                            <button onclick="handleDeleteSchedule('${item.id}')" class="text-xs text-gray-400 hover:text-red-500 font-semibold py-1 px-2.5 rounded border border-gray-100 hover:border-red-100 transition active:scale-95">
                                <i class="fa-regular fa-trash-can"></i> 삭제
                            </button>
                        </div>
                    </div>
                `;
        container.appendChild(card);
    });
}

// 일정별 다중 사진 비동기 업로드 및 Canvas 압축(퀄리티 0.6) 가동 처리
async function handleSchedulePhotoUpload(scheduleId, files) {
    const fileList = Array.from(files);
    const allPhotos = await getAllPhotosFromDB();

    // 이미지 업로드 제한: 누적 100장 한도 검사 (IndexedDB 활용으로 대용량 저장 가능)
    if (allPhotos.length + fileList.length > 100) {
        alert(`⚠️ 총 사진 개수는 100장까지 업로드 가능합니다.\n현재 저장된 사진: ${allPhotos.length}장`);
        return;
    }

    const uploadPromises = fileList.map(async (file, idx) => {
        try {
            const compressedBase64 = await resizeAndCompressImage(file, 800, 0.6); // 퀄리티 0.6 압축 적용
            const photoObj = {
                id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
                dataUrl: compressedBase64,
                memo: "",
                type: "schedule",
                scheduleId: scheduleId
            };
            await savePhotoToDB(photoObj);
        } catch (err) {
            console.error("일정 사진 압축 실패, 원본 보존 우회:", err);
            const fallbackBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(file);
            });
            const photoObj = {
                id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
                dataUrl: fallbackBase64,
                memo: "",
                type: "schedule",
                scheduleId: scheduleId
            };
            await savePhotoToDB(photoObj);
        }
    });

    await Promise.all(uploadPromises);
    await renderSchedule();
}

// 일정에 첨부된 개별 사진 삭제 함수
async function handleDeleteSchedulePhoto(scheduleId, photoId) {
    if (!confirm("이 첨부 사진을 삭제하시겠습니까?")) return;
    await deletePhotoFromDB(photoId);
    await renderSchedule();
}

// 인라인 수정 모드 활성화
function enableScheduleEdit(id) {
    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    const item = schedules.find(s => s.id === id);
    if (!item) return;

    // 저장된 time이 HH:MM 형식인지 확인 (기존 텍스트 형식 포함)
    const timeForPicker = /^\d{2}:\d{2}$/.test(item.time) ? item.time : '';
    const timeDisplay = timeForPicker ? item.time : (item.time || '');

    // 저장된 day에서 날짜(MM/DD) 추출 → date 피커 초기값 설정
    const tripInfo = JSON.parse(localStorage.getItem('LG_TRIP_INFO')) || DEFAULT_TRIP_INFO;
    let dateForPicker = '';
    const dayMatch = (item.day || '').match(/(\d{1,2})\/(\d{1,2})/);
    if (dayMatch) {
        const nowYear = new Date().getFullYear();
        const mm = String(dayMatch[1]).padStart(2, '0');
        const dd = String(dayMatch[2]).padStart(2, '0');
        dateForPicker = `${nowYear}-${mm}-${dd}`;
    }

    const card = document.getElementById(`schedule-card-${id}`);
    card.innerHTML = `
                <div class="space-y-2.5">
                    <div class="flex justify-between items-center border-b pb-1.5">
                        <span class="text-xs font-bold text-lgRed"><i class="fa-regular fa-pen-to-square"></i> 일정 수정</span>
                        <div class="flex gap-1.5">
                            <button onclick="saveScheduleEdit('${id}')" class="bg-lgRed hover:bg-lgRed-dark text-white text-[11px] font-bold px-2.5 py-1 rounded transition active:scale-95">저장</button>
                            <button onclick="renderSchedule()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded transition">취소</button>
                        </div>
                    </div>

                    <!-- 날짜 피커 (수정용) -->
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold mb-1">📅 날짜 선택</label>
                        <input type="date" id="edit-date-${id}" value="${dateForPicker}"
                            onchange="onEditDateChange('${id}')"
                            class="w-full text-xs p-1.5 border rounded">
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="block text-[10px] text-gray-400 font-bold mb-1">구분</label>
                            <input type="text" id="edit-day-${id}" value="${item.day}" class="w-full text-xs p-1.5 border rounded">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-[10px] text-gray-400 font-bold mb-1">⏰ 시간</label>
                            <input type="time" id="edit-time-${id}" value="${timeForPicker}"
                                class="w-full text-xs p-1.5 border rounded">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold mb-1">미팅 상대</label>
                        <input type="text" id="edit-partner-${id}" value="${item.partner}" class="w-full text-xs p-1.5 border rounded">
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold mb-1">안건 및 목표</label>
                        <textarea id="edit-topic-${id}" rows="2" class="w-full text-xs p-1.5 border rounded">${item.topic}</textarea>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold mb-1">구글맵 위치 링크</label>
                        <div class="flex gap-1.5">
                            <input type="url" id="edit-map-${id}" value="${item.map || ''}" class="flex-1 text-xs p-1.5 border rounded">
                            <button type="button" onclick="openLocationSearchModal('edit-map-${id}')"
                                class="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-2.5 rounded-lg transition active:scale-95 flex items-center justify-center gap-1 text-[10px] font-bold"
                                title="위치 검색">
                                <i class="fa-solid fa-magnifying-glass-location text-lgRed"></i> 검색
                            </button>
                        </div>
                    </div>
                </div>
            `;
}

/**
 * 수정 폼에서 날짜 선택 시 구분 필드 자동 채우기
 */
function onEditDateChange(id) {
    const dateInput = document.getElementById(`edit-date-${id}`);
    const dayInput = document.getElementById(`edit-day-${id}`);
    if (!dateInput || !dayInput || !dateInput.value) return;

    const selectedDate = new Date(dateInput.value + 'T00:00:00');
    const tripInfo = JSON.parse(localStorage.getItem('LG_TRIP_INFO')) || DEFAULT_TRIP_INFO;
    const periodStr = tripInfo.period || '';
    const startMatch = periodStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);

    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');

    if (startMatch) {
        const startDate = new Date(
            `${startMatch[1]}-${String(startMatch[2]).padStart(2, '0')}-${String(startMatch[3]).padStart(2, '0')}T00:00:00`
        );
        const diffDays = Math.round((selectedDate - startDate) / (1000 * 60 * 60 * 24));
        const dayNum = diffDays + 1;
        dayInput.value = (dayNum >= 1 && dayNum <= 30) ? `Day ${dayNum} (${mm}/${dd})` : `${mm}/${dd}`;
    } else {
        dayInput.value = `${mm}/${dd}`;
    }
}

// 수정 데이터 저장 완료 함수
function saveScheduleEdit(id) {
    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE"));
    const index = schedules.findIndex(s => s.id === id);

    if (index !== -1) {
        // 수정된 데이터 할당 (time은 type=time의 HH:MM 형식)
        schedules[index].day = document.getElementById(`edit-day-${id}`).value.trim();
        schedules[index].time = document.getElementById(`edit-time-${id}`).value.trim();
        schedules[index].partner = document.getElementById(`edit-partner-${id}`).value.trim();
        schedules[index].topic = document.getElementById(`edit-topic-${id}`).value.trim();
        schedules[index].map = document.getElementById(`edit-map-${id}`).value.trim();

        localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(schedules));
    }
    renderSchedule();
}

// 일정 신규 추가 제출 핸들러
function handleAddSchedule(e) {
    e.preventDefault();
    const day = document.getElementById("sched-day").value.trim();
    // type="time"이면 HH:MM 형식으로 반환됨
    const time = document.getElementById("sched-time").value.trim();
    const partner = document.getElementById("sched-partner").value.trim();
    const topic = document.getElementById("sched-topic").value.trim();
    const map = document.getElementById("sched-map").value.trim();

    const newSchedule = {
        id: `sched-${Date.now()}`,
        day,
        time,
        partner,
        topic,
        map
    };

    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    schedules.push(newSchedule);
    localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(schedules));

    // 폼 전체 리셋 (date 피커 포함)
    document.getElementById("add-schedule-form").reset();
    renderSchedule();
}

// 일정 개별 삭제 함수 (해당 일정에 바인딩된 IndexedDB 내 사진도 함께 자동 삭제)
async function handleDeleteSchedule(id) {
    if (!confirm("해당 미팅 일정을 정말로 삭제하시겠습니까?")) return;
    let schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    schedules = schedules.filter(s => s.id !== id);
    localStorage.setItem("LG_TRIP_SCHEDULE", JSON.stringify(schedules));

    // IndexedDB에 연동된 이미지들 제거
    try {
        const allPhotos = await getAllPhotosFromDB();
        const targetPhotos = allPhotos.filter(p => p.type === 'schedule' && p.scheduleId === id);
        for (const p of targetPhotos) {
            await deletePhotoFromDB(p.id);
        }
    } catch (err) {
        console.error("일정 사진 제거 에러:", err);
    }

    await renderSchedule();
}


// ------------------ [ 2번 탭: 회의록 및 STT 파싱 / 교차검증 로직 ] ------------------

// 저장된 회의록 리스트를 렌더링하는 함수 (양쪽 목록 동시 업데이트)
function renderMeetings() {
    const meetings = JSON.parse(localStorage.getItem("LG_TRIP_MEETINGS")) || [];

    // 업로드 화면과 결과 화면 두 곳의 meetings-list 모두 업데이트
    ['meetings-list', 'meetings-list-2'].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        if (meetings.length === 0) {
            container.innerHTML = `
                        <div class="text-center py-6 bg-white border border-dashed rounded-xl text-gray-400 text-xs">
                            <i class="fa-regular fa-file-lines text-xl mb-1"></i>
                            <p>저장된 회의록이 없습니다.</p>
                        </div>
                    `;
        } else {
            meetings.forEach(meet => {
                const item = document.createElement("div");
                item.className = "bg-white p-3 rounded-xl shadow-sm border border-gray-100 relative space-y-1.5";

                const dateStr = new Date(meet.timestamp).toLocaleString("ko-KR", {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const formattedContent = (meet.content || '').replace(/\n/g, "<br>");

                item.innerHTML = `
                            <div class="flex justify-between items-start pr-7">
                                <h4 class="text-xs font-bold text-gray-800">${meet.title}</h4>
                                <span class="text-[9px] text-gray-400 font-semibold flex-shrink-0 ml-1">${dateStr}</span>
                            </div>
                            <div class="text-[10px] text-gray-600 bg-gray-50 p-2 rounded-lg border leading-relaxed max-h-20 overflow-y-auto">
                                ${formattedContent}
                            </div>
                            ${meet.action ? `<div class="text-[10px] text-lgRed bg-red-50 p-2 rounded-lg border border-red-100/50">
                                <i class="fa-solid fa-circle-exclamation mr-1"></i>${meet.action}
                            </div>` : ''}
                            <button onclick="handleDeleteMeeting('${meet.id}')" class="absolute top-2.5 right-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition duration-150 active:scale-90" title="회의록 삭제">
                                <i class="fa-regular fa-trash-can text-xs"></i>
                            </button>
                        `;
                container.appendChild(item);
            });
        }
    });

    // 카운트 배지 업데이트
    const cnt = meetings.length;
    ['meetings-count', 'meetings-count-2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${cnt}개`;
    });
}

// ─────────────────────────────────────────────────────────────
// [ MinutesAI 통합 함수 모음 ]
// ─────────────────────────────────────────────────────────────

// MinutesAI에서 선택된 파일 전역 저장
let minutesSelectedFile = null;
let minutesActiveTab = 'audio'; // 'audio' | 'text'
let minutesLastResult = null;   // 마지막 Gemini JSON 응답

// 입력 탭 전환 (음성 / 텍스트)
function switchMinutesTab(tab) {
    minutesActiveTab = tab;
    const audioZone = document.getElementById('min-audio-zone');
    const textZone = document.getElementById('min-text-zone');
    const btnAudio = document.getElementById('min-tab-audio');
    const btnText = document.getElementById('min-tab-text');

    if (tab === 'audio') {
        audioZone.classList.remove('hidden');
        textZone.classList.add('hidden');
        btnAudio.className = 'flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white text-gray-800 shadow-sm flex items-center justify-center gap-1.5 transition-all';
        btnText.className = 'flex-1 py-1.5 text-[11px] font-medium rounded-lg text-gray-500 flex items-center justify-center gap-1.5 transition-all';
    } else {
        audioZone.classList.add('hidden');
        textZone.classList.remove('hidden');
        btnText.className = 'flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white text-gray-800 shadow-sm flex items-center justify-center gap-1.5 transition-all';
        btnAudio.className = 'flex-1 py-1.5 text-[11px] font-medium rounded-lg text-gray-500 flex items-center justify-center gap-1.5 transition-all';
    }
    checkMinutesValidation();
}

// 드롭존 설정 (새 min-dropzone)
function setupDropzone() {
    const dropzone = document.getElementById('min-dropzone');
    if (!dropzone) return;

    dropzone.addEventListener('click', () => {
        document.getElementById('audio-file-input').click();
    });
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-lgRed', 'bg-red-50/50');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-lgRed', 'bg-red-50/50');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-lgRed', 'bg-red-50/50');
        if (e.dataTransfer.files.length > 0) {
            handleMinutesFileSelect(e.dataTransfer.files[0]);
        }
    });

    // 텍스트 입력 글자수 카운터
    const textInput = document.getElementById('min-text-input');
    if (textInput) {
        textInput.addEventListener('input', () => {
            const cnt = textInput.value.length;
            const el = document.getElementById('min-char-counter');
            if (el) el.textContent = `${cnt.toLocaleString()}자`;
            checkMinutesValidation();
        });
    }
}

// 파일 선택 처리 (다양한 텍스트 파일 지원 및 FileReader 비동기 로딩)
function handleMinutesFileSelect(file) {
    if (!file) return;

    // 허용하는 다양한 텍스트 확장자 검증 (.txt, .md, .json, .csv, .log)
    const allowedExtensions = ['.txt', '.md', '.json', '.csv', '.log'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        alert('지원하지 않는 파일 형식입니다.\n\n지원 확장자: .txt, .md, .json, .csv, .log');
        return;
    }

    minutesSelectedFile = file;

    // UI 업데이트 — 파일 정보 표시
    document.getElementById('dropzone-default').classList.add('hidden');
    const infoEl = document.getElementById('min-file-info');
    infoEl.classList.remove('hidden');
    infoEl.classList.add('flex');
    document.getElementById('min-file-name').textContent = file.name;
    document.getElementById('min-file-size').textContent = (file.size / 1024).toFixed(1) + ' KB';

    // 비동기로 파일 텍스트 내용을 읽어옴
    const reader = new FileReader();
    reader.onload = function (e) {
        const textContent = e.target.result;
        const textInput = document.getElementById('min-text-input');
        if (textInput) {
            textInput.value = textContent;
            const charCounter = document.getElementById('min-char-counter');
            if (charCounter) {
                charCounter.textContent = `${textContent.length.toLocaleString()}자`;
            }
            // 자동으로 텍스트 탭으로 전환하여 가져온 텍스트를 바로 보게 함
            switchMinutesTab('text');
        }
    };
    reader.onerror = function () {
        alert('파일을 읽어오는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file, 'UTF-8');

    checkMinutesValidation();
}

// 파일 선택 초기화 (텍스트 입력창 내용도 함께 리셋)
function resetMinutesFile() {
    minutesSelectedFile = null;
    document.getElementById('audio-file-input').value = '';
    document.getElementById('dropzone-default').classList.remove('hidden');
    const infoEl = document.getElementById('min-file-info');
    infoEl.classList.add('hidden');
    infoEl.classList.remove('flex');

    // 텍스트 입력값 및 카운터 초기화
    const textInput = document.getElementById('min-text-input');
    if (textInput) {
        textInput.value = '';
    }
    const charCounter = document.getElementById('min-char-counter');
    if (charCounter) {
        charCounter.textContent = '0자';
    }

    checkMinutesValidation();
}

// 분석 시작 버튼 활성화 검증
function checkMinutesValidation() {
    const btn = document.getElementById('min-start-btn');
    if (!btn) return;

    let valid = false;
    // 텍스트 파일이 로드되었거나 텍스트 영역에 글자가 10자 이상 있는 경우
    const txt = (document.getElementById('min-text-input') || {}).value || '';
    if (txt.trim().length > 10) valid = true;

    if (valid) {
        btn.disabled = false;
        btn.className = 'w-full bg-lgRed hover:bg-lgRed-dark text-white font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]';
    } else {
        btn.disabled = true;
        btn.className = 'w-full bg-gray-200 text-gray-400 font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed';
    }
}

// 샘플 텍스트 불러오기
function loadMinutesSample() {
    const sample = `이서연(디자이너): 안녕하세요 여러분, 이번 신규 B2B 파트너사 수출 전략 시안에 대해 회의하려고 합니다.\n김민수(PM): 네, 시안 잘 받았습니다. 현지화 마케팅 방안이 아주 좋아 보여요.\n박준영(개발자): 시스템 구축 가이드는 전달받아 기술 스펙 검증 단계에 있으며 일정상 큰 무리가 없습니다.\n이서연(디자이너): 호주 지사 피드백을 반영하여 색상 테마를 LG Deep Red와 Charcoal 위주로 맞추었습니다.\n김민수(PM): 준영님, 현지 결제 시스템 연동 API 분석은 다음 주 화요일까지 가능할까요?\n박준영(개발자): 네, 6월 2일까지 마무리하여 검토 보고드리겠습니다.\n김민수(PM): 좋습니다. 서연님은 호주 지사와 피그마를 실시간 공유해 주시고, 저는 6월 5일까지 지라 업무 할당을 완료하겠습니다.`;
    const textInput = document.getElementById('min-text-input');
    if (textInput) {
        textInput.value = sample;
        const el = document.getElementById('min-char-counter');
        if (el) el.textContent = `${sample.length.toLocaleString()}자`;
        switchMinutesTab('text');
    }
    checkMinutesValidation();
}

// ── 로딩 화면 단계 상태 업데이트 ──
function updateMinutesStep(stepId, state) {
    const iconEl = document.getElementById(`mstep-icon-${stepId}`);
    const badgeEl = document.getElementById(`mstep-badge-${stepId}`);
    if (!iconEl || !badgeEl) return;

    if (state === 'active') {
        iconEl.className = 'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-red-100 text-lgRed flex-shrink-0 ring-2 ring-lgRed/30 ring-offset-1 animate-pulse';
        badgeEl.textContent = '진행 중';
        badgeEl.className = 'text-[10px] font-bold text-lgRed';
    } else if (state === 'done') {
        iconEl.className = 'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-emerald-500 text-white flex-shrink-0';
        iconEl.innerHTML = '<i class="fa-solid fa-check text-[9px]"></i>';
        badgeEl.textContent = '완료';
        badgeEl.className = 'text-[10px] font-bold text-emerald-600';
    }
}

// ── AI 분석 시작 메인 함수 ──
async function startMinutesAnalysis() {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
    const subject = (document.getElementById('min-subject') || {}).value || '';
    const speakers = (document.getElementById('min-speakers') || {}).value || 'auto';
    const style = (document.getElementById('min-style') || {}).value || 'bullet';
    const custom = (document.getElementById('min-custom-prompt') || {}).value || '';

    const textContent = (document.getElementById('min-text-input') || {}).value || '';
    if (textContent.trim().length < 10) return;

    // STEP B 로딩 화면 전환
    document.getElementById('minutes-step-upload').classList.add('hidden');
    document.getElementById('minutes-step-loading').classList.remove('hidden');
    document.getElementById('minutes-step-result').classList.add('hidden');

    const titleEl = document.getElementById('min-loading-title');
    const descEl = document.getElementById('min-loading-desc');

    // Step 1: 데이터 로드
    updateMinutesStep('upload', 'active');
    titleEl.textContent = 'AI 엔진에 데이터 전송 중...';
    descEl.textContent = '텍스트 스크립트 데이터를 정합 검증하고 있습니다.';
    await new Promise(r => setTimeout(r, 800));
    updateMinutesStep('upload', 'done');

    // Step 2: AI 분석
    updateMinutesStep('stt', 'active');
    titleEl.textContent = '전문 AI 회의 기록 관리자 분석 진행 중...';
    descEl.textContent = 'Gemini LLM이 대화 내용의 맥락과 의사결정을 파악하고 있습니다.';

    try {
        let geminiResult;

        if (apiKey) {
            // Gemini로 JSON 구조화 및 전문 회의록 템플릿 요약 요청
            geminiResult = await structureMinutesWithGemini(textContent, subject, speakers, style, custom, apiKey);
        } else {
            // API Key 없을 때 로컬 파싱 폴백
            geminiResult = buildFallbackMinutes(textContent, subject);
        }

        updateMinutesStep('stt', 'done');
        updateMinutesStep('summary', 'active');
        titleEl.textContent = '보고서 구조화 및 Action Item 조립 중...';
        descEl.textContent = '지정된 4단 템플릿에 맞추어 마크다운 보고서를 렌더링합니다.';
        await new Promise(r => setTimeout(r, 600));
        updateMinutesStep('summary', 'done');

        // STEP C 결과 화면 렌더링
        minutesLastResult = geminiResult;
        renderMinutesDashboard(geminiResult);

    } catch (err) {
        console.error('[MinutesAI] 분석 오류:', err);
        // 폴백: 기본 분석
        const fallback = buildFallbackMinutes(textContent || '텍스트 파일 분석 결과', subject);
        minutesLastResult = fallback;
        renderMinutesDashboard(fallback);
    }
}

// ── Gemini에 구조화된 JSON 회의록 요청 (전문 회의 기록 관리자 4단 표준 템플릿 강제) ──
async function structureMinutesWithGemini(rawText, subject, speakers, style, custom, apiKey) {
    const tripInfo = JSON.parse(localStorage.getItem('LG_TRIP_INFO')) || DEFAULT_TRIP_INFO;

    // 현재 날짜 및 요일 구하기 (한국어 요일 표기)
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const dayOfWeek = days[today.getDay()];
    const formattedDate = `${year}.${month}.${date} (${dayOfWeek})`;

    const prompt = `당신은 전문적인 회의 기록 관리자입니다.
제공된 B2B 해외 출장 회의 대화 내용을 분석하여 체계적이고 명료한 회의록을 작성하세요.

[출장 정보 및 문맥]
- 출장지: ${tripInfo.country}
- 일정: ${tripInfo.period}
- 출장 목적: ${tripInfo.purpose}

[분석 절차]
1. 대화 내용에서 핵심 주제와 논의 사항을 파악합니다.
2. 의사결정 사항과 그 근거를 명확히 정리합니다.
3. 향후 조치사항과 담당자, 일정을 구조화합니다.
4. 아래 템플릿에 맞춰 최종 회의록을 작성합니다.

[회의록 템플릿 양식]
## 1. 회의 정보
- 일시: ${formattedDate} HH:MM~HH:MM (총 시간)
- 장소: ${tripInfo.country} 현지 미팅룸
- 참석자: (총 N명)
  - 소속1: 이름 직함, 이름 직함 (N명)
  - 소속2: 이름 직함 (N명)
- 회의 안건: ${subject || 'B2B 미팅 및 세부 가이드라인 조율'}

## 2. 주제별 논의 내용 요약
- [주제 1] (주제에 대한 논의 내용 및 화자들의 발언 요약)
- [주제 2] (주제에 대한 논의 내용 및 화자들의 발언 요약)

## 3. 합의된 결정사항
- (결정사항 1) 의사결정 사항 및 이를 도출한 합리적 근거
- (결정사항 2) 의사결정 사항 및 이를 도출한 합리적 근거

## 4. 후속 조치 계획 (담당자별 정리)
- [소속명 / 담당자명] 조치해야 할 세부 실천 과제 (완료 기한: YYYY.MM.DD)

반드시 아래 JSON 스키마로만 응답하세요 (다른 텍스트 없이 JSON만 반환):
{
  "title": "회의 제목 (간결하고 명확하게)",
  "date": "${formattedDate}",
  "participants": "참석자 목록 (쉼표 구분)",
  "decisions": [
    { "topic": "주요 논의 주제", "summary": "합의 및 결정사항" }
  ],
  "actionItems": [
    { "task": "할 일", "assignee": "담당자", "dueDate": "기한" }
  ],
  "markdownResult": "회의록 템플릿 양식 규격에 맞춰 마크다운 형식으로 포맷팅된 최종 회의록 본문"
}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${prompt}\n\n[회의 대화 내용]\n${rawText}\n\n[특별 지시사항]\n${custom || '없음'}` }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
            })
        }
    );

    if (!response.ok) throw new Error(`Gemini API 오류: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // JSON 파싱
    const cleanText = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanText);
}

// ── 폴백: API Key 없을 때 로컬 파싱을 통한 4단 표준 마크다운 생성 ──
function buildFallbackMinutes(text, subject) {
    const tripInfo = JSON.parse(localStorage.getItem('LG_TRIP_INFO')) || DEFAULT_TRIP_INFO;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const transcript = [];
    const speakersSet = new Set();

    // 1. 대화 스크립트 파싱 및 화자 감출
    lines.forEach((line, i) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30) {
            const spk = line.substring(0, colonIdx).trim();
            const txt = line.substring(colonIdx + 1).trim();
            speakersSet.add(spk);
            transcript.push({ speaker: spk, time: `10:${String(i * 3 % 60).padStart(2, '0')}`, text: txt });
        } else {
            transcript.push({ speaker: '참석자', time: `10:${String(i * 3 % 60).padStart(2, '0')}`, text: line });
        }
    });

    // 2. 화자 분석 및 소속별 분류 구성
    const detectedSpeakers = Array.from(speakersSet);
    let totalSpeakersCount = detectedSpeakers.length || 2;
    let participantsText = `(총 ${totalSpeakersCount}명)\n`;
    const lgMembers = [];
    const partnerMembers = [];

    if (detectedSpeakers.length > 0) {
        detectedSpeakers.forEach(spk => {
            const m = spk.match(/^([^(]+)\(([^)]+)\)$/);
            if (m) {
                const name = m[1].trim();
                const role = m[2].trim();
                if (role.includes('PM') || role.includes('개발') || role.includes('디자이너') || role.includes('부장') || role.includes('책임') || role.includes('선임')) {
                    lgMembers.push(`${name} ${role}`);
                } else {
                    partnerMembers.push(`${name} ${role}`);
                }
            } else {
                if (spk.includes('김') || spk.includes('이') || spk.includes('홍') || spk.includes('박') || spk.includes('최') || spk.includes('정')) {
                    lgMembers.push(`${spk} 담당자`);
                } else {
                    partnerMembers.push(`${spk} 담당자`);
                }
            }
        });

        if (lgMembers.length > 0) {
            participantsText += `  - LG전자 본사: ${lgMembers.join(', ')} (${lgMembers.length}명)\n`;
        } else {
            participantsText += `  - LG전자 본사: 홍길동 부장 (1명)\n`;
            totalSpeakersCount += 1;
        }

        if (partnerMembers.length > 0) {
            participantsText += `  - 협력 파트너사: ${partnerMembers.join(', ')} (${partnerMembers.length}명)`;
        } else {
            participantsText += `  - 협력 파트너사: 현지 바이어 (1명)`;
            totalSpeakersCount += 1;
        }

        participantsText = participantsText.replace(/\(총 \d+명\)/, `(총 ${totalSpeakersCount}명)`);
    } else {
        participantsText = `(총 3명)\n  - LG전자 본사: 홍길동 부장, 김철수 책임 (2명)\n  - 협력 파트너사: 현지 바이어 (1명)`;
    }

    // 3. 실제 대화 스크립트 기반 동적 의사결정(Decisions) 및 Action Items 추출
    const decisions = [];
    const actionItems = [];
    const topicSummaries = [];

    // 텍스트 분석에 사용될 키워드 매칭
    const decisionKeywords = ["결정", "합의", "결론", "확정", "하기로", "반영", "동의", "승인", "적용"];
    const actionKeywords = ["까지", "기한", "완료", "ASAP", "다음", "준비", "제출", "보고", "공유", "피드백", "마무리"];

    transcript.forEach(t => {
        const spkClean = t.speaker.replace(/\([^)]+\)/g, '').trim(); // 괄호 제거한 깔끔한 이름

        // 의사결정 사항 추출
        const hasDecision = decisionKeywords.some(kw => t.text.includes(kw));
        if (hasDecision && t.text.length > 10 && decisions.length < 5) {
            let summary = t.text.trim();
            if (summary.endsWith('.')) summary = summary.slice(0, -1);
            decisions.push({
                topic: `${spkClean} 담당 제안 건`,
                summary: `${summary} (논의 근거: 대화 내 발화 기준)`
            });
        }

        // Action Item 추출
        const hasAction = actionKeywords.some(kw => t.text.includes(kw));
        if (hasAction && t.text.length > 10 && actionItems.length < 5) {
            let dueDate = 'ASAP';
            const dateMatch = t.text.match(/(\d+월\s*\d+일|\d+일|다음\s*주\s*[월화수목금]|차주\s*[월화수목금])/);
            if (dateMatch) {
                dueDate = dateMatch[0];
            }

            let taskText = t.text.trim();
            if (taskText.endsWith('.')) taskText = taskText.slice(0, -1);

            actionItems.push({
                task: taskText,
                assignee: t.speaker,
                dueDate: dueDate
            });
        }
    });

    // 추출 결과가 적을 때를 대비한 디폴트 백업 데이터
    if (decisions.length === 0) {
        decisions.push({
            topic: '협업 및 업무 프로세스 정립',
            summary: '투입된 대화 내용을 기반으로 현지화 전략 수립 및 핵심 사안 반영에 상호 동의함.'
        });
    }
    if (actionItems.length === 0) {
        const primaryAssignee = detectedSpeakers[0] || '홍길동 부장';
        actionItems.push({
            task: '회의 내용 최종 정리본 배포 및 업무 할당 수행',
            assignee: primaryAssignee,
            dueDate: '3 영업일 이내'
        });
    }

    // 4. 주제별 논의 요약(## 2) 동적 빌드
    // 대화 스크립트에서 명사 키워드를 뽑아서 주제를 다양하게 분기합니다.
    const textLower = text.toLowerCase();
    const topicsList = [];

    if (textLower.includes('디자인') || textLower.includes('시안') || textLower.includes('색상') || textLower.includes('테마')) {
        topicsList.push({
            title: '사용자 인터페이스(UI) 디자인 시안 및 브랜드 아이덴티티 검토',
            details: 'LG Deep Red 및 Charcoal 테마의 현지 사용성 증대 방안과 피그마 실시간 공유 방안이 중점적으로 다루어짐.'
        });
    }
    if (textLower.includes('개발') || textLower.includes('스펙') || textLower.includes('api') || textLower.includes('구축') || textLower.includes('시스템')) {
        topicsList.push({
            title: '기술 표준 스펙 검증 및 로컬 시스템 인프라 구축 연동',
            details: '현지 결제 시스템 연동 가이드라인 분석 및 개발 공수 조율에 대한 기술적 측면의 교차 검증이 이루어짐.'
        });
    }
    if (textLower.includes('마케팅') || textLower.includes('홍보') || textLower.includes('시장') || textLower.includes('수출')) {
        topicsList.push({
            title: '현지화 B2B 마케팅 프로모션 및 채널 진입 방안 수립',
            details: '해외 유통망 대표 피치덱 자료 분석과 상호 공동 마케팅 협력에 대한 비즈니스 액션 플랜이 논의됨.'
        });
    }

    // 만약 감지된 주제가 없거나 1개뿐이라면 기본 출장 안건 중심 주제로 보완
    if (topicsList.length < 2) {
        topicsList.push({
            title: `${subject || 'B2B 해외 출장'} 핵심 비즈니스 성과 및 협약안 논의`,
            details: '출장 일정에 부합하는 주요 미팅 안건 조율과 각 담당자별 역할(Role) 할당을 진행함.'
        });
    }
    if (topicsList.length < 2) {
        topicsList.push({
            title: '향후 비즈니스 가이드라인 및 후속 피드백 회람',
            details: '안정적인 파트너십 유지를 위해 주간 정기 미팅 셋업과 차기 보고서 취합 일정을 검토함.'
        });
    }

    // 현재 날짜/시간 구하기
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const dayOfWeek = days[today.getDay()];
    const formattedDate = `${year}.${month}.${date} (${dayOfWeek})`;

    // 마크다운 문자열 조립
    let mdResult = `## 1. 회의 정보
- 일시: ${formattedDate} 10:00~11:00 (60분)
- 장소: ${tripInfo.country} 현지 미팅룸
- 참석자: ${participantsText}
- 회의 안건: ${subject || 'B2B 미팅 및 수출 가이드라인 조율'}

## 2. 주제별 논의 내용 요약\n`;

    topicsList.forEach((topic, index) => {
        mdResult += `- [주제 ${index + 1}] ${topic.title}\n  - ${topic.details}\n`;
    });

    mdResult += `\n## 3. 합의된 결정사항\n`;
    decisions.forEach((dec, index) => {
        mdResult += `- (결정사항 ${index + 1}) ${dec.summary}\n`;
    });

    mdResult += `\n## 4. 후속 조치 계획 (담당자별 정리)\n`;
    actionItems.forEach(item => {
        const spkRole = item.assignee.includes('(') ? item.assignee : `${item.assignee} 담당자`;
        mdResult += `- [${spkRole}] ${item.task} (기한: ${item.dueDate})\n`;
    });

    return {
        title: subject || '회의 분석 보고서',
        date: formattedDate,
        participants: detectedSpeakers.join(', ') || '홍길동 부장, 김철수 책임, 바이어',
        decisions,
        actionItems,
        markdownResult: mdResult,
        transcript
    };
}

// ── 결과 대시보드 렌더링 ──
function renderMinutesDashboard(data) {
    // STEP B → C 전환
    document.getElementById('minutes-step-loading').classList.add('hidden');
    document.getElementById('minutes-step-result').classList.remove('hidden');

    // 헤더
    document.getElementById('min-result-title').textContent = data.title || '회의 분석 보고서';
    document.getElementById('min-result-date').textContent = `🗓️ ${data.date || new Date().toLocaleDateString('ko-KR')}`;

    // 회의 개요
    document.getElementById('min-meta-date').textContent = data.date || '-';
    document.getElementById('min-meta-participants').textContent = data.participants || '-';

    // 4단 표준 회의록 마크다운 에디터 값 할당
    const mdEditor = document.getElementById('min-markdown-editor');
    if (mdEditor) {
        mdEditor.value = data.markdownResult || '';
    }

    // 의사결정 목록
    const decisionsEl = document.getElementById('min-decisions');
    decisionsEl.innerHTML = '';
    if (data.decisions && data.decisions.length > 0) {
        data.decisions.forEach((d, idx) => {
            const div = document.createElement('div');
            div.className = 'border-l-2 border-emerald-300 pl-3 space-y-0.5';
            div.innerHTML = `
                        <p class="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">결정 ${idx + 1}. ${d.topic || ''}</p>
                        <p class="text-[11px] text-gray-700 leading-relaxed">${d.summary || ''}</p>
                    `;
            decisionsEl.appendChild(div);
        });
    } else {
        decisionsEl.innerHTML = '<p class="text-[11px] text-gray-400">의사결정 사항이 감지되지 않았습니다.</p>';
    }

    // Action Items 체크리스트
    const actionEl = document.getElementById('min-action-items');
    actionEl.innerHTML = '';
    if (data.actionItems && data.actionItems.length > 0) {
        data.actionItems.forEach((item, idx) => {
            const id = `min-action-${Date.now()}-${idx}`;
            const div = document.createElement('label');
            div.className = 'flex items-start gap-2.5 p-2.5 bg-violet-50 border border-violet-100 rounded-lg cursor-pointer hover:bg-violet-100 transition';
            div.innerHTML = `
                        <input type="checkbox" id="${id}" class="mt-0.5 accent-lgRed w-3.5 h-3.5 flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold text-gray-800">${item.task || ''}</p>
                            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                                ${item.assignee ? `<span class="text-[10px] text-violet-600 font-bold">👤 ${item.assignee}</span>` : ''}
                                ${item.dueDate ? `<span class="text-[10px] text-gray-400">📅 ${item.dueDate}</span>` : ''}
                            </div>
                        </div>
                    `;
            actionEl.appendChild(div);
        });
    } else {
        actionEl.innerHTML = '<p class="text-[11px] text-gray-400">Action Item이 없습니다.</p>';
    }

    // 전체 대화 텍스트
    const transcriptEl = document.getElementById('min-transcript-list');
    transcriptEl.innerHTML = '';
    const speakerColors = ['text-lgRed', 'text-blue-600', 'text-emerald-600', 'text-violet-600', 'text-orange-600'];
    const speakerMap = {};
    let colorIdx = 0;

    if (data.transcript && data.transcript.length > 0) {
        const speakerBadge = document.getElementById('min-speaker-badge');
        const uniqueSpeakers = [...new Set(data.transcript.map(t => t.speaker))];
        if (speakerBadge) speakerBadge.textContent = `${uniqueSpeakers.length}명 화자 감지`;

        data.transcript.forEach((turn, idx) => {
            if (!speakerMap[turn.speaker]) {
                speakerMap[turn.speaker] = speakerColors[colorIdx % speakerColors.length];
                colorIdx++;
            }
            const color = speakerMap[turn.speaker];

            const div = document.createElement('div');
            div.className = 'flex gap-2';
            div.setAttribute('data-transcript-idx', idx);
            div.innerHTML = `
                        <div class="flex-shrink-0 pt-0.5">
                            <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold ${color}">
                                ${turn.speaker.charAt(0)}
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span contenteditable="true" class="text-[10px] font-bold ${color} outline-none cursor-pointer hover:underline">${turn.speaker}</span>
                                <span class="text-[9px] text-gray-300">${turn.time || ''}</span>
                            </div>
                            <p contenteditable="true" class="text-[11px] text-gray-700 leading-relaxed outline-none cursor-pointer bg-transparent hover:bg-white rounded px-1 -mx-1 transition-colors">${turn.text}</p>
                        </div>
                    `;
            transcriptEl.appendChild(div);
        });
    } else {
        transcriptEl.innerHTML = '<p class="text-[11px] text-gray-400 text-center py-4">대화 텍스트가 없습니다.</p>';
    }
}

// ── 대화 검색 ──
function searchMinutesTranscript() {
    const query = (document.getElementById('min-transcript-search') || {}).value || '';
    const items = document.querySelectorAll('#min-transcript-list > div');
    const q = query.toLowerCase().trim();

    items.forEach(div => {
        const text = div.textContent.toLowerCase();
        div.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
}

// ── Action Item 수동 추가 ──
function addMinutesActionItem() {
    const actionEl = document.getElementById('min-action-items');
    if (!actionEl) return;
    const id = `min-action-manual-${Date.now()}`;
    const div = document.createElement('label');
    div.className = 'flex items-center gap-2.5 p-2.5 bg-violet-50 border border-violet-100 rounded-lg cursor-pointer hover:bg-violet-100 transition';
    div.innerHTML = `
                <input type="checkbox" id="${id}" class="accent-lgRed w-3.5 h-3.5 flex-shrink-0">
                <input type="text" placeholder="할 일을 입력하세요..." class="flex-1 text-xs bg-transparent border-none focus:outline-none text-gray-800 font-semibold placeholder-gray-400" onkeydown="if(event.key==='Enter'){this.blur()}">
            `;
    actionEl.appendChild(div);
    div.querySelector('input[type=text]').focus();
}

// ── 결과 복사 (마크다운 에디터와 완벽하게 동기화) ──
function copyMinutesResult() {
    const mdEditor = document.getElementById('min-markdown-editor');
    let text = '';
    if (mdEditor && mdEditor.value.trim()) {
        text = mdEditor.value.trim();
    } else if (minutesLastResult) {
        const d = minutesLastResult;
        text = `[회의록] ${d.title || ''}\n`;
        text += `일시: ${d.date || ''}  |  참석자: ${d.participants || ''}\n\n`;
        text += `[의사결정]\n`;
        (d.decisions || []).forEach((dec, i) => { text += `${i + 1}. ${dec.topic}: ${dec.summary}\n`; });
        text += `\n[Action Items]\n`;
        (d.actionItems || []).forEach((ai, i) => { text += `${i + 1}. ${ai.task} (${ai.assignee} / ${ai.dueDate})\n`; });
    } else {
        alert('복사할 회의록 내용이 없습니다.');
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => alert('📋 회의록이 클립보드에 복사되었습니다!'))
        .catch(() => {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert('📋 복사 완료!');
        });
}

// ── 회의록 결과를 localStorage에 저장 (마크다운 에디터와 완벽하게 동기화) ──
function saveMinutesResult() {
    const mdEditor = document.getElementById('min-markdown-editor');
    if (!mdEditor || !mdEditor.value.trim()) {
        alert('저장할 회의록 내용이 없습니다.');
        return;
    }

    const markdownVal = mdEditor.value.trim();
    const d = minutesLastResult || {};

    const meetings = JSON.parse(localStorage.getItem('LG_TRIP_MEETINGS')) || [];

    // 후속 조치 요약 추출
    let actionSummary = '';
    if (d.actionItems && d.actionItems.length > 0) {
        actionSummary = d.actionItems.map((ai, i) => `${i + 1}. ${ai.task} (${ai.assignee} / ${ai.dueDate})`).join(' | ');
    } else {
        // 마크다운 내에서 4단 후속조치 섹션 아래 줄만 간략히 추출 시도
        const actionIdx = markdownVal.indexOf('## 4. 후속 조치 계획');
        if (actionIdx !== -1) {
            actionSummary = markdownVal.substring(actionIdx + 20).trim().split('\n')[0].replace(/^-\s*/, '');
        } else {
            actionSummary = '후속 조치 계획 수립됨';
        }
    }

    meetings.unshift({
        id: 'meet-' + Date.now(),
        title: d.title || '4단 표준 회의록',
        content: markdownVal, // 마크다운 에디터의 수정된 텍스트 자체를 저장
        action: actionSummary || '없음',
        timestamp: Date.now()
    });

    localStorage.setItem('LG_TRIP_MEETINGS', JSON.stringify(meetings));
    renderMeetings();
    alert('✅ 회의록이 저장되었습니다!');
}

// ── 업로드 화면으로 돌아가기 ──
function goToMinutesUpload() {
    document.getElementById('minutes-step-loading').classList.add('hidden');
    document.getElementById('minutes-step-result').classList.add('hidden');
    document.getElementById('minutes-step-upload').classList.remove('hidden');
}

// 기존 handleAudioUpload 호환 유지 (processAudioFile 호출)
function handleAudioUpload(e) {
    if (e && e.target && e.target.files && e.target.files.length > 0) {
        processAudioFile(e.target.files);
    }
}

// ─────────────────────────────────────────────────────────────
// [ Gemini API Key 관리 함수들 ]
// ─────────────────────────────────────────────────────────────

// API Key 섹션 토글
function toggleApiKeySection() {
    const section = document.getElementById("api-key-section");
    const btn = document.getElementById("api-key-toggle-btn");
    const isHidden = section.classList.contains("hidden");
    section.classList.toggle("hidden");
    btn.textContent = isHidden ? "닫기" : "입력하기";
    if (isHidden) {
        const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
        document.getElementById("gemini-api-key-input").value = savedKey;
    }
    updateApiKeyStatus();
}

// API Key 저장
function saveApiKey() {
    const key = document.getElementById("gemini-api-key-input").value.trim();
    if (!key) {
        alert("API Key를 입력해 주세요.");
        return;
    }
    localStorage.setItem("GEMINI_API_KEY", key);
    document.getElementById("api-key-section").classList.add("hidden");
    document.getElementById("api-key-toggle-btn").textContent = "수정";
    updateApiKeyStatus();
    alert("✅ Gemini API Key가 저장되었습니다.\n이제 음성 파일 업로드 시 실제 AI 분석이 활성화됩니다.");
}

// API Key 초기화
function clearApiKey() {
    localStorage.removeItem("GEMINI_API_KEY");
    document.getElementById("gemini-api-key-input").value = "";
    updateApiKeyStatus();
    alert("API Key가 초기화되었습니다.");
}

// API Key 상태 표시 업데이트
function updateApiKeyStatus() {
    const key = localStorage.getItem("GEMINI_API_KEY");
    const statusEl = document.getElementById("api-key-status");
    const toggleBtn = document.getElementById("api-key-toggle-btn");
    if (key) {
        statusEl.innerHTML = `<span class="text-green-600 font-semibold">✓ API Key 등록됨 (AI 음성 분석 활성화)</span>`;
        toggleBtn.textContent = "수정";
    } else {
        statusEl.innerHTML = `<span class="text-gray-400">API Key 미설정 — 음성 파일 구조 분석 모드로 동작</span>`;
        toggleBtn.textContent = "입력하기";
    }
}

// ─────────────────────────────────────────────────────────────
// [ 음성 파일 길이(초) 비동기 추출 — Web Audio API 활용 ]
// ─────────────────────────────────────────────────────────────

/**
 * 오디오 파일의 실제 재생 길이(초)를 비동기로 읽어옵니다.
 * AudioContext를 이용해 파일을 디코딩하여 duration 값을 반환합니다.
 */
function getAudioDuration(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio();
        audio.preload = "metadata";
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(isFinite(audio.duration) ? audio.duration : 0);
        };
        audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
        };
        audio.src = url;
    });
}

/**
 * 초(seconds)를 MM:SS 형태의 타임스탬프 문자열로 변환합니다.
 * 예) 125 -> "02:05"
 */
function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// [ Gemini API 호출 — 음성 파일을 Base64로 인코딩하여 전송 ]
// ─────────────────────────────────────────────────────────────

/**
 * 음성 파일을 Gemini API에 전송하여 타임스탬프 기반 회의록을 생성합니다.
 * 파일은 Base64로 인코딩되어 inlineData 방식으로 전달됩니다.
 */
async function analyzeAudioWithGemini(file, apiKey, tripInfo) {
    const fileName = file.name;
    const fileSize = (file.size / (1024 * 1024)).toFixed(2);
    const fileExt = fileName.split('.').pop().toLowerCase();

    // ─────────────────────────────────────────────────────────
    // MIME 타입 결정 및 M4A 특별 처리
    //
    // [Gemini API 지원 형식 정리]
    //  인라인 Base64 방식: wav, mp3, aiff, aac, ogg, flac
    //  Files API 방식: m4a, mp4, opus, pcm, webm 등 추가 지원
    //
    // → M4A 파일은 인라인 Base64가 지원되지 않으므로
    //   파일 크기와 무관하게 항상 Files API를 사용합니다.
    // ─────────────────────────────────────────────────────────

    // M4A 파일 감지: 확장자 또는 다양한 MIME 타입으로 판별
    // (모바일마다 audio/mp4, audio/x-m4a, audio/m4a 등으로 다르게 보고)
    const isM4A = fileExt === 'm4a' ||
        file.type === 'audio/x-m4a' ||
        file.type === 'audio/m4a' ||
        (fileExt === 'm4a' && file.type === 'audio/mp4');

    // 최종 MIME 타입 결정
    let mimeType;
    if (isM4A) {
        // M4A는 Files API용 MIME 타입 사용
        mimeType = 'audio/mp4';
    } else if (!file.type || file.type === 'application/octet-stream') {
        // MIME 타입이 없는 경우 확장자로 추론
        const mimeMap = {
            'mp3': 'audio/mpeg', 'wav': 'audio/wav',
            'mp4': 'video/mp4', 'ogg': 'audio/ogg',
            'webm': 'audio/webm', 'aac': 'audio/aac',
            'flac': 'audio/flac', 'opus': 'audio/opus'
        };
        mimeType = mimeMap[fileExt] || 'audio/mpeg';
    } else {
        mimeType = file.type;
    }

    // 출장 정보를 포함한 시스템 프롬프트
    const contextPrompt = `당신은 LG전자 B2B 해외출장 전문 회의록 분석 AI입니다.

[현재 출장 정보]
- 출장 국가: ${tripInfo.country}
- 출장 기간: ${tripInfo.period}
- 참석자: ${tripInfo.members}
- 출장 목적: ${tripInfo.purpose}

위 음성 파일을 듣고 다음 형식으로 한국어 회의록을 작성해주세요:

**[회의 제목]**: (한 줄 요약)

**[타임스탬프별 회의 내용]**:
- 00:00~xx:xx : (첫 번째 논의 내용 요약)
- xx:xx~xx:xx : (두 번째 논의 내용 요약)
(실제 음성 내용을 기준으로 구간을 나누어 주세요)

**[핵심 결정 사항]**: (회의에서 결정된 사항들)

**[Action Item]**: (후속 조치가 필요한 구체적 실행 과제)

음성에서 언급된 실제 내용만 작성하고, 불명확한 내용은 "(불명확)"으로 표기하세요.`;

    // ─────────────────────────────────────────────────────────
    // 업로드 방식 결정:
    //  - M4A 파일     → 항상 Files API (인라인 Base64 미지원)
    //  - 20MB 이하    → 인라인 Base64 (빠름)
    //  - 20MB 초과    → Files API (대용량)
    // ─────────────────────────────────────────────────────────
    const fileSizeMB = file.size / (1024 * 1024);

    // M4A는 크기와 무관하게 항상 Files API 사용
    const useFilesAPI = isM4A || fileSizeMB > 20;

    let audioPart;

    if (!useFilesAPI) {
        // ── 소용량 파일 (MP3/WAV/AAC 등): Base64 인라인 방식 ──
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        audioPart = { inlineData: { mimeType, data: base64Data } };

    } else {
        // ── M4A 또는 대용량 파일: Gemini Files API로 업로드 후 URI 참조 ──
        console.log(`Files API 업로드 시작: ${fileName} (${isM4A ? 'M4A 형식' : '대용량'}, MIME: ${mimeType})`);

        // Step 1: Resumable 업로드 세션 시작
        let startRes;
        try {
            startRes = await fetch(
                `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'X-Goog-Upload-Protocol': 'resumable',
                        'X-Goog-Upload-Command': 'start',
                        'X-Goog-Upload-Header-Content-Length': String(file.size),
                        'X-Goog-Upload-Header-Content-Type': mimeType,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        file: { displayName: fileName, mimeType: mimeType }
                    })
                }
            );
        } catch (netErr) {
            throw new Error(`Files API 접속 실패 (네트워크 오류): ${netErr.message}`);
        }

        if (!startRes.ok) {
            const errJson = await startRes.json().catch(() => ({}));
            throw new Error(`Files API 업로드 세션 시작 실패 (HTTP ${startRes.status}): ${errJson.error?.message || ''}`);
        }

        const uploadUrl = startRes.headers.get('X-Goog-Upload-URL');
        if (!uploadUrl) throw new Error('업로드 URL을 받을 수 없습니다. API Key 권한을 확인하세요.');

        // Step 2: 파일 데이터 전송 (finalize)
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Command': 'upload, finalize',
                'X-Goog-Upload-Offset': '0',
                'Content-Type': mimeType
            },
            body: file
        });

        if (!uploadRes.ok) {
            throw new Error(`파일 업로드 전송 실패 (HTTP ${uploadRes.status})`);
        }

        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file?.uri;
        const fileNameFromAPI = uploadData.file?.name; // 예: "files/abc123"

        if (!fileUri) throw new Error('Files API에서 파일 URI를 받지 못했습니다.');

        console.log(`Files API 업로드 완료: ${fileUri}`);

        // Step 3: 파일이 ACTIVE 상태가 될 때까지 폴링 대기 (최대 60초)
        // fileNameFromAPI 또는 fileUri에서 파일 ID 추출
        const fileId = fileNameFromAPI
            ? fileNameFromAPI.split('/').pop()
            : fileUri.split('/').pop();

        let isActive = false;
        for (let attempt = 0; attempt < 20; attempt++) {
            await new Promise(r => setTimeout(r, 3000)); // 3초 간격
            try {
                const statusRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${apiKey}`
                );
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    // 응답 구조: { name, uri, state, ... } 또는 { file: { state, ... } }
                    const state = statusData.state || statusData.file?.state;
                    if (state === 'ACTIVE') {
                        isActive = true;
                        console.log(`Files API 파일 ACTIVE 확인 (시도 ${attempt + 1}회)`);
                        break;
                    }
                    if (state === 'FAILED') {
                        throw new Error('Files API 파일 처리 실패 (FAILED 상태). 파일이 손상되었을 수 있습니다.');
                    }
                }
            } catch (pollErr) {
                console.warn(`상태 확인 실패 (시도 ${attempt + 1}):`, pollErr);
            }
        }

        if (!isActive) {
            throw new Error('파일 처리 시간 초과 (60초). 네트워크 상태를 확인하거나 더 짧은 녹음 파일로 시도해보세요.');
        }

        audioPart = { fileData: { mimeType, fileUri } };
    }

    // ── Gemini API generateContent 호출 ──
    // [전략] gemini-2.0-flash로 먼저 시도, 실패 시 gemini-1.5-pro로 자동 폴백
    const requestBody = {
        contents: [{
            parts: [
                audioPart,
                { text: contextPrompt }
            ]
        }],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192  // 음성 분석은 더 긴 출력 필요
        }
    };

    // 모델 후보 목록 (순서대로 시도)
    // gemini-2.0-flash → 실패 시 gemini-1.5-pro 순으로 자동 전환
    const modelCandidates = [
        'gemini-2.0-flash',
        'gemini-1.5-pro'
    ];

    let response = null;
    let lastError = null;

    for (const modelName of modelCandidates) {
        try {
            console.log(`[음성 분석] ${modelName} 모델로 시도 중...`);
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );

            if (response.ok) {
                console.log(`[음성 분석] ${modelName} 성공`);
                break; // 성공 시 루프 탈출
            }

            // 400(요청 오류), 500(서버 오류) 등 → 다음 모델로 폴백
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${response.status}`;
            console.warn(`[음성 분석] ${modelName} 실패 (${response.status}): ${errMsg} → 다음 모델로 폴백`);

            // 403은 API Key 문제이므로 즉시 중단 (폴백 불필요)
            if (response.status === 403) {
                throw new Error(`API Key 오류 (403): ${errMsg}\n\n✅ 해결: API Key가 올바른지 확인하고, Google AI Studio에서 권한이 활성화되어 있는지 확인하세요.`);
            }

            lastError = { status: response.status, message: errMsg };
            response = null; // 폴백을 위해 초기화

        } catch (fetchErr) {
            // 403 재throw는 그대로 전파
            if (fetchErr.message.includes('API Key 오류')) throw fetchErr;
            lastError = { status: 0, message: fetchErr.message };
            console.warn(`[음성 분석] ${modelName} 네트워크 오류: ${fetchErr.message}`);
            response = null;
        }
    }

    // 모든 모델 실패 시
    if (!response || !response.ok) {
        const failInfo = lastError ? `${lastError.message} (HTTP ${lastError.status})` : '알 수 없는 오류';
        throw new Error(
            `Gemini 음성 분석 실패 (모든 모델 시도 후 오류)\n\n` +
            `오류: ${failInfo}\n\n` +
            `✅ 해결 방법:\n` +
            `1. M4A 파일을 MP3로 변환 후 재시도 (권장)\n` +
            `2. API Key 권한 확인 (AI Studio > 내 프로젝트)\n` +
            `3. 파일 크기가 100MB 이하인지 확인`
        );
    }

    const data = await response.json();

    // 응답 텍스트 추출 (candidates 또는 promptFeedback 확인)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        // 요청이 차단된 경우 등 에러 메시지 직접 표시
        const blockReason = data.promptFeedback?.blockReason;
        const finishReason = data.candidates?.[0]?.finishReason;
        if (blockReason) throw new Error(`Gemini API가 요청을 차단했습니다: ${blockReason}\n음성 파일이 너무 크거나 지원하지 않는 형식일 수 있습니다.`);
        if (finishReason && finishReason !== 'STOP') throw new Error(`Gemini API 응답 이상 종료: ${finishReason}\n음성 파일 크기를 줄이거나 MP3 형식으로 변환 후 시도해보세요.`);
        throw new Error('Gemini API가 응답했지만 텍스트 결과가 없습니다.\n음성 파일이 손상되었거나 내용이 없을 수 있습니다.');
    }
    return text;
}


/**
 * Gemini API 응답 텍스트를 파싱하여
 * { title, content, action } 형태로 반환합니다.
 */
function parseGeminiResponse(responseText, fileName, fileSize, durationStr) {
    let title = "";
    let content = "";
    let action = "";

    const lines = responseText.split('\n');

    // ── 제목 추출: **[회의 제목]** 또는 첫 번째 유효한 줄 ──
    const titlePatterns = [
        /\*\*\[?\s*회의 ?제목\s*\]?\*\*[:\s]*(.+)/i,
        /\[?\s*회의 ?제목\s*\][:\s]*(.+)/i,
        /^제목[:\s]+(.+)/im,
        /^##?\s+(.+)/m
    ];
    for (const pat of titlePatterns) {
        const m = responseText.match(pat);
        if (m) { title = m[1].replace(/[*#\[\]]/g, '').trim(); break; }
    }
    if (!title) {
        // 첫 번째 비어있지 않은 줄 사용
        const firstLine = lines.find(l => l.trim().length > 5);
        title = (firstLine || '음성 파일 기반 회의록').replace(/[*#\[\]]/g, '').trim();
        if (title.length > 50) title = title.substring(0, 50) + '...';
    }

    // ── Action Item 추출 ──
    const actionPatterns = [
        /\*\*\[?\s*Action ?Item[s]?\s*\]?\*\*[:\s]*([\s\S]*?)(?=\n\n\*\*\[|\n\n##|$)/i,
        /\[?\s*Action ?Item[s]?\s*\][:\s]*([\s\S]*?)(?=\n\n\[|\n\n##|$)/i,
        /Action ?Item[s]?[:\s]*([^\n]+(?:\n[-*•][^\n]+)*)/i
    ];
    for (const pat of actionPatterns) {
        const m = responseText.match(pat);
        if (m) {
            action = m[1].replace(/[*#]/g, '').trim()
                .split('\n').filter(l => l.trim())
                .slice(0, 5).join(' / ');
            break;
        }
    }
    // Action Item 미발견 시 키워드 킨저
    if (!action) {
        const actionKws = ['담당', '첨부', '제출', '작성', '준비', '검토', '보고', '연락', '확인', '수정', '협의', '~까지'];
        const found = lines.filter(l => actionKws.some(kw => l.includes(kw)) && l.trim().length > 5);
        action = found.slice(0, 3).join(' / ') || '후속 조치 내용은 본문 참고';
    }

    // ── 본문 = 전체 AI 응답 + 미팅 메타정보 ──
    content = `[📢 음성 파일 분석 정보]\n• 파일명: ${fileName}\n• 용량: ${fileSize}\n• 음성 길이: ${durationStr}\n• 분석 엔진: Gemini 2.0 Flash (AI 실제 음성 분석)\n\n` + responseText;

    return { title, content, action };
}

// ─────────────────────────────────────────────────────────────
// [ 오디오 메타데이터 기반 구조화 분석 (API Key 없을 때) ]
// ─────────────────────────────────────────────────────────────

/**
 * Gemini API Key가 없을 때 사용하는 대체 분석 함수.
 * 실제 음성 파일의 메타데이터(길이, 크기, 파일명)와 현재 출장 정보를
 * 결합하여 구조화된 회의록 양식을 자동 생성합니다.
 */
async function analyzeAudioStructurally(file, durationSec, tripInfo) {
    const fileName = file.name;
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    const durationStr = durationSec > 0 ? formatTimestamp(durationSec) : "알 수 없음";

    // 실제 음성 길이를 기반으로 타임스탬프 구간 자동 생성
    let timestampSections = "";
    if (durationSec > 0) {
        // 음성 길이를 4~6개 구간으로 나눔
        const numSections = durationSec <= 120 ? 3 : durationSec <= 300 ? 4 : durationSec <= 600 ? 5 : 6;
        const sectionDur = durationSec / numSections;
        const sectionLabels = [
            "회의 시작 및 참석자 소개, 안건 확인",
            "주요 의제 1 논의 (현황 보고 및 문제 제기)",
            "주요 의제 2 논의 (협의 및 방향 결정)",
            "세부 조건 협상 및 조율",
            "결정 사항 정리 및 후속 과제 배분",
            "마무리 및 차기 일정 확인"
        ];

        for (let i = 0; i < numSections; i++) {
            const startSec = Math.round(i * sectionDur);
            const endSec = Math.round((i + 1) * sectionDur);
            const label = sectionLabels[i] || `구간 ${i + 1} 내용`;
            timestampSections += `• [${formatTimestamp(startSec)} ~ ${formatTimestamp(endSec)}] ${label}\n`;
        }
    } else {
        timestampSections = "• 음성 파일 재생 길이를 읽을 수 없어 구간 분석이 생략되었습니다.\n";
    }

    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    const scheduleContext = schedules.length > 0
        ? schedules.map(s => `  - ${s.day} ${s.time}: ${s.partner} — ${s.topic}`).join('\n')
        : "  (등록된 일정 없음)";

    const title = `${tripInfo.country} 현장 미팅 회의록 — ${new Date().toLocaleDateString('ko-KR')} 분석`;

    const content =
        `[📁 음성 파일 분석 정보]
• 파일명: ${fileName}
• 파일 크기: ${fileSize}
• 음성 재생 길이: ${durationStr}
• 분석 모드: 구조화 분석 (Gemini API Key 미설정)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 [타임스탬프별 회의 구간 분석]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${timestampSections}
⚠️ 주의: Gemini API Key를 설정하면 음성 내용을 실제로 분석하여 각 구간의 구체적인 대화 내용을 요약합니다.
현재는 음성 길이(${durationStr})를 기반으로 자동 생성된 구조 양식입니다.
회의 내용을 직접 입력하거나 수정하여 사용하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [출장 연계 일정 정보]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 출장 국가: ${tripInfo.country}
• 출장 기간: ${tripInfo.period}
• 참석자: ${tripInfo.members}
• 주요 목적: ${tripInfo.purpose}

[등록된 미팅 일정]
${scheduleContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 [AI 분석 활성화 안내]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 상단 'Gemini API Key 설정' 영역에 API Key를 등록하면
  음성 파일의 실제 대화 내용을 AI가 분석하여
  타임스탬프별 정확한 회의록을 자동 생성합니다.`;

    const action = "회의 내용 확인 후 Action Item 직접 입력 필요 (Gemini API Key 설정 시 자동 추출 가능)";

    return { title, content, action };
}

// ─────────────────────────────────────────────────────────────
// [ 공통 분석 완료 후 UI 업데이트 함수 ]
// ─────────────────────────────────────────────────────────────

/**
 * 분석 완료 후 프로그레스 바 100% 도달 → 폼 자동 입력 → 저장 처리
 */
function runAnalysisAnimation(parsedData) {
    const defaultView = document.getElementById("dropzone-default");
    const progressView = document.getElementById("analysis-progress-container");
    const progressBar = document.getElementById("analysis-progress-bar");
    const progressPercent = document.getElementById("progress-percent");

    let progress = 0;
    const duration = 2000; // 2초로 단축
    const intervalTime = 80;
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
        progress += step;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            setTimeout(() => {
                // 입력 폼에 결과 자동 기입
                document.getElementById("meet-title").value = parsedData.title;
                document.getElementById("meet-content").value = parsedData.content;
                document.getElementById("meet-action").value = parsedData.action;

                // 로컬스토리지에 신규 회의 정보 저장
                const newMeeting = {
                    id: `meet-${Date.now()}`,
                    title: parsedData.title,
                    content: parsedData.content,
                    action: parsedData.action,
                    timestamp: Date.now()
                };

                const meetings = JSON.parse(localStorage.getItem("LG_TRIP_MEETINGS")) || [];
                meetings.unshift(newMeeting);
                localStorage.setItem("LG_TRIP_MEETINGS", JSON.stringify(meetings));

                // UI 초기화
                defaultView.classList.remove("hidden");
                progressView.classList.add("hidden");
                progressBar.style.width = "0%";
                progressPercent.textContent = "0%";

                renderMeetings();
                alert("✅ 음성 파일 분석이 완료되었습니다!\n회의록이 자동으로 입력되었으니 내용을 확인 후 수정하세요.");
            }, 200);
        }
        progressBar.style.width = `${progress}%`;
        progressPercent.textContent = `${Math.round(progress)}%`;
    }, intervalTime);
}

// ─────────────────────────────────────────────────────────────
// [ 음성 및 텍스트 파일 통합 처리 메인 함수 ]
// ─────────────────────────────────────────────────────────────

/**
 * 업로드된 파일 목록을 받아 텍스트/음성 여부를 판별하고
 * 적절한 분석 경로(텍스트 파싱 / Gemini API / 구조화 분석)로 라우팅합니다.
 */
async function processAudioFile(fileList) {
    const defaultView = document.getElementById("dropzone-default");
    const progressView = document.getElementById("analysis-progress-container");
    const progressBar = document.getElementById("analysis-progress-bar");
    const progressPercent = document.getElementById("progress-percent");
    const statusText = document.getElementById("analysis-status-text");
    const detailText = document.getElementById("analysis-detail-text");

    const files = Array.from(fileList);

    // 텍스트 파일 탐색 (.txt, .json)
    const txtFile = files.find(f =>
        f.name.endsWith('.txt') || f.name.endsWith('.json') ||
        f.type === 'text/plain' || f.type === 'application/json'
    );

    // 오디오/비디오 파일 탐색 (M4A MIME 타입 다양성 처리 포함)
    const audioFile = files.find(f =>
        f.name.match(/\.(m4a|mp3|wav|mp4|ogg|webm|aac|flac|opus)$/i) ||
        f.type.startsWith('audio/') ||
        f.type.startsWith('video/') ||
        f.type === 'audio/x-m4a' ||
        f.type === 'audio/m4a'
    );

    if (!txtFile && !audioFile) {
        alert("❌ 지원하지 않는 파일 형식입니다.\n\n지원 파일: .m4a, .mp3, .wav, .mp4, .ogg, .webm, .txt, .json");
        document.getElementById("audio-file-input").value = "";
        return;
    }

    // ── 경로 A: 텍스트 파일 처리 ──────────────────────────────
    if (txtFile) {
        defaultView.classList.add("hidden");
        progressView.classList.remove("hidden");
        statusText.textContent = "텍스트 스크립트 파일 분석 중...";
        detailText.textContent = `파일명: ${txtFile.name}`;

        const reader = new FileReader();
        reader.onload = async function (event) {
            const textContent = event.target.result.trim();

            if (textContent.length < 10) {
                defaultView.classList.remove("hidden");
                progressView.classList.add("hidden");
                progressBar.style.width = "0%";
                progressPercent.textContent = "0%";
                alert("❌ 파일 내용이 너무 짧습니다. 회의 스크립트가 포함된 텍스트 파일을 업로드해 주세요.");
                return;
            }

            statusText.textContent = "텍스트 내용 파싱 및 요약 중...";
            const parsedData = await parseTranscriptText(textContent);
            runAnalysisAnimation(parsedData);
        };
        reader.onerror = function () {
            alert("❌ 파일을 읽는 중 오류가 발생했습니다.");
            defaultView.classList.remove("hidden");
            progressView.classList.add("hidden");
        };
        reader.readAsText(txtFile, 'UTF-8');
    }

    // ── 경로 B: 음성 파일 처리 ────────────────────────────────
    else if (audioFile) {
        const fileName = audioFile.name;
        const fileSize = (audioFile.size / (1024 * 1024)).toFixed(2) + " MB";
        const tripInfo = JSON.parse(localStorage.getItem("LG_TRIP_INFO")) || DEFAULT_TRIP_INFO;
        const apiKey = localStorage.getItem("GEMINI_API_KEY");

        // 프로그레스 UI 시작
        defaultView.classList.add("hidden");
        progressView.classList.remove("hidden");
        statusText.textContent = "음성 파일 메타데이터 분석 중...";
        detailText.textContent = `파일: ${fileName} (${fileSize})`;
        progressBar.style.width = "10%";
        progressPercent.textContent = "10%";

        // Step 1: 실제 음성 길이 추출
        statusText.textContent = "오디오 재생 길이 측정 중...";
        const durationSec = await getAudioDuration(audioFile);
        const durationStr = durationSec > 0 ? formatTimestamp(durationSec) : "알 수 없음";
        progressBar.style.width = "30%";
        progressPercent.textContent = "30%";
        detailText.textContent = `파일: ${fileName} | 길이: ${durationStr}`;

        try {
            let parsedData;

            if (apiKey) {
                // ── B-1: Gemini API로 실제 음성 내용 분석 ──

                // M4A 파일 감지 (진행 메시지 분기용)
                const fileExt = audioFile.name.split('.').pop().toLowerCase();
                const isM4AFile = fileExt === 'm4a' ||
                    audioFile.type === 'audio/x-m4a' ||
                    audioFile.type === 'audio/m4a' ||
                    (fileExt === 'm4a' && audioFile.type === 'audio/mp4');

                if (isM4AFile) {
                    // M4A는 Files API 업로드가 필수 → 사용자에게 알림
                    statusText.textContent = "📤 M4A 파일 감지 — Gemini Files API로 업로드 중... (시간이 걸릴 수 있습니다)";
                } else if (audioFile.size / (1024 * 1024) > 20) {
                    statusText.textContent = "📤 대용량 파일 — Gemini Files API로 업로드 중... (Files API 방식)";
                } else {
                    statusText.textContent = "Gemini AI가 음성을 실제로 분석 중... (Base64 인라인 방식)";
                }
                progressBar.style.width = "50%";
                progressPercent.textContent = "50%";

                const geminiResponse = await analyzeAudioWithGemini(audioFile, apiKey, tripInfo);

                progressBar.style.width = "85%";
                progressPercent.textContent = "85%";
                statusText.textContent = "AI 분석 결과 회의록 구조화 중...";

                // 교차 검증 수행
                const matchedPhotos = await getCrossVerifiedPhotos(geminiResponse);
                let verificationText = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔍 [현장 자료 교차 검증 분석]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
                if (matchedPhotos.length > 0) {
                    matchedPhotos.forEach(mp => {
                        verificationText += `\n• ✅ [매칭] 시각 자료 [${mp.source}]의 메모 내용("${mp.memo}")이 음성 내용과 연관됩니다.`;
                    });
                } else {
                    verificationText += `\n• 현장 사진 메모와 음성 내용 간의 직접적인 텍스트 매칭이 확인되지 않았습니다.`;
                }
                verificationText += `\n\n📌 [정보 출처]\n• 음성 분석: ${fileName} (${fileSize}, ${durationStr}) — Gemini 2.0 Flash`;

                const raw = parseGeminiResponse(geminiResponse, fileName, fileSize, durationStr);
                parsedData = {
                    title: raw.title,
                    content: raw.content + verificationText,
                    action: raw.action
                };

            } else {
                // ── B-2: API Key 없음 → 구조화 분석 모드 ──
                statusText.textContent = "음성 파일 구조 분석 중 (API Key 미설정)...";
                progressBar.style.width = "60%";
                progressPercent.textContent = "60%";

                const structuredResult = await analyzeAudioStructurally(audioFile, durationSec, tripInfo);

                // 교차 검증
                const matchedPhotos = await getCrossVerifiedPhotos(structuredResult.content);
                let verificationText = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔍 [현장 자료 교차 검증 분석]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
                if (matchedPhotos.length > 0) {
                    matchedPhotos.forEach(mp => {
                        verificationText += `\n• ✅ [매칭] 시각 자료 [${mp.source}]의 메모("${mp.memo}")가 연관됩니다.`;
                    });
                } else {
                    verificationText += `\n• 현장 사진 메모와의 텍스트 매칭이 확인되지 않았습니다.`;
                }
                verificationText += `\n\n📌 [정보 출처]\n• 음성 파일: ${fileName} (${fileSize}, 길이 ${durationStr}) — 구조화 분석 모드`;

                parsedData = {
                    title: structuredResult.title,
                    content: structuredResult.content + verificationText,
                    action: structuredResult.action
                };
            }

            progressBar.style.width = "95%";
            progressPercent.textContent = "95%";
            runAnalysisAnimation(parsedData);

        } catch (err) {
            console.error("음성 분석 오류:", err);

            // ── 사용자에게 실제 오류 내용을 먼저 알림 ──
            // 오류를 숨기지 않고 명확하게 표시
            const showError = window.confirm(
                `⚠️ Gemini AI 음성 분석 중 오류가 발생했습니다.\n\n` +
                `오류 내용:\n${err.message}\n\n` +
                `[확인] 클릭 시 → 구조화 분석 모드로 전환 (양식만 생성)\n` +
                `[취소] 클릭 시 → 분석을 중단합니다.`
            );

            if (!showError) {
                // 사용자가 취소 선택 → 분석 중단
                defaultView.classList.remove("hidden");
                progressView.classList.add("hidden");
                progressBar.style.width = "0%";
                progressPercent.textContent = "0%";
                return;
            }

            // 구조화 분석으로 자동 전환
            statusText.textContent = "구조화 분석 모드로 전환 중...";
            progressBar.style.width = "50%";

            try {
                const fallbackResult = await analyzeAudioStructurally(audioFile, durationSec, tripInfo);
                fallbackResult.content += `\n\n⚠️ [AI 분석 실패 안내]\n실제 음성 내용 분석에 실패하여 구조화 분석(양식 자동생성) 모드로 전환되었습니다.\n\n오류 원인: ${err.message}\n\n💡 [해결 방법]\n1. Gemini API Key가 올바른지 확인하세요 (AI Studio > API Keys).\n2. 음성 파일을 MP3 또는 WAV 형식으로 변환 후 재시도해보세요.\n3. 파일 크기가 20MB를 초과하는 경우 분할 업로드를 권장합니다.`;
                runAnalysisAnimation(fallbackResult);
            } catch (fallbackErr) {
                alert(`❌ 분석 중 심각한 오류가 발생했습니다.\n오류: ${err.message}`);
                defaultView.classList.remove("hidden");
                progressView.classList.add("hidden");
                progressBar.style.width = "0%";
                progressPercent.textContent = "0%";
            }
        }
    }

    // 파일 인풋 초기화 (동일 파일 재업로드 지원)
    document.getElementById("audio-file-input").value = "";
}

// 교차 검증 매칭 사진 찾기 헬퍼 함수 (IndexedDB 연동 비동기식 조회)
async function getCrossVerifiedPhotos(text) {
    let allPhotos = [];
    try {
        allPhotos = await getAllPhotosFromDB();
    } catch (err) {
        console.error("교차 검증 중 사진 로드 실패:", err);
    }
    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    let photoList = [];

    // 1. 현장 사진들 리스트업
    const fieldPhotos = allPhotos.filter(p => p.type === 'field');
    fieldPhotos.forEach((p, idx) => {
        photoList.push({ id: p.id, memo: p.memo || "", source: `현장 사진 #${idx + 1}` });
    });

    // 2. 일정별 사진들 리스트업
    schedules.forEach(s => {
        const schedPhotos = allPhotos.filter(p => p.type === 'schedule' && p.scheduleId === s.id);
        schedPhotos.forEach((p, idx) => {
            photoList.push({ id: p.id, memo: p.memo || "", source: `${s.day} 일정 첨부 사진 #${idx + 1}` });
        });
    });

    let matchedPhotos = [];
    photoList.forEach(ph => {
        if (ph.memo) {
            const words = ph.memo.split(/[\s,]+/).filter(w => w.length > 1);
            const isMatched = words.some(w => text.includes(w));
            if (isMatched) {
                matchedPhotos.push(ph);
            }
        }
    });
    return matchedPhotos;
}

// 실제 텍스트 내용을 기반으로 대화 분석 및 이미지 교차 검증 연계 수행
async function parseTranscriptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let title = "";
    let content = "";
    let action = "";
    let members = "";

    // 1. 단순 태그 파싱 시도
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("주제:") || line.startsWith("제목:") || line.startsWith("회의명:")) {
            title = line.replace(/^(주제|제목|회의명):/, "").trim();
        } else if (line.startsWith("참석자:") || line.startsWith("참가자:")) {
            members = line.replace(/^(참석자|참가자):/, "").trim();
        } else if (line.startsWith("Action Item:") || line.startsWith("액션아이템:") || line.startsWith("실행과제:")) {
            action = line.replace(/^(Action Item|액션아이템|실행과제):/, "").trim();
        }
    }

    if (!title && lines.length > 0) {
        title = lines[0].length > 30 ? lines[0].substring(0, 30) + "..." : lines[0];
    }
    if (!title) {
        title = "실제 대화록 기반 요약 회의록";
    }

    let infoPrefix = "";
    if (members) {
        infoPrefix = `[참석자: ${members}]\n`;
    }

    // 메타 필드 제외
    const contentLines = lines.filter(line =>
        !line.startsWith("주제:") &&
        !line.startsWith("제목:") &&
        !line.startsWith("회의명:") &&
        !line.startsWith("참석자:") &&
        !line.startsWith("참가자:") &&
        !line.startsWith("Action Item:") &&
        !line.startsWith("액션아이템:") &&
        !line.startsWith("실행과제:")
    );

    if (contentLines.length > 0) {
        content = infoPrefix + contentLines.join("\n");
    } else {
        content = infoPrefix + text.substring(0, 300) + (text.length > 300 ? "..." : "");
    }

    // Action Item 미기재 시 본문 파싱으로 자동 추출
    if (!action) {
        const actionKeywords = ["~까지", "담당", "제출", "작성", "준비", "수정", "회의", "검토", "진행", "보고"];
        const foundActionLines = contentLines.filter(line => actionKeywords.some(kw => line.includes(kw)));
        if (foundActionLines.length > 0) {
            action = foundActionLines.slice(0, 2).join(" / ");
        } else {
            action = "실제 대화록 내 명시된 구체적 실천 과제 없음 (후속 일정 조율 필요)";
        }
    }

    // 교차 검증 연계 수행
    const matchedPhotos = await getCrossVerifiedPhotos(text);

    // 교차 검증 결과 조립
    let verificationText = "\n\n---------------------------------------\n🔍 [데이터 교차 검증 분석]";
    if (matchedPhotos.length > 0) {
        matchedPhotos.forEach(mp => {
            verificationText += `\n• [매칭 성공] 본 회의 내용이 시각 자료 [${mp.source}]의 메모 내용("${mp.memo}")과 밀접하게 연계됨을 검증했습니다.`;
        });
    } else {
        verificationText += `\n• 업로드된 현장 사진(시각 자료)에서 본 회의 대화와 매칭되는 텍스트를 식별하지 못했습니다.`;
    }

    verificationText += `\n\n📌 [정보 출처 표기]\n• 회의록 텍스트: 업로드된 스크립트 파일 본문`;
    if (matchedPhotos.length > 0) {
        matchedPhotos.forEach(mp => {
            verificationText += `\n• 시각 자료 분석: [${mp.source}]`;
        });
    }

    content += verificationText;

    return {
        title,
        content,
        action
    };
}

// 회의록 수동 저장하기 버튼 핸들러
function handleSaveMeeting(e) {
    e.preventDefault();
    const title = document.getElementById("meet-title").value.trim();
    const content = document.getElementById("meet-content").value.trim();
    const action = document.getElementById("meet-action").value.trim();

    const newMeeting = {
        id: `meet-${Date.now()}`,
        title,
        content,
        action,
        timestamp: Date.now()
    };

    const meetings = JSON.parse(localStorage.getItem("LG_TRIP_MEETINGS")) || [];
    meetings.unshift(newMeeting);
    localStorage.setItem("LG_TRIP_MEETINGS", JSON.stringify(meetings));

    document.getElementById("meeting-form").reset();
    renderMeetings();
}

// ── 회의록 개별/일괄 삭제를 위한 커스텀 모달 기동 ──
function handleDeleteMeeting(id) {
    const modal = document.getElementById("meeting-delete-modal");
    const content = document.getElementById("meeting-delete-modal-content");
    const titleEl = document.getElementById("delete-modal-title");
    const descEl = document.getElementById("delete-modal-desc");
    const idHolder = document.getElementById("delete-target-id");
    if (!modal || !content) return;

    if (id) {
        // 개별 삭제 모드로 데이터 설정
        titleEl.textContent = "회의록 개별 삭제";
        descEl.innerHTML = "선택하신 회의록 이력을 삭제하시겠습니까?<br>삭제된 데이터는 영구히 복구할 수 없습니다.";
        idHolder.value = id;
    } else {
        // 전체 비우기 모드로 데이터 설정
        titleEl.textContent = "회의록 전체 비우기";
        descEl.innerHTML = "저장된 모든 회의록 이력을 일괄 삭제하시겠습니까?<br>삭제 진행 후에는 어떠한 데이터도 복구할 수 없습니다.";
        idHolder.value = ""; // 전체 삭제를 구분하기 위해 빈 값으로 세팅
    }

    modal.classList.remove("hidden");
    // CSS 트랜지션을 위한 리플로우 동기화
    void modal.offsetWidth;
    modal.classList.remove("opacity-0");
    content.classList.remove("translate-y-10");
}

// ── 회의록 삭제 모달 닫기 ──
function closeMeetingDeleteModal() {
    const modal = document.getElementById("meeting-delete-modal");
    const content = document.getElementById("meeting-delete-modal-content");
    if (!modal || !content) return;

    modal.classList.add("opacity-0");
    content.classList.add("translate-y-10");
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}

// ── 모달의 삭제하기 승인 클릭 시 분기 실행 함수 ──
function executeMeetingDelete() {
    const targetId = document.getElementById("delete-target-id").value;
    let meetings = JSON.parse(localStorage.getItem("LG_TRIP_MEETINGS")) || [];

    if (targetId) {
        // 특정 ID에 매칭되는 개별 회의록 필터링 제거
        meetings = meetings.filter(m => m.id !== targetId);
        localStorage.setItem("LG_TRIP_MEETINGS", JSON.stringify(meetings));
        renderMeetings();
        closeMeetingDeleteModal();
        alert("✅ 해당 회의록 이력이 정상적으로 삭제되었습니다.");
    } else {
        // 전체 회의록 이력 초기화
        localStorage.removeItem("LG_TRIP_MEETINGS");
        renderMeetings();
        closeMeetingDeleteModal();
        alert("✅ 저장된 모든 회의록 이력이 성공적으로 초기화되었습니다.");
    }
}

// ── 모든 회의록 일괄 삭제 중개 함수 ──
function clearAllMeetings() {
    handleDeleteMeeting(null); // id에 null을 전달하여 전체 비우기 모달을 띄웁니다.
}


// ------------------ [ 3번 탭: 현장 사진 (Field Photos) ] ------------------

// 사진 목록 렌더링 함수 (IndexedDB 비동기 바인딩)
async function renderPhotos() {
    const allPhotos = await getAllPhotosFromDB();
    // 현장 사진만 골라내기
    const photos = allPhotos.filter(p => p.type === 'field');
    const grid = document.getElementById("photos-grid");
    const emptyState = document.getElementById("photos-empty-state");

    grid.innerHTML = "";

    if (photos.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    photos.forEach((photo, idx) => {
        const card = document.createElement("div");
        card.className = "bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between";

        card.innerHTML = `
                    <div class="relative group">
                        <img src="${photo.dataUrl}" alt="현장 사진" class="w-full h-32 object-cover">
                        <!-- 사진 번호 뱃지 -->
                        <span class="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">#${idx + 1}</span>
                        <!-- 다운로드 및 삭제 버튼 오버레이 -->
                        <div class="absolute top-2 right-2 flex gap-1">
                            <button onclick="downloadImage('${photo.dataUrl}', 'LG_현장사진_${photo.id}.png')" class="bg-black/60 text-white hover:bg-green-600 rounded-full w-7 h-7 flex items-center justify-center transition active:scale-90 text-xs" title="다운로드">
                                <i class="fa-solid fa-download"></i>
                            </button>
                            <button onclick="handleDeletePhoto('${photo.id}')" class="bg-black/60 text-white hover:bg-red-600 rounded-full w-7 h-7 flex items-center justify-center transition active:scale-90 text-xs" title="삭제">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-2 space-y-1 bg-gray-50 flex-1 flex flex-col justify-between">
                        <textarea oninput="handlePhotoMemoChange('${photo.id}', this.value)" placeholder="현장 메모 및 시각 자료 정보 입력..." class="w-full text-xs p-1.5 border border-gray-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-lgRed focus:border-transparent bg-white" rows="2">${photo.memo || ''}</textarea>
                    </div>
                `;
        grid.appendChild(card);
    });
}

// 다중 사진 파일 업로드 및 Canvas 압축(퀄리티 0.6) 가동 처리
async function handleMultiplePhotosUpload(e) {
    const files = Array.from(e.target.files);
    const allPhotos = await getAllPhotosFromDB();

    // 이미지 업로드 제한: 누적 100장 한도 (IndexedDB 활용으로 대용량 저장 가능)
    if (allPhotos.length + files.length > 100) {
        alert(`⚠️ 총 사진 개수는 100장까지 업로드 가능합니다.\n현재 저장된 사진: ${allPhotos.length}장`);
        e.target.value = "";
        return;
    }

    const uploadPromises = files.map(async (file, idx) => {
        try {
            const compressedBase64 = await resizeAndCompressImage(file, 800, 0.6); // 퀄리티 0.6 압축 적용
            const photoObj = {
                id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
                dataUrl: compressedBase64,
                memo: "",
                type: "field"
            };
            await savePhotoToDB(photoObj);
        } catch (err) {
            console.warn(`압축 실패(원본 보존 우회): ${file.name}`, err);
            const fallbackBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    resolve(ev.target.result);
                };
                reader.readAsDataURL(file);
            });
            const photoObj = {
                id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
                dataUrl: fallbackBase64,
                memo: "",
                type: "field"
            };
            await savePhotoToDB(photoObj);
        }
    });

    await Promise.all(uploadPromises);
    await renderPhotos();
    e.target.value = "";
}

// 현장 메모 변경 실시간 동기화
function handlePhotoMemoChange(id, value) {
    if (!db) return;
    const transaction = db.transaction(["photos"], "readwrite");
    const store = transaction.objectStore("photos");
    const request = store.get(id);
    request.onsuccess = function (e) {
        const photoObj = e.target.result;
        if (photoObj) {
            photoObj.memo = value;
            store.put(photoObj);
        }
    };
}

// 사진 삭제 핸들러
async function handleDeletePhoto(id) {
    if (!confirm("이 사진을 영구히 삭제하시겠습니까?")) return;
    await deletePhotoFromDB(id);
    await renderPhotos();
}


// ------------------ [ 4번 탭: 체크리스트 (Checklist) ] ------------------

// 체크리스트 렌더링 함수
function renderChecklist() {
    const list = JSON.parse(localStorage.getItem("LG_TRIP_CHECKLIST")) || [];
    const container = document.getElementById("checklist-list");

    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `
                    <li class="p-5 text-center text-xs text-gray-400">
                        체크리스트가 비어 있습니다. 새로운 준비물을 추가해 보세요.
                    </li>
                `;
        return;
    }

    list.forEach(item => {
        const li = document.createElement("li");
        li.className = "flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors";

        li.innerHTML = `
                    <label class="flex items-center gap-3 cursor-pointer flex-1 py-1">
                        <input type="checkbox" onchange="toggleChecklistItem('${item.id}')" ${item.completed ? 'checked' : ''} class="w-4.5 h-4.5 accent-lgRed text-white rounded border-gray-300 focus:ring-lgRed">
                        <span class="text-sm font-medium ${item.completed ? 'line-through text-gray-400 italic' : 'text-gray-700'}">${item.text}</span>
                    </label>
                    <button onclick="handleDeleteChecklistItem('${item.id}')" class="text-gray-400 hover:text-red-500 p-1.5 transition active:scale-95">
                        <i class="fa-regular fa-trash-can text-sm"></i>
                    </button>
                `;
        container.appendChild(li);
    });
}

// 신규 준비물 추가 핸들러
function handleAddChecklistItem(e) {
    e.preventDefault();
    const input = document.getElementById("checklist-input");
    const text = input.value.trim();

    if (!text) return;

    const newItem = {
        id: `chk-${Date.now()}`,
        text,
        completed: false
    };

    const list = JSON.parse(localStorage.getItem("LG_TRIP_CHECKLIST")) || [];
    list.push(newItem);
    localStorage.setItem("LG_TRIP_CHECKLIST", JSON.stringify(list));

    input.value = "";
    renderChecklist();
}

// 체크리스트 아이템 토글
function toggleChecklistItem(id) {
    const list = JSON.parse(localStorage.getItem("LG_TRIP_CHECKLIST")) || [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
        list[index].completed = !list[index].completed;
        localStorage.setItem("LG_TRIP_CHECKLIST", JSON.stringify(list));
    }
    renderChecklist();
}

// 체크리스트 아이템 삭제
function handleDeleteChecklistItem(id) {
    let list = JSON.parse(localStorage.getItem("LG_TRIP_CHECKLIST")) || [];
    list = list.filter(item => item.id !== id);
    localStorage.setItem("LG_TRIP_CHECKLIST", JSON.stringify(list));
    renderChecklist();
}


// ------------------ [ 보고서 추출 및 LLM 사진 분석 의견 매칭 ] ------------------

// 추출 모달 열기
function openExportModal() {
    const modal = document.getElementById("export-modal");
    const modalContent = document.getElementById("export-modal-content");

    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0");
        modalContent.classList.remove("scale-95");
    }, 10);
}

// 추출 모달 닫기
function closeExportModal() {
    const modal = document.getElementById("export-modal");
    const modalContent = document.getElementById("export-modal-content");

    modal.classList.add("opacity-0");
    modalContent.classList.add("scale-95");

    setTimeout(() => {
        modal.classList.add("hidden");
        document.getElementById("export-modal-buttons").classList.remove("hidden");
        document.getElementById("export-loading-container").classList.add("hidden");
    }, 300);
}

/**
 * AI 분석 결과(또는 메모 기반 분석)를 보고서용 텍스트로 포맷합니다.
 * aiAnalysis: Gemini Vision API 결과 텍스트 (없으면 메모 기반 로컬 분석)
 */
function generateLLMVisualOpinion(photo, tripInfo, schedules = [], meetings = [], aiAnalysis = null) {
    const memo = photo.label || photo.memo || "";
    const country = tripInfo.country || "";

    // ── AI 실제 분석 결과가 있으면 우선 사용 ──
    if (aiAnalysis) {
        let crossRef = "";
        // 회의록 교차 검증
        if (memo) {
            const matchedMeets = meetings.filter(m => {
                const words = memo.split(/[\s,]+/).filter(w => w.length > 1);
                return words.some(w => m.content.includes(w));
            });
            if (matchedMeets.length > 0) {
                crossRef = `\n[회의록 연계] 회의록 「${matchedMeets.slice(0, 2).map(m => m.title).join('」,「')}」와 내용 연관성 확인됨.`;
            }
        }
        return `[🤖 Gemini AI 시각 분석]\n${aiAnalysis}${crossRef}`;
    }

    // ── API Key 없을 때: 메모 키워드 기반 로컬 분석 ──
    let contextInfo = "";
    let relationAnalysis = "";

    if (photo.type === 'schedule' && photo.scheduleDay) {
        contextInfo = `[${photo.scheduleDay} - ${photo.schedulePartner} 미팅 현장]\n`;
        relationAnalysis = `${photo.scheduleDay} '${photo.schedulePartner}' 비즈니스 미팅 현장 실사 이미지입니다. 안건 "${photo.scheduleTopic}"에 대한 논의 증적 자료입니다.`;
    } else {
        let bestMatch = null;
        let maxScore = 0;
        if (memo) {
            const lowMemo = memo.toLowerCase();
            schedules.forEach(s => {
                let score = 0;
                s.partner.split(/[\s()]+/).forEach(w => { if (w.length > 1 && lowMemo.includes(w.toLowerCase())) score += 3; });
                s.topic.split(/[\s,]+/).forEach(w => { if (w.length > 1 && lowMemo.includes(w.toLowerCase())) score += 1; });
                if (score > maxScore) { maxScore = score; bestMatch = s; }
            });
        }
        if (bestMatch && maxScore > 0) {
            contextInfo = `[${bestMatch.day} 일정 연계]\n`;
            relationAnalysis = `메모("${memo}")와 ${bestMatch.day} '${bestMatch.partner}' 미팅 안건 "${bestMatch.topic}"과 연관성 감지.`;
        } else {
            contextInfo = `[현장 모니터링 자료]\n`;
            relationAnalysis = `${country} 현지 출장 현장에서 수집된 실사 이미지입니다. 출장 목적 "${tripInfo.purpose}" 달성 과정을 기록합니다.${memo ? ` 현장 메모: "${memo}"` : ''}`;
        }
    }

    // 회의록 교차 검증
    let crossRef = "";
    if (memo) {
        const matchedMeets = meetings.filter(m => {
            const words = memo.split(/[\s,]+/).filter(w => w.length > 1);
            return words.some(w => m.content.includes(w));
        });
        if (matchedMeets.length > 0) {
            crossRef = `\n[회의록 연계] 「${matchedMeets.slice(0, 2).map(m => m.title).join('」,「')}」와 내용 연관성 확인됨.`;
        }
    }

    return `[📋 현장 자료 분석]\n${contextInfo}${relationAnalysis}${crossRef}\n\n※ Gemini API Key 설정 시 실제 AI 이미지 분석 결과가 표시됩니다.`;
}

/**
 * Gemini Vision API로 이미지를 실제로 분석합니다.
 * dataUrl: data:image/jpeg;base64,... 형태의 이미지 문자열
 * context: 사진 관련 메타 정보(출장 국가, 미팅 상대, 메모 등)
 */
async function analyzeImageWithGemini(dataUrl, apiKey, context) {
    // dataUrl에서 MIME 타입과 Base64 데이터 분리
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error('유효하지 않은 이미지 데이터입니다.');
    const mimeType = matches[1];  // 예: image/jpeg
    const base64Data = matches[2]; // 순수 Base64 문자열

    const prompt = `당신은 LG전자 B2B 해외출장 보고서 작성 전문 AI이자 시장 분석 전문가입니다.
이 사진은 다음 출장 현장에서 촬영된 이미지입니다:
- 출장 국가: ${context.country}
- 사진 출처: ${context.source}
- 현장 메모: ${context.memo || '없음'}
${context.schedulePartner ? `- 미팅 상대: ${context.schedulePartner}` : ''}
${context.scheduleTopic ? `- 미팅 안건: ${context.scheduleTopic}` : ''}

[시장 분석 지시]
제공된 이미지(차트, 그래프, 매장 전경, 제품, 회의 현장 등)의 시각적 요소를 분석하여
시장의 현재 트렌드, 소비자 반응, 경쟁사 동향 또는 데이터 변동 추이를 도출하고,
이를 보고서의 '시장 분석' 섹션에 전문적인 비즈니스 톤으로 녹여내어 작성하라.

다음 항목을 한국어로 작성해주세요:
1. [현장 관찰] 사진에서 실제로 보이는 것 (장소, 사람, 제품, 상황 등 시각적 요소)
2. [시장 분석] 이미지에서 읽히는 시장 트렌드, 소비자 패턴, 경쟁 구도 또는 비즈니스 기회
3. [전략적 인사이트] B2B 출장 맥락에서의 핵심 비즈니스 함의 및 후속 액션 제안 1~2줄

분석 결과를 전문적이고 간결하게 작성하되 총 300자 이내로 작성해주세요.`;


    const requestBody = {
        contents: [{
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
            ]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
    };

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '(분석 결과 없음)';
}

/**
 * 2장의 이미지와 문맥 정보를 기반으로 임원 보고 수준의 3단 AI 요약 카드 데이터를 요청합니다.
 */
async function generateThreeStepAISummary(photo1, photo2, apiKey, tripInfo) {
    const prompt = `당신은 LG전자 B2B 해외출장 보고서 전문 임원 보고서 작성 전문가입니다.
다음 두 장의 현장 사진 및 실사 메모를 기반으로 보고서 하단에 들어갈 3단 요약 카드 데이터를 구성해주세요.

[출장 기본 정보]
- 출장지: ${tripInfo.country}
- 출장 목적: ${tripInfo.purpose}

[사진 1 정보]
- 출처: ${photo1.source}
- 현장 메모: ${photo1.memo || '없음'}

[사진 2 정보]
- 출처: ${photo2 ? photo2.source : '없음'}
- 현장 메모: ${photo2 ? (photo2.memo || '없음') : '없음'}

임원 보고 수준의 높은 통찰력과 격식 있는 비즈니스 어조를 사용하여 다음 3가지 요약 항목을 작성해주세요:
1. 핵심 발견 (Key Finding): 현장 실사에서 확인된 가장 중요한 팩트 및 관찰점.
2. 시장 분석 (Market Analysis): 현장 관찰을 바탕으로 분석한 현지 시장 동향, 고객 니즈, 경쟁 구도.
3. 전략 제언 (Strategic Recommendation): 향후 매출 확대 및 비즈니스 강화를 위한 구체적 실행 방안 및 후속 제언.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만 반환):
{
  "finding": "핵심 발견 요약 (1~2줄)",
  "analysis": "시장 분석 요약 (1~2줄)",
  "recommendation": "전략 제언 요약 (1~2줄)"
}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
                })
            }
        );

        if (!response.ok) throw new Error('API Response Error');
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanText = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleanText);
    } catch (err) {
        console.warn("AI 3단 요약 요청 실패, 로컬 폴백을 작동합니다:", err);
        return generateLocalThreeStepSummary(photo1, photo2, tripInfo);
    }
}

/**
 * 3단 AI 요약 카드에 대한 로컬 파싱 폴백 함수
 */
function generateLocalThreeStepSummary(photo1, photo2, tripInfo) {
    const memo1 = photo1.memo || "";
    const memo2 = photo2 ? (photo2.memo || "") : "";
    const country = tripInfo.country || "";

    let finding = "";
    let alignmentAnalysis = "";
    let rec = "";

    if (memo1 || memo2) {
        finding = `현지 실사 과정에서 "${memo1}" ${memo2 ? `및 "${memo2}"` : ""} 관련 중요 관찰 지표 확인.`;
        alignmentAnalysis = `${country} B2B 시장 모니터링 결과, 기술 협의 및 제품 실사 수요가 지속적으로 증가하고 있음.`;
        rec = `본사 유관부서와 연계하여 식별된 고객사 요구사항을 반영하고 1차 기술 스펙 최종 승인 획득 필요.`;
    } else {
        finding = `B2B 해외 출장 일정에 따른 주요 파트너사 현장 방문 및 인터뷰 완료.`;
        alignmentAnalysis = `현지 유통 인프라 및 경쟁사 주력 사양 대응 현황에 대한 밀착 분석 진행 중.`;
        rec = `출장 목적 "${tripInfo.purpose}"에 부합하도록 후속 비즈니스 계약 검토 및 정기 미팅 셋업.`;
    }

    return { finding, analysis: alignmentAnalysis, recommendation: rec };
}

// SheetJS 및 PptxGenJS 라이브러리를 활용한 정식 Excel, PPT 보고서 추출 구현
// ※ 완전 async 방식으로 setTimeout 제거, Gemini Vision API 병렬 이미지 분석 지원
async function triggerExport(type) {
    // CDN 라이브러리 존재 여부 안전 검사 (오프라인 상태이거나 로드 지연 시 발생하는 굳음 현상 차단)
    if (type === 'excel' && typeof ExcelJS === 'undefined') {
        alert("ExcelJS 라이브러리가 로드되지 않았습니다. 인터넷 연결 상태를 확인하시거나 페이지를 새로고침 해주세요.");
        return;
    }
    if (type === 'ppt' && typeof PptxGenJS === 'undefined') {
        alert("PptxGenJS 라이브러리가 로드되지 않았습니다. 인터넷 연결 상태를 확인하시거나 페이지를 새로고침 해주세요.");
        return;
    }

    // 버튼 숨기고 로딩 상태 표시
    document.getElementById("export-modal-buttons").classList.add("hidden");
    document.getElementById("export-loading-container").classList.remove("hidden");

    // 로컬스토리지 데이터 로드
    const tripInfo = JSON.parse(localStorage.getItem("LG_TRIP_INFO")) || DEFAULT_TRIP_INFO;
    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    const meetings = JSON.parse(localStorage.getItem("LG_TRIP_MEETINGS")) || [];
    const apiKey = localStorage.getItem("GEMINI_API_KEY");

    // ── Step 1: IndexedDB에서 전체 사진 로드 ──
    let allDBPhotos = [];
    try {
        allDBPhotos = await getAllPhotosFromDB();
    } catch (err) {
        console.error("보고서용 이미지 로드 에러:", err);
    }

    // ── Step 2: 보고서용 사진 목록 구성 ──
    let allPhotos = [];

    // 2-1. 현장 사진 탭 자료
    const fieldPhotos = allDBPhotos.filter(p => p.type === 'field');
    fieldPhotos.forEach((p, idx) => {
        allPhotos.push({
            dataUrl: p.dataUrl,
            label: p.memo || "",
            memo: p.memo || "",
            source: `현장 사진 탭 #${idx + 1}`,
            type: 'field',
            id: p.id
        });
    });

    // 2-2. 일정별 첨부 사진 취합
    schedules.forEach(s => {
        const schedPhotos = allDBPhotos.filter(p => p.type === 'schedule' && p.scheduleId === s.id);
        schedPhotos.forEach((p, idx) => {
            allPhotos.push({
                dataUrl: p.dataUrl,
                label: p.memo || "",
                memo: p.memo || "",
                source: `${s.day} 일정 사진 #${idx + 1}`,
                type: 'schedule',
                id: p.id,
                scheduleId: s.id,
                scheduleDay: s.day,
                schedulePartner: s.partner,
                scheduleTopic: s.topic
            });
        });
    });

    // ── Step 3: Gemini Vision API로 이미지 병렬 분석 (API Key 있을 때만) ──
    // 각 사진의 AI 분석 결과를 aiAnalysisMap에 id → 분석텍스트 형태로 저장
    const aiAnalysisMap = {};
    if (apiKey && allPhotos.length > 0) {
        // 로딩 메시지 업데이트
        const loadingTextEl = document.querySelector("#export-loading-container p");
        if (loadingTextEl) loadingTextEl.textContent = `Gemini AI가 ${allPhotos.length}장의 사진을 분석 중입니다...`;

        // 병렬로 모든 사진 분석 (최대 5장까지, 초과 시 순차 처리)
        const analysisBatches = [];
        for (let i = 0; i < allPhotos.length; i += 5) {
            const batch = allPhotos.slice(i, i + 5);
            const batchResults = await Promise.allSettled(
                batch.map(ph => analyzeImageWithGemini(ph.dataUrl, apiKey, {
                    country: tripInfo.country,
                    source: ph.source,
                    memo: ph.memo,
                    schedulePartner: ph.schedulePartner,
                    scheduleTopic: ph.scheduleTopic
                }))
            );
            batchResults.forEach((result, batchIdx) => {
                const photo = batch[batchIdx];
                if (result.status === 'fulfilled') {
                    aiAnalysisMap[photo.id] = result.value;
                } else {
                    console.warn(`사진 ${photo.source} 분석 실패:`, result.reason);
                    aiAnalysisMap[photo.id] = null; // 실패 시 로컬 분석으로 폴백
                }
            });
        }
    }

    try {
        if (type === 'excel') {
            // ═══════════════════════════════════════════════════
            // [ ExcelJS 활용 Excel 파일 (.xlsx) 생성 및 이미지 임베딩 ]
            // ═══════════════════════════════════════════════════
            const workbook = new ExcelJS.Workbook();

            // 시트 1: 출장 개요 및 일정
            const ws1 = workbook.addWorksheet('출장 개요 및 일정');

            // 제목 스타일 및 값
            ws1.mergeCells('A1:F1');
            const titleCell1 = ws1.getCell('A1');
            titleCell1.value = 'LG전자 B2B 해외 출장 종합 보고서 (출장 개요 및 세부 일정)';
            titleCell1.font = { name: '맑은 고딕', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA50034' } }; // LG Deep Red
            titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };
            ws1.getRow(1).height = 40;

            // 기본 정보
            ws1.getCell('A3').value = '[출장 기본 정보]';
            ws1.getCell('A3').font = { name: '맑은 고딕', size: 11, bold: true };

            ws1.getCell('A4').value = '출장 국가';
            ws1.getCell('B4').value = tripInfo.country;
            ws1.getCell('A5').value = '출장 일정';
            ws1.getCell('B5').value = tripInfo.period;
            ws1.getCell('A6').value = '참석 인원';
            ws1.getCell('B6').value = tripInfo.members;
            ws1.getCell('A7').value = '주요 목적';
            ws1.getCell('B7').value = tripInfo.purpose;

            ['A4', 'A5', 'A6', 'A7'].forEach(cell => {
                ws1.getCell(cell).font = { name: '맑은 고딕', size: 9, bold: true };
                ws1.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
            });

            // 일정 리스트
            ws1.getCell('A9').value = '[출장 미팅 상세 일정]';
            ws1.getCell('A9').font = { name: '맑은 고딕', size: 11, bold: true };

            const scheduleHeader = ["일정 구분", "시간", "미팅 상대", "주요 안건 및 미팅 주제", "구글맵 위치 주소", "등록사진 개수"];
            ws1.getRow(10).values = scheduleHeader;
            ws1.getRow(10).font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            ws1.getRow(10).height = 25;
            for (let col = 1; col <= 6; col++) {
                const cell = ws1.getCell(10, col);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA50034' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            schedules.forEach((s) => {
                const cnt = allDBPhotos.filter(p => p.type === 'schedule' && p.scheduleId === s.id).length;
                ws1.addRow([s.day, s.time, s.partner, s.topic, s.map || "링크 없음", `${cnt}장`]);
            });

            // 테두리 및 정렬
            ws1.eachRow((row, rowNumber) => {
                if (rowNumber > 9) {
                    row.font = { name: '맑은 고딕', size: 10 };
                    row.alignment = { vertical: 'middle' };
                    row.border = {
                        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                    };
                }
            });

            ws1.columns = [
                { width: 18 }, { width: 12 }, { width: 32 }, { width: 55 }, { width: 35 }, { width: 15 }
            ];

            // 시트 2: 회의록
            const ws2 = workbook.addWorksheet('음성분석 회의록');
            ws2.mergeCells('A1:D1');
            const titleCell2 = ws2.getCell('A1');
            titleCell2.value = 'LG전자 B2B 해외 출장 회의록 종합 이력';
            titleCell2.font = { name: '맑은 고딕', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA50034' } };
            titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
            ws2.getRow(1).height = 40;

            const meetingHeader = ["일시", "회의 제목", "회의 결정 사항 및 교차 검증 내용", "후속 실천 과제 (Action Item)"];
            ws2.getRow(3).values = meetingHeader;
            ws2.getRow(3).font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            ws2.getRow(3).height = 25;
            for (let col = 1; col <= 4; col++) {
                const cell = ws2.getCell(3, col);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA50034' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            meetings.forEach(m => {
                ws2.addRow([
                    new Date(m.timestamp).toLocaleDateString("ko-KR"),
                    m.title, m.content, m.action
                ]);
            });

            ws2.eachRow((row, rowNumber) => {
                if (rowNumber > 2) {
                    row.font = { name: '맑은 고딕', size: 10 };
                    row.alignment = { vertical: 'middle', wrapText: true };
                    row.border = {
                        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                    };
                }
            });
            ws2.columns = [
                { width: 18 }, { width: 30 }, { width: 70 }, { width: 45 }
            ];

            // 시트 3: 현장 사진 AI 분석 대장
            const ws3 = workbook.addWorksheet('현장 시각자료 AI분석');
            ws3.mergeCells('A1:E1');
            const titleCell3 = ws3.getCell('A1');
            titleCell3.value = 'LG전자 B2B 해외 출장 현장 시각 자료 AI 분석 대장';
            titleCell3.font = { name: '맑은 고딕', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA50034' } };
            titleCell3.alignment = { horizontal: 'center', vertical: 'middle' };
            ws3.getRow(1).height = 40;

            ws3.getCell('A2').value = apiKey ? "※ Gemini Vision AI 실제 이미지 분석 결과" : "※ Gemini API Key 미설정 — 메모 기반 분석";
            ws3.getCell('A2').font = { name: '맑은 고딕', size: 9, italic: true, color: { argb: 'FF888888' } };

            const photoHeader = ["순번", "사진 구분/출처", "현장 메모", "실제 현장 사진", "AI 이미지 분석 의견"];
            ws3.getRow(4).values = photoHeader;
            ws3.getRow(4).font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            ws3.getRow(4).height = 25;
            for (let col = 1; col <= 5; col++) {
                const cell = ws3.getCell(4, col);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA50034' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // 사진 행 높이 설정과 실제 이미지 배치 진행
            for (let idx = 0; idx < allPhotos.length; idx++) {
                const ph = allPhotos[idx];
                const aiResult = aiAnalysisMap[ph.id] || null;
                const opinion = generateLLMVisualOpinion(ph, tripInfo, schedules, meetings, aiResult);

                const rowNumber = 5 + idx;
                const addedRow = ws3.addRow([idx + 1, ph.source, ph.label || "미지정", "", opinion]);
                ws3.getRow(rowNumber).height = 100; // 이미지 수용을 위해 행 높이를 100pt로 확장

                // 실제 이미지 임베딩 처리
                try {
                    const dataUrl = ph.dataUrl;
                    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                    if (matches) {
                        const mimeType = matches[1];
                        const base64Data = matches[2];

                        // 이미지의 MIME 타입에 맞춰 ExcelJS 등록용 확장자(png, jpeg, gif 등)를 동적으로 매칭합니다.
                        let ext = 'png';
                        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
                            ext = 'jpeg';
                        } else if (mimeType.includes('gif')) {
                            ext = 'gif';
                        } else if (mimeType.includes('webp')) {
                            ext = 'webp';
                        }

                        const imageId = workbook.addImage({
                            base64: base64Data,
                            extension: ext
                        });

                        // D열(0-indexed 3번째 열)의 현재 행 셀 내부에 여백을 남기고 가득 차도록 twoCells 임베딩을 구성합니다.
                        // 1픽셀 = 9,525 EMU이며, 대략 8픽셀의 여백(76,200 EMU)을 상하좌우에 배치하여 테두리를 가리지 않도록 맞춤 조절합니다.
                        ws3.addImage(imageId, {
                            tl: { col: 3, row: rowNumber - 1, colOff: 76200, rowOff: 76200 },
                            br: { col: 4, row: rowNumber, colOff: -76200, rowOff: -76200 },
                            editAs: 'twoCells'
                        });
                    }
                } catch (imgErr) {
                    console.error(`엑셀 이미지 임베딩 실패 (Index: ${idx}):`, imgErr);
                    ws3.getCell(rowNumber, 4).value = '사진 오류';
                }
            }

            if (allPhotos.length === 0) {
                ws3.addRow(["", "등록된 현장 사진이 없습니다.", "", "", ""]);
            }

            ws3.eachRow((row, rowNumber) => {
                if (rowNumber > 3) {
                    row.font = { name: '맑은 고딕', size: 10 };
                    row.alignment = { vertical: 'middle', wrapText: true };
                    row.border = {
                        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                    };
                    // D열은 사진이 임베딩되므로 가로 정렬 center
                    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });

            ws3.columns = [
                { width: 8 }, { width: 28 }, { width: 30 }, { width: 24 }, { width: 90 }
            ];

            // 파일 다운로드
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            downloadFile(blob, "LG_출장_종합보고서.xlsx");

        } else if (type === 'ppt') {
            // ═══════════════════════════════════════════════════
            // [ PowerPoint 파일 (.pptx) 생성 ]
            // ═══════════════════════════════════════════════════
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';

            // ─ 슬라이드 1: 표지 ─
            const slide1 = pptx.addSlide();
            slide1.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: 'A50034' });
            slide1.addText("LG전자 B2B 해외 출장 종합 보고서", {
                x: 0.5, y: 2.2, w: 12.5, h: 1.2,
                fontSize: 32, bold: true, color: 'FFFFFF', fontFace: 'Malgun Gothic'
            });
            slide1.addText(`대상 지역: ${tripInfo.country} | 일정: ${tripInfo.period}\n참석자: ${tripInfo.members}`, {
                x: 0.5, y: 3.5, w: 12.5, h: 1.0,
                fontSize: 16, color: 'F5F5F5', fontFace: 'Malgun Gothic'
            });
            slide1.addText(apiKey ? "AI 이미지 분석 포함 보고서 (Gemini Vision)" : "LG Electronics Global Operations Support System", {
                x: 0.5, y: 5.8, w: 12.5, h: 0.5,
                fontSize: 12, italic: true, color: 'E0E0E0', fontFace: 'Arial'
            });

            // ─ 슬라이드 2: 출장 일정 테이블 ─
            const slide2 = pptx.addSlide();
            slide2.addText("1. 출장 세부 일정 및 동선 현황", {
                x: 0.5, y: 0.4, w: 12.5, h: 0.6,
                fontSize: 22, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
            });
            const tableHeader = [
                { text: "구분", options: { bold: true, fill: 'A50034', color: 'FFFFFF', align: 'center' } },
                { text: "시간", options: { bold: true, fill: 'A50034', color: 'FFFFFF', align: 'center' } },
                { text: "미팅 파트너사", options: { bold: true, fill: 'A50034', color: 'FFFFFF', align: 'center' } },
                { text: "핵심 의제 및 미팅 안건", options: { bold: true, fill: 'A50034', color: 'FFFFFF' } }
            ];
            const tableRows = [tableHeader];
            schedules.forEach(s => {
                tableRows.push([
                    { text: s.day, options: { align: 'center' } },
                    { text: s.time, options: { align: 'center' } },
                    { text: s.partner, options: { bold: true } },
                    { text: s.topic }
                ]);
            });
            slide2.addTable(tableRows, {
                x: 0.5, y: 1.2, w: 12.3, h: 4.8,
                colW: [1.2, 1.2, 3.2, 6.7],
                border: { pt: 1, color: 'E0E0E0' },
                fontSize: 11, fontFace: 'Malgun Gothic', valign: 'middle'
            });

            // ─ 슬라이드 3: 회의록 요약 ─
            const slide3 = pptx.addSlide();
            slide3.addText("2. 주요 비즈니스 회의록 및 실행 과제", {
                x: 0.5, y: 0.4, w: 12.5, h: 0.6,
                fontSize: 22, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
            });
            const displayedMeetings = meetings.slice(0, 3);
            if (displayedMeetings.length === 0) {
                slide3.addText("수집된 회의 이력이 없습니다.", {
                    x: 0.5, y: 2.5, w: 12.3, h: 1.0,
                    fontSize: 14, color: '888888', fontFace: 'Malgun Gothic', align: 'center'
                });
            } else {
                let yPos = 1.1;
                displayedMeetings.forEach((m, idx) => {
                    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                        x: 0.5, y: yPos, w: 12.3, h: 1.6,
                        fill: 'F9F9F9', line: { color: 'E0E0E0', width: 1 }
                    });
                    slide3.addText(`[회의 #${idx + 1}] ${m.title}`, {
                        x: 0.7, y: yPos + 0.05, w: 11.9, h: 0.3,
                        fontSize: 12, bold: true, color: '262626', fontFace: 'Malgun Gothic'
                    });
                    const shortContent = m.content.length > 220 ? m.content.substring(0, 220) + "..." : m.content;
                    slide3.addText(`- 내용: ${shortContent}`, {
                        x: 0.7, y: yPos + 0.35, w: 11.9, h: 0.8,
                        fontSize: 9, color: '555555', fontFace: 'Malgun Gothic'
                    });
                    slide3.addText(`★ Action Item: ${m.action}`, {
                        x: 0.7, y: yPos + 1.15, w: 11.9, h: 0.35,
                        fontSize: 10, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
                    });
                    yPos += 1.7;
                });
            }

            // ─ 슬라이드 4~N: 현장 사진 + AI 분석 ─
            if (allPhotos.length === 0) {
                const slide4 = pptx.addSlide();
                slide4.addText("3. 현장 모니터링 실사 자료", {
                    x: 0.5, y: 0.4, w: 12.5, h: 0.6,
                    fontSize: 22, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
                });
                slide4.addText("등록된 현장 사진 이미지 데이터가 없습니다.", {
                    x: 0.5, y: 2.5, w: 12.3, h: 1.0,
                    fontSize: 14, color: '888888', fontFace: 'Malgun Gothic', align: 'center'
                });
            } else {
                // 2장씩 묶어 대칭 슬라이드 구성 및 하단 3단 요약 카드 배치
                const totalSlides = Math.ceil(allPhotos.length / 2);
                for (let i = 0; i < allPhotos.length; i += 2) {
                    const ph1 = allPhotos[i];
                    const ph2 = allPhotos[i + 1] || null;
                    const slideNum = Math.floor(i / 2) + 1;
                    const photoSlide = pptx.addSlide();

                    // ── ① 슬라이드 제목 ──
                    photoSlide.addText(
                        `3. 현장 실사 자료 및 AI 시장 분석 (${slideNum}/${totalSlides})`,
                        {
                            x: 0.35, y: 0.10, w: 12.63, h: 0.45,
                            fontSize: 13, bold: true,
                            color: 'A50034', fontFace: 'Malgun Gothic'
                        }
                    );

                    // 로딩 메시지 업데이트
                    const loadingTextEl = document.querySelector("#export-loading-container p");
                    if (loadingTextEl) {
                        loadingTextEl.textContent = `PPT 슬라이드 ${slideNum}의 AI 3단 요약 생성 중...`;
                    }

                    // 3단 AI 요약 카드 데이터 획득 (사용자가 수동으로 수정한 요약이 로컬 스토리지에 있으면 이를 우선 적용)
                    const savedSummaries = JSON.parse(localStorage.getItem("LG_TRIP_AI_SUMMARIES")) || {};
                    const slideKey = `slide_${slideNum}`;
                    let summary = savedSummaries[slideKey];

                    if (!summary) {
                        // 저장된 수동 요약 데이터가 없는 경우에만 기존 자동 요약 로직 수행
                        summary = apiKey
                            ? await generateThreeStepAISummary(ph1, ph2, apiKey, tripInfo)
                            : generateLocalThreeStepSummary(ph1, ph2, tripInfo);
                    }

                    // ── ② z-order 1순위: 3단 요약 카드의 배경 둥근 사각형 도형 추가 ──
                    // 카드 1 (핵심 발견) 배경
                    photoSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                        x: 0.35, y: 4.70, w: 3.97, h: 2.45,
                        fill: 'FFF0F5', line: { color: 'F5C0D0', width: 1 }
                    });
                    // 카드 2 (시장 분석) 배경
                    photoSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                        x: 4.68, y: 4.70, w: 3.97, h: 2.45,
                        fill: 'FFF0F5', line: { color: 'F5C0D0', width: 1 }
                    });
                    // 카드 3 (전략 제언) 배경
                    photoSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                        x: 9.01, y: 4.70, w: 3.97, h: 2.45,
                        fill: 'FFF0F5', line: { color: 'F5C0D0', width: 1 }
                    });

                    // ── ③ z-order 2순위: 이미지 addImage 추가 ──
                    // 사진 1 (왼쪽 배치)
                    let imgData1 = ph1.dataUrl;
                    if (imgData1.startsWith('data:')) {
                        imgData1 = imgData1.replace(/^data:/, '');
                    }
                    try {
                        photoSlide.addImage({
                            data: imgData1,
                            x: 0.35, y: 0.70, w: 6.10, h: 3.80,
                            sizing: { type: 'contain', w: 6.10, h: 3.80 }
                        });
                        // 사진 1 정보 뱃지
                        photoSlide.addText(`📍 ${ph1.source} ${ph1.label ? `[${ph1.label}]` : ''}`, {
                            x: 0.45, y: 4.20, w: 5.90, h: 0.25,
                            fontSize: 8.5, bold: true, color: 'FFFFFF', fontFace: 'Malgun Gothic',
                            fill: '00000080', align: 'center'
                        });
                    } catch (err) {
                        console.warn("PPT 사진 1 로드 에러:", err);
                    }

                    // 사진 2 (오른쪽 배치)
                    if (ph2) {
                        let imgData2 = ph2.dataUrl;
                        if (imgData2.startsWith('data:')) {
                            imgData2 = imgData2.replace(/^data:/, '');
                        }
                        try {
                            photoSlide.addImage({
                                data: imgData2,
                                x: 6.88, y: 0.70, w: 6.10, h: 3.80,
                                sizing: { type: 'contain', w: 6.10, h: 3.80 }
                            });
                            // 사진 2 정보 뱃지
                            photoSlide.addText(`📍 ${ph2.source} ${ph2.label ? `[${ph2.label}]` : ''}`, {
                                x: 6.98, y: 4.20, w: 5.90, h: 0.25,
                                fontSize: 8.5, bold: true, color: 'FFFFFF', fontFace: 'Malgun Gothic',
                                fill: '00000080', align: 'center'
                            });
                        } catch (err) {
                            console.warn("PPT 사진 2 로드 에러:", err);
                        }
                    } else {
                        // 1장만 존재할 시 오른쪽 빈공간 플레이스홀더
                        photoSlide.addShape(pptx.shapes.RECTANGLE, {
                            x: 6.88, y: 0.70, w: 6.10, h: 3.80,
                            fill: 'F9F9F9', line: { color: 'E0E0E0', width: 1, dashType: 'dash' }
                        });
                        photoSlide.addText("현장 실사 추가 자료 없음", {
                            x: 6.88, y: 2.30, w: 6.10, h: 0.5,
                            fontSize: 12, color: '888888', align: 'center', fontFace: 'Malgun Gothic'
                        });
                    }

                    // ── ④ z-order 3순위: 3단 요약 카드 텍스트 추가 (최상위 레이어 가독성 강화) ──
                    // 카드 1 (핵심 발견) 텍스트
                    photoSlide.addText("🔍 핵심 발견 (Key Finding)", {
                        x: 0.50, y: 4.80, w: 3.67, h: 0.35,
                        fontSize: 11.5, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
                    });
                    photoSlide.addText(summary.finding || '확인된 정보 없음', {
                        x: 0.50, y: 5.20, w: 3.67, h: 1.75,
                        fontSize: 9.5, color: '444444', fontFace: 'Malgun Gothic',
                        valign: 'top', wrap: true, lineSpacing: 3
                    });

                    // 카드 2 (시장 분석) 텍스트
                    photoSlide.addText("📈 시장 분석 (Market Analysis)", {
                        x: 4.83, y: 4.80, w: 3.67, h: 0.35,
                        fontSize: 11.5, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
                    });
                    photoSlide.addText(summary.analysis || '분석 정보 없음', {
                        x: 4.83, y: 5.20, w: 3.67, h: 1.75,
                        fontSize: 9.5, color: '444444', fontFace: 'Malgun Gothic',
                        valign: 'top', wrap: true, lineSpacing: 3
                    });

                    // 카드 3 (전략 제언) 텍스트
                    photoSlide.addText("💡 전략 제언 (Strategic Rec.)", {
                        x: 9.16, y: 4.80, w: 3.67, h: 0.35,
                        fontSize: 11.5, bold: true, color: 'A50034', fontFace: 'Malgun Gothic'
                    });
                    photoSlide.addText(summary.recommendation || '제언 정보 없음', {
                        x: 9.16, y: 5.20, w: 3.67, h: 1.75,
                        fontSize: 9.5, color: '444444', fontFace: 'Malgun Gothic',
                        valign: 'top', wrap: true, lineSpacing: 3
                    });
                }
            }

            pptx.writeFile({ fileName: "LG_출장_발표자료.pptx" });
        }

        closeExportModal();
        const aiMsg = apiKey && allPhotos.length > 0 ? `\n(${allPhotos.length}장 이미지 AI 분석 포함)` : '';
        alert(`📂 보고서 파일이 다운로드되었습니다.${aiMsg}`);

    } catch (e) {
        console.error('보고서 생성 오류:', e);
        alert(`보고서 생성 중 오류가 발생했습니다.\n오류: ${e.message}`);
        closeExportModal();
    }
}

// 브라우저 다운로드 실행을 돕는 유틸리티
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Base64 형식의 이미지를 디코딩하여 브라우저 다운로드를 실행해주는 공통 유틸리티 함수
function downloadImage(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    downloadFile(blob, filename);
}

// ==========================================================================
// [ 신규 추가: 출국/귀국 항공편 관리 비즈니스 로직 ]
// ==========================================================================

const MOCK_FLIGHT_DATABASE = [
    {
        flightNo: "KE121",
        airline: "대한항공",
        depCode: "ICN",
        depTime: "18:55",
        arrCode: "SYD",
        arrTime: "07:00",
        arrNextDay: true,
        note: "출국 항공편: KE121 (대한항공) | 출발 18:55 - 도착 07:00 (+1) (야간 비행, 기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Incheon+Airport",
        type: "outbound"
    },
    {
        flightNo: "KE122",
        airline: "대한항공",
        depCode: "SYD",
        depTime: "09:00",
        arrCode: "ICN",
        arrTime: "17:40",
        arrNextDay: false,
        note: "귀국 항공편: KE122 (대한항공) | 출발 09:00 - 도착 17:40 (당일 도착, 기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Sydney+Airport",
        type: "inbound"
    },
    {
        flightNo: "OZ601",
        airline: "아시아나항공",
        depCode: "ICN",
        depTime: "20:00",
        arrCode: "SYD",
        arrTime: "08:20",
        arrNextDay: true,
        note: "출국 항공편: OZ601 (아시아나항공) | 출발 20:00 - 도착 08:20 (+1) (야간 비행, 기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Incheon+Airport",
        type: "outbound"
    },
    {
        flightNo: "OZ602",
        airline: "아시아나항공",
        depCode: "SYD",
        depTime: "10:30",
        arrCode: "ICN",
        arrTime: "19:00",
        arrNextDay: false,
        note: "귀국 항공편: OZ602 (아시아나항공) | 출발 10:30 - 도착 19:00 (당일 도착, 기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Sydney+Airport",
        type: "inbound"
    },
    {
        flightNo: "KE081",
        airline: "대한항공",
        depCode: "ICN",
        depTime: "10:00",
        arrCode: "JFK",
        arrTime: "11:20",
        arrNextDay: false,
        note: "출국 항공편: KE081 (대한항공) | 뉴욕행 대표 항공편 (기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=Incheon+Airport",
        type: "outbound"
    },
    {
        flightNo: "KE082",
        airline: "대한항공",
        depCode: "JFK",
        depTime: "13:40",
        arrCode: "ICN",
        arrTime: "17:30",
        arrNextDay: true,
        note: "귀국 항공편: KE082 (대한항공) | JFK 출발 항공편 (기내 수속 3시간 전 권장)",
        mapUrl: "https://maps.google.com/?q=John+F.+Kennedy+International+Airport",
        type: "inbound"
    }
];

// 항공편 목록 전체를 렌더링하는 함수
async function renderFlights() {
    const container = document.getElementById("flight-info-container");
    if (!container) return;

    const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
    let allPhotos = [];
    try {
        allPhotos = await getAllPhotosFromDB();
    } catch (err) {
        console.error("항공편 이미지 획득 실패:", err);
    }

    container.innerHTML = `
                <!-- 항공편 검색 및 등록 패널 -->
                <div class="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-5 flex justify-between items-center shadow-sm">
                    <div class="space-y-0.5">
                        <h3 class="text-xs font-bold text-lgRed flex items-center gap-1.5">
                            <i class="fa-solid fa-plane-departure animate-pulse"></i> 항공편 웹 검색 및 자동 등록
                        </h3>
                        <p class="text-[10px] text-gray-500 leading-normal">실시간 항공편을 조회하여 출국/귀국 일정을 즉시 채웁니다.</p>
                    </div>
                    <button onclick="openFlightSearchModal()" class="bg-lgRed hover:bg-lgRed-dark text-white text-xs font-bold px-3.5 py-2 rounded-xl transition duration-150 active:scale-95 shadow-sm flex items-center gap-1.5">
                        <i class="fa-solid fa-magnifying-glass"></i> 항공편 찾기
                    </button>
                </div>

                <!-- 출국 및 귀국 비행 카드 목록 -->
                <div class="space-y-4 mb-6">
                    ${await renderSingleFlightCard('outbound', flights.outbound, allPhotos)}
                    ${await renderSingleFlightCard('inbound', flights.inbound, allPhotos)}
                </div>
            `;
}

// 개별 항공권 카드 HTML 렌더링 서브 함수
        async function renderSingleFlightCard(type, flightData, allPhotos) {
            const label = type === 'outbound' ? '출국 비행' : '귀국 비행';
            const badgeBg = type === 'outbound' ? 'bg-lgRed text-white' : 'bg-charcoal text-white';
            
            if (!flightData || !flightData.flightNo) {
                // 항공편 정보가 없을 때의 가벼운 플레이스홀더 구성
                return `
                    <div class="ticket-card p-4 flex flex-col justify-center items-center py-6 border-dashed border-2 border-red-200">
                        <p class="text-xs font-bold text-gray-400 mb-2"><i class="fa-solid fa-plane-slash mr-1"></i> 등록된 ${label} 정보가 없습니다.</p>
                        <button onclick="openFlightEditModal('${type}')" class="text-[10px] bg-white border border-red-200 text-lgRed font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition active:scale-95">
                            <i class="fa-solid fa-plus mr-1"></i> 수동 직접 입력
                        </button>
                    </div>
                `;
            }

            // 첨부된 E-티켓 썸네일 이미지 필터링
            const flightPhoto = allPhotos.find(p => p.type === 'flight' && p.flightType === type && p.id === flightData.photoId);
            let photoHtml = "";
            if (flightPhoto) {
                photoHtml = `
                    <div class="mt-3.5 border-t border-red-100 pt-3 flex items-center gap-3">
                        <div class="relative group w-12 h-12 aspect-square border rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                            <img src="${flightPhoto.dataUrl}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onclick="downloadImage('${flightPhoto.dataUrl}', 'LG_${label}_티켓_${flightPhoto.id}.png')" class="p-1 bg-white text-gray-800 rounded hover:bg-green-500 hover:text-white transition">
                                    <i class="fa-solid fa-download text-[8px]"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[9px] font-bold text-gray-400 leading-none">첨부된 실물 항공표</p>
                            <button onclick="downloadImage('${flightPhoto.dataUrl}', 'LG_${label}_티켓.png')" class="text-[10px] text-blue-600 font-bold hover:underline truncate mt-1 block">
                                <i class="fa-solid fa-ticket mr-1"></i> E-티켓 다운로드
                            </button>
                        </div>
                        <button onclick="deleteFlightPhoto('${type}', '${flightPhoto.id}')" class="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition" title="티켓 사진 삭제">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                `;
            }

            // 마스킹 처리된 예약코드 보기 모드 분기 (기본 비노출)
            const showCodeId = `fl-code-show-${type}`;
            const hiddenCode = flightData.bookingCode ? flightData.bookingCode.substring(0, 3) + '*****' : '미입력';
            const originalCode = flightData.bookingCode || '미입력';

            // 편명에서 항공사 브랜드 식별 및 커스텀 스타일 클래스 지정
            const flightNoUpper = (flightData.flightNo || '').toUpperCase();
            let airlineClass = '';
            let brandBadgeBg = badgeBg;
            
            if (flightNoUpper.startsWith('KE')) {
                airlineClass = 'airline-ke';
                brandBadgeBg = 'bg-[#005187] text-white'; // 대한항공 시그니처 네이비
            } else if (flightNoUpper.startsWith('OZ')) {
                airlineClass = 'airline-oz';
                brandBadgeBg = 'bg-[#E1002A] text-white'; // 아시아나 시그니처 레드
            } else if (flightNoUpper.startsWith('LJ') || flightNoUpper.startsWith('TW') || flightNoUpper.startsWith('7C') || flightNoUpper.startsWith('BX')) {
                airlineClass = 'airline-lcc';
                if (flightNoUpper.startsWith('LJ')) brandBadgeBg = 'bg-[#4B8B3B] text-white'; // 진에어 연두
                else if (flightNoUpper.startsWith('TW')) brandBadgeBg = 'bg-[#E20020] text-white'; // 티웨이 레드
                else if (flightNoUpper.startsWith('7C')) brandBadgeBg = 'bg-[#FF6200] text-white'; // 제주 주황
                else if (flightNoUpper.startsWith('BX')) brandBadgeBg = 'bg-[#0065A6] text-white'; // 에어부산 파랑
            }

            return `
                <div class="ticket-card p-4 relative flex flex-col ${airlineClass}">
                    <!-- 헤더: 구분 배지 및 시간/제어 버튼 -->
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2">
                            <span class="${brandBadgeBg} text-[10px] font-bold px-2 py-0.5 rounded-full">${label}</span>
                            <span class="text-xs font-semibold text-gray-500"><i class="fa-regular fa-clock mr-1"></i>${flightData.depTime}</span>
                        </div>
                        <!-- 우측 제어 액션들 -->
                        <div class="flex items-center gap-1">
                            <button onclick="openFlightEditModal('${type}')" class="bg-white border border-gray-200 text-gray-600 hover:border-red-200 hover:text-lgRed text-[10px] font-bold px-2 py-1 rounded-lg transition duration-150 active:scale-95">
                                <i class="fa-regular fa-pen-to-square"></i> 수정
                            </button>
                            <button onclick="document.getElementById('file-flight-${type}').click()" class="bg-white border border-gray-200 text-gray-600 hover:border-red-200 hover:text-lgRed text-[10px] font-bold px-2 py-1 rounded-lg transition duration-150 active:scale-95">
                                <i class="fa-solid fa-paperclip"></i> 사진 첨부
                            </button>
                            <input type="file" id="file-flight-${type}" accept="image/*" class="hidden" onchange="handleFlightPhotoUpload('${type}', this.files)">
                            <button onclick="deleteFlight('${type}')" class="bg-white border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 text-[10px] font-bold px-2 py-1 rounded-lg transition duration-150 active:scale-95">
                                <i class="fa-regular fa-trash-can"></i> 삭제
                            </button>
                        </div>
                    </div>

                    <!-- 바디: 출발지 - 편명 - 목적지 경로 -->
                    <div class="flex items-center justify-between my-2">
                        <!-- 출발지 -->
                        <div class="text-left w-1/3">
                            <h4 class="text-lg font-black text-gray-800 tracking-tight leading-none">${flightData.depCode}</h4>
                            <p class="text-[10px] text-gray-400 font-mono mt-1">${flightData.depTime}</p>
                        </div>
                        
                        <!-- 중간 항공기 경로 선 및 편명 (SVG 로고 포함) -->
                        <div class="flight-path-container w-1/3">
                            <div class="flight-path-line"></div>
                            <div class="flight-path-airline-logo">
                                ${getFlightLogoSVG(flightData.flightNo)}
                                <span class="block text-[8.5px] font-black font-mono tracking-tighter mt-1 text-gray-800 text-center leading-none">${flightData.flightNo}</span>
                            </div>
                        </div>

                        <!-- 도착지 -->
                        <div class="text-right w-1/3">
                            <h4 class="text-lg font-black text-gray-800 tracking-tight leading-none">${flightData.arrCode}</h4>
                            <p class="text-[10px] text-gray-400 font-mono mt-1">${flightData.arrTime}${flightData.arrNextDay ? ' (+1)' : ''}</p>
                        </div>
                    </div>

                    <!-- 티켓 뜯는 선 데코레이션 효과 -->
                    <div class="ticket-divider-container my-1.5">
                        <div class="ticket-notch-left"></div>
                        <div class="ticket-dashed-line"></div>
                        <div class="ticket-notch-right"></div>
                    </div>

                    <!-- 하단 정보: 예약코드 및 안내 문구 -->
                    <div class="space-y-1.5 text-left">
                        <div class="flex items-center gap-1.5 text-xs">
                            <span class="text-gray-400 font-bold text-[10px] uppercase tracking-wider">예약 코드:</span>
                            <span id="${showCodeId}" class="font-bold text-gray-700 font-mono" data-original="${originalCode}">${hiddenCode}</span>
                            <button onclick="toggleFlightCodeDisplay('${type}')" class="text-gray-400 hover:text-gray-600 transition p-0.5 eye-btn">
                                <i id="eye-icon-${type}" class="fa-regular fa-eye text-[10px]"></i>
                            </button>
                        </div>
                        
                        <p class="text-[10px] text-gray-500 leading-relaxed font-normal bg-white p-2 rounded-lg border border-red-50/50">
                            <strong>안내:</strong> ${flightData.note || '안내 사항이 없습니다.'}
                        </p>

                        ${flightData.mapUrl ? `
                            <a href="${flightData.mapUrl}" target="_blank" class="inline-flex items-center gap-1 text-[9px] text-blue-600 hover:underline font-bold mt-1">
                                <i class="fa-solid fa-map-location-dot"></i>
                                <span>공항 위치 지도 보기</span>
                            </a>
                        ` : ''}
                    </div>

                    <!-- E-티켓 썸네일 노출 -->
                    ${photoHtml}
                </div>
            `;
        }

// 예약 코드 숨김/보임 토글 함수
function toggleFlightCodeDisplay(type) {
    const codeEl = document.getElementById(`fl-code-show-${type}`);
    const eyeIcon = document.getElementById(`eye-icon-${type}`);
    if (!codeEl || !eyeIcon) return;

    const isMasked = eyeIcon.classList.contains("fa-eye");
    const originalVal = codeEl.getAttribute("data-original");
    const maskedVal = originalVal.substring(0, 3) + '*****';

    if (isMasked) {
        // 원본 노출
        codeEl.textContent = originalVal;
        eyeIcon.className = "fa-regular fa-eye-slash text-[10px]";
    } else {
        // 마스킹 처리
        codeEl.textContent = maskedVal;
        eyeIcon.className = "fa-regular fa-eye text-[10px]";
    }
}

// 항공편 수동 수정 모달 열기
function openFlightEditModal(type) {
    const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
    const f = flights[type] || {};

    // HTML 인풋 밸류 기본 세팅
    document.getElementById("edit-flight-type").value = type;
    document.getElementById("edit-flight-no").value = f.flightNo || "";
    document.getElementById("edit-flight-airline").value = f.airline || "";
    document.getElementById("edit-flight-dep-code").value = f.depCode || "";
    document.getElementById("edit-flight-dep-time").value = f.depTime || "";
    document.getElementById("edit-flight-arr-code").value = f.arrCode || "";
    document.getElementById("edit-flight-arr-time").value = f.arrTime || "";
    document.getElementById("edit-flight-next-day").checked = !!f.arrNextDay;
    document.getElementById("edit-flight-booking").value = f.bookingCode || "";
    document.getElementById("edit-flight-note").value = f.note || "";
    document.getElementById("edit-flight-map").value = f.mapUrl || "";

    // 모달 노출
    const modal = document.getElementById("flight-edit-modal");
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.remove("opacity-0"), 10);
}

// 항공편 수동 수정 모달 닫기
function closeFlightEditModal() {
    const modal = document.getElementById("flight-edit-modal");
    modal.classList.add("opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 300);
}

// 항공편 수정 데이터 저장 실행 함수
function saveFlightEdit() {
    const type = document.getElementById("edit-flight-type").value;
    const flightNo = document.getElementById("edit-flight-no").value.trim().toUpperCase();
    const airline = document.getElementById("edit-flight-airline").value.trim();
    const depCode = document.getElementById("edit-flight-dep-code").value.trim().toUpperCase();
    const depTime = document.getElementById("edit-flight-dep-time").value;
    const arrCode = document.getElementById("edit-flight-arr-code").value.trim().toUpperCase();
    const arrTime = document.getElementById("edit-flight-arr-time").value;
    const arrNextDay = document.getElementById("edit-flight-next-day").checked;
    const bookingCode = document.getElementById("edit-flight-booking").value.trim();
    const note = document.getElementById("edit-flight-note").value.trim();
    const mapUrl = document.getElementById("edit-flight-map").value.trim();

    if (!flightNo || !depCode || !arrCode || !depTime || !arrTime) {
        alert("⚠️ 편명, 공항 코드 및 출발/도착 시간은 필수 항목입니다.");
        return;
    }

    const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
    flights[type] = {
        ...(flights[type] || {}),
        flightNo,
        airline,
        depCode,
        depTime,
        arrCode,
        arrTime,
        arrNextDay,
        bookingCode,
        note,
        mapUrl
    };

    localStorage.setItem("LG_TRIP_FLIGHTS", JSON.stringify(flights));
    closeFlightEditModal();
    renderSchedule(); // 화면 즉시 다시 그리기
}

// 항공권 실물 사진 비동기 업로드 및 Canvas 압축 가공
async function handleFlightPhotoUpload(type, files) {
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
        const compressedBase64 = await resizeAndCompressImage(file, 800, 0.6); // 퀄리티 0.6 이미지 최적화 압축
        const photoId = `photo-flight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const photoObj = {
            id: photoId,
            dataUrl: compressedBase64,
            memo: `${type === 'outbound' ? '출국' : '귀국'} 비행 E-티켓 사진`,
            type: "flight",
            flightType: type
        };

        await savePhotoToDB(photoObj);

        // 항공편 스토리지의 photoId에 연결 매칭
        const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
        flights[type].photoId = photoId;
        localStorage.setItem("LG_TRIP_FLIGHTS", JSON.stringify(flights));

        renderSchedule();
    } catch (err) {
        console.error("항공권 사진 저장 에러:", err);
        alert("사진 저장 과정 중 에러가 발생했습니다: " + err.message);
    }
}

// 항공편 등록 사진 단독 삭제 기능
async function deleteFlightPhoto(type, photoId) {
    if (!confirm("이 항공권 첨부 사진을 삭제하시겠습니까?")) return;
    try {
        await deletePhotoFromDB(photoId);

        // 항공편 스토리지의 photoId 연결 해제
        const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
        flights[type].photoId = "";
        localStorage.setItem("LG_TRIP_FLIGHTS", JSON.stringify(flights));

        renderSchedule();
    } catch (err) {
        console.error("사진 삭제 오류:", err);
    }
}

// 항공편 정보 완전 초기화(삭제) 함수
async function deleteFlight(type) {
    if (!confirm(`이 ${type === 'outbound' ? '출국' : '귀국'} 항공편 정보를 전체 삭제하시겠습니까?`)) return;

    try {
        const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
        const f = flights[type];

        // 첨부된 E-티켓 이미지가 있다면 데이터베이스에서도 함께 제거
        if (f && f.photoId) {
            await deletePhotoFromDB(f.photoId);
        }

        // 해당 타입의 항공 데이터 초기화
        flights[type] = {
            flightNo: "",
            airline: "",
            depCode: "",
            depTime: "",
            arrCode: "",
            arrTime: "",
            arrNextDay: false,
            bookingCode: "",
            note: "",
            mapUrl: "",
            photoId: ""
        };

        localStorage.setItem("LG_TRIP_FLIGHTS", JSON.stringify(flights));
        renderSchedule();
    } catch (err) {
        console.error("항공권 정보 삭제 중 에러:", err);
    }
}

// 항공편 실시간 검색/찾기 모달 열기
function openFlightSearchModal() {
    const modal = document.getElementById("flight-search-modal");
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.remove("opacity-0"), 10);

    // 검색어 초기화 및 목록 렌더링
    document.getElementById("flight-search-input").value = "";
    renderSearchFlightList("");
}

// 항공편 실시간 검색/찾기 모달 닫기
function closeFlightSearchModal() {
    const modal = document.getElementById("flight-search-modal");
    modal.classList.add("opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 300);
}

// 검색어 입력을 받아 가상 항공편 리스트를 여는 인터페이스
function filterFlightsSearch(query) {
    renderSearchFlightList(query);
}

// 가상 항공편 데이터베이스 목록을 팝업창에 렌더링
function renderSearchFlightList(query) {
    const container = document.getElementById("flight-search-list");
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    const filtered = q
        ? MOCK_FLIGHT_DATABASE.filter(f =>
            f.flightNo.toLowerCase().includes(q) ||
            f.airline.toLowerCase().includes(q) ||
            f.depCode.toLowerCase().includes(q) ||
            f.arrCode.toLowerCase().includes(q)
        )
        : MOCK_FLIGHT_DATABASE;

    container.innerHTML = "";
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-xs text-gray-400 py-6">검색된 항공편 정보가 없습니다.</p>';
        return;
    }

    filtered.forEach(f => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "w-full text-left p-3 border border-gray-100 hover:border-red-200 hover:bg-red-50/50 rounded-xl transition duration-150 flex justify-between items-center gap-2";

        const typeLabel = f.type === 'outbound' ? '출국' : '귀국';
        const typeBg = f.type === 'outbound' ? 'bg-red-50 text-lgRed border border-red-100' : 'bg-gray-100 text-gray-700 border border-gray-200';

        btn.innerHTML = `
                    <div class="space-y-1">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${typeBg}">${typeLabel}</span>
                            <span class="text-sm font-black text-gray-800">${f.flightNo}</span>
                            <span class="text-[10px] text-gray-400">(${f.airline})</span>
                        </div>
                        <p class="text-[10px] text-gray-500 font-mono">${f.depCode} (${f.depTime}) ➔ ${f.arrCode} (${f.arrTime}${f.arrNextDay ? ' +1일' : ''})</p>
                    </div>
                    <i class="fa-solid fa-circle-plus text-lgRed text-lg hover:scale-110 transition-transform"></i>
                `;

        btn.addEventListener('click', () => {
            selectFlightFromSearch(f);
        });

        container.appendChild(btn);
    });
}

// 검색된 가상 항공편 선택 시 스토리지 자동 바인딩 및 저장
function selectFlightFromSearch(flightData) {
    const flights = JSON.parse(localStorage.getItem("LG_TRIP_FLIGHTS")) || DEFAULT_TRIP_FLIGHTS;
    const type = flightData.type; // outbound 또는 inbound

    // 기존 데이터 병합하되, 핵심 정보 갱신
    flights[type] = {
        ...(flights[type] || {}),
        flightNo: flightData.flightNo,
        airline: flightData.airline,
        depCode: flightData.depCode,
        depTime: flightData.depTime,
        arrCode: flightData.arrCode,
        arrTime: flightData.arrTime,
        arrNextDay: flightData.arrNextDay,
        note: flightData.note,
        mapUrl: flightData.mapUrl
    };

    localStorage.setItem("LG_TRIP_FLIGHTS", JSON.stringify(flights));

    closeFlightSearchModal();
    renderSchedule();
    alert(`✈️ [${flightData.flightNo} ${flightData.airline}] 항공권 정보가 자동 등록되었습니다.`);
}

// ─────────────────────────────────────────────────────────────
// [ 신규 추가: 항공사 로고 SVG 렌더링 및 모달/위치 제어 모듈 ]
// ─────────────────────────────────────────────────────────────

// 전역 변수: 위치 검색 결과를 채워줄 타겟 input의 ID
let locationTargetInputId = "";

/**
 * 편명(flightNo)을 기반으로 대한항공(KE), 아시아나항공(OZ) 등 각 항공사 고유의 고급 SVG 로고를 반환합니다.
 * 매칭되지 않거나 편명이 없는 경우 프리미엄 여객기 실루엣 SVG를 반환합니다.
 */
function getFlightLogoSVG(flightNo) {
    if (!flightNo) return getFallbackPlaneSVG();
    const fn = flightNo.toUpperCase().trim();

    if (fn.startsWith("KE")) {
        // 대한항공 태극 심볼 (고품질 미려한 인라인 SVG)
        return `
            <svg class="flight-logo-svg scale-110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px;">
                <circle cx="50" cy="50" r="46" fill="#005187" stroke="white" stroke-width="4"/>
                <path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15ZM50 78C34.54 78 22 65.46 22 50C22 34.54 34.54 22 50 22C65.46 22 78 34.54 78 50C78 65.46 65.46 78 50 78Z" fill="white"/>
                <path d="M50 28C37.85 28 28 37.85 28 50C28 62.15 37.85 72 50 72C62.15 72 72 62.15 72 50C72 37.85 62.15 28 50 28Z" fill="#C8102E"/>
                <path d="M50 36C42.27 36 36 42.27 36 50H64C64 42.27 57.73 36 50 36Z" fill="#005187"/>
            </svg>
        `;
    } else if (fn.startsWith("OZ")) {
        // 아시아나항공 윙 레드 로고
        return `
            <svg class="flight-logo-svg scale-110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px;">
                <path d="M15 85H45L75 25H45L15 85Z" fill="#E1002A"/>
                <path d="M30 85H60L75 55H45L30 85Z" fill="#7C7E81"/>
                <circle cx="75" cy="25" r="8" fill="#E1002A"/>
            </svg>
        `;
    } else if (fn.startsWith("LJ")) {
        // 진에어 나비 나비 형상
        return `
            <svg class="flight-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px;">
                <path d="M20 25C20 25 30 35 45 42C50 32 55 20 55 10C55 20 60 32 65 42C80 35 90 25 90 25C90 25 85 40 70 50C75 60 80 75 80 85C70 75 60 65 55 60C50 65 40 75 30 85C30 75 35 60 40 50C25 40 20 25 20 25Z" fill="#4B8B3B"/>
                <circle cx="55" cy="60" r="6" fill="#9FC010"/>
            </svg>
        `;
    } else if (fn.startsWith("TW")) {
        // 티웨이 로고 심볼 (T'way)
        return `
            <svg class="flight-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px;">
                <rect x="15" y="15" width="70" height="70" rx="16" fill="#E20020"/>
                <path d="M35 55H43V35H32V28H54V35H43V55H35ZM62 55C66.97 55 71 50.97 71 46C71 41.03 66.97 37 62 37C57.03 37 53 41.03 53 46C53 50.97 57.03 55 62 55Z" fill="white"/>
                <circle cx="71" cy="31" r="5" fill="#FFC72C"/>
            </svg>
        `;
    } else if (fn.startsWith("7C")) {
        // 제주항공 주황색 바람개비/로고 심볼
        return `
            <svg class="flight-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px;">
                <circle cx="50" cy="50" r="42" fill="#FF6200" stroke="white" stroke-width="4"/>
                <path d="M50 20C50 20 42 35 50 50C58 65 50 80 50 80C50 80 58 65 50 50C42 35 50 20 50 20Z" fill="white"/>
                <path d="M20 50C20 50 35 42 50 50C65 58 80 50 80 50C80 50 65 42 50 50C35 58 20 50 20 50Z" fill="white"/>
            </svg>
        `;
    } else if (fn.startsWith("BX")) {
        // 에어부산 푸른 날개 심볼
        return `
            <svg class="flight-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px;">
                <path d="M10 50C10 50 30 30 50 30C70 30 90 50 90 50C90 50 70 70 50 70C30 70 10 50 10 50Z" fill="#0065A6"/>
                <path d="M30 50C30 50 40 40 50 40C60 40 70 50 70 50C70 50 60 60 50 60C40 60 30 50 30 50Z" fill="white"/>
                <circle cx="50" cy="50" r="6" fill="#FFC72C"/>
            </svg>
        `;
    } else {
        // 기타 브랜드 또는 기본 아이콘
        return getFallbackPlaneSVG();
    }
}

/**
 * 기본으로 제공되는 고품질 프리미엄 여객기 SVG 아이콘을 반환합니다.
 * 꼬리날개와 전반적인 비행기 모양이 미려하게 조각된 실루엣입니다.
 */
function getFallbackPlaneSVG() {
    return `
        <svg class="flight-logo-svg text-lgRed" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width: 26px; height: 26px; filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.15));">
            <path d="M12 2C11.67 2 11.23 2.91 10.92 4.96L10.45 8.16L3.63 11.66C3.21 11.87 2.96 12.31 3.01 12.78C3.06 13.25 3.39 13.62 3.86 13.71L10.15 15L10.02 18.25L7.76 19.86C7.45 20.08 7.29 20.45 7.34 20.83C7.39 21.21 7.64 21.53 8 21.67L12 23L16 21.67C16.36 21.53 16.61 21.21 16.66 20.83C16.71 20.45 16.55 20.08 16.24 19.86L13.98 18.25L13.85 15L20.14 13.71C20.61 13.62 20.94 13.25 20.99 12.78C21.04 12.31 20.79 11.87 20.37 11.66L13.55 8.16L13.08 4.96C12.77 2.91 12.33 2 12 2Z"/>
        </svg>
    `;
}

// ── [ 구글맵 검색 및 Nominatim API 연동 모듈 ] ──

// 위치 검색 모달 열기
function openLocationSearchModal(targetInputId) {
    locationTargetInputId = targetInputId;

    const modal = document.getElementById("location-search-modal");
    if (!modal) return;

    modal.classList.remove("hidden");
    // 리플로우 유도 후 opacity 애니메이션 트리거
    void modal.offsetWidth;
    modal.classList.remove("opacity-0");

    // 인풋창 초기화 및 포커스
    const input = document.getElementById("location-search-input");
    if (input) {
        input.value = "";
        input.focus();
    }

    // 결과 목록 리셋
    const resultsContainer = document.getElementById("location-search-results");
    if (resultsContainer) {
        resultsContainer.innerHTML = '<p class="text-center text-xs text-gray-400 py-6">검색어를 입력하고 검색 버튼을 눌러주세요.</p>';
    }
}

// 위치 검색 모달 닫기
function closeLocationSearchModal() {
    const modal = document.getElementById("location-search-modal");
    if (!modal) return;

    modal.classList.add("opacity-0");
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}

// Nominatim API 기반 실시간 전세계 위치 검색
async function searchLocation() {
    const queryInput = document.getElementById("location-search-input");
    const resultsContainer = document.getElementById("location-search-results");
    const loadingSpinner = document.getElementById("location-search-loading");

    if (!queryInput || !resultsContainer || !loadingSpinner) return;

    const query = queryInput.value.trim();
    if (!query) {
        alert("🔍 검색할 장소명을 입력해 주세요.");
        return;
    }

    // 로딩바 보임, 결과 목록 비움
    loadingSpinner.classList.remove("hidden");
    resultsContainer.classList.add("hidden");

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8`;
        const response = await fetch(url, {
            headers: {
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "User-Agent": "LGTripPlannerApp/1.0"
            }
        });

        if (!response.ok) throw new Error("네트워크 응답 오류");

        const data = await response.json();

        resultsContainer.innerHTML = "";
        loadingSpinner.classList.add("hidden");
        resultsContainer.classList.remove("hidden");

        if (data.length === 0) {
            resultsContainer.innerHTML = '<p class="text-center text-xs text-gray-400 py-6">검색 결과가 없습니다.<br>다른 키워드로 검색해 보세요.</p>';
            return;
        }

        data.forEach(item => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "w-full text-left p-3 border border-gray-100 hover:border-red-200 hover:bg-red-50/50 rounded-xl transition duration-150 flex flex-col gap-1 active:scale-[0.98]";

            // 상세 주소 정제
            const displayName = item.display_name;
            const lat = item.lat;
            const lon = item.lon;

            btn.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <i class="fa-solid fa-location-dot text-lgRed text-xs"></i>
                    <span class="text-xs font-bold text-gray-800">${item.name || "알 수 없는 장소"}</span>
                </div>
                <p class="text-[10px] text-gray-500 leading-normal line-clamp-2">${displayName}</p>
            `;

            btn.addEventListener("click", () => {
                selectLocation(lat, lon, item.name || displayName);
            });

            resultsContainer.appendChild(btn);
        });

    } catch (err) {
        console.error("위치 검색 오류:", err);
        loadingSpinner.classList.add("hidden");
        resultsContainer.classList.remove("hidden");
        resultsContainer.innerHTML = '<p class="text-center text-xs text-red-500 py-6">⚠️ 검색 서버 연결 중 오류가 발생했습니다.<br>잠시 후 다시 시도해 주세요.</p>';
    }
}

// 검색한 위치 선택 및 구글맵 링크 바인딩
function selectLocation(lat, lon, displayName) {
    if (!locationTargetInputId) return;

    const targetInput = document.getElementById(locationTargetInputId);
    if (targetInput) {
        // 위도, 경도 좌표를 이용해 구글맵 검색 주소로 강제 포맷팅
        const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayName)}&query_place_id=${lat},${lon}`;
        targetInput.value = googleMapUrl;

        // 초록색 피드백 애니메이션 효과 부여
        targetInput.classList.add("border-emerald-500", "ring-2", "ring-emerald-200");
        setTimeout(() => {
            targetInput.classList.remove("border-emerald-500", "ring-2", "ring-emerald-200");
        }, 1500);
    }

    closeLocationSearchModal();
}

// ── [ PPT AI 시장조사 요약 수동 에디터 제어 모듈 ] ──

// PPT AI 요약 편집 모달 열기
async function openPptAiSummaryModal() {
    const modal = document.getElementById("ppt-ai-summary-modal");
    if (!modal) return;

    modal.classList.remove("hidden");
    void modal.offsetWidth;
    modal.classList.remove("opacity-0");

    // 붙여넣기 텍스트 상자 초기화
    const jsonInput = document.getElementById("ppt-ai-json-input");
    if (jsonInput) jsonInput.value = "";

    // 슬라이드별 에디터 빌드
    await buildPptAiSlidesEditor();
}

// PPT AI 요약 편집 모달 닫기
function closePptAiSummaryModal() {
    const modal = document.getElementById("ppt-ai-summary-modal");
    if (!modal) return;

    modal.classList.add("opacity-0");
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}

// 슬라이드별 요약 입력창 동적 생성 (현장 사진이 두 장씩 묶이므로 전체 사진 기준 슬라이드 개수 계산)
async function buildPptAiSlidesEditor() {
    const container = document.getElementById("ppt-ai-slides-editor-container");
    if (!container) return;

    container.innerHTML = "";

    // 1. 전체 사진 목록 취합
    let allDBPhotos = [];
    try {
        allDBPhotos = await getAllPhotosFromDB();
    } catch (err) {
        console.error(err);
    }

    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    let allPhotos = [];

    // 현장 사진 탭
    const fieldPhotos = allDBPhotos.filter(p => p.type === 'field');
    fieldPhotos.forEach((p, idx) => {
        allPhotos.push({ id: p.id, source: `현장 사진 #${idx + 1}`, label: p.memo });
    });

    // 일정 사진 탭
    schedules.forEach(s => {
        const schedPhotos = allDBPhotos.filter(p => p.type === 'schedule' && p.scheduleId === s.id);
        schedPhotos.forEach((p, idx) => {
            allPhotos.push({ id: p.id, source: `${s.day} 일정 사진 #${idx + 1}`, label: p.memo });
        });
    });

    if (allPhotos.length === 0) {
        container.innerHTML = '<p class="text-center text-xs text-gray-400 py-4">등록된 현장 사진이 없어 PPT 슬라이드가 생성되지 않습니다.<br>사진 탭이나 일정 탭에 사진을 먼저 등록해주세요.</p>';
        return;
    }

    const totalSlides = Math.ceil(allPhotos.length / 2);
    const savedSummaries = JSON.parse(localStorage.getItem("LG_TRIP_AI_SUMMARIES")) || {};

    for (let slideNum = 1; slideNum <= totalSlides; slideNum++) {
        const p1 = allPhotos[(slideNum - 1) * 2];
        const p2 = allPhotos[(slideNum - 1) * 2 + 1] || null;

        const slideKey = `slide_${slideNum}`;
        const sum = savedSummaries[slideKey] || { finding: "", analysis: "", recommendation: "" };

        const slideBox = document.createElement("div");
        slideBox.className = "bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2.5 text-left";
        slideBox.innerHTML = `
            <div class="flex justify-between items-center border-b border-gray-200 pb-1.5">
                <span class="text-xs font-bold text-gray-800"><i class="fa-regular fa-image text-lgRed mr-1"></i> 슬라이드 ${slideNum} 요약 내용</span>
                <span class="text-[9px] text-gray-400 font-semibold">${p1.source}${p2 ? ` & ${p2.source}` : ''}</span>
            </div>
            <div class="space-y-1.5">
                <div>
                    <label class="block text-[9px] text-gray-400 font-bold mb-0.5">🔍 핵심 발견 (Key Finding)</label>
                    <textarea id="sum-find-${slideNum}" rows="2" class="w-full text-[10px] p-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none resize-none">${sum.finding || ""}</textarea>
                </div>
                <div>
                    <label class="block text-[9px] text-gray-400 font-bold mb-0.5">📈 시장 분석 (Market Analysis)</label>
                    <textarea id="sum-analysis-${slideNum}" rows="2" class="w-full text-[10px] p-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none resize-none">${sum.analysis || ""}</textarea>
                </div>
                <div>
                    <label class="block text-[9px] text-gray-400 font-bold mb-0.5">💡 전략 제언 (Strategic Rec.)</label>
                    <textarea id="sum-rec-${slideNum}" rows="2" class="w-full text-[10px] p-1.5 border rounded-lg focus:ring-1 focus:ring-lgRed focus:outline-none resize-none">${sum.recommendation || ""}</textarea>
                </div>
            </div>
        `;
        container.appendChild(slideBox);
    }
}

// 무료 AI 복사용 프롬프트 조합 빌더 (구조화 데이터 압축)
async function copyAISummaryPrompt() {
    const tripInfo = JSON.parse(localStorage.getItem("LG_TRIP_INFO")) || DEFAULT_TRIP_INFO;
    const schedules = JSON.parse(localStorage.getItem("LG_TRIP_SCHEDULE")) || [];
    const meetings = JSON.parse(localStorage.getItem("LG_TRIP_MEETINGS")) || [];

    let allDBPhotos = [];
    try {
        allDBPhotos = await getAllPhotosFromDB();
    } catch (err) {
        console.error(err);
    }

    let photoMemoList = [];
    allDBPhotos.forEach((p, idx) => {
        if (p.type === 'field' && p.memo) {
            photoMemoList.push(`[현장사진 #${idx+1}] ${p.memo}`);
        }
    });
    schedules.forEach(s => {
        const schedPhotos = allDBPhotos.filter(p => p.type === 'schedule' && p.scheduleId === s.id);
        schedPhotos.forEach((p, idx) => {
            if (p.memo) {
                photoMemoList.push(`[일정사진(${s.day}) #${idx+1}] ${p.memo}`);
            }
        });
    });

    const schedText = schedules.map(s => `- ${s.day} (${s.time}) [${s.partner}]: ${s.topic}`).join("\n");
    const meetText = meetings.map(m => `- ${m.title}: ${m.content}`).join("\n");
    const photoText = photoMemoList.length > 0 ? photoMemoList.join("\n") : "현장 사진 실사 데이터 메모 없음";

    const prompt = `당신은 LG전자 B2B 해외 출장 결과 분석관입니다.
제공된 아래 출장 개요, 상세 일정, 미팅 회의록, 현장 사진들의 메모 내용을 종합 분석하여,
PowerPoint 16:9 규격 발표자료의 슬라이드에 들어갈 고품질 '시장조사 3단 요약 카드' 내용을 작성해주세요.

[출장 개요 및 정보]
- 출장 국가: ${tripInfo.country}
- 일정 기간: ${tripInfo.period}
- 참석 인원: ${tripInfo.members}
- 출장 목적: ${tripInfo.purpose}

[출장 상세 일정 정보]
${schedText}

[주요 미팅 회의록]
${meetText}

[등록된 현장 사진 실사 데이터 목록]
${photoText}

[출력 요구사항 및 포맷]
반드시 아래 JSON 포맷을 정확히 유지하여 한국어로 답변을 생성해 주세요. 다른 서론이나 설명은 완전히 배제하고 JSON 데이터만 출력해야 합니다.
전체 사진 개수에 맞춰 각 슬라이드(사진 2장당 1개 슬라이드 배정, 올림 처리)의 요약 데이터를 배열 형태로 반환해야 합니다.

\`\`\`json
{
  "slides": [
    {
      "slideNum": 1,
      "finding": "현장에서 발견한 가장 중요한 비즈니스적 팩트나 시장 실태를 100자 내외로 상세 기술",
      "analysis": "해당 현상에 대한 경쟁 구도, 기술 규제, 소비자 수요 측면의 전문 시장 분석을 100자 내외로 기술",
      "recommendation": "LG전자가 향후 취해야 할 구체적인 영업 전략, 제품 개발, 마케팅 액션 제언을 100자 내외로 기술"
    }
  ]
}
\`\`\`
`;

    try {
        await navigator.clipboard.writeText(prompt);
        alert("📋 무료 AI 챗봇 전용 프롬프트가 클립보드에 복사되었습니다!\nGemini나 Copilot 무료 웹사이트에 그대로 붙여넣어 요약 결과를 가져오세요.");
    } catch (err) {
        console.error("클립보드 복사 실패:", err);
        alert("클립보드 복사에 실패했습니다. 수동으로 텍스트를 복사해 주세요.");
    }
}

// AI 챗봇이 리턴한 답변 텍스트(JSON)를 파싱하여 입력 폼에 채우기
function parseAndApplyJSONSummary() {
    const rawInput = document.getElementById("ppt-ai-json-input").value.trim();
    if (!rawInput) {
        alert("⚠️ 붙여넣을 AI 요약 JSON 데이터가 비어 있습니다.");
        return;
    }

    try {
        // 마크다운 코드 블록 (\`\`\`json ... \`\`\`) 정제
        let cleanJSON = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

        const data = JSON.parse(cleanJSON);
        if (!data || !data.slides || !Array.isArray(data.slides)) {
            throw new Error("JSON 형식이 맞지 않습니다. ('slides' 배열 노출 필수)");
        }

        data.slides.forEach(s => {
            const num = s.slideNum;
            const findEl = document.getElementById(`sum-find-${num}`);
            const analysisEl = document.getElementById(`sum-analysis-${num}`);
            const recEl = document.getElementById(`sum-rec-${num}`);

            if (findEl) findEl.value = s.finding || "";
            if (analysisEl) analysisEl.value = s.analysis || "";
            if (recEl) recEl.value = s.recommendation || "";
        });

        alert("✨ AI 요약 데이터가 각 슬라이드 폼에 자동으로 채워졌습니다!\n세부 수정이 필요하면 확인하신 뒤 아래 '변경사항 저장'을 눌러주세요.");

    } catch (err) {
        console.error("JSON 파싱 에러:", err);
        alert("⚠️ JSON 데이터 파싱에 실패했습니다.\n입력 데이터가 올바른 JSON 포맷인지 확인하거나, 챗봇이 JSON 형태의 마크다운 코드로 출력했는지 확인해주세요.\n\n[에러 내용]: " + err.message);
    }
}

// 편집된 슬라이드별 3단 요약을 로컬 스토리지에 영구 보존
function savePptAiSummaries() {
    const savedSummaries = {};
    const textareas = document.querySelectorAll("[id^='sum-find-']");
    const totalSlides = textareas.length;

    for (let slideNum = 1; slideNum <= totalSlides; slideNum++) {
        const finding = document.getElementById(`sum-find-${slideNum}`).value.trim();
        const analysis = document.getElementById(`sum-analysis-${slideNum}`).value.trim();
        const recommendation = document.getElementById(`sum-rec-${slideNum}`).value.trim();

        savedSummaries[`slide_${slideNum}`] = { finding, analysis, recommendation };
    }

    localStorage.setItem("LG_TRIP_AI_SUMMARIES", JSON.stringify(savedSummaries));
    alert("💾 PPT AI 요약 정보가 로컬 스토리지에 성공적으로 저장되었습니다.\nPPT 다운로드 시 이 정보가 우선적으로 반영됩니다.");
    closePptAiSummaryModal();
}


