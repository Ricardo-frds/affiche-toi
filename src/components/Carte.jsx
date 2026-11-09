import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useApp } from "../context/AppContext";
import FormulaireEnchere from "./FormulaireEnchere";
import GEO_DATA from "../data/departements.json";

const PROJECTION_CONFIG = {
  center: [2.5, 46.3],
  scale: 2500,
};

export default function Carte({ onSelectParis }) {
  const { departementBids, getMinDepartement, clicks, pageViews, activeUsers, totalRevenu, occupiedCount, freeCount } = useApp();
  const [selected, setSelected]       = useState(null);
  const [hoveredCode, setHoveredCode] = useState(null);
  const [tooltip, setTooltip]         = useState(null);
  const [tooltipPos, setTooltipPos]   = useState({ x: 0, y: 0 });

  const { topBids, totalClicks } = useMemo(() => {
    const sorted = Object.values(departementBids).sort((a, b) => b.montant - a.montant);
    return {
      topBids:     sorted.slice(0, 6),
      totalClicks: sorted.reduce((s, b) => s + (clicks[b.id] || 0), 0),
    };
  }, [departementBids, clicks]);
  const maxTop = topBids[0]?.montant || 1;

  function handleClick(geo) {
    const code = geo.properties.code;
    if (code === "75") { onSelectParis(); return; }
    setSelected({ code, nom: geo.properties.nom });
  }

  function handleMouseMove(geo, evt) {
    const code    = geo.properties.code;
    const bid     = departementBids[code];
    const isParis = code === "75";
    setHoveredCode(code);
    setTooltipPos({ x: evt.clientX, y: evt.clientY });
    setTooltip({ nom: geo.properties.nom, bid, code, isParis });
  }

  return (
    <div className="carte-container">
      <div className="pg-banner">
        <div className="pg-banner-left">
          <span className="pg-banner-icon">🗺</span>
          <div>
            <h2 className="pg-banner-title">Carte de France</h2>
            <p className="pg-banner-sub">Cliquez sur un département · Paris ouvre la Rue de Paris</p>
          </div>
        </div>
        <div className="pg-banner-right">
          <div className="stat-pill live">
            <span className="live-dot" />
            <strong>{activeUsers}</strong>
            <span>en ligne</span>
          </div>
          <div className="stat-pill">
            <span>👁</span>
            <strong>{pageViews.toLocaleString("fr-FR")}</strong>
            <span>vues</span>
          </div>
          <div className="stat-pill">
            <span>💰</span>
            <strong>{totalRevenu.toLocaleString("fr-FR")} €</strong>
            <span>misés</span>
          </div>
        </div>
      </div>

      <div className="carte-body">
        {/* ── Carte SVG ── */}
        <div className="carte-wrapper">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={PROJECTION_CONFIG}
            width={700}
            height={650}
            style={{ width: "100%", height: "auto" }}
          >
            <ZoomableGroup zoom={1} minZoom={1} maxZoom={6} center={[2.5, 46.3]}>
              <Geographies geography={GEO_DATA}>
                {({ geographies, path }) => (
                  <>
                    {/* Passe 1 : polygones */}
                    {geographies.map((geo) => {
                      const code       = geo.properties.code;
                      const bid        = departementBids[code];
                      const isParis    = code === "75";
                      const isSelected = selected?.code === code;
                      const isHovered  = hoveredCode === code;

                      const fill = isHovered
                        ? bid ? bid.couleur : isParis ? "#2a5080" : "#2563eb"
                        : bid ? bid.couleur : isParis ? "#1e3a5f" : "#1a2740";

                      const stroke = isHovered
                        ? isParis ? "#fcd34d" : bid ? "#ffffff" : "#93c5fd"
                        : isParis ? "#f59e0b" : isSelected ? "#60a5fa" : "#4a7aaa";

                      const strokeWidth = isHovered
                        ? isParis ? 2.5 : 2
                        : isParis ? 2 : isSelected ? 1.8 : 1;

                      const filter = isHovered
                        ? bid
                          ? `drop-shadow(0 0 10px ${bid.couleur}) drop-shadow(0 0 20px ${bid.couleur}88)`
                          : isParis
                          ? "drop-shadow(0 0 12px rgba(245,158,11,0.9))"
                          : "drop-shadow(0 0 10px rgba(96,165,250,0.85)) drop-shadow(0 0 20px rgba(37,99,235,0.5))"
                        : bid
                        ? `drop-shadow(0 0 5px ${bid.couleur}80)`
                        : isParis
                        ? "drop-shadow(0 0 8px rgba(245,158,11,0.7))"
                        : "none";

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          style={{ outline: "none", cursor: "pointer", filter }}
                          onClick={() => handleClick(geo)}
                          onMouseMove={(evt) => handleMouseMove(geo, evt)}
                          onMouseLeave={() => { setTooltip(null); setHoveredCode(null); }}
                        />
                      );
                    })}

                    {/* Passe 2 : labels */}
                    {geographies.map((geo) => {
                      const centroid = path.centroid(geo);
                      if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;
                      const code    = geo.properties.code;
                      const nom     = geo.properties.nom;
                      const bid     = departementBids[code];
                      const isParis = code === "75";
                      const isHovered = hoveredCode === code;
                      const labelColor = isHovered
                        ? "#ffffff"
                        : bid ? "#ffffff" : isParis ? "#fcd34d" : "rgba(255,255,255,0.65)";

                      return (
                        <text
                          key={`lbl-${geo.rsmKey}`}
                          x={centroid[0]}
                          y={centroid[1]}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="'Inter', system-ui, sans-serif"
                          fontWeight={isHovered || bid ? "700" : "500"}
                          fontSize={isParis ? 4 : 5.5}
                          fill={labelColor}
                          stroke={bid ? "rgba(0,0,0,0.7)" : "none"}
                          strokeWidth={bid ? 0.5 : 0}
                          paintOrder="stroke"
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {bid ? bid.nom : nom}
                        </text>
                      );
                    })}
                  </>
                )}
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip enrichi */}
          {tooltip && (
            <div
              className="tooltip tooltip-fixed carte-tooltip"
              style={{ left: tooltipPos.x + 18, top: tooltipPos.y - 10 }}
            >
              {/* Liseré gauche coloré selon l'état */}
              <div className="tt-accent-bar" style={{
                background: tooltip.bid    ? tooltip.bid.couleur
                          : tooltip.isParis ? "#f59e0b"
                          : "#10b981",
              }} />

              <div className="tt-content">
                {/* Header département */}
                <div className="tt-header">
                  <span className="tt-dep-name">
                    {tooltip.isParis ? "★ " : ""}{tooltip.nom}
                  </span>
                  {tooltip.bid && (
                    <span className="tt-badge" style={{
                      color: tooltip.bid.couleur,
                      borderColor: tooltip.bid.couleur + "55",
                      background: tooltip.bid.couleur + "14",
                    }}>occupé</span>
                  )}
                  {!tooltip.bid && tooltip.isParis && (
                    <span className="tt-badge tt-badge-gold">PREMIUM</span>
                  )}
                  {!tooltip.bid && !tooltip.isParis && (
                    <span className="tt-badge tt-badge-free">LIBRE</span>
                  )}
                </div>

                {/* État : occupé */}
                {tooltip.bid && (
                  <>
                    <div className="tt-brand-row">
                      <span className="tt-dot-lg" style={{
                        background: tooltip.bid.couleur,
                        boxShadow: `0 0 10px ${tooltip.bid.couleur}`,
                      }} />
                      <span className="tt-brand-name">{tooltip.bid.nom}</span>
                      <span className="tt-bid-amount" style={{ color: tooltip.bid.couleur }}>
                        {tooltip.bid.montant} €
                      </span>
                    </div>
                    <div className="tt-clicks-row">
                      <span>👁</span>
                      <span>{(clicks[tooltip.bid.id] || 0).toLocaleString("fr-FR")} clics</span>
                    </div>
                    <div className="tt-divider" />
                    <div className="tt-cta-row">
                      <span>⚡</span>
                      <span>Surpasser pour <strong>{getMinDepartement(tooltip.code)} €</strong></span>
                    </div>
                  </>
                )}

                {/* État : Paris */}
                {tooltip.isParis && (
                  <div className="tt-special-body">
                    <p className="tt-special-desc">12 vitrines · visibilité maximale</p>
                    <div className="tt-special-cta tt-special-cta-gold">Ouvrir la Rue de Paris →</div>
                  </div>
                )}

                {/* État : libre */}
                {!tooltip.bid && !tooltip.isParis && (
                  <div className="tt-special-body">
                    <div className="tt-libre-row">
                      <span className="tt-libre-check">✓</span>
                      <span>Libre — dès <strong>5 €</strong></span>
                    </div>
                    <div className="tt-special-cta">Cliquez pour enchérir →</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="carte-zoom-hint">
            🖱 Molette pour zoomer · Cliquer-glisser pour déplacer
          </p>
        </div>

        {/* ── Sidebar ── */}
        <div className="carte-sidebar">

          {/* Occupation */}
          <div className="carte-stat-card">
            <div className="stat-label">Occupation</div>
            <div className="stat-value">
              {occupiedCount}
              <span style={{ fontSize: "1rem", color: "#64748b" }}> / 96</span>
            </div>
            <div className="carte-progress-track">
              <div className="carte-progress-fill"
                style={{ width: `${(occupiedCount / 96) * 100}%` }} />
            </div>
            <div className="stat-sub">{freeCount} département{freeCount > 1 ? "s" : ""} libre{freeCount > 1 ? "s" : ""}</div>
          </div>

          {/* Revenus */}
          <div className="carte-stat-card">
            <div className="stat-label">Revenus (démo)</div>
            <div className="stat-value" style={{ color: "#34d399" }}>
              {totalRevenu.toLocaleString("fr-FR")} €
            </div>
            <div className="stat-sub">
              👁 {totalClicks.toLocaleString("fr-FR")} clics cumulés
            </div>
          </div>

          {/* Top enchères avec barres */}
          <div className="carte-stat-card">
            <div className="stat-label">Top enchères</div>
            <div className="top-bids-list">
              {topBids.map((b, i) => (
                <div key={b.id} className="top-bid-item">
                  <span className="top-bid-rank">#{i + 1}</span>
                  <span className="top-bid-dot" style={{ background: b.couleur }} />
                  <span className="top-bid-nom">{b.nom}</span>
                  <span className="top-bid-montant">{b.montant} €</span>
                  <div className="top-bid-bar-track" style={{ gridColumn: "2 / -1" }}>
                    <div className="top-bid-bar-fill"
                      style={{ width: `${(b.montant / maxTop) * 100}%`, background: b.couleur }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="carte-cta-card">
            <div className="carte-cta-title">Réservez votre département</div>
            <p className="carte-cta-sub">
              {freeCount} emplacements libres · Visibilité immédiate sur toute la France
            </p>
            <div className="carte-cta-hint">Cliquez sur un département pour enchérir</div>
          </div>

          {/* Légende */}
          <div className="carte-legende">
            <span className="legende-item">
              <span className="legende-dot libre" /> Libre
            </span>
            <span className="legende-item">
              <span className="legende-dot occupe" /> Occupé
            </span>
            <span className="legende-item">
              <span className="legende-dot paris" /> Paris ★
            </span>
          </div>
        </div>
      </div>

      {selected && (
        <FormulaireEnchere
          type="departement"
          departement={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
