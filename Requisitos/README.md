# Requerimientos Funcionales

### RF-001. Gestión de Usuarios y Seguridad
Autenticación y autorización
Debe soportar esquemas de autenticación JWT para proteger los endpoints de conversión y consulta de estado 
GitHub

Gestión de roles para limitar el acceso a operaciones críticas.
Validación de permisos
Solo usuarios autenticados pueden subir archivos y consultar resultados.
Auditoría de acciones con registro de usuario, operación y timestamp.

### RF-002. Endpoints de Conversión de Imágenes
Subida de archivo
Endpoint POST /upload que reciba archivos como form-data usando UploadFile de FastAPI, con procesamiento asincrónico para no bloquear el hilo principal 
FastAPI

Validación de tamaño máximo (configurable) y tipos MIME permitidos (por ejemplo JPEG, PNG) antes de encolar la tarea 
AI Framework

Consulta de estado de tarea
Endpoint GET /tasks/{task_id} que devuelva el estado de la conversión (pendiente, en proceso, completada, fallida) 
Stack Overflow

Uso de códigos HTTP apropiados: 202 Accepted para subida correcta, 200 OK con estado, 404 Not Found para IDs inválidos.
Descarga del resultado
Endpoint GET /download/{task_id} que permita al usuario obtener la imagen convertida almacenada 
GitHub

Configuración de encabezados Content-Disposition para forzar descarga con nombre de archivo original más sufijo de conversión.

### RF-003. Orquestación de Tareas y Colas de Mensajes
Publicación de tareas en RabbitMQ
Al recibir una solicitud válida, FastAPI debe publicar un mensaje en una cola persistente de RabbitMQ con los metadatos de la tarea (ID, usuario, ruta temporal del archivo) 
GitHub

Manejo de Dead-Letter Queue (DLQ)
Configurar DLQ para mensajes que no se procesen correctamente tras X intentos, permitiendo reintentos o revisión manual 
RabbitMQ
CloudAMQP

Exponer un endpoint de administración para visualizar y reencolar mensajes de la DLQ
Alibaba Cloud

Background tasks
Opcionalmente, usar BackgroundTasks de FastAPI para encolar tareas ligeras (por ejemplo limpieza de temporales), y delegar procesamiento pesado a workers externos 
FastAPI

### RF-004. Gestión de Almacenamiento
Almacenamiento compartido
Contenedor o volumen Docker accesible por todos los workers para guardar imágenes originales y convertidas 
GitHub

Política de retención
Mecanismo configurable (por ejemplo TTL) para borrar archivos antiguos tras un periodo determinado.
Integridad de datos
Verificación de checksum (SHA-256) al guardar y al servir la descarga para garantizar que no hay corrupción.

### RF-005. Escalabilidad y Autogestión de Recursos
Auto-Scaling Manager
Servicio que supervise la longitud de la cola en RabbitMQ y escale automáticamente la cantidad de contenedores de workers según métricas de carga 
Gcore
Kubernetes

Tolerancia a fallos
Workers configurados con reinicio automático en caso de fallo.
Heartbeats y healthchecks para asegurar la disponibilidad de cada worker.
Configuración dinámica
Parámetros de escalado (umbral de cola, máximo/mínimo réplicas) expuestos vía variables de entorno o configuración centralizada.

### RF-006. Monitoreo y Logging
Recolección de métricas
Exponer endpoint /metrics compatible con Prometheus para escrapear métricas de latencia, tasa de errores, uso de CPU/memoria 
Medium

Logging centralizado
Logs estructurados (JSON) enviados a un sistema de agregación (ELK, Graylog) con trazabilidad de requests (request_id) 
Better Stack

Alertas y dashboards
Definir alertas (por ejemplo: cola detenida, ratio de errores alto) y dashboards para visualizar KPI en Grafana o equivalente.

### RF-007. Documentación y Testing
Documentación automática
Uso de OpenAPI/Swagger integrado en FastAPI para documentar todos los endpoints y esquemas de datos 
GitHub

Pruebas unitarias e integración
Cobertura mínima del 80% con pytest, simulando en tests la publicación/consumo de mensajes de RabbitMQ.
Tests end-to-end que validen desde la subida del archivo hasta la descarga del resultado final.
CI/CD
Pipeline que ejecute lint, tests y, en caso de éxito, despliegue automático a entornos de staging/producción.
