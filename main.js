// [업그레이드] Teachable Machine 모델 URL
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
        "main-title": "🧑‍🦲 대머리 관상 분석 PRO 👨‍🦱",
        "main-desc": "실시간 웹캠 또는 사진 업로드로 당신의 풍성함을 확인하세요!",
        "btn-webcam": "🎥 실시간 웹캠",
        "btn-upload": "📸 사진 업로드",
        "upload-title": "사진 선택 또는 드래그",
        "loading-text": "관상 분석 모델 가동 중...",
        "btn-retry": "다시 하기",
        "footer-text": "💡 사진은 저장되지 않으니 안심하세요!",
        "result-title": "분석 결과",
        "Bald": "대머리",
        "Normal": "풍성함",
        "대머리": "대머리",
        "대머리 아님": "풍성함"
    },
    en: {
        "main-title": "🧑‍🦲 Baldness Analysis PRO 👨‍🦱",
        "main-desc": "Check your status with live webcam or photo upload!",
        "btn-webcam": "🎥 Live Webcam",
        "btn-upload": "📸 Photo Upload",
        "upload-title": "Select or Drag Photo",
        "loading-text": "AI Model Loading...",
        "btn-retry": "Try Again",
        "footer-text": "💡 Photos are not saved, don't worry!",
        "result-title": "Analysis Result",
        "Bald": "Bald",
        "Normal": "Full Hair",
        "대머리": "Bald",
        "대머리 아님": "Full Hair"
    },
    ja: {
        "main-title": "🧑‍🦲 ハゲ相占い PRO 👨‍🦱",
        "main-desc": "リアルタイムカメラや写真アップロードで髪の状態を確認しましょう！",
        "btn-webcam": "🎥 リアルタイムカメラ",
        "btn-upload": "📸 사진 업로드",
        "upload-title": "写真を選択またはドラッグ",
        "loading-text": "AIモデル起動中...",
        "btn-retry": "もう一度行う",
        "footer-text": "💡 写真は保存されませんのでご安心ください！",
        "result-title": "分析結果",
        "Bald": "ハゲ",
        "Normal": "フサフサ",
        "대머리": "ハゲ",
        "대머리 아님": "フサフサ"
    },
    zh: {
        "main-title": "🧑‍🦲 秃头面相分析 PRO 👨‍🦱",
        "main-desc": "通过实时摄像头或照片上传检查您的头发状况！",
        "btn-webcam": "🎥 实时摄像头",
        "btn-upload": "📸 上传照片",
        "upload-title": "选择或拖拽照片",
        "loading-text": "AI 模型加载中...",
        "btn-retry": "再试一次",
        "footer-text": "💡 照片不会被保存，请放心！",
        "result-title": "分析结果",
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
        // [업그레이드] 사용자 제공 로직 반영: flip=true, size=200~300
        const flip = true;
        webcam = new tmImage.Webcam(300, 300, flip); 
        await webcam.setup();
        await webcam.play();
        webcamContainer.innerHTML = ''; // 초기화
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
