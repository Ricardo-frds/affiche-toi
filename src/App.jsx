import { useState, useEffect, useMemo } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Carte from "./components/Carte";
import RueParis from "./components/RueParis";
import Classement from "./components/Classement";
import "./App.css";

const TABS = [
  { id: "carte",      label: "Carte de France", icon: "🗺" },
  { id: "paris",      label: "Rue de Paris",    icon: "🏙" },
  { id: "classement", label: "Classement",      icon: "🏆" },
];

function LogoMark() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lmGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#lmGrad)" />
      <path d="M18 7.5C13.9 7.5 10.5 10.9 10.5 15C10.5 20.9 18 28.5 18 28.5C18 28.5 25.5 20.9 25.5 15C25.5 10.9 22.1 7.5 18 7.5Z" fill="white" opacity="0.92"/>
      <circle cx="18" cy="15" r="3.8" fill="url(#lmGrad)" />
    </svg>
  );
}

function FooterStats() {
  const { pageViews, totalRevenu, freeCount } = useApp();
  return (
    <div className="footer-mini-stats">
      <div className="footer-mini-stat">
        <span className="fms-val" style={{ color: "#60a5fa" }}>{pageViews.toLocaleString("fr-FR")}</span>
        <span className="fms-label">vues</span>
      </div>
      <div className="fms-sep" />
      <div className="footer-mini-stat">
        <span className="fms-val" style={{ color: "#4ade80" }}>{totalRevenu.toLocaleString("fr-FR")} €</span>
        <span className="fms-label">misés</span>
      </div>
      <div className="fms-sep" />
      <div className="footer-mini-stat">
        <span className="fms-val" style={{ color: "#f59e0b" }}>{freeCount}</span>
        <span className="fms-label">places libres</span>
      </div>
    </div>
  );
}

function HeaderStats() {
  const { activeUsers, pageViews, totalRevenu } = useApp();
  return (
    <div className="header-stats-bar">
      <div className="hstat">
        <span className="live-dot" />
        <strong>{activeUsers}</strong>
        <span>en ligne</span>
      </div>
      <div className="hstat-sep" />
      <div className="hstat">
        <span className="hstat-icon">👁</span>
        <strong>{pageViews.toLocaleString("fr-FR")}</strong>
        <span>vues</span>
      </div>
      <div className="hstat-sep" />
      <div className="hstat">
        <span className="hstat-icon">💰</span>
        <strong>{totalRevenu.toLocaleString("fr-FR")} €</strong>
        <span>misés</span>
      </div>
    </div>
  );
}

/* Données fixes pour l'illustration */
const ILLUS_CITIES = [
  { cx: 198, cy: 148, label: "Paris",     couleur: "#f59e0b", r: 7, bid: "320 €", delay: "0s"   },
  { cx: 242, cy: 258, label: "Lyon",      couleur: "#3b82f6", r: 5, bid: "120 €", delay: "0.8s" },
  { cx: 215, cy: 318, label: "Marseille", couleur: "#ec4899", r: 5, bid: "85 €",  delay: "1.4s" },
  { cx: 102, cy: 268, label: "Bordeaux",  couleur: "#10b981", r: 4, bid: "60 €",  delay: "2s"   },
  { cx: 270, cy: 190, label: "Grenoble",  couleur: "#a78bfa", r: 4, bid: "45 €",  delay: "2.6s" },
];

const FRANCE_PATH =
  "M 155,18 L 190,8 L 230,12 L 268,22 L 302,48 L 328,72 L 338,112 " +
  "L 342,158 L 328,200 L 318,235 L 298,258 L 282,285 L 262,310 " +
  "L 238,330 L 205,338 L 170,328 L 142,308 L 118,285 L 94,260 " +
  "L 72,232 L 62,200 L 58,168 L 62,138 L 52,112 L 48,88 " +
  "L 62,68 L 88,52 L 112,42 L 138,28 Z";

const MINI_BUILDINGS = [
  { x: 55,  w: 48, h: 110, col: "#f59e0b" },
  { x: 115, w: 62, h: 155, col: "#3b82f6" },
  { x: 190, w: 54, h: 130, col: "#ec4899" },
  { x: 258, w: 44, h: 95,  col: "#10b981" },
  { x: 314, w: 50, h: 118, col: "#a78bfa" },
];

