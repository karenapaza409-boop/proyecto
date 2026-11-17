"""Medición HTTP autenticada; no registra token ni cuerpos de respuesta."""
import os
import statistics
import time
import urllib.request
import urllib.error

def main():
    token = os.environ.get("MM_TOKEN")
    if not token:
        raise SystemExit("Defina MM_TOKEN con un token vigente; no lo pase como argumento.")
    url = os.environ.get("MM_MEASURE_URL", "http://localhost:8080/api/v1/productos?size=20")
    elapsed = []
    for _ in range(20):
        request = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                response.read()
        except (urllib.error.URLError, TimeoutError):
            raise SystemExit("Petición fallida. Verifique servicio, URL y permisos; no se imprime la respuesta.")
        elapsed.append((time.perf_counter() - start) * 1000)
    print(f"n=20 primera_ms={elapsed[0]:.2f} mediana_ms={statistics.median(elapsed):.2f} p95_ms={sorted(elapsed)[18]:.2f}")

if __name__ == "__main__":
    main()
