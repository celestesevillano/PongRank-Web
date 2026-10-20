import { Button } from '@/components/ui/button';
import { PAGE_SIZES } from '@/hooks/use-paginated';
import type { Page } from '@/types/api';
import { pageRange } from '@/utils/pagination';

type PaginationBarProps = {
  page: Page<unknown>;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
};

export function PaginationBar({ page, size, onPageChange, onSizeChange }: PaginationBarProps) {
  const { from, to } = pageRange(page);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
      <label className="flex items-center gap-2 text-muted">
        Por página
        <select
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
          className="rounded-lg border border-line bg-black px-2 py-1 text-white"
        >
          {PAGE_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <Button variant="secondary" disabled={page.first} onClick={() => onPageChange(page.page - 1)}>
          ‹ Anterior
        </Button>
        <span className="text-muted">
          {from}–{to} de {page.totalElements}
        </span>
        <Button variant="secondary" disabled={page.last} onClick={() => onPageChange(page.page + 1)}>
          Siguiente ›
        </Button>
      </div>
    </div>
  );
}
