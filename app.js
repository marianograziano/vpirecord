// Estado global de la aplicación
const AppState = {
    mediaRecorder: null,
    mediaStream: null,
    recordedChunks: [],
    recordingStartTime: null,
    timerInterval: null,
    currentVideoBlob: null,
    exercises: []
};

// Elementos del DOM
const elements = {
    cameraSelect: document.getElementById('cameraSelect'),
    videoPreview: document.getElementById('videoPreview'),
    videoPlayback: document.getElementById('videoPlayback'),
    exerciseName: document.getElementById('exerciseName'),
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
}

// Iniciar grabación
function startRecording() {
    if (!AppState.mediaStream) {
        alert('Por favor, permite el acceso a la cámara primero.');
        return;
    }

    try {
        AppState.recordedChunks = [];

        // Configurar MediaRecorder con formato WebM
        const options = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        };

        // Fallback si el formato no está soportado
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }

        AppState.mediaRecorder = new MediaRecorder(AppState.mediaStream, options);

        AppState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                AppState.recordedChunks.push(event.data);
            }
        };

        AppState.mediaRecorder.onstop = onRecordingStopped;

        AppState.mediaRecorder.start(100); // Recopilar datos cada 100ms
        AppState.recordingStartTime = Date.now();

        // Iniciar timer
        startTimer();

        // Actualizar UI
        updateUIForRecording(true);

        console.log('Grabación iniciada');
    } catch (error) {
        console.error('Error al iniciar grabación:', error);
        alert('Error al iniciar la grabación. Por favor, intenta de nuevo.');
    }
}

// Detener grabación
function stopRecording() {
    if (AppState.mediaRecorder && AppState.mediaRecorder.state !== 'inactive') {
        AppState.mediaRecorder.stop();
        stopTimer();
        console.log('Grabación detenida');
    }
}

// Cuando se detiene la grabación
function onRecordingStopped() {
    const blob = new Blob(AppState.recordedChunks, { type: 'video/webm' });
    AppState.currentVideoBlob = blob;

    // Mostrar preview del video grabado
    elements.videoPreview.style.display = 'none';
    elements.videoPlayback.style.display = 'block';
    elements.videoPlayback.src = URL.createObjectURL(blob);

    // Actualizar UI
    updateUIForRecording(false);
    elements.saveBtn.style.display = 'inline-flex';
    elements.discardBtn.style.display = 'inline-flex';

    console.log('Video listo para guardar o descartar');
}

// Guardar ejercicio
function saveExercise() {
    const name = elements.exerciseName.value.trim();

    if (!name) {
        alert('Por favor, ingresa un nombre para el ejercicio.');
        elements.exerciseName.focus();
        return;
    }

    if (!AppState.currentVideoBlob) {
        alert('No hay ningún video para guardar.');
        return;
    }

    // Convertir blob a base64 para almacenamiento
    const reader = new FileReader();
    reader.onloadend = () => {
        const exercise = {
            id: Date.now(),
            name: name,
            date: new Date().toISOString(),
            duration: elements.timerDisplay.textContent,
            videoData: reader.result
        };

        AppState.exercises.push(exercise);
        saveExercisesToStorage();
        renderExercises();
        resetRecordingState();

        console.log('Ejercicio guardado:', exercise.name);
    };

    reader.readAsDataURL(AppState.currentVideoBlob);
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
    AppState.recordedChunks = [];
    elements.exerciseName.value = '';
    elements.timerDisplay.textContent = '00:00';
    elements.saveBtn.style.display = 'none';
    elements.discardBtn.style.display = 'none';
    elements.videoPlayback.style.display = 'none';
    elements.videoPreview.style.display = 'block';
    elements.startBtn.disabled = false;
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

        return `
            <div class="exercise-item" data-id="${exercise.id}">
                <div class="exercise-header">
                    <div class="exercise-info">
                        <h3>${escapeHtml(exercise.name)}</h3>
                        <div class="exercise-meta">
                            <div>📅 ${formattedDate}</div>
                            <div>⏱️ Duración: ${exercise.duration}</div>
                        </div>
                    </div>
                    <div class="exercise-actions">
                        <button class="btn-play" onclick="togglePlayExercise(${exercise.id})">
                            ▶️ Ver
                        </button>
                        <button class="btn-download" onclick="downloadExercise(${exercise.id})">
                            ⬇️ Descargar
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
function downloadExercise(id) {
    const exercise = AppState.exercises.find(ex => ex.id === id);
    if (!exercise) return;

    const link = document.createElement('a');
    link.href = exercise.videoData;
    link.download = `${exercise.name.replace(/\s+/g, '_')}_${new Date(exercise.date).toISOString().split('T')[0]}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Ejercicio descargado:', exercise.name);
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
