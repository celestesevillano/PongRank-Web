import {
  ChartNoAxesColumnIncreasing,
  RotateCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { CardLighting } from "@/components/common/card-lighting";
import { ScreenState } from "@/components/common/screen-state";
import { Spinner } from "@/components/common/spinner";
import { RatingChart } from "@/components/statistics/rating-chart";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/context/plan";
import { useSession } from "@/context/session";
import { useFetch } from "@/hooks/use-fetch";
import { BrandImages } from "@/lib/brand";
import { paths } from "@/routes/paths";
import { authService } from "@/services/auth.service";
import { matchesService } from "@/services/matches.service";
import {
  computeStatistics,
  filterRating,
  monthlyResults,
  signedRating,
  streakMessage,
  type Statistics,
  type StatisticsPeriod,
} from "@/utils/statistics";

const CYAN = "#22D3EE";
const RED = "#E8262F";
const AMBER = "#FFD278";

const StatisticsArt = {
  streak: "/illustrations/statistics/pongrank-current-streak.webp",
  bestVictory: "/illustrations/statistics/pongrank-best-victory-banner.webp",
} as const;

export default function StatisticsPage() {
  const { player } = useSession();
  const { plan, loading, refresh } = usePlan();

  if (plan?.plan === "FREEMIUM") return <Navigate to={paths.home} replace />;
  if (!plan) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <p className="text-muted">No pudimos verificar tu plan.</p>
            <Button variant="secondary" icon={RotateCw} onClick={refresh}>
              Reintentar
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <StatisticsView
      key={player!.id}
      playerId={player!.id}
      sessionRating={player!.ratingGlicko}
    />
  );
}

function StatisticsView({
  playerId,
  sessionRating,
}: {
  playerId: number;
  sessionRating: number;
}) {
  const [period, setPeriod] = useState<StatisticsPeriod>("Mes");
  const history = useFetch(
    async (signal) => {
      const [matches, me] = await Promise.all([
        matchesService.confirmedHistory(playerId, signal),
        authService.me(signal),
      ]);
      return {
        stats: computeStatistics(matches, playerId, me.ratingGlicko),
        rating: me.ratingGlicko,
        now: Date.now(),
      };
    },
    [playerId],
  );

  const snapshot = history.data;
  const selected = useMemo(
    () => snapshot && filterRating(snapshot.stats, period, snapshot.now),
    [period, snapshot],
  );
  const insight = snapshot && monthlyResults(snapshot.stats, snapshot.now);
  const rating = snapshot?.rating ?? sessionRating;
  const delta = selected?.delta;
  const DeltaIcon = delta != null && delta < 0 ? TrendingDown : TrendingUp;
  const deltaColor =
    delta != null && delta < 0 ? "text-[#FF8990]" : "text-accent";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Hero />

      <section
        aria-label="Rating actual"
        className="relative overflow-hidden rounded-2xl border border-[#248997] bg-[#071C23] p-4"
      >
        <CardLighting color={CYAN} court />
        <p className="relative text-xs font-bold tracking-wider text-[#B8BDC3]">
          RATING ACTUAL
        </p>
        <div className="relative flex flex-wrap items-center gap-4">
          <p className="text-5xl font-black tabular-nums">
            {Number.isFinite(rating) ? Math.round(rating) : "—"}
          </p>
          {delta != null && !history.error && (
            <p
              aria-label={`Variación en ${period.toLowerCase()}: ${signedRating(delta)} puntos`}
              className={`fade-in flex items-center gap-1 rounded-2xl border border-[#215360] bg-[#09191F] px-2 py-1 text-[15px] font-extrabold tabular-nums ${deltaColor}`}
            >
              <DeltaIcon aria-hidden className="size-4" />
              {signedRating(delta)} pts
            </p>
          )}
        </div>
      </section>

      <ScreenState
        loading={history.loading}
        error={history.error}
        data={snapshot}
        onRetry={history.refetch}
      >
        {({ stats }) => (
          <>
            {selected && (
              <RatingChart
                period={period}
                onPeriodChange={setPeriod}
                points={selected.points}
                incomplete={selected.incomplete}
              />
            )}
            {insight && (
              <section className="relative flex items-center gap-2 overflow-hidden rounded-2xl border border-[#24616A] bg-[#081A20] p-4">
                <CardLighting color={CYAN} court />
                <span className="relative rounded-[10px] bg-[#10333C] p-2">
                  <TrendingUp aria-hidden className="size-5.5 text-accent" />
                </span>
                <img
                  src={BrandImages.introBall}
                  alt=""
                  className="pointer-events-none absolute right-1.5 bottom-2.5 size-10 opacity-80"
                />
                <div className="relative flex flex-1 flex-col gap-1 pr-7">
                  <h2 className="text-sm font-extrabold">
                    Tus últimos 30 días
                  </h2>
                  <p className="text-sm text-[#B8BDC3] tabular-nums">
                    {insight.wins === 0
                      ? `Jugaste ${insight.played} partidas sin victorias.`
                      : `Ganaste ${insight.wins} de tus ${insight.played} partidas.`}
                  </p>
                </div>
              </section>
            )}
            <Results wins={stats.wins} losses={stats.losses} />
            <div className="grid gap-2 sm:grid-cols-2">
              <StreakCard streak={stats.streak} />
              <BestVictoryCard best={stats.best} />
            </div>
          </>
        )}
      </ScreenState>
    </div>
  );
}

