document.addEventListener('DOMContentLoaded', () => {
    // DOM-элементы
    const uploadForm = document.getElementById('uploadForm');
    const audioFileInput = document.getElementById('audioFile');
    const dropZone = document.getElementById('dropZone');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const submitBtn = document.getElementById('submitBtn');
    
    const loadingDiv = document.getElementById('loading');
    const errorBox = document.getElementById('errorBox');
    const resultsSection = document.getElementById('resultsSection');
    const bpmValue = document.getElementById('bpmValue');
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');

    let wavesurfer = null;

    // --- Логика Drag & Drop ---

    // Подсвечиваем зону при перетаскивании
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('over'));
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('over'));
    });

    // Обработка выбора файла (через клик или drop)
    audioFileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            audioFileInput.files = files; // Передаем файл в input
            handleFileSelect();
        }
    });

    function handleFileSelect() {
        const file = audioFileInput.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            submitBtn.disabled = false; // Активируем кнопку анализа
            errorBox.classList.add('hidden');
        } else {
            fileNameDisplay.textContent = 'Файл не выбран';
            submitBtn.disabled = true;
        }
    }

    // --- Отправка на сервер ---

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = audioFileInput.files[0];
        if (!file) return;

        errorBox.classList.add('hidden');
        resultsSection.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка анализа на сервере.');
            }

            const data = await response.json();
            renderResults(data, file);

        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.classList.remove('hidden');
        } finally {
            loadingDiv.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    // --- Отрисовка результатов (современный стиль) ---

    function renderResults(data, fileBlob) {
        resultsSection.classList.add('results-fade-in'); 

        resultsSection.classList.remove('hidden');
        bpmValue.textContent = data.bpm;

        // 1. Инициализация Wavesurfer (Красивая волна)
        if (wavesurfer) {
            wavesurfer.destroy();
        }

        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            // Яркий циановый градиент для волны
            waveColor: '#1a4e5e',     
            progressColor: '#22d3ee', 
            cursorColor: '#8b5cf6',
            barWidth: 3,        /* Сделаем столбики толще */
            barGap: 1,          /* Уменьшим зазор */
            barRadius: 4,       /* Скруглим */
            cursorWidth: 2,
            height: 150,
            responsive: true
        });

        wavesurfer.loadBlob(fileBlob);

        // Кнопка плеера (иконки Play/Pause)
        playPauseBtn.onclick = () => {
            wavesurfer.playPause();
            const isPlaying = wavesurfer.isPlaying();
            playIcon.classList.toggle('hidden', isPlaying);
            pauseIcon.classList.toggle('hidden', !isPlaying);
        };

        // 2. Спектрограмма (Plotly в Dark Mode, БЕЗ ОСЕЙ)
        
        // Получаем градиент 'Inferno' (от черного к оранжевому), он лучше подходит для темной темы
        const specTrace = {
            z: data.spectrogram,
            type: 'heatmap',
            colorscale: 'Inferno', 
            showscale: false
        };
        
        // Скрываем все лишнее, оставляем только картинку
        const specLayout = {
            margin: { t: 0, b: 0, l: 0, r: 0 }, // Убираем отступы
            xaxis: { visible: false },          // Скрываем ось Х
            yaxis: { visible: false },          // Скрываем ось Y
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };
        
        Plotly.newPlot('spectrogramChart', [specTrace], specLayout, {responsive: true, displayModeBar: false});

        // 3. MFCC (Plotly, БЕЗ ОСЕЙ, палитра 'Jet')
        const mfccTrace = {
            z: data.mfcc,
            type: 'heatmap',
            colorscale: 'Jet',
            showscale: false
        };
        
        const mfccLayout = {
            margin: { t: 0, b: 0, l: 0, r: 0 },
            xaxis: { visible: false },
            yaxis: { visible: false },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };
        
        Plotly.newPlot('mfccChart', [mfccTrace], mfccLayout, {responsive: true, displayModeBar: false});
    }
});