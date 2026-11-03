# PongRank Web

Cliente web de PongRank (React + Vite + TypeScript + Tailwind CSS + React Router + axios). Consume la API de [PongRank-Backend](https://github.com/adrianaalvarad/PongRank-Backend).

## Requisitos

- Node 22+
- Backend corriendo (por defecto en `http://localhost:8080`)

## Uso

```bash
cp .env.example .env
npm install
npm run dev
```

Variables de entorno:

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL base del backend, sin `/api/v1` |

El backend debe incluir el origen de la web en `CORS_ALLOWED_ORIGINS` (en desarrollo, `http://localhost:5173`).

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: typecheck y build de producción
- `npm run lint`: lint

## Estructura

- `src/routes`: rutas centralizadas, carga diferida de páginas
- `src/pages`: una página por ruta
- `src/components`: UI reutilizable (`ui`, `layout`, `common`, `matches`)
- `src/services`: cliente axios con refresh de token y servicios por recurso
- `src/hooks`, `src/context`, `src/utils`: lógica compartida
