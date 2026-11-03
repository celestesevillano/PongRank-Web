import { Card } from '@/components/ui/card';

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </Card>
  );
}
