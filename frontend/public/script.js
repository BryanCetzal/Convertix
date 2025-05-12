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
                simulateUpload(file);
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
    // LÓGICA DE CONVERSIÓN (SIMULADA)
    // ==============================================
    function startConversion() {
        if (conversionInProgress) return;
        
        conversionInProgress = true;
        currentProgress = 0;
        const progressBar = document.createElement('div');
        progressBar.className = 'conversion-progress';
        document.getElementById('dropZone').appendChild(progressBar);
        
        // Mostrar el botón Cancelar
        document.getElementById('cancelBtn').style.display = 'block';

        // Deshabilitar controles durante conversión
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
        });
        
        document.getElementById('convertBtn').disabled = true;
        document.getElementById('cancelBtn').disabled = false;
        
        // *********************************************************************
        // AQUÍ DEBES REEMPLAZAR ESTA SIMULACIÓN POR LA LÓGICA REAL DEL BACKEND
        // *********************************************************************
        progressInterval = setInterval(() => {
            currentProgress += 2;
            progressBar.style.height = `${currentProgress}%`;
            
            if (currentProgress >= 100) {
                completeConversion();
            }
        }, 100);
        
        // Ejemplo de cómo llamarías al backend real:
        // convertImagesToFormat()
        //   .then(() => completeConversion())
        //   .catch(error => handleConversionError(error))
    }

    function completeConversion() {
        clearInterval(progressInterval);
        const progressBar = document.querySelector('.conversion-progress');
        
        // Ocultar el botón Cancelar
        document.getElementById('cancelBtn').style.display = 'none';

        if (progressBar) {
            progressBar.style.opacity = '0';
            setTimeout(() => {
                progressBar.remove();
                resetConversionState();
            }, 500);
        }
        
        // *********************************************************************
        // AQUÍ DEBES MANEJAR LA RESPUESTA DEL BACKEND
        // (ej: descargar archivos, mostrar resultados, etc)
        // *********************************************************************
        console.log('Formato seleccionado:', 
            document.querySelector('.format-btn.active').dataset.format);
    }

    

    // ==============================================
    // FUNCIONES AUXILIARES
    // ==============================================
    function simulateUpload(file) {
        const interval = setInterval(() => {
            file.progress += Math.random() * 15;
            if (file.progress >= 100) {
                file.progress = 100;
                file.status = 'uploaded';
                clearInterval(interval);
            }
            updateFileProgress(file);
        }, 300);
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

    function cancelConversion() {
        clearInterval(progressInterval);
        const progressBar = document.querySelector('.conversion-progress');
        
        // Ocultar el botón Cancelar
        document.getElementById('cancelBtn').style.display = 'none';

        if (progressBar) {
            progressBar.style.opacity = '0';
            setTimeout(() => progressBar.remove(), 500);
        }
        
        resetConversionState();
        document.getElementById('cancelBtn').disabled = true;
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