function Hero() {
  const lightId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const trailId = `${lightId}trail`;

  return (
    <header className="relative flex min-h-29 flex-col justify-end overflow-hidden pb-1">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 -right-2 bottom-0 w-[51%] max-w-80 [mask-image:linear-gradient(to_right,transparent,black_30%)]"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 180 116"
          preserveAspectRatio="xMaxYMid slice"
          className="absolute inset-0"
        >
          <defs>
            <radialGradient id={lightId} cx="76%" cy="42%" r="56%">
              <stop offset="0" stopColor="#FF343F" stopOpacity={0.44} />
              <stop offset="0.54" stopColor="#E51B36" stopOpacity={0.19} />
              <stop offset="1" stopColor="#DC1F31" stopOpacity={0} />
            </radialGradient>
            <linearGradient id={trailId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0" stopColor={RED} stopOpacity={0} />
              <stop offset="1" stopColor="#FF374A" stopOpacity={0.92} />
            </linearGradient>
          </defs>
          <rect width="180" height="116" fill={`url(#${lightId})`} />
          <path
            d="M0 110 Q65 43 120 41 Q71 57 0 110Z"
            fill={`url(#${trailId})`}
            opacity={0.42}
          />
          <path
            d="M0 99 Q65 44 118 39 M18 109 Q66 63 115 48"
            stroke={`url(#${trailId})`}
            strokeWidth={1.6}
            fill="none"
          />
          <path
            d="M53 99 L180 79 M45 108 L180 87 M91 93 L90 116 M107 91 L107 116 M122 88 L125 116 M138 86 L143 116 M155 83 L160 116 M170 81 L175 116"
            stroke="#66838D"
            strokeOpacity={0.18}
            strokeWidth={0.8}
            fill="none"
          />
        </svg>
        <img
          src={BrandImages.introPaddle}
          alt=""
          className="absolute top-1 -right-px h-30.5 w-29 object-contain"
        />
        <img
          src={BrandImages.introBall}
          alt=""
          className="absolute top-11 right-23.5 size-10 object-contain"
        />
      </div>
      <div className="relative flex items-start">
        <h1 className="text-[34px] leading-tight font-black italic">
          Estadísticas
        </h1>
        <svg
          aria-hidden
          width={24}
          height={28}
          viewBox="0 0 24 28"
          className="-mt-1 ml-0.5"
        >
          <path
            d="M3 12 L8 2 M9 17 L20 9 M12 23 L23 21"
            stroke="#FF3145"
            strokeWidth={3.2}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      <p className="relative mt-1 text-sm font-medium text-[#C2C4CA]">
        Tu rendimiento en la mesa
      </p>
    </header>
  );
}

function Results({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;

  return (
    <section
      aria-labelledby="results-title"
      className="flex flex-col gap-2 rounded-2xl border border-[#344047] bg-[#101519] p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ChartNoAxesColumnIncreasing
          aria-hidden
          className="size-5 text-accent"
        />
        <h2 id="results-title" className="grow text-lg font-extrabold">
          Resultados
        </h2>
        {total > 0 && (
          <span className="text-[13px] font-bold text-accent tabular-nums">
            {Math.round((100 * wins) / total)} % de victorias
          </span>
        )}
      </div>
      <div
        aria-hidden
        className="my-1 flex h-2.5 overflow-hidden rounded-lg bg-[#344047]"
      >
        {wins > 0 && (
          <span
            className="bg-accent transition-[flex-grow] duration-500"
            style={{ flexGrow: wins }}
          />
        )}
        {losses > 0 && (
          <span
            className="bg-brand transition-[flex-grow] duration-500"
            style={{ flexGrow: losses }}
          />
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-[13px] text-[#B8BDC3] tabular-nums">
        <span className="text-accent">
          {wins} {wins === 1 ? "victoria" : "victorias"}
        </span>
        <span className="text-[#FF8990]">
          {losses} {losses === 1 ? "derrota" : "derrotas"}
        </span>
        <span>
          {total} {total === 1 ? "partida" : "partidas"}
        </span>
      </div>
    </section>
  );
}

function HighlightBody({
  value,
  detail,
  artwork,
}: {
  value: string | number;
  detail?: string;
  artwork: string;
}) {
  return (
    <div className="relative flex min-h-18 flex-col justify-center gap-0.5 pr-13">
      <span className="truncate text-xl font-extrabold tabular-nums">
        {value}
      </span>
      {detail && (
        <span className="text-sm text-[#B8BDC3] tabular-nums">{detail}</span>
      )}
      <img
        src={artwork}
        alt=""
        className="pointer-events-none absolute top-0 -right-3 size-18 object-contain"
      />
    </div>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <section className="relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-2xl border border-[#A03543] bg-[#231318] p-4">
      <CardLighting color={RED} />
      <h2 className="relative text-sm font-extrabold">Racha actual</h2>
      <HighlightBody
        value={streak}
        detail={
          streak === 1 ? "victoria consecutiva" : "victorias consecutivas"
        }
        artwork={StatisticsArt.streak}
      />
      <p
        className="relative mt-1 self-start rounded-lg bg-[#3B2914] p-2 text-xs font-bold"
        style={{ color: AMBER }}
      >
        {streakMessage(streak)}
      </p>
    </section>
  );
}

function BestVictoryCard({ best }: { best: Statistics["best"] }) {
  const cardClass =
    "relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-2xl border border-[#927035] bg-[#161613] p-4";

  if (!best) {
    return (
      <section className={cardClass}>
        <CardLighting color={AMBER} />
        <h2 className="relative text-sm font-extrabold">Mejor victoria</h2>
        <p className="relative text-sm text-[#B8BDC3]">Aún sin victorias.</p>
      </section>
    );
  }

  const opponentRating = Number.isFinite(best.opponent.ratingGlicko)
    ? `Rating ${Math.round(best.opponent.ratingGlicko)}`
    : undefined;

  return (
    <Link
      to={paths.matchDetail(best.id)}
      className={`${cardClass} transition hover:brightness-125 active:opacity-75`}
    >
      <CardLighting color={AMBER} />
      <h2 className="relative text-sm font-extrabold">Mejor victoria</h2>
      <HighlightBody
        value={best.opponent.name}
        detail={opponentRating}
        artwork={StatisticsArt.bestVictory}
      />
      <span className="relative mt-auto text-xs font-bold text-accent">
        Ver partida
      </span>
    </Link>
  );
}
