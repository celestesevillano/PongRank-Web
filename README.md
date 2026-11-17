# PongRank Web

Cliente web de PongRank (React + Vite + TypeScript + Tailwind CSS + React Router + axios). Consume la API de [PongRank-Backend](https://github.com/celestesevillano/PongRank-Backend).

**Curso:** CS 2031, Desarrollo Basado en Plataformas.

## Enlaces

- Web desplegada: https://pong-rank-web.vercel.app
- API desplegada: https://pongrank-api.duckdns.org
- Backend: https://github.com/celestesevillano/PongRank-Backend
- App móvil: https://github.com/celestesevillano/PongRank-Mobile

## Integrantes y participación

| Integrante | Código | Principales aportes | Participación |
| --- | --- | --- | --- |
| Adriana Celeste Sevillano Común | 202310146 | Mayor parte del desarrollo: backend, sistema de diseño, pantallas y flujos de Mobile, pruebas y coordinación | 100 % |
| Treicy Calsina Gutiérrez | 202520007 | Despliegue y levantamiento de todas las URLs; creación y gestión de usuarios para la demo | 100 % |
| Adriana Celeste Alvarado León | 202420154 | Coach de postura y flujo de Partidas | 100 % |
| Andrea Alejandra Vidal Coello | 202410193 | Revisión del proyecto y flujo de amistad (Pongmigos) | 100 % |

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
