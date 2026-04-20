const MODEL_URL = "https://teachablemachine.withgoogle.com/models/xgYVlX_uw/";
let model, webcam, maxPredictions, isWebcamRunning = false;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const webcamSection = document.getElementById('webcam-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const imageUpload = document.getElementById('image-upload');
const webcamContainer = document.getElementById('webcam-container');
const webcamLabelContainer = document.getElementById('webcam-label-container');
const labelContainer = document.getElementById('label-container');
const dominantResult = document.getElementById('dominant-result');
const imagePreview = document.getElementById('image-preview');

// Buttons
const useWebcamBtn = document.getElementById('use-webcam-btn');
const useUploadBtn = document.getElementById('use-upload-btn');
const retryBtn = document.getElementById('retry-btn');
const langSelect = document.getElementById('lang-select');

// --- i18n Translations ---
const translations = {
    ko: {
        "nav-home": "홈",
        "nav-test": "테스트",
        "nav-info": "정보",
        "nav-privacy": "개인정보처리방침",
        "main-title": "🧑‍🦲 대머리 관상 분석 PRO 👨‍🦱",
        "main-desc": "AI가 당신의 두피 관상을 분석하여 미래를 예측해 드립니다.",
        "btn-webcam": "🎥 실시간 웹캠",
        "btn-upload": "📸 사진 업로드",
        "upload-title": "사진 선택 또는 드래그",
        "loading-text": "관상 분석 모델 가동 중...",
        "btn-retry": "다시 하기",
        "footer-text": "💡 사진은 저장되지 않으니 안심하세요!",
        "result-title": "분석 결과",
        "info-title": "관상학으로 보는 대머리",
        "info-p1": "관상학에서 이마는 하늘의 기운을 받는 곳으로, 넓고 빛나는 이마는 대개 총명함과 리더십을 상징합니다. 본 테스트는 AI 기술을 통해 이러한 전통적 관상 해석과 현대적 데이터를 결합하여 재미있는 결과를 제공합니다.",
        "info-h3": "풍성한 기운을 유지하는 법",
        "info-list": "<li>규칙적인 두피 마사지로 혈액순환 돕기</li><li>단백질이 풍부한 식단 유지</li><li>스트레스 관리와 충분한 수면</li>",
        "privacy-text": "본 사이트는 사용자의 카메라 및 사진 데이터를 분석 목적으로만 사용하며, 어떠한 서버에도 저장하거나 외부에 공유하지 않습니다. 모든 분석은 사용자의 브라우저 내에서 로컬로 이루어집니다.",
        "Bald": "대머리",
        "Normal": "풍성함",
        "대머리": "대머리",
        "대머리 아님": "풍성함"
    },
    en: {
        "nav-home": "Home",
        "nav-test": "Test",
        "nav-info": "Info",
        "nav-privacy": "Privacy",
        "main-title": "🧑‍🦲 Baldness Analysis PRO 👨‍🦱",
        "main-desc": "AI predicts your future by analyzing your scalp physiognomy.",
        "btn-webcam": "🎥 Live Webcam",
        "btn-upload": "📸 Photo Upload",
        "upload-title": "Select or Drag Photo",
        "loading-text": "AI Model Loading...",
        "btn-retry": "Try Again",
        "footer-text": "💡 Photos are not saved, don't worry!",
        "result-title": "Analysis Result",
        "info-title": "Physiognomy of Baldness",
        "info-p1": "In physiognomy, the forehead is where heavenly energy is received. A broad, shining forehead usually symbolizes intelligence and leadership.",
        "info-h3": "How to Keep Full Hair",
        "info-list": "<li>Scalp massage for blood circulation</li><li>High-protein diet</li><li>Stress management and enough sleep</li>",
        "privacy-text": "This site uses camera and photo data for analysis only. We do not store or share data. All analysis is done locally in your browser.",
        "Bald": "Bald",
        "Normal": "Full Hair",
        "대머리": "Bald",
        "대머리 아님": "Full Hair"
    },
    ja: {
        "nav-home": "ホーム",
        "nav-test": "テスト",
        "nav-info": "情報",
        "nav-privacy": "プライバシー",
        "main-title": "🧑‍🦲 ハゲ相占い PRO 👨‍🦱",
        "main-desc": "AIがあなたの髪の状態を分析し、未来を予測します。",
        "btn-webcam": "🎥 リアルタイムカメラ",
        "btn-upload": "📸 写真アップ로드",
        "upload-title": "사진 선택 또는 드래그",
        "loading-text": "AIモデル起動中...",
        "btn-retry": "もう一度行う",
        "footer-text": "💡 写真は保存されませんのでご安心ください！",
        "result-title": "分析結果",
        "info-title": "ハゲの観相学",
        "info-p1": "観相学において額は天の気を受ける場所であり、広く輝く額は知性とリーダーシップを象徴します。",
        "info-h3": "フサフサな髪を保つ方法",
        "info-list": "<li>頭皮マッサージで血行促進</li><li>高タンパクな食事</li><li>ストレス管理と十分な睡眠</li>",
        "privacy-text": "当サイトは分析目的のみでカメラデータを使用し、保存や共有は一切行いません。すべてローカルで処理されます。",
        "Bald": "ハゲ",
        "Normal": "フサフサ",
        "대머리": "ハゲ",
        "대머리 아님": "フサ프사"
    },
    zh: {
        "nav-home": "首页",
        "nav-test": "测试",
        "nav-info": "信息",
        "nav-privacy": "隐私政策",
        "main-title": "🧑‍🦲 秃头面相分析 PRO 👨‍🦱",
        "main-desc": "AI 通过分析您的头皮面相来预测未来。",
        "btn-webcam": "🎥 实时摄像头",
        "btn-upload": "📸 上传照片",
        "upload-title": "选择或拖拽照片",
        "loading-text": "AI 模型加载中...",
        "btn-retry": "再试一次",
        "footer-text": "💡 照片不会被保存，请放心！",
        "result-title": "分析结果",
        "info-title": "秃头的面相学",
        "info-p1": "在面相学中，额头是接受上天之气的地方，宽阔明亮的额头通常象征着聪明和领导力。",
        "info-h3": "保持头发浓密的方法",
        "info-list": "<li>按摩头皮促进血液循环</li><li>保持高蛋白饮食</li><li>压力管理和充足睡眠</li>",
        "privacy-text": "本站仅将相机数据用于分析，不进行任何存储或共享。所有处理均在本地完成。",
        "Bald": "秃头",
        "Normal": "头发浓密",
        "대머리": "秃头",
        "대머리 아님": "头发浓密"
    }
};

function getTranslation(key) {
    const lang = langSelect.value;
    return (translations[lang] && translations[lang][key]) ? translations[lang][key] : key;
}

function updateLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.innerHTML = translations[lang][key];
    });
    localStorage.setItem('lang', lang);
}

