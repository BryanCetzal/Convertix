from worker import convert_to_webp
import sys

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python client.py <input.png> <output_dir> [quality]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    quality = int(sys.argv[3]) if len(sys.argv) > 3 else 85

    # Envía la tarea al worker
    task = convert_to_webp.delay(input_path, output_dir, quality)
    print(f"Tarea enviada. ID: {task.id}")

    # Opcional: Esperar y mostrar resultado
    result = task.get(timeout=30)
    print("Resultado:", result)