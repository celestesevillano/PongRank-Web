import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="text-2xl font-bold">No encontramos esa página</h1>
      <Link to="/" className="rounded-xl bg-brand px-4 py-2.5 font-bold">
        Volver al inicio
      </Link>
    </div>
  );
}
