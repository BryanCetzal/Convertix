/**
 * CONVERTIX - Panel de Administración
 * 
 * ARCHIVO PRINCIPAL PARA BACKEND:
 * - Todas las llamadas API se centralizan aquí
 * - Estructura preparada para recibir datos reales
 * - Simulaciones pueden eliminarse fácilmente
 */

document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // CONFIGURACIÓN BASE - IMPORTANTE PARA BACKEND
    // =============================================
    
    /**
     * ENDPOINTS API - CONFIGURAR SEGÚN BACKEND:
     * Estos valores deben coincidir con las rutas del backend
     */
    const API_CONFIG = {
        baseUrl: '/api/admin', // Ruta base de la API
        endpoints: {
            dashboard: '/dashboard', // Datos principales
            activities: '/activities', // Actividades recientes
            errors: '/errors', // Detalle de errores
            storage: '/storage', // Uso de almacenamiento
            logout: '/logout' // Cierre de sesión
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (localStorage.getItem('admin_token') || '')
        }
    };

    // =============================================
    // FUNCIONES PRINCIPALES - COMUNICACIÓN CON BACKEND
    // =============================================

    /**
     * Obtener datos del dashboard desde backend
     * IMPORTANTE: Esta es la función principal a implementar
     */
    async function fetchDashboardData() {
        try {
            // SIMULACIÓN (ELIMINAR EN PRODUCCIÓN)
            if (window.location.href.includes('localhost')) {
                return await simulateApiCall();
            }

            // IMPLEMENTACIÓN REAL (DESCOMENTAR)
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.dashboard}`, {
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) throw new Error('Error al cargar datos');
            return await response.json();
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Mostrar error al usuario (implementar UI)
            showErrorNotification('Error al cargar datos del dashboard');
            return null;
        }
    }

    /**
     * Función de simulación (solo desarrollo)
     * ELIMINAR cuando el backend esté implementado
     */
    async function simulateApiCall() {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            dailyConversions: 1248,
            yesterdayConversions: 1115,
            errorReports: 23,
            errorTypes: { format: 12, size: 8, other: 3 },
            storageUsage: { used: 4.7, total: 7, percentage: 65 },
            recentActivities: [
                // ... datos simulados
            ],
            hourlyConversions: [45, 32, 28, 40, 68, 86, 120, 145, 180, 210, 190, 165],
            formatDistribution: { webp: 65, png: 20, jpg: 15 }
        };
    }

    // =============================================
    // FUNCIONES DE INTERFAZ - USAR CON DATOS REALES
    // =============================================

    /**
     * Cargar datos en el dashboard
     * @param {Object} data - Datos del backend
     */
    function loadDashboard(data) {
        if (!data) return;
        
        // Tarjeta de conversiones
        updateConversionsCard(data);
        
        // Tarjeta de errores
        updateErrorsCard(data);
        
        // Tarjeta de almacenamiento
        updateStorageCard(data);
        
        // Actividades recientes
        loadActivities(data.recentActivities);
        
        // Gráficos
        initCharts(data.hourlyConversions, data.formatDistribution);
    }

    // Funciones específicas de actualización UI...
    // (Mantener las funciones del código anterior pero asegurar que usan data del backend)

    // =============================================
    // INICIALIZACIÓN - EJECUCIÓN PRINCIPAL
    // =============================================

    // Cargar datos al iniciar
    async function initialize() {
        const data = await fetchDashboardData();
        loadDashboard(data);
        
        // Configurar listeners
        setupEventListeners();
    }

    // Iniciar la aplicación
    initialize();

    // =============================================
    // MANEJO DE EVENTOS - IMPORTANTE PARA BACKEND
    // =============================================

    function setupEventListeners() {
        // Navegación
        document.getElementById('logoutLink').addEventListener('click', handleLogout);
        
        // Otros listeners...
    }

    async function handleLogout(e) {
        e.preventDefault();
        
        try {
            // Implementar llamada real al backend
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.logout}`, {
                method: 'POST',
                headers: API_CONFIG.headers
            });
            
            if (response.ok) {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            showErrorNotification('Error al cerrar sesión');
        }
    }

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================

    function showErrorNotification(message) {
        // Implementar UI de error (puede ser un toast/alert)
        console.error('UI Error:', message);
    }
});