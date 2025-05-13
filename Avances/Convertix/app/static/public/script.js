document.addEventListener('DOMContentLoaded', () => {
    // ==============================================
    // VARIABLES Y SELECTORES
    // ==============================================
    // Variables globales
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const instructions = document.getElementById('instructions');
    const convertBtn = document.getElementById('convertBtn');
    const qualitySlider = document.getElementById('qualitySlider');

    // Variables clave para el backend
    let files = []; // Almacena TODAS las imágenes seleccionadas (File objects)
    let currentFormat = 'webp'; // Formato seleccionado (webp|png|jpg)
    let currentQuality = 10; // Calidad (10-100, solo para webp)
    
    // Variables de estado
    let conversionInProgress = false;
    let progressInterval;
    let currentProgress = 0;

    // ==============================================
    // FUNCIONES DE INTERFAZ/USUARIO
    // ==============================================
    // Animación inicial
    setTimeout(() => {
        document.body.classList.remove('is-preload');
    }, 100);

    // Manejo de archivos (drag & drop)
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#6e97ff';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ffffff';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ffffff';
        handleFiles(e.dataTransfer.files);
    });

    // ==============================================
    // FUNCIONES PRINCIPALES
    // ==============================================

    // Maneja la seleción de archivos
    function handleFiles(newFiles) {
        for (let file of newFiles) {
            if (file.size > 20 * 1024 * 1024) {
                alert(`El archivo ${file.name} supera los 20MB.`);
                continue;
            }
            
            if (!files.some(f => f.name === file.name && f.size === file.size)) {
                file.status = 'uploading';
                file.progress = 0;
                files.push(file);
                handleFileUpload(file);
            }
        }
        updateFileList();
    }

    // Actualiza la lista visual de archivos
    function updateFileList() {
        if (files.length === 0) {
            fileList.style.display = 'none';
            instructions.style.display = 'block';
            convertBtn.disabled = true;
            return;
        }
        
        instructions.style.display = 'none';
        fileList.style.display = 'block';
        convertBtn.disabled = false;
        
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-progress-fill" 
                    style="width: ${file.progress || 0}%;
                            opacity: ${file.status === 'uploaded' ? 0 : 1};"></div>
                <div class="file-content">
                    <div class="file-icon"></div>
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-remove" data-index="${index}">×</div>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
        
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-index'));
                files.splice(index, 1);
                updateFileList();
            });
        });
    }

    // ==============================================
    // LÓGICA DE CONVERSIÓN (Backend real)
    // ==============================================
    async function startConversion() {
        if (conversionInProgress || files.length === 0) return;
        
        conversionInProgress = true;
        
        // Mostrar el botón Cancelar
        document.getElementById('cancelBtn').style.display = 'block';

        const format = document.querySelector('.format-btn.active').dataset.format;
        const quality = document.getElementById('qualitySlider').value;

        // Crear la barra de progreso
        const progressBar = document.createElement('div');
        progressBar.className = 'conversion-progress';
        document.getElementById('dropZone').appendChild(progressBar);

        // Deshabilitar controles durante la conversión
        document.getElementById('convertBtn').disabled = true;
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
        });

        try {
            // Iniciar la conversión de cada archivo
            for (const file of files) {
                if (!file.id) continue;
                
                // Iniciar la conversión enviando la solicitud al backend
                const formData = new FormData();
                formData.append('image_id', file.id);
                formData.append('target_format', format);
                formData.append('options', JSON.stringify({ quality: parseInt(quality) }));

                const response = await fetch('/api/v1/convert', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const result = await response.json();
                console.log('Tarea iniciada:', result);

                // Monitorear progreso de la conversión
                let converted = false;
                for (let i = 0; i < 30; i++) {
                    const statusRes = await fetch(`/api/v1/status/${file.id}`);
                    const status = await statusRes.json();
                    
                    // Si la conversión está completada
                    if (status.status === 'completed') {
                        if (status.url) {
                            const a = document.createElement('a');
                            a.href = `/api/v1${status.url}`;
                            a.download = status.url.split('/').pop();  // Extrae el nombre del archivo
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }
                        converted = true;
                        break;
                    }
                    
                    // Si falló la conversión
                    else if (status.status === 'failed') {
                        throw new Error('La conversión falló');
                    }

                    // Esperar 1 segundo antes de verificar el estado nuevamente
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (!converted) {
                    throw new Error('Tiempo de espera agotado');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al convertir: ${error.message}`);
        } finally {
            // Una vez completada la conversión, actualizar estado y limpiar la barra de progreso
            conversionInProgress = false;
            document.getElementById('convertBtn').disabled = false;
            document.querySelectorAll('.format-btn').forEach(btn => {
                btn.style.pointerEvents = 'auto';
            });

            // Eliminar la barra de progreso y ocultar el botón Cancelar
            document.getElementById('cancelBtn').style.display = 'none';
            const progressBar = document.querySelector('.conversion-progress');
            if (progressBar) {
                progressBar.style.opacity = '0';
                setTimeout(() => {
                    progressBar.remove();
                    resetConversionState();
                }, 500);
            }
        }
    }

    // ==============================================
    // FUNCIONES AUXILIARES
    // ==============================================
    function cancelConversion() {
        // Cancelar cualquier tarea en progreso (detener el intervalo)
        clearInterval(progressInterval);
        
        // Ocultar el botón Cancelar
        document.getElementById('cancelBtn').style.display = 'none';

        // Eliminar la barra de progreso si está visible
        const progressBar = document.querySelector('.conversion-progress');
        if (progressBar) {
            progressBar.style.opacity = '0';
            setTimeout(() => progressBar.remove(), 500);
        }

        // Resetear el estado de la conversión
        resetConversionState();
    }

    function resetConversionState() {
        conversionInProgress = false;
        currentProgress = 0;
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        });
        document.getElementById('convertBtn').disabled = false;
        document.getElementById('cancelBtn').style.display = 'none';
    }


    

    // ==============================================
    // FUNCIONES AUXILIARES
    // ==============================================
    async function handleFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/v1/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            file.status = 'uploaded';
            file.progress = 100;
            file.id = data.id; // Guarda el ID de la imagen en el objeto file
            updateFileProgress(file);
            
        } catch (error) {
            console.error('Upload failed:', error);
            file.status = 'failed';
            updateFileProgress(file);
            alert(`Error al subir ${file.name}: ${error.message}`);
        }
    }

    function updateFileProgress(file) {
        const fileItems = document.querySelectorAll('.file-progress-fill');
        files.forEach((f, index) => {
            if (f === file && fileItems[index]) {
                fileItems[index].style.width = `${f.progress}%`;
                fileItems[index].style.opacity = f.status === 'uploaded' ? '0' : '1';
            }
        });
    }


    // ==============================================
    // EVENT LISTENERS ADICIONALES
    // ==============================================
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const qualityControl = document.querySelector('.quality-control');
            if (this.dataset.format !== 'webp') {
                qualityControl.style.opacity = '0.5';
                qualityControl.style.pointerEvents = 'none';
            } else {
                qualityControl.style.opacity = '1';
                qualityControl.style.pointerEvents = 'auto';
            }
        });
    });

    document.getElementById('qualitySlider').addEventListener('input', function() {
        document.getElementById('qualityValue').textContent = this.value + '%';
    });

    document.getElementById('qualityValue').textContent = 
        document.getElementById('qualitySlider').value + '%';

    document.getElementById('convertBtn').addEventListener('click', startConversion);
    document.getElementById('cancelBtn').addEventListener('click', cancelConversion);

    // ==============================================
    // ZONA DE IMPLEMENTACIÓN DEL BACKEND
    // ==============================================

    // Cambiar todas las URLs de la API para que usen /api/v1
    const API_BASE_URL = '/api/v1';

    async function convertImagesToFormat() {
        const formData = new FormData();
        const format = document.querySelector('.format-btn.active').dataset.format;
        const quality = document.getElementById('qualitySlider').value;
        
        formData.append('target_format', format);
        formData.append('options', JSON.stringify({ quality: parseInt(quality) }));
        
        // Subir cada imagen primero
        const imageIds = [];
        for (const file of files) {
            try {
                // 1. Subir la imagen
                const uploadForm = new FormData();
                uploadForm.append('file', file);
                
                const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadForm
                });
                
                if (!uploadResponse.ok) throw new Error('Error al subir imagen');
                
                const uploadData = await uploadResponse.json();
                imageIds.push(uploadData.id);
                
            } catch (error) {
                console.error('Error subiendo imagen:', error);
                alert(`Error subiendo ${file.name}: ${error.message}`);
            }
        }
        
        // 2. Iniciar conversión para cada imagen
        for (const imageId of imageIds) {
            try {
                const convertResponse = await fetch(`${API_BASE_URL}/convert/${imageId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        target_format: format,
                        options: { quality: parseInt(quality) }
                    })
                });
                
                if (!convertResponse.ok) throw new Error('Error al iniciar conversión');
                
                // 3. Monitorear progreso
                await monitorConversionProgress(imageId);
                
            } catch (error) {
                console.error('Error convirtiendo imagen:', error);
                alert(`Error convirtiendo imagen ID ${imageId}: ${error.message}`);
            }
        }
    }

    async function monitorConversionProgress(imageId) {
        let attempts = 0;
        const maxAttempts = 30; // 30 intentos (30 segundos máximo)
        
        while (attempts < maxAttempts) {
            try {
                const statusResponse = await fetch(`${API_BASE_URL}/status/${imageId}`);
                const statusData = await statusResponse.json();
                
                if (statusData.conversion_status === 'completed') {
                    // Descargar imagen convertida
                    window.open(statusData.url, '_blank');
                    return;
                } else if (statusData.conversion_status === 'failed') {
                    throw new Error('La conversión falló');
                }
                
                // Esperar 1 segundo antes de volver a verificar
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                
            } catch (error) {
                console.error('Error monitoreando progreso:', error);
                throw error;
            }
        }
        
        throw new Error('Tiempo de espera agotado para la conversión');
    }


    /*
    // Datos a enviar:
    {
        format: 'webp'|'png'|'jpg',
        quality: 10-100, // solo para webp
        files: [File]    // array de imágenes
    }

    async function convertImagesToFormat() {
        // 1. Preparar datos para el backend
        const formData = new FormData();
        formData.append('format', document.querySelector('.format-btn.active').dataset.format);
        formData.append('quality', document.getElementById('qualitySlider').value);
        
        files.forEach(file => {
            formData.append('files', file);
        });

        // 2. Enviar al endpoint del backend
        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            // 3. Manejar respuesta (ej: descargar ZIP)
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'imagenes_convertidas.zip';
            a.click();
            
        } catch (error) {
            console.error('Error en conversión:', error);
            // Mostrar notificación de error al usuario
        }
    }
    */
});