function HeroIllustration() {
  return (
    <div className="hero-illus">
      {/* Cartes d'enchères flottantes */}
      {ILLUS_CITIES.map((c) => (
        <div key={c.label} className="hero-float-card"
          style={{ "--glow": c.couleur, animationDelay: c.delay }}>
          <span className="hfc-dot" style={{ background: c.couleur }} />
          <div className="hfc-info">
            <span className="hfc-label">{c.label}</span>
            <span className="hfc-bid" style={{ color: c.couleur }}>{c.bid}</span>
          </div>
        </div>
      ))}

      {/* SVG principal */}
      <svg viewBox="0 0 400 440" className="hero-illus-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="hFranceGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%"   stopColor="#1a3a6e" />
            <stop offset="60%"  stopColor="#0f2040" />
            <stop offset="100%" stopColor="#07111f" />
          </radialGradient>
          <radialGradient id="hGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <filter id="hBlur"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="hBlur3"><feGaussianBlur stdDeviation="3" /></filter>
          <linearGradient id="hSkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#06010e" />
            <stop offset="55%"  stopColor="#0d0320" />
            <stop offset="100%" stopColor="#180a28" />
          </linearGradient>
          <linearGradient id="hRoadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#12152a" />
            <stop offset="100%" stopColor="#07080f" />
          </linearGradient>
          <clipPath id="hClip">
            <rect x="0" y="0" width="400" height="440" />
          </clipPath>
        </defs>

        <g clipPath="url(#hClip)">
          {/* ── Carte de France ── */}
          {/* Halo global derrière la France */}
          <ellipse cx="195" cy="178" rx="175" ry="185"
            fill="url(#hGlow)" filter="url(#hBlur)" />

          {/* Silhouette France — halo */}
          <path d={FRANCE_PATH} fill="#2563eb" opacity="0.18" filter="url(#hBlur)" />
          {/* Silhouette France — corps */}
          <path d={FRANCE_PATH} fill="url(#hFranceGrad)"
            stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
          {/* Réseau de lignes internes (grille approximative) */}
          {[80,120,160,200,240,280].map(x => (
            <line key={x} x1={x} y1={20} x2={x} y2={340}
              stroke="rgba(59,130,246,0.07)" strokeWidth="0.8" />
          ))}
          {[60,100,140,180,220,260,300].map(y => (
            <line key={y} x1={48} y1={y} x2={342} y2={y}
              stroke="rgba(59,130,246,0.07)" strokeWidth="0.8" />
          ))}

          {/* Points de villes */}
          {ILLUS_CITIES.map((c) => (
            <g key={c.label}>
              {/* Anneau pulsant */}
              <circle cx={c.cx} cy={c.cy} r={c.r + 10}
                fill="none" stroke={c.couleur} strokeWidth="1" opacity="0.4"
                style={{ animation: `pulseRing 2.4s ${c.delay} ease-out infinite` }} />
              <circle cx={c.cx} cy={c.cy} r={c.r + 20}
                fill="none" stroke={c.couleur} strokeWidth="0.5" opacity="0.2"
                style={{ animation: `pulseRing 2.4s ${c.delay} ease-out infinite` }} />
              {/* Point principal */}
              <circle cx={c.cx} cy={c.cy} r={c.r}
                fill={c.couleur}
                style={{ filter: `drop-shadow(0 0 6px ${c.couleur})` }} />
              <circle cx={c.cx} cy={c.cy} r={c.r * 0.4} fill="rgba(255,255,255,0.8)" />
            </g>
          ))}

          {/* ── Scène Rue de Paris ── */}
          {/* Ciel de nuit */}
          <rect x="0" y="345" width="400" height="95" fill="url(#hSkyGrad)" />
          {/* Quelques étoiles */}
          {[30,80,130,200,260,310,360].map((x, i) => (
            <circle key={x} cx={x} cy={350 + (i % 3) * 6} r={0.8}
              fill="white" opacity={0.4 + (i % 3) * 0.2} />
          ))}

          {/* Bâtiments */}
          {MINI_BUILDINGS.map((b, i) => {
            const sw = Math.round(b.w * 0.3);
            const sh = Math.round(sw * 0.4);
            const baseY = 393;
            const topY = baseY - b.h;
            const crownH = 10;
            const archTop = topY - crownH;
            const archPath = [
              `M ${b.x},${topY}`,
              `L ${b.x},${archTop + crownH * 0.35}`,
              `Q ${b.x + b.w * 0.5},${archTop - crownH * 0.3} ${b.x + b.w},${archTop + crownH * 0.35}`,
              `L ${b.x + b.w},${topY} Z`,
            ].join(" ");
            return (
              <g key={i}>
                {/* Halo sol */}
                <ellipse cx={b.x + b.w / 2} cy={baseY + 2} rx={b.w * 0.7} ry={5}
                  fill={b.col} opacity={0.2} />
                {/* Face latérale */}
                <polygon
                  points={`${b.x+b.w},${baseY} ${b.x+b.w+sw},${baseY-sh} ${b.x+b.w+sw},${topY-sh} ${b.x+b.w},${topY}`}
                  fill="#040c18" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                {/* Façade */}
                <rect x={b.x} y={topY} width={b.w} height={b.h}
                  fill="#07111f" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                {/* Colonne néon gauche */}
                <rect x={b.x + 1.5} y={topY} width={2} height={b.h}
                  fill={b.col} opacity={0.8}
                  style={{ filter: `drop-shadow(0 0 3px ${b.col})` }} />
                {/* Couronne halo */}
                <path d={archPath} fill={b.col} opacity={0.25} filter="url(#hBlur3)" />
                {/* Couronne */}
                <path d={archPath} fill={b.col}
                  style={{ filter: `drop-shadow(0 0 6px ${b.col})`, animation: "neonFlicker 6s ease-in-out infinite" }} />
                {/* Billboard */}
                <rect x={b.x + 3} y={topY + 5} width={b.w - 6} height={b.h * 0.3}
                  fill="#030810" rx="1.5" />
                <rect x={b.x + 5} y={topY + 7} width={b.w - 10} height={b.h * 0.3 - 4}
                  fill="none" stroke={b.col} strokeWidth="1" rx="1"
                  style={{ filter: `drop-shadow(0 0 3px ${b.col})` }} />
                {/* Rang */}
                <circle cx={b.x + b.w - 7} cy={topY + 8} r={6}
                  fill={i === 1 ? "#f59e0b" : "#050e1c"}
                  stroke={i === 1 ? "#fcd34d" : b.col} strokeWidth="0.8" />
                <text x={b.x + b.w - 7} y={topY + 8}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={i === 1 ? "#000" : "#fff"}
                  fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="5">
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Trottoir */}
          <rect x="0" y="393" width="400" height="6" fill="#1a2a3e" />
          {/* Route */}
          <rect x="0" y="399" width="400" height="41" fill="url(#hRoadGrad)" />
          {/* Pointillés */}
          <line x1="0" y1="421" x2="400" y2="421"
            stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="20,16" />

          {/* Lampadaires */}
          {[55, 185, 320].map((lx, i) => (
            <g key={i}>
              <line x1={lx} y1="393" x2={lx} y2="358"
                stroke="#1e2d3d" strokeWidth="1.5" />
              <line x1={lx} y1="358" x2={lx + 12} y2="354"
                stroke="#1e2d3d" strokeWidth="1" />
              <circle cx={lx + 12} cy="353" r="3"
                fill="rgba(254,243,199,0.9)"
                style={{ filter: "drop-shadow(0 0 5px rgba(254,243,199,0.6))" }} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function Hero({ onCarte, onParis }) {
  const { activeUsers, pageViews, totalRevenu, parisBids, freeCount } = useApp();

  return (
    <section className="hero">
      <div className="hero-bg-orb hero-bg-orb1" />
      <div className="hero-bg-orb hero-bg-orb2" />
      <div className="hero-bg-orb hero-bg-orb3" />
      <div className="hero-grid-overlay" />

      <div className="hero-inner">
        <div className="hero-content">

          {/* Pill live */}
          <div className="hero-eyebrow">
            <span className="live-dot" />
            <span><strong>{activeUsers}</strong> personnes voient cette page en ce moment</span>
          </div>

          {/* Titre principal */}
          <h2 className="hero-title">
            Votre pub,<br />
            <span className="hero-title-accent">sur toute la France</span>
          </h2>

          {/* Description */}
          <p className="hero-desc">
            Enchérissez sur un département ou une place en Rue de Paris.
            La mise la plus haute gagne la visibilité — classement en temps réel.
          </p>

          {/* CTAs */}
          <div className="hero-ctas">
            <button className="btn-primary hero-btn-main" onClick={onCarte}>
              <span className="hero-btn-icon">🗺</span>
              <span>Choisir un département</span>
              <span className="hero-btn-arrow">→</span>
            </button>
            <button className="btn-primary btn-gold hero-btn-sec" onClick={onParis}>
              <span>🏙</span>
              <span>Rue de Paris</span>
            </button>
          </div>

          {/* Trust signals */}
          <div className="hero-trust">
            <span className="hero-trust-item">dès 5 €</span>
            <span className="hero-trust-sep">·</span>
            <span className="hero-trust-item">visible immédiatement</span>
            <span className="hero-trust-sep">·</span>
            <span className="hero-trust-item">aucune inscription</span>
          </div>

          {/* Métriques live */}
          <div className="hero-metrics">
            <div className="hero-metric">
              <span className="hero-metric-val" style={{ color: "#60a5fa" }}>
                {pageViews.toLocaleString("fr-FR")}
              </span>
              <span className="hero-metric-label">vues</span>
            </div>
            <div className="hero-metric-sep" />
            <div className="hero-metric">
              <span className="hero-metric-val" style={{ color: "#4ade80" }}>
                {totalRevenu.toLocaleString("fr-FR")} €
              </span>
              <span className="hero-metric-label">misés</span>
            </div>
            <div className="hero-metric-sep" />
            <div className="hero-metric">
              <span className="hero-metric-val" style={{ color: "#f59e0b" }}>
                {freeCount}
              </span>
              <span className="hero-metric-label">places libres</span>
            </div>
            <div className="hero-metric-sep" />
            <div className="hero-metric">
              <span className="hero-metric-val" style={{ color: "#c084fc" }}>
                {parisBids.length}
              </span>
              <span className="hero-metric-label">pubs Paris</span>
            </div>
          </div>

          {/* Steps */}
          <div className="hero-steps">
            <div className="hero-step">
              <span className="hero-step-num">1</span>
              <span>Choisissez</span>
            </div>
            <div className="hero-step-arrow">→</div>
            <div className="hero-step">
              <span className="hero-step-num">2</span>
              <span>Enchérissez</span>
            </div>
            <div className="hero-step-arrow">→</div>
            <div className="hero-step">
              <span className="hero-step-num">3</span>
              <span>Soyez visible</span>
            </div>
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}

function HomeFeatures({ onCarte, onParis, onClassement }) {
  const { activeUsers, freeCount, parisFree } = useApp();

  return (
    <section className="home-features">
      <div className="home-features-inner">
        <div className="home-section-head">
          <h3 className="home-section-title">Trois façons d'être visible</h3>
          <p className="home-section-sub">Choisissez votre terrain de jeu — enchérissez, brillez, dominez</p>
        </div>
        <div className="home-features-grid">

          <div className="hf-card" style={{ "--accent": "#3b82f6" }} onClick={onCarte}>
            <div className="hf-card-icon">🗺</div>
            <h4 className="hf-card-title">Carte de France</h4>
            <p className="hf-card-desc">96 départements à conquérir. Votre marque visible sur la carte interactive dès votre enchère validée.</p>
            <div className="hf-card-stat">
              <span className="hf-stat-val" style={{ color: "#60a5fa" }}>{freeCount}</span>
              <span className="hf-stat-label">emplacements libres</span>
            </div>
            <div className="hf-card-cta">Explorer la carte <span>→</span></div>
          </div>

          <div className="hf-card hf-card-featured" style={{ "--accent": "#f59e0b" }} onClick={onParis}>
            <div className="hf-card-badge">⭐ Premium</div>
            <div className="hf-card-icon">🏙</div>
            <h4 className="hf-card-title">Rue de Paris</h4>
            <p className="hf-card-desc">12 vitrines de façade en plein Paris. La zone la plus visible, pour les marques les plus ambitieuses.</p>
            <div className="hf-card-stat">
              <span className="hf-stat-val" style={{ color: "#f59e0b" }}>{parisFree}</span>
              <span className="hf-stat-label">vitrines disponibles</span>
            </div>
            <div className="hf-card-cta">Voir la rue <span>→</span></div>
          </div>

          <div className="hf-card" style={{ "--accent": "#a78bfa" }} onClick={onClassement}>
            <div className="hf-card-icon">🏆</div>
            <h4 className="hf-card-title">Classement live</h4>
            <p className="hf-card-desc">Suivez les enchères en temps réel. Comparez, surpassez vos concurrents et montez au sommet.</p>
            <div className="hf-card-stat">
              <span className="hf-stat-val" style={{ color: "#a78bfa" }}>{activeUsers}</span>
              <span className="hf-stat-label">visiteurs actifs</span>
            </div>
            <div className="hf-card-cta">Voir le classement <span>→</span></div>
          </div>

        </div>
      </div>
    </section>
  );
}

function HomeLive({ onCarte, onParis }) {
  const { departementBids, parisBids, clicks } = useApp();

  const topDept = useMemo(
    () => Object.values(departementBids).sort((a, b) => b.montant - a.montant).slice(0, 3),
    [departementBids]
  );
  const topParis = parisBids.slice(0, 3);

  const all = [
    ...topDept.map(b => ({ ...b, type: "dept" })),
    ...topParis.map(b => ({ ...b, type: "paris" })),
  ].slice(0, 6);

  if (all.length === 0) return null;

  return (
    <section className="home-live">
      <div className="home-live-inner">
        <div className="home-section-head">
          <div className="home-section-live-badge">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span>Enchères actives</span>
          </div>
          <h3 className="home-section-title">Ce qui se passe en ce moment</h3>
          <p className="home-section-sub">Les meilleures enchères en cours · mis à jour en temps réel</p>
        </div>
        <div className="home-live-grid">
          {all.map(bid => (
            <div
              key={bid.id}
              className={`home-bid-card${bid.type === "paris" ? " home-bid-card-paris" : ""}`}
              onClick={bid.type === "paris" ? onParis : onCarte}
            >
              <span className="hbc-dot" style={{ background: bid.couleur, boxShadow: `0 0 8px ${bid.couleur}` }} />
              <div className="hbc-info">
                <span className="hbc-name">{bid.nom}</span>
                <span className="hbc-zone">{bid.type === "paris" ? "🏙 Rue de Paris" : `🗺 ${bid.departement}`}</span>
              </div>
              <div className="hbc-right">
                <span className="hbc-amount">{bid.montant} €</span>
                {(clicks[bid.id] || 0) > 0 && (
                  <span className="hbc-clicks">👁 {(clicks[bid.id] || 0).toLocaleString("fr-FR")}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppInner() {
  const [tab, setTab] = useState(() => sessionStorage.getItem("affiche_tab") || null);

  useEffect(() => {
    if (tab === null) sessionStorage.removeItem("affiche_tab");
    else sessionStorage.setItem("affiche_tab", tab);
  }, [tab]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-glow" />
        <div className="header-inner">

          {/* Logo */}
          <div className="header-logo" onClick={() => setTab(null)}>
            <div className="logo-mark"><LogoMark /></div>
            <div className="logo-text">
              <h1>Affiche‑toi</h1>
              <p>Pub aux enchères · France</p>
            </div>
          </div>

          {/* Nav centrale */}
          <nav className="header-nav">
            {tab !== null && (
              <>
                <button className="nav-home-btn" onClick={() => setTab(null)}>← Accueil</button>
                <div className="header-nav-sep" />
              </>
            )}
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`nav-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Droite */}
          <div className="header-right">
            <HeaderStats />
            {tab === null && (
              <button className="header-cta" onClick={() => setTab("carte")}>
                Enchérir →
              </button>
            )}
            <span className="header-badge">DÉMO</span>
          </div>

        </div>
      </header>

      <main className="app-main">
        {tab === null ? (
          <>
            <Hero
              onCarte={() => setTab("carte")}
              onParis={() => setTab("paris")}
            />
            <HomeFeatures
              onCarte={() => setTab("carte")}
              onParis={() => setTab("paris")}
              onClassement={() => setTab("classement")}
            />
            <HomeLive
              onCarte={() => setTab("carte")}
              onParis={() => setTab("paris")}
            />
          </>
        ) : (
          <div className="main-inner tab-content" key={tab}>
            {tab === "carte" && <Carte onSelectParis={() => setTab("paris")} />}
            {tab === "paris" && <RueParis />}
            {tab === "classement" && <Classement />}
          </div>
        )}
      </main>

      <footer className="app-footer">

        {/* ── Bannière CTA ── */}
        <div className="footer-cta-band">
          <div className="footer-cta-band-inner">
            <div className="footer-cta-band-text">
              <p className="footer-cta-band-title">Prêt à afficher votre marque ?</p>
              <p className="footer-cta-band-sub">Des milliers de visiteurs parcourent la carte chaque jour</p>
            </div>
            <div className="footer-cta-band-actions">
              <button className="btn-primary footer-cta-btn" onClick={() => setTab("carte")}>
                <span>🗺</span><span>Choisir un département</span><span className="footer-cta-arrow">→</span>
              </button>
              <button className="btn-primary btn-gold footer-cta-btn-sec" onClick={() => setTab("paris")}>
                <span>🏙</span><span>Rue de Paris</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Colonnes ── */}
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-col">
            <div className="footer-brand" style={{ cursor: "pointer" }} onClick={() => setTab(null)}>
              <div className="footer-logo-mark"><LogoMark /></div>
              <span className="footer-logo">Affiche‑toi</span>
            </div>
            <p className="footer-tagline">
              La première plateforme de publicité aux enchères sur la carte de France.
              Visibilité immédiate, classement en temps réel.
            </p>
            <FooterStats />
          </div>

          {/* Comment ça marche */}
          <div className="footer-col">
            <div className="footer-col-title">Comment ça marche</div>
            <ol className="footer-steps">
              <li>Choisissez un département sur la carte</li>
              <li>Proposez une enchère (min. 5 €)</li>
              <li>Votre marque s'affiche immédiatement</li>
              <li>Surenchérissez pour remonter</li>
            </ol>
          </div>

          {/* Explorer */}
          <div className="footer-col">
            <div className="footer-col-title">Explorer</div>
            <ul className="footer-links">
              <li>
                <button onClick={() => setTab("carte")} className="footer-link">
                  <span className="footer-link-icon">🗺</span>
                  <span>Carte de France</span>
                  <span className="footer-link-arrow">→</span>
                </button>
              </li>
              <li>
                <button onClick={() => setTab("paris")} className="footer-link">
                  <span className="footer-link-icon">🏙</span>
                  <span>Rue de Paris</span>
                  <span className="footer-link-arrow">→</span>
                </button>
              </li>
              <li>
                <button onClick={() => setTab("classement")} className="footer-link">
                  <span className="footer-link-icon">🏆</span>
                  <span>Classement live</span>
                  <span className="footer-link-arrow">→</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Barre bottom ── */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-bottom-wordmark">Affiche‑toi</span>
            <span className="footer-demo-badge">DÉMO</span>
          </div>
          <div className="footer-bottom-center">
            <span>© 2026 Affiche‑toi</span>
            <span className="footer-sep">·</span>
            <span>Aucun paiement réel</span>
            <span className="footer-sep">·</span>
            <span>Projet ESGI</span>
          </div>
          <div className="footer-bottom-right">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>En ligne</span>
          </div>
        </div>

      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
