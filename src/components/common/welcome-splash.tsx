import { useEffect, useState } from 'react';

const SEEN_KEY = 'pongrank.welcome-seen';
const DURATION_MS = 2200;

const hasSeenSplash = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
};

export function WelcomeSplash() {
  const [visible, setVisible] = useState(() => !hasSeenSplash());

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      return;
    }
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="splash" role="presentation" onClick={() => setVisible(false)}>
      <div className="splash__glow" />
      <div className="splash__stage">
        <div className="splash__paddle" />
        <div className="splash__ball" />
        <div className="splash__shock" />
      </div>
      <h1 className="splash__title">
        Pong<span>Rank</span>
      </h1>
      <p className="splash__tagline">Juega. Sube. Compite.</p>
    </div>
  );
}