// --- Theme Management ---
function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- AI Model Management ---
async function loadModel() {
    if (model) return;
    loadingSection.classList.remove('hidden');
    try {
        model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
        maxPredictions = model.getTotalClasses();
    } catch (e) {
        alert("모델 로드 실패: " + e.message);
    }
    loadingSection.classList.add('hidden');
}

// --- Webcam Functions ---
async function startWebcam() {
    await loadModel();
    isWebcamRunning = true;
    webcamSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
    resultSection.classList.add('hidden');

    if (!webcam) {
        const flip = true;
        webcam = new tmImage.Webcam(300, 300, flip); 
        await webcam.setup();
        await webcam.play();
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(webcam.canvas);
        window.requestAnimationFrame(webcamLoop);
    }
}

async function webcamLoop() {
    if (!isWebcamRunning) return;
    webcam.update();
    const prediction = await model.predict(webcam.canvas);
    renderBars(prediction, webcamLabelContainer);
    window.requestAnimationFrame(webcamLoop);
}

// --- Upload Functions ---
async function handleUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    await loadModel();
    isWebcamRunning = false;
    webcamSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        imagePreview.src = e.target.result;
        imagePreview.onload = async () => {
            const prediction = await model.predict(imagePreview);
            prediction.sort((a, b) => b.probability - a.probability);
            renderBars(prediction, labelContainer);
            
            const top = prediction[0];
            const translatedClass = getTranslation(top.className);
            dominantResult.innerHTML = `<strong>[${translatedClass}]</strong><br>${Math.round(top.probability * 100)}%`;
            
            loadingSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
            uploadSection.classList.add('hidden');
        };
    };
    reader.readAsDataURL(file);
}

// --- UI Rendering ---
function renderBars(predictions, container) {
    container.innerHTML = '';
    predictions.forEach(p => {
        const percent = Math.round(p.probability * 100);
        const translatedName = getTranslation(p.className);
        const wrapper = document.createElement('div');
        wrapper.className = 'result-bar-wrapper';
        wrapper.innerHTML = `
            <div class="label-info"><span>${translatedName}</span><span>${percent}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${percent}%"></div></div>
        `;
        container.appendChild(wrapper);
    });
}

// --- Event Listeners ---
useWebcamBtn.addEventListener('click', startWebcam);
useUploadBtn.addEventListener('click', () => {
    isWebcamRunning = false;
    webcamSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
});

imageUpload.addEventListener('change', (e) => handleUpload(e.target.files[0]));
retryBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
});

langSelect.addEventListener('change', (e) => updateLanguage(e.target.value));

// --- Initialization ---
initTheme();
const savedLang = localStorage.getItem('lang') || 'ko';
langSelect.value = savedLang;
updateLanguage(savedLang);
