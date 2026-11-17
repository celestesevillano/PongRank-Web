# PongRank Web

Cliente web de PongRank para organizar partidas de tenis de mesa, encontrar rivales y clubes, registrar resultados y consultar el ranking. Consume la API REST de [PongRank Backend](https://github.com/celestesevillano/PongRank-Backend).

**Curso:** CS 2031, Desarrollo Basado en Plataformas.

## Enlaces

- **Web:** https://pong-rank-web.vercel.app
- **API:** https://pongrank-api.duckdns.org
- **Backend:** https://github.com/celestesevillano/PongRank-Backend
- **Mobile:** https://github.com/celestesevillano/PongRank-Mobile

## Funcionalidades

- Registro guiado, inicio de sesión y recuperación de contraseña.
- Inicio con rating, posición en la comunidad, actividad reciente y accesos a Estadísticas y Coach según el plan.
- Ranking por comunidad y estadísticas del jugador (evolución del rating, rachas y mejor victoria).
- Planes de membresía con pago mediante MercadoPago.
- Creación, búsqueda, unión, seguimiento y confirmación de partidas.
- Actualización de partidas en vivo mediante polling.
- Comunidades, clubes, perfiles públicos y solicitudes de amistad (Pongmigos).
- Panel administrativo para aprobar clubes y verificar jugadores federados.
- Búsqueda con debounce, filtros, estados vacíos, reintento de solicitudes y feedback mediante toasts.
- Listados paginados con navegación, tamaño de página y rango de resultados.

## Flujo principal

1. El jugador inicia sesión y ve en **Inicio** su rating Glicko-2 y su puesto en la comunidad.
2. Busca un rival cercano o de su comunidad y **crea la partida**.
3. Registra el marcador set por set, en vivo o al final.
4. El rival **confirma** el resultado (o lo disputa).
5. El backend recalcula el rating de forma asíncrona y el cambio se refleja en el ranking y en **Estadísticas**.

## Arquitectura

La aplicación está construida con React, TypeScript, Vite, Tailwind CSS, React Router y Axios.

- `src/services`: cliente HTTP centralizado, interceptores JWT y servicios por recurso.
- `src/hooks`: lógica reutilizable para requests, paginación, debounce, geolocalización y partidas en vivo.
- `src/context`: sesión, planes, registro y notificaciones globales.
- `src/components`: componentes presentacionales reutilizables, layouts, estados de pantalla, diálogos y controles.
- `src/pages`: vistas de autenticación, dashboard, partidas, Social, ranking, estadísticas, perfil y administración.
- `src/routes/router.tsx`: rutas públicas, privadas, administrativas, dinámicas y carga diferida.
- `src/utils`: normalización de respuestas, errores y paginación.

Las requests usan `VITE_API_BASE_URL`, headers de autenticación y refresh automático del access token. `useFetch` cancela requests al desmontar componentes mediante `AbortController`. La sesión web se conserva en el almacenamiento del navegador; no se deben incluir tokens ni archivos `.env` en el repositorio.

## Dónde se cumple cada criterio

| Criterio | Implementación |
| --- | --- |
| Cliente HTTP centralizado | `src/services/http.ts`: `baseURL` desde `VITE_API_BASE_URL`, interceptor del JWT, refresh token y errores globales |
| Cancelación de requests | `src/hooks/use-fetch.ts` y `use-paginated.ts` con `AbortController` |
| Custom hooks | `useFetch`, `usePaginated`, `useDebounce`, `useGeolocation`, `useLiveMatch` |
| Estado global | `src/context`: `session`, `plan`, `toast`, `registration` |
| Rutas | `src/routes/router.tsx`: `PrivateRoute`, `AdminRoute`, `:id`, `React.lazy` + `Suspense`, 404 y breadcrumbs |
| Paginación | `PaginationBar` + `?page=&size=` en comunidades, ranking, historial de partidas y administración |
| Errores y carga | `ErrorBoundary`, `ScreenState` (spinner, vacío, reintento) y mensajes por código 400/401/403/404/409/500 en `src/utils/api-error.ts` |
| Acciones destructivas | `ConfirmDialog` antes de cancelar partidas, salir de comunidades y aprobar clubes |
| UI/UX | Tailwind con tokens del sistema de diseño, iconos Lucide, responsive con barra inferior en móvil y animaciones que respetan `prefers-reduced-motion` |
| Deployment | Vercel (web) y AWS EC2 con HTTPS mediante DuckDNS (API); variables de entorno de producción configuradas en cada plataforma |

## Requisitos

- Node.js 22 o superior.
- Backend disponible localmente o mediante una URL pública.

## Instalación y uso

```bash
cp .env.example .env
npm install
npm run dev
```

En Windows PowerShell usa `Copy-Item .env.example .env` en lugar de `cp`.

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL base del backend, sin `/api/v1`. |

En desarrollo, el origen local (por defecto `http://localhost:5173`) debe estar en `CORS_ALLOWED_ORIGINS` del backend. En producción, `VITE_API_BASE_URL` se configura en las variables de entorno de Vercel.

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # typecheck y build de producción
npm run lint      # análisis estático
npm run preview   # previsualización del build
```

## Integrantes y participación

| Integrante | Código | Aportes principales | Participación |
| --- | --- | --- | --- |
| Adriana Celeste Sevillano Común | 202310146 | Backend, sistema de diseño, pantallas y flujos de Mobile, pruebas y coordinación | 100 % |
| Treicy Calsina Gutiérrez | 202520007 | Despliegue, URLs y usuarios para la demo | 100 % |
| Adriana Celeste Alvarado León | 202420154 | Coach de postura en Mobile; partidas, Inicio, estadísticas, onboarding e inicio de sesión en Web | 100 % |
| Andrea Alejandra Vidal Coello | 202410193 | Revisión del proyecto y flujo de amistad (Pongmigos) | 100 % |
