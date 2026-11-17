import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import {
  signedRating,
  STATISTICS_PERIODS,
  type RatingPoint,
  type StatisticsPeriod,
} from "@/utils/statistics";

const CYAN = "#22D3EE";
const LOSS = "#FF8990";
const PLOT_HEIGHT = 120;
const INSET = 8;
const MAX_DOTS = 32;

const shortDate = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
});

type RatingChartProps = {
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
  points: RatingPoint[];
  incomplete: boolean;
};

export function RatingChart({
  period,
  onPeriodChange,
  points,
  incomplete,
}: RatingChartProps) {
  return (
    <section
      aria-labelledby="rating-chart-title"
      className="flex flex-col gap-2 rounded-2xl border border-[#344047] bg-[#101519] p-4"
    >
      <div className="flex items-center gap-2">
        <TrendingUp aria-hidden className="size-5.5 text-accent" />
        <h2 id="rating-chart-title" className="flex-1 text-lg font-extrabold">
          Evolución del rating
        </h2>
      </div>
      <div className="flex gap-2">
        {STATISTICS_PERIODS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === period}
            onClick={() => onPeriodChange(item)}
            className={`min-h-11 flex-1 rounded-full border p-1 font-semibold transition active:opacity-75 ${item === period ? "border-brand bg-primary text-white" : "border-[#344047] text-[#B8BDC3] hover:border-muted"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {points.length > 0 && <RatingPlot key={period} points={points} />}
      {incomplete ? (
        <p className="py-2 text-sm text-[#B8BDC3]">
          {points.length > 0
            ? "Se muestra el historial de rating que se pudo reconstruir."
            : "Aún no está disponible el historial de rating de este periodo."}
        </p>
      ) : (
        points.length === 0 && (
          <p className="py-2 text-sm text-[#B8BDC3]">
            Sin partidas confirmadas en este periodo.
          </p>
        )
      )}
    </section>
  );
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function RatingPlot({ points }: { points: RatingPoint[] }) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [canvasRef, width] = useElementWidth<HTMLDivElement>();
  const [selectedId, setSelectedId] = useState<number>();
  const lastIndex = points.length - 1;
  const selectedIndex = points.findIndex(({ id }) => id === selectedId);
  const index = selectedIndex < 0 ? lastIndex : selectedIndex;
  const point = points[index];
  const first = points[0];
  const last = points[lastIndex];

  const ratings = points.map(({ rating }) => rating);
  const lowest = Math.min(...ratings);
  const highest = Math.max(...ratings);
  const step = Math.max(10, Math.ceil((highest - lowest) / 30) * 10);
  const top = Math.ceil(highest / step) * step;
  const labels = [top, top - step, top - step * 2, top - step * 3];
  if (labels[3] > lowest) labels.push(top - step * 4);
  const bottom = labels[labels.length - 1];
  const toY = (rating: number) =>
    INSET + (PLOT_HEIGHT * (top - rating)) / (top - bottom);

  const coords = points.map((entry, i) => ({
    x:
      INSET +
      (width - 2 * INSET) *
        (last.date === first.date
          ? lastIndex === 0
            ? 0.5
            : i / lastIndex
          : (entry.date - first.date) / (last.date - first.date)),
    y: toY(entry.rating),
  }));
  const path = coords
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ");
  const selected = coords[index];
  const baseline = PLOT_HEIGHT + INSET;

  const selectNearest = (event: MouseEvent<HTMLDivElement>) => {
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const nearest = coords.reduce(
      (best, candidate, i) =>
        Math.abs(candidate.x - x) <= Math.abs(coords[best].x - x) ? i : best,
      0,
    );
    setSelectedId(points[nearest].id);
  };

  return (
    <div className="fade-in flex flex-col gap-1">
      <div className="flex items-stretch gap-2">
        <div
          aria-hidden
          className="flex flex-col justify-between py-0.5 text-xs text-[#B8BDC3] tabular-nums"
        >
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div
          ref={canvasRef}
          aria-hidden
          onClick={selectNearest}
          className="min-w-0 flex-1 cursor-crosshair"
          style={{ minHeight: PLOT_HEIGHT + 2 * INSET }}
        >
          {width > INSET * 2 && (
            <svg
              width={width}
              height={PLOT_HEIGHT + 2 * INSET}
              className="block"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={CYAN} stopOpacity={0.32} />
                  <stop offset="1" stopColor={CYAN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {labels.map((label) => (
                <line
                  key={label}
                  x1={0}
                  x2={width}
                  y1={toY(label)}
                  y2={toY(label)}
                  stroke="#37464C"
                  strokeDasharray="4 4"
                />
              ))}
              {points.length > 1 && (
                <>
                  <path
                    d={`${path} L${coords[lastIndex].x} ${baseline} L${coords[0].x} ${baseline} Z`}
                    fill={`url(#${gradientId})`}
                  />
                  <path
                    d={path}
                    stroke={CYAN}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    fill="none"
                  />
                </>
              )}
              {points.length <= MAX_DOTS &&
                coords.map(({ x, y }, i) => (
                  <circle key={points[i].id} cx={x} cy={y} r={3} fill={CYAN} />
                ))}
              <line
                x1={selected.x}
                x2={selected.x}
                y1={selected.y}
                y2={baseline}
                stroke={CYAN}
                strokeOpacity={0.55}
                strokeDasharray="3 3"
              />
              <circle
                cx={selected.x}
                cy={selected.y}
                r={6}
                fill="#000"
                stroke={CYAN}
                strokeWidth={2}
              />
              <circle cx={selected.x} cy={selected.y} r={2.5} fill="#fff" />
            </svg>
          )}
        </div>
      </div>
      {first.date !== last.date && (
        <div className="flex justify-between pl-10 text-xs text-[#B8BDC3] tabular-nums">
          <span>{shortDate.format(first.date)}</span>
          <span>{shortDate.format(last.date)}</span>
        </div>
      )}
      <div className="flex items-center rounded-[14px] border border-[#215360] bg-[#0A2229]">
        <PointButton
          direction="previous"
          disabled={index === 0}
          onClick={() => setSelectedId(points[index - 1].id)}
        />
        <div
          aria-live="polite"
          className="flex flex-1 flex-col items-center py-1"
        >
          <span className="text-xs text-[#B8BDC3]">
            {shortDate.format(point.date)}
          </span>
          <span className="text-sm font-bold tabular-nums">
            {Math.round(point.rating)}{" "}
            <span style={{ color: point.delta < 0 ? LOSS : CYAN }}>
              {signedRating(point.delta)} pts
            </span>
          </span>
        </div>
        <PointButton
          direction="next"
          disabled={index === lastIndex}
          onClick={() => setSelectedId(points[index + 1].id)}
        />
      </div>
    </div>
  );
}

function PointButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const previous = direction === "previous";
  const Icon = previous ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={previous ? "Punto anterior" : "Punto siguiente"}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 w-11 items-center justify-center rounded-[14px] transition hover:bg-white/5 disabled:opacity-25"
    >
      <Icon aria-hidden className="size-4.5 text-accent" />
    </button>
  );
}
