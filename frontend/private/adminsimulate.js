document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // ZONA DE CONFIGURACIÓN - DATOS SIMULADOS
    // =============================================
    // Estos datos serán reemplazados por llamadas al backend
    
    /* 
    ESTRUCTURA DE DATOS ESPERADA DESDE EL BACKEND:
    
    API Endpoint sugerido: /api/admin/dashboard
    
    Response esperado:
    {
        dailyConversions: Number,
        yesterdayConversions: Number, // Para calcular el %
        errorReports: Number,
        errorTypes: {
            format: Number,
            size: Number,
            other: Number
        },
        storageUsage: {
            used: Number, // en GB
            total: Number, // en GB
            percentage: Number
        },
        recentActivities: [{
            user: String,
            action: String,
            timestamp: String, // o Date
            quality: Number,
            originalSize: Number, // en MB
            convertedSize: Number, // en MB
            format: String // 'webp', 'png', 'jpg'
        }],
        hourlyConversions: [Number], // Array de 24 valores (0-23)
        formatDistribution: { // Porcentajes
            webp: Number,
            png: Number,
            jpg: Number
        }
    }
    */

    // Datos simulados (eliminar cuando se implemente el backend)
    const simulateData = {
        dailyConversions: 1248,
        yesterdayConversions: 1115,
        errorReports: 23,
        errorTypes: {
            format: 12,
            size: 8,
            other: 3
        },
        storageUsage: {
            used: 4.7,
            total: 7,
            percentage: 65
        },
        recentActivities: [
            {
                user: "Usuario123",
                action: "convirtió 5 imágenes a WEBP",
                timestamp: new Date(Date.now() - 15 * 60000),
                quality: 80,
                originalSize: 4.2,
                convertedSize: 1.8,
                format: "webp"
            },
            // ... más actividades
        ],
        hourlyConversions: [45, 32, 28, 40, 68, 86, 120, 145, 180, 210, 190, 165, 150, 130, 145, 160, 175, 190, 205, 180, 150, 120, 90, 60],
        formatDistribution: {
            webp: 65,
            png: 20,
            jpg: 15
        }
    };

    // =============================================
    // ZONA DE FUNCIONES PRINCIPALES
    // =============================================

    // Función para cargar datos reales desde el backend
    async function fetchDashboardData() {
        /*
        IMPLEMENTACIÓN BACKEND:
        Reemplazar esta simulación con una llamada real al API
        
        try {
            const response = await fetch('/api/admin/dashboard');
            if (!response.ok) throw new Error('Error al cargar datos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            // Opcional: Mostrar notificación al usuario
            return simulateData; // Usar datos simulados como fallback
        }
        */
        
        // SIMULACIÓN: Retornar datos falsos (eliminar en producción)
        return new Promise(resolve => {
            // Simular delay de red
            setTimeout(() => resolve(simulateData), 800);
        });
    }

    // Función principal para cargar el dashboard
    async function loadDashboard() {
        // Obtener datos (simulados o reales)
        const dashboardData = await fetchDashboardData();
        
        // Calcular porcentaje de cambio
        const changePercent = Math.round(
            ((dashboardData.dailyConversions - dashboardData.yesterdayConversions) / 
            dashboardData.yesterdayConversions) * 100
        );
        
        // Actualizar UI
        document.querySelector('.stat-value').textContent = 
            dashboardData.dailyConversions.toLocaleString();
            
        document.querySelector('.error-card .stat-value').textContent = 
            dashboardData.errorReports;
            
        document.querySelector('.storage-progress').style.width = 
            `${dashboardData.storageUsage.percentage}%`;
            
        document.querySelector('.storage-info span:first-child').textContent = 
            `${dashboardData.storageUsage.used.toFixed(1)}GB/${dashboardData.storageUsage.total}GB usados`;
            
        document.querySelector('.storage-info span:last-child').textContent = 
            `${dashboardData.storageUsage.percentage}%`;
        
        // Actualizar comparación
        const comparisonElement = document.querySelector('.stat-comparison');
        comparisonElement.textContent = 
            `${changePercent >= 0 ? '↑' : '↓'} ${Math.abs(changePercent)}% respecto a ayer`;
        comparisonElement.classList.toggle('positive', changePercent >= 0);
        comparisonElement.classList.toggle('negative', changePercent < 0);
        
        // Actualizar tipos de error
        const errorTypesContainer = document.querySelector('.error-types');
        errorTypesContainer.innerHTML = `
            <span>Formato: ${dashboardData.errorTypes.format}</span>
            <span>Tamaño: ${dashboardData.errorTypes.size}</span>
            <span>Otros: ${dashboardData.errorTypes.other}</span>
        `;
        
        // Cargar actividades
        loadActivities(dashboardData.recentActivities);
        // Cargar gráficos
        initCharts(dashboardData.hourlyConversions, dashboardData.formatDistribution);
    }

    // Cargar actividades recientes
    function loadActivities(activities) {
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = '';
        
        activities.forEach(activity => {
            const formatClass = activity.format.toLowerCase();
            const formatName = activity.format.toUpperCase();
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">${getActivityIcon(activity.format)}</div>
                <div class="activity-details">
                    <p><strong>${activity.user}</strong> ${activity.action}</p>
                    <div class="activity-meta">
                        <span>${formatTimeAgo(activity.timestamp)}</span>
                        <span>Calidad: ${activity.quality}%</span>
                        <span>Tamaño: ${activity.originalSize.toFixed(1)}MB → ${activity.convertedSize.toFixed(1)}MB</span>
                    </div>
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    // Inicializar gráficos
    function initCharts(hourlyData, formatData) {
        // Gráfico de barras
        const maxValue = Math.max(...hourlyData);
        const barsContainer = document.querySelector('.chart-bars');
        barsContainer.innerHTML = '';
        
        hourlyData.forEach((value, hour) => {
            const barHeight = (value / maxValue) * 100;
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${barHeight}%`;
            bar.setAttribute('data-value', value);
            bar.setAttribute('title', `${value} conversiones a las ${formatHour(hour)}`);
            
            barsContainer.appendChild(bar);
        });

        // Actualizar gráfico circular
        const pieChart = document.querySelector('.pie-chart');
        pieChart.style.background = `
            conic-gradient(
                #6e97ff 0% ${formatData.webp}%,
                #6eff8e ${formatData.webp}% ${formatData.webp + formatData.png}%,
                #ffb46e ${formatData.webp + formatData.png}% 100%
            )
        `;
        
        // Actualizar leyenda
        document.querySelector('.pie-chart-legend').innerHTML = `
            <div><span class="webp-dot"></span> WebP (${formatData.webp}%)</div>
            <div><span class="png-dot"></span> PNG (${formatData.png}%)</div>
            <div><span class="jpg-dot"></span> JPG (${formatData.jpg}%)</div>
        `;
    }

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================

    function getActivityIcon(format) {
        const icons = {
            webp: '📷',
            png: '🖼️',
            jpg: '📸'
        };
        return icons[format.toLowerCase()] || '📋';
    }

    function formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);
        
        if (diffMinutes < 1) return 'Hace unos segundos';
        if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }

    function formatHour(hour) {
        return hour < 12 ? `${hour === 0 ? 12 : hour}am` : `${hour === 12 ? 12 : hour - 12}pm`;
    }

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    loadDashboard();

    // Navegación
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`Navegar a: ${e.target.textContent}`);
        });
    });

    // Opcional: Actualizar datos cada X tiempo
    // setInterval(loadDashboard, 300000); // 5 minutos
});