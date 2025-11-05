// Estado global de la aplicación
const AppState = {
    videoRecorder: null,
    audioRecorder: null,
    mediaStream: null,
    videoChunks: [],
    audioChunks: [],
    recordingStartTime: null,
    timerInterval: null,
    currentVideoBlob: null,
    currentAudioBlob: null,
    exercises: []
};

// Elementos del DOM
const elements = {
    cameraSelect: document.getElementById('cameraSelect'),
    videoPreview: document.getElementById('videoPreview'),
    videoPlayback: document.getElementById('videoPlayback'),
    exerciseName: document.getElementById('exerciseName'),
    exerciseType: document.getElementById('exerciseType'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    saveBtn: document.getElementById('saveBtn'),
    discardBtn: document.getElementById('discardBtn'),
    recordingTimer: document.getElementById('recordingTimer'),
    timerDisplay: document.getElementById('timerDisplay'),
    exerciseList: document.getElementById('exerciseList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn')
};

// Inicialización de la aplicación
async function init() {
    try {
        await loadCameras();
        loadExercises();
        setupEventListeners();

        // Deshabilitar botón de inicio hasta que se complete el formulario
        elements.startBtn.disabled = true;

        console.log('Aplicación iniciada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        alert('Error al acceder a las cámaras. Por favor, permite el acceso a la cámara y el micrófono.');
    }
}

// Cargar cámaras disponibles
async function loadCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        elements.cameraSelect.innerHTML = '';

        if (videoDevices.length === 0) {
            elements.cameraSelect.innerHTML = '<option value="">No se encontraron cámaras</option>';
            return;
        }

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Cámara ${index + 1}`;
            elements.cameraSelect.appendChild(option);
        });

        // Iniciar la primera cámara
        await startCamera();
    } catch (error) {
        console.error('Error al cargar cámaras:', error);
        throw error;
    }
}

// Iniciar cámara seleccionada
async function startCamera() {
    try {
        // Detener stream anterior si existe
        if (AppState.mediaStream) {
            AppState.mediaStream.getTracks().forEach(track => track.stop());
        }

        const selectedCamera = elements.cameraSelect.value;
        const constraints = {
            video: {
                deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        };

        AppState.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.videoPreview.srcObject = AppState.mediaStream;

        console.log('Cámara iniciada:', selectedCamera || 'predeterminada');
    } catch (error) {
        console.error('Error al iniciar cámara:', error);
        alert('No se pudo acceder a la cámara seleccionada. Verifica los permisos.');
    }
}

// Configurar event listeners
function setupEventListeners() {
    elements.cameraSelect.addEventListener('change', startCamera);
    elements.startBtn.addEventListener('click', startRecording);
    elements.stopBtn.addEventListener('click', stopRecording);
    elements.saveBtn.addEventListener('click', saveExercise);
    elements.discardBtn.addEventListener('click', discardRecording);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // Validar formulario antes de permitir grabar
    elements.exerciseName.addEventListener('input', validateForm);
    elements.exerciseType.addEventListener('change', validateForm);
}

// Validar que los campos del formulario estén completos
function validateForm() {
    const name = elements.exerciseName.value.trim();
    const type = elements.exerciseType.value;

    // Solo habilitar el botón si ambos campos están completos
    elements.startBtn.disabled = !(name && type);
}

// Iniciar grabación
function startRecording() {
    if (!AppState.mediaStream) {
        alert('Por favor, permite el acceso a la cámara primero.');
        return;
    }

    const name = elements.exerciseName.value.trim();
    const type = elements.exerciseType.value;

    if (!name || !type) {
        alert('Por favor, completa el nombre del ejercicio y el tipo de ejecución.');
        return;
    }

    try {
        AppState.videoChunks = [];
        AppState.audioChunks = [];

        // Crear stream solo de video (sin audio)
        const videoStream = new MediaStream(
            AppState.mediaStream.getVideoTracks()
        );

        // Crear stream solo de audio (sin video)
        const audioStream = new MediaStream(
            AppState.mediaStream.getAudioTracks()
        );

        // Configurar MediaRecorder para video (sin audio)
        const videoOptions = {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        };

        // Fallback si el formato no está soportado
        if (!MediaRecorder.isTypeSupported(videoOptions.mimeType)) {
            videoOptions.mimeType = 'video/webm';
        }

        AppState.videoRecorder = new MediaRecorder(videoStream, videoOptions);

        AppState.videoRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                AppState.videoChunks.push(event.data);
            }
        };

        // Configurar MediaRecorder para audio
        // Intentar usar audio/wav, si no está disponible usar audio/webm
        let audioMimeType = 'audio/wav';
        if (!MediaRecorder.isTypeSupported(audioMimeType)) {
            audioMimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(audioMimeType)) {
                audioMimeType = 'audio/webm';
            }
        }

        const audioOptions = {
            mimeType: audioMimeType,
            audioBitsPerSecond: 128000 // 128 kbps
        };

        AppState.audioRecorder = new MediaRecorder(audioStream, audioOptions);

        AppState.audioRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                AppState.audioChunks.push(event.data);
            }
        };

        // Configurar callback cuando ambas grabaciones se detengan
        let stoppedCount = 0;
        const onStopped = () => {
            stoppedCount++;
            if (stoppedCount === 2) {
                onRecordingStopped();
            }
        };

        AppState.videoRecorder.onstop = onStopped;
        AppState.audioRecorder.onstop = onStopped;

        // Iniciar ambas grabaciones
        AppState.videoRecorder.start(100); // Recopilar datos cada 100ms
        AppState.audioRecorder.start(100);
        AppState.recordingStartTime = Date.now();

        // Iniciar timer
        startTimer();

        // Actualizar UI
        updateUIForRecording(true);

        console.log('Grabación iniciada (audio y video por separado)');
        console.log('Audio formato:', audioMimeType);
    } catch (error) {
        console.error('Error al iniciar grabación:', error);
        alert('Error al iniciar la grabación. Por favor, intenta de nuevo.');
    }
}

// Detener grabación
function stopRecording() {
    let stopped = false;

    if (AppState.videoRecorder && AppState.videoRecorder.state !== 'inactive') {
        AppState.videoRecorder.stop();
        stopped = true;
    }

    if (AppState.audioRecorder && AppState.audioRecorder.state !== 'inactive') {
        AppState.audioRecorder.stop();
        stopped = true;
    }

    if (stopped) {
        stopTimer();
        console.log('Grabación detenida');
    }
}

// Cuando se detiene la grabación
function onRecordingStopped() {
    // Crear blob de video (sin audio)
    const videoBlob = new Blob(AppState.videoChunks, { type: 'video/webm' });
    AppState.currentVideoBlob = videoBlob;

    // Crear blob de audio
    // Determinar el tipo MIME correcto
    let audioType = 'audio/wav';
    if (AppState.audioChunks.length > 0) {
        audioType = AppState.audioChunks[0].type || 'audio/webm';
    }

    const audioBlob = new Blob(AppState.audioChunks, { type: audioType });
    AppState.currentAudioBlob = audioBlob;

    // Mostrar preview del video grabado (sin audio en el preview)
    elements.videoPreview.style.display = 'none';
    elements.videoPlayback.style.display = 'block';
    elements.videoPlayback.src = URL.createObjectURL(videoBlob);

    // Actualizar UI
    updateUIForRecording(false);
    elements.saveBtn.style.display = 'inline-flex';
    elements.discardBtn.style.display = 'inline-flex';

    console.log('Video y audio listos para guardar o descartar');
    console.log('Video size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Audio size:', (audioBlob.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Audio type:', audioType);
}

// Guardar ejercicio
function saveExercise() {
    const name = elements.exerciseName.value.trim();
    const type = elements.exerciseType.value;

    if (!name || !type) {
        alert('Por favor, completa todos los datos del ejercicio.');
        return;
    }

    if (!AppState.currentVideoBlob || !AppState.currentAudioBlob) {
        alert('No hay ningún video o audio para guardar.');
        return;
    }

    // Convertir video blob a base64
    const videoReader = new FileReader();
    videoReader.onloadend = () => {
        const videoData = videoReader.result;

        // Convertir audio blob a base64
        const audioReader = new FileReader();
        audioReader.onloadend = () => {
            const audioData = audioReader.result;

            const exercise = {
                id: Date.now(),
                name: name,
                type: type,
                date: new Date().toISOString(),
                duration: elements.timerDisplay.textContent,
                videoData: videoData,
                audioData: audioData,
                audioType: AppState.currentAudioBlob.type
            };

            AppState.exercises.push(exercise);
            saveExercisesToStorage();
            renderExercises();
            resetRecordingState();

            console.log('Ejercicio guardado:', exercise.name);
        };

        audioReader.readAsDataURL(AppState.currentAudioBlob);
    };

    videoReader.readAsDataURL(AppState.currentVideoBlob);
}

// Descartar grabación
function discardRecording() {
    if (confirm('¿Estás seguro de que quieres descartar esta grabación?')) {
        resetRecordingState();
        console.log('Grabación descartada');
    }
}

// Resetear estado de grabación
function resetRecordingState() {
    AppState.currentVideoBlob = null;
    AppState.currentAudioBlob = null;
    AppState.videoChunks = [];
    AppState.audioChunks = [];
    elements.exerciseName.value = '';
    elements.exerciseType.value = '';
    elements.timerDisplay.textContent = '00:00';
    elements.saveBtn.style.display = 'none';
    elements.discardBtn.style.display = 'none';
    elements.videoPlayback.style.display = 'none';
    elements.videoPreview.style.display = 'block';
    elements.startBtn.disabled = true; // Deshabilitado hasta que se complete el formulario
}

// Timer de grabación
function startTimer() {
    elements.recordingTimer.style.display = 'flex';
    AppState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - AppState.recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        elements.timerDisplay.textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
        AppState.timerInterval = null;
    }
    elements.recordingTimer.style.display = 'none';
}

// Actualizar UI durante grabación
function updateUIForRecording(isRecording) {
    elements.startBtn.disabled = isRecording;
    elements.stopBtn.disabled = !isRecording;
    elements.cameraSelect.disabled = isRecording;
    elements.exerciseName.disabled = isRecording;
    elements.exerciseType.disabled = isRecording;
}

// Guardar ejercicios en localStorage
function saveExercisesToStorage() {
    try {
        localStorage.setItem('exercises', JSON.stringify(AppState.exercises));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        alert('Error al guardar el ejercicio. El video podría ser demasiado grande.');
    }
}

// Cargar ejercicios desde localStorage
function loadExercises() {
    try {
        const stored = localStorage.getItem('exercises');
        if (stored) {
            AppState.exercises = JSON.parse(stored);
            renderExercises();
        }
    } catch (error) {
        console.error('Error al cargar ejercicios:', error);
        AppState.exercises = [];
    }
}

// Renderizar lista de ejercicios
function renderExercises() {
    if (AppState.exercises.length === 0) {
        elements.exerciseList.innerHTML = '<p class="empty-message">No hay ejercicios registrados aún</p>';
        return;
    }

    // Ordenar por fecha (más reciente primero)
    const sortedExercises = [...AppState.exercises].sort((a, b) => b.date.localeCompare(a.date));

    elements.exerciseList.innerHTML = sortedExercises.map(exercise => {
        const date = new Date(exercise.date);
        const formattedDate = date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Obtener etiqueta del tipo de ejercicio
        const typeLabels = {
            'solo': 'Solo',
            'velo': 'Con velo',
            'complemento': 'Con complemento'
        };
        const typeLabel = exercise.type ? typeLabels[exercise.type] || exercise.type : 'No especificado';

        return `
            <div class="exercise-item" data-id="${exercise.id}">
                <div class="exercise-header">
                    <div class="exercise-info">
                        <h3>${escapeHtml(exercise.name)}</h3>
                        <div class="exercise-meta">
                            <div>📅 ${formattedDate}</div>
                            <div>⏱️ Duración: ${exercise.duration}</div>
                            <div>🎭 Tipo: ${typeLabel}</div>
                        </div>
                    </div>
                    <div class="exercise-actions">
                        <button class="btn-play" onclick="togglePlayExercise(${exercise.id})">
                            ▶️ Ver
                        </button>
                        <button class="btn-download" onclick="downloadExercise(${exercise.id}, 'video')">
                            ⬇️ Video
                        </button>
                        <button class="btn-download" onclick="downloadExercise(${exercise.id}, 'audio')">
                            🎵 Audio
                        </button>
                        <button class="btn-delete" onclick="deleteExercise(${exercise.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                <div id="player-${exercise.id}" class="video-player" style="display: none;">
                    <video controls>
                        <source src="${exercise.videoData}" type="video/webm">
                    </video>
                    ${exercise.audioData ? `
                    <div class="audio-player">
                        <audio controls>
                            <source src="${exercise.audioData}" type="${exercise.audioType || 'audio/webm'}">
                        </audio>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle reproducción de ejercicio
function togglePlayExercise(id) {
    const player = document.getElementById(`player-${id}`);
    const video = player.querySelector('video');

    if (player.style.display === 'none') {
        player.style.display = 'block';
        video.play();
    } else {
        player.style.display = 'none';
        video.pause();
        video.currentTime = 0;
    }
}

// Descargar ejercicio
function downloadExercise(id, type = 'video') {
    const exercise = AppState.exercises.find(ex => ex.id === id);
    if (!exercise) return;

    const link = document.createElement('a');
    const baseName = `${exercise.name.replace(/\s+/g, '_')}_${new Date(exercise.date).toISOString().split('T')[0]}`;

    if (type === 'audio') {
        if (!exercise.audioData) {
            alert('Este ejercicio no tiene audio guardado.');
            return;
        }
        link.href = exercise.audioData;
        // Determinar extensión según el tipo
        const extension = exercise.audioType && exercise.audioType.includes('wav') ? 'wav' : 'webm';
        link.download = `${baseName}_audio.${extension}`;
    } else {
        link.href = exercise.videoData;
        link.download = `${baseName}_video.webm`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`${type === 'audio' ? 'Audio' : 'Video'} descargado:`, exercise.name);
}

// Eliminar ejercicio
function deleteExercise(id) {
    const exercise = AppState.exercises.find(ex => ex.id === id);
    if (!exercise) return;

    if (confirm(`¿Estás seguro de que quieres eliminar "${exercise.name}"?`)) {
        AppState.exercises = AppState.exercises.filter(ex => ex.id !== id);
        saveExercisesToStorage();
        renderExercises();
        console.log('Ejercicio eliminado:', exercise.name);
    }
}

// Limpiar historial completo
function clearHistory() {
    if (AppState.exercises.length === 0) {
        alert('No hay ejercicios para eliminar.');
        return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar TODOS los ejercicios? Esta acción no se puede deshacer.')) {
        AppState.exercises = [];
        saveExercisesToStorage();
        renderExercises();
        console.log('Historial limpiado');
    }
}

// Utilidad para escapar HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    if (AppState.mediaStream) {
        AppState.mediaStream.getTracks().forEach(track => track.stop());
    }
});

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
