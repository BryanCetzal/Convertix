Tener inicializado lo siguiente:
1. Uvicorn -> C:\Convertix\Convertix> python -m uvicorn app.main:app --reload
  
3. RabbitMQ -> rabbitmq-service.bat install
            -> rabbitmq-service.bat start
            -> rabbitmq-plugins enable rabbitmq_management
            -> rabbitmq-service.bat stop
            -> rabbitmq-service.bat start
   
   Ir a: http://localhost:15672/
   Tuve que hacer todo lo anterior para que me permita entrar al sitio.
   User: guest
   Pass: guest
   
5. Celery -> C:\Convertix\Convertix> celery -A app.core.celery_app worker --loglevel=info -P solo
