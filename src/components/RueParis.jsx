import { useState, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import FormulaireEnchere from "./FormulaireEnchere";

const TOP_MAX = 12;
const BASE_Y  = 460;
const SVG_H   = 580;
const GAP     = 4;

// Pseudo-aléatoire déterministe (seed → [0,1])
function sr(seed) {
  const x = Math.sin(seed + 1.618) * 10000;
  return x - Math.floor(x);
}

// Config de largeur selon le rang
function cfg(rank) {
  if (rank === 0)  return { fw: 148 };
  if (rank <= 2)  return { fw: 118 };
  if (rank <= 5)  return { fw: 90 };
  return           { fw: 68 };
}

// Calcul du côté visible (projection oblique)
function side(fw) {
  const sw = Math.round(fw * 0.42);
  const sh = Math.round(sw * 0.44);   // élévation du côté
  return { sw, sh };
}

// Étoiles pré-calculées (déterministes)
const STARS = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  cx: sr(i * 7.3  + 1) * 1350,
  cy: sr(i * 3.7  + 2) * 300,
  r:  sr(i * 11.1 + 3) > 0.82 ? 1.4 : 0.7,
  op: 0.3 + sr(i * 5.9 + 4) * 0.65,
  delay: (sr(i * 2.3 + 5) * 7).toFixed(2),
  dur:   (2 + sr(i * 4.1 + 6) * 4).toFixed(2),
}));

// ─── Générer les fenêtres d'une zone ────────────────────────
function genWins(x, fw, zoneTop, zoneH, seed) {
  const floors = Math.max(1, Math.floor(zoneH / 16));
  const wpp    = fw > 110 ? 4 : fw > 80 ? 3 : 2;
  const wW     = (fw - 12) / (wpp * 2.1);
  const flH    = zoneH / floors;
  const wins   = [];
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < wpp; c++) {
      const colW = fw / wpp;
      wins.push({
        wx:    x + colW * (c + 0.22),
        wy:    zoneTop + f * flH + flH * 0.18,
        wW,
        wh:    Math.max(3.5, flH * 0.48),
        lit:   sr(seed + f * 13 + c * 5) > 0.33,
        delay: (sr(seed + f * 7  + c * 3) * 8).toFixed(2),
        dur:   (3 + sr(seed + f * 11 + c * 7) * 5).toFixed(2),
      });
    }
  }
  return wins;
}

// Retourne '#000' ou '#fff' selon la luminosité perçue d'une couleur hex
function contrastText(hex) {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45 ? "#000000" : "#ffffff";
}

// ─── Composant immeuble style casino / Vegas ─────────────────
function Building3D({ bid, rank, x, maxMontant, clicks, minToSurpass, onBid, hovered, onHover, onLeave, recordClick }) {
  const bidClicks = clicks ?? 0;

  const { fw }     = cfg(rank);
  const { sw, sh } = side(fw);
  const ratio      = bid.montant / maxMontant;
  const h          = Math.round(120 + ratio * 340);
  const y          = BASE_Y;
  const isFirst    = rank === 0;
  const col        = bid.couleur;
  const colText    = contrastText(col); // '#000' ou '#fff' selon la couleur

  // ── Couronne (casino crown) ──
  const crownH  = isFirst ? 30 : rank < 3 ? 24 : rank < 6 ? 18 : 13;
  const crownY  = y - h;

  // ── Billboard principal ──
  const bbPad = 5;
  const bbX   = x + bbPad;
  const bbW   = fw - bbPad * 2;
  const bbH   = Math.min(isFirst ? 92 : rank < 3 ? 72 : rank < 6 ? 54 : 42, h * 0.48);
  const bbY   = crownY + crownH + 4;
  const bbFs  = isFirst ? 14 : rank < 3 ? 11 : rank < 6 ? 9 : 7;

  // ── Zone fenêtres 1 (entre billboard principal et secondaire) ──
  const win1Top = bbY + bbH + 6;
  const win1Bot = crownY + Math.round(h * 0.68);
  const win1H   = win1Bot - win1Top;

  // ── Billboard secondaire ──
  const sb2Y = win1Bot + 3;
  const sb2H = isFirst ? 26 : rank < 3 ? 20 : 15;
  const sb2W = fw - 10;

  // ── Zone fenêtres 2 (en dessous du billboard secondaire) ──
  const win2Top = sb2Y + sb2H + 5;
  const win2Bot = y - 10;
  const win2H   = win2Bot - win2Top;

  // ── Marquise néon (bas du bâtiment) ──
  const mqY = y - 10;
  const mqH = 9;

  // Génération déterministe des fenêtres
  const wins1 = win1H > 12 ? genWins(x, fw, win1Top, win1H, bid.id * 97) : [];
  const wins2 = win2H > 12 ? genWins(x, fw, win2Top, win2H, bid.id * 157) : [];

  // 3 faces projection oblique
  const front = `${x},${y} ${x+fw},${y} ${x+fw},${crownY} ${x},${crownY}`;
  const fside = `${x+fw},${y} ${x+fw+sw},${y-sh} ${x+fw+sw},${crownY-sh} ${x+fw},${crownY}`;
  const roof  = `${x},${crownY} ${x+fw},${crownY} ${x+fw+sw},${crownY-sh} ${x+sw},${crownY-sh}`;
  const edge  = "rgba(255,255,255,0.07)";

  // ── Affiche tranche latérale ──
  // sp(u,v) : point sur la face latérale, u∈[0,1] gauche→droite, v∈[0,1] haut→bas
  const sp      = (u, v) => [x + fw + u * sw,  crownY + v * h - u * sh];
  const sbV0    = 0.06;
  const sbV1    = 0.42;
  const sbPts   = [sp(0.1,sbV0), sp(0.9,sbV0), sp(0.9,sbV1), sp(0.1,sbV1)]
                    .map(p => p.join(",")).join(" ");
  const sbPtsI  = [
    sp(0.2, sbV0 + (sbV1-sbV0)*0.12), sp(0.8, sbV0 + (sbV1-sbV0)*0.12),
    sp(0.8, sbV1 - (sbV1-sbV0)*0.12), sp(0.2, sbV1 - (sbV1-sbV0)*0.12),
  ].map(p => p.join(",")).join(" ");
  const sbAngle  = Math.atan2(-sh, sw) * 180 / Math.PI;
  const sbNamePt = sp(0.5, sbV0 + (sbV1-sbV0) * 0.30);
  const sbAmtPt  = sp(0.5, sbV0 + (sbV1-sbV0) * 0.58);
  const sbClicPt = sp(0.5, sbV0 + (sbV1-sbV0) * 0.84);
  const sbFs     = Math.max(4, Math.min(bbFs * 0.82, sw * 0.13));

  // Chemin de l'arche de couronne
  const archTop = crownY - crownH;
  const archPath = [
    `M ${x},${crownY}`,
    `L ${x},${archTop + crownH * 0.35}`,
    `Q ${x + fw * 0.12},${archTop} ${x + fw * 0.5},${archTop - crownH * 0.28}`,
    `Q ${x + fw * 0.88},${archTop} ${x + fw},${archTop + crownH * 0.35}`,
    `L ${x + fw},${crownY}`,
    `Z`,
  ].join(" ");

  const liftY = hovered ? -12 : 0;

  return (
    <g style={{
        cursor: "pointer",
        transform: `translateY(${liftY}px)`,
        transition: "transform 0.25s ease",
        transformBox: "fill-box",
        transformOrigin: "bottom center",
      }}
      onClick={() => { recordClick(bid.id); if (bid.lien) window.open(bid.lien, "_blank"); }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >

      {/* Aura pulsante pour le leader */}
      {isFirst && (
        <ellipse cx={x + fw/2 + sw/4} cy={y - h * 0.45}
          rx={fw * (hovered ? 1.9 : 1.5)} ry={h * (hovered ? 0.8 : 0.65)}
          fill={col}
          style={{ animation: "neonPulse 2.8s ease-in-out infinite", transition: "rx 0.3s, ry 0.3s" }} />
      )}

      {/* Aura hover pour tous */}
      {hovered && !isFirst && (
        <ellipse cx={x + fw/2 + sw/4} cy={y - h * 0.4}
          rx={fw * 1.3} ry={h * 0.55}
          fill={col} opacity={0.06} />
      )}

      {/* Halo au sol */}
      <ellipse cx={x + fw/2 + sw/2} cy={y + 3} rx={fw * (hovered ? 1.2 : 0.95)} ry={hovered ? 13 : 9}
        fill={col} opacity={hovered ? 0.55 : isFirst ? 0.38 : 0.16}
        style={{ transition: "all 0.3s" }} />

      {/* Face latérale — fond */}
      <polygon points={fside} fill="#05101d" stroke={edge} strokeWidth="0.5" />

      {/* ── Affiche sur la tranche latérale ── */}
      {/* Halo flou derrière le panneau */}
      <polygon points={sbPts} fill={col} opacity={hovered ? 0.28 : 0.15}
        style={{ filter: "blur(5px)", transition: "opacity 0.3s" }} />
      {/* Fond sombre du panneau */}
      <polygon points={sbPts} fill="#030810" stroke={col} strokeWidth="1.2"
        strokeOpacity={hovered ? 1 : 0.75}
        style={{ filter: `drop-shadow(0 0 ${hovered ? 6 : 3}px ${col})`, transition: "all 0.3s" }} />
      {/* Cadre intérieur fin */}
      <polygon points={sbPtsI} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.5" />
      {/* Nom de la marque */}
      <text
        x={sbNamePt[0]} y={sbNamePt[1]}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Outfit', sans-serif" fontWeight="900"
        fontSize={sbFs} fill="white"
        transform={`rotate(${sbAngle}, ${sbNamePt[0]}, ${sbNamePt[1]})`}
        style={{ filter: `drop-shadow(0 0 3px ${col})` }}
      >
        {bid.nom}
      </text>
      {/* Montant */}
      <text
        x={sbAmtPt[0]} y={sbAmtPt[1]}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Inter', sans-serif" fontWeight="600"
        fontSize={Math.max(3.5, sbFs * 0.72)} fill={col}
        transform={`rotate(${sbAngle}, ${sbAmtPt[0]}, ${sbAmtPt[1]})`}
        style={{ filter: `drop-shadow(0 0 3px ${col})` }}
      >
        {bid.montant} €
      </text>
      {/* Compteur de clics (tranche) */}
      <text
        x={sbClicPt[0]} y={sbClicPt[1]}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Inter', sans-serif" fontWeight="500"
        fontSize={Math.max(3, sbFs * 0.60)} fill="rgba(255,255,255,0.55)"
        transform={`rotate(${sbAngle}, ${sbClicPt[0]}, ${sbClicPt[1]})`}
      >
        {"👁 "}{bidClicks.toLocaleString("fr-FR")}
      </text>

      {/* Arête néon (limite façade / tranche) */}
      <line x1={x+fw+1} y1={crownY} x2={x+fw+1} y2={y}
        stroke={col} strokeWidth="1.5" opacity="0.65"
        style={{ filter: `drop-shadow(0 0 5px ${col})` }} />

      {/* Toit */}
      <polygon points={roof} fill="#030810" stroke={edge} strokeWidth="0.5" />

      {/* Façade de base */}
      <polygon points={front} fill="#07111f" stroke={edge} strokeWidth="0.5" />

      {/* Colonnes néon verticales (gauche + droite) */}
      <rect x={x + 1.5} y={crownY} width={2.5} height={h}
        fill={col} opacity={0.75}
        style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
      <rect x={x + fw - 4} y={crownY} width={2.5} height={h}
        fill={col} opacity={0.75}
        style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
      {/* Colonnes intermédiaires pour les grands bâtiments */}
      {fw > 100 && (
        <>
          <rect x={x + fw * 0.33} y={crownY} width={1.5} height={h}
            fill={col} opacity={0.3} />
          <rect x={x + fw * 0.66} y={crownY} width={1.5} height={h}
            fill={col} opacity={0.3} />
        </>
      )}

      {/* ── Couronne / Crown arch ── */}
      {/* Halo de la couronne */}
      <path d={archPath} fill={col} opacity={hovered ? 0.5 : 0.3}
        style={{ filter: `blur(${hovered ? 10 : 6}px)`, transition: "all 0.3s" }} />
      {/* Couronne principale */}
      <path d={archPath} fill={col} opacity={1}
        style={{ filter: `drop-shadow(0 0 ${hovered ? 18 : 10}px ${col}) drop-shadow(0 0 ${hovered ? 35 : 20}px ${col}66)`, transition: "filter 0.3s", animation: "neonFlicker 6s ease-in-out infinite" }} />
      {/* Zone sombre intérieure */}
      <rect x={x + 3} y={archTop + 2} width={fw - 6} height={crownH - 2}
        fill="#040a14" rx="1.5" opacity="0.85" />
      {/* Texte de la couronne */}
      <text x={x + fw / 2} y={archTop + crownH * 0.56}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Outfit', sans-serif" fontWeight="900"
        fontSize={isFirst ? 8 : rank < 3 ? 6.5 : 5.5} fill={col}
        stroke={colText === "#ffffff" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0)"}
        strokeWidth="0.3" paintOrder="stroke"
        style={{ filter: `drop-shadow(0 0 6px ${col}) drop-shadow(0 0 2px #fff)` }}>
        ★ {bid.nom} ★
      </text>

      {/* ── Billboard principal ── */}
      {/* Halo extérieur */}
      <rect x={bbX - 4} y={bbY - 4} width={bbW + 8} height={bbH + 8}
        fill={col} rx="4" opacity={0.28}
        style={{ filter: "blur(7px)" }} />
      {/* Zone sombre */}
      <rect x={bbX} y={bbY} width={bbW} height={bbH}
        fill="#030810" rx="2.5" />
      {/* Cadre néon épais */}
      <rect x={bbX + 2} y={bbY + 2} width={bbW - 4} height={bbH - 4}
        fill="none" stroke={col} strokeWidth="2" rx="2"
        style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
      {/* Cadre intérieur fin */}
      <rect x={bbX + 6} y={bbY + 6} width={bbW - 12} height={bbH - 12}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" rx="1" />
      {/* Nom de la marque */}
      <text x={bbX + bbW / 2} y={bbY + bbH * 0.33}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Outfit', sans-serif" fontWeight="900"
        fontSize={bbFs} fill="white" letterSpacing="-0.3">
        {bid.nom}
      </text>
      {/* Séparateur */}
      <line x1={bbX + 8} y1={bbY + bbH * 0.52} x2={bbX + bbW - 8} y2={bbY + bbH * 0.52}
        stroke={col} strokeWidth="0.4" opacity="0.35" />
      {/* Montant */}
      <text x={bbX + bbW / 2} y={bbY + bbH * 0.65}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Inter', sans-serif" fontWeight="600"
        fontSize={Math.max(5, bbFs * 0.68)} fill={col}
        style={{ filter: `drop-shadow(0 0 3px ${col})` }}>
        {bid.montant} €
      </text>
      {/* Compteur de clics */}
      <text x={bbX + bbW / 2} y={bbY + bbH * 0.86}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Inter', sans-serif" fontWeight="500"
        fontSize={Math.max(4, bbFs * 0.60)} fill="rgba(255,255,255,0.60)">
        {"👁 "}{bidClicks.toLocaleString("fr-FR")}{" clics"}
      </text>

      {/* ── Zone fenêtres 1 ── */}
      {wins1.map((w, wi) => (
        <rect key={wi} x={w.wx} y={w.wy} width={w.wW} height={w.wh} rx="0.5"
          fill={w.lit ? "rgba(255,215,90,0.75)" : "rgba(15,35,65,0.6)"}
          style={w.lit ? {
            animation: `fenetreFlicker ${w.dur}s ease-in-out infinite ${w.delay}s alternate`,
          } : undefined}
        />
      ))}

      {/* ── Billboard secondaire ── */}
      {win1H > 12 && (
        <>
          <rect x={x + 5 - 2} y={sb2Y - 2} width={sb2W + 4} height={sb2H + 4}
            fill={col} rx="2" opacity={0.18}
            style={{ filter: "blur(5px)" }} />
          <rect x={x + 5} y={sb2Y} width={sb2W} height={sb2H}
            fill="#050d1a" rx="2" />
          <rect x={x + 7} y={sb2Y + 2} width={sb2W - 4} height={sb2H - 4}
            fill="none" stroke={col} strokeWidth="1.2" rx="1.2" opacity="0.9" />
          <text x={x + fw / 2} y={sb2Y + sb2H / 2}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Outfit', sans-serif" fontWeight="700"
            fontSize={Math.max(5, bbFs * 0.75)} fill="rgba(255,255,255,0.85)">
            {bid.montant} €
          </text>
        </>
      )}

      {/* ── Zone fenêtres 2 ── */}
      {wins2.map((w, wi) => (
        <rect key={`z2-${wi}`} x={w.wx} y={w.wy} width={w.wW} height={w.wh} rx="0.5"
          fill={w.lit ? "rgba(255,215,90,0.75)" : "rgba(15,35,65,0.6)"}
          style={w.lit ? {
            animation: `fenetreFlicker ${w.dur}s ease-in-out infinite ${w.delay}s alternate`,
          } : undefined}
        />
      ))}

      {/* ── Marquise néon en bas ── */}
      <rect x={x + 1} y={mqY} width={fw - 2} height={mqH}
        fill={col} rx="1" opacity={0.9}
        style={{ filter: `drop-shadow(0 0 5px ${col})` }} />
      <text x={x + fw / 2} y={mqY + mqH / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Outfit', sans-serif" fontWeight="700"
        fontSize="4.5" fill={colText}>
        {bid.nom.toUpperCase()}
      </text>

      {/* Badge rang */}
      <circle cx={x + fw - 10} cy={crownY + 11} r={9}
        fill={isFirst ? "#f59e0b" : rank < 3 ? col : "#050e1c"}
        stroke={isFirst ? "#fcd34d" : col} strokeWidth="1.2"
        style={isFirst ? undefined : { filter: `drop-shadow(0 0 5px ${col})` }} />
      <text x={x + fw - 10} y={crownY + 11}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Outfit', sans-serif" fontWeight="900"
        fontSize={isFirst ? 8 : 7}
        fill={isFirst ? "#000" : rank < 3 ? "#000" : "#fff"}>
        {rank + 1}
      </text>

      {/* ── Bande d'enchère au pied ── */}
      {rank === 0 ? (
        <>
          <rect x={x + 1} y={mqY - 17} width={fw - 2} height={14}
            fill="#f59e0b" opacity={0.95} rx={2} />
          <text x={x + fw / 2} y={mqY - 10}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize={6} fill="#000">
            {"🏆 Leader · "}{bid.montant}{" €"}
          </text>
        </>
      ) : (
        <g style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); onBid?.(); }}>
          <rect x={x + 1} y={mqY - 17} width={fw - 2} height={14}
            fill={hovered ? col : "rgba(255,255,255,0.05)"} rx={2}
            stroke={col} strokeWidth="0.6"
            style={{ transition: "fill 0.2s", opacity: hovered ? 0.9 : 1 }} />
          <text x={x + fw / 2} y={mqY - 10}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Inter', sans-serif" fontSize={5.5}
            fill={hovered ? "#000" : "rgba(255,255,255,0.6)"}>
            {hovered ? `⚡ Clic · ${minToSurpass} €` : `⚡ Surpasser · ${minToSurpass} €`}
          </text>
        </g>
      )}

      {/* ── Tooltip hover ── */}
      {hovered && (() => {
        const tw     = 116;
        const th     = !isFirst && minToSurpass ? 82 : 67;
        const ah     = 7;
        const cx     = x + fw / 2 + sw * 0.1;
        const tty    = Math.max(4, crownY - crownH - 11 - ah - th);
        const tby    = tty + th;
        const lx     = cx - tw / 2;
        const pbX    = lx + 10;
        const pbW    = tw - 20;
        const pbFill = Math.min((bid.montant / maxMontant) * pbW, pbW);
        return (
          <g style={{ pointerEvents: "none" }}>
            {/* Ombre portée */}
            <rect x={lx + 3} y={tty + 3} width={tw} height={th} rx={7}
              fill="rgba(0,0,0,0.55)" style={{ filter: "blur(8px)" }} />
            {/* Fond principal */}
            <rect x={lx} y={tty} width={tw} height={th} rx={7}
              fill="#06101f" stroke={col} strokeWidth="0.9"
              style={{ filter: `drop-shadow(0 2px 14px ${col}55)` }} />
            {/* Liseré gauche coloré */}
            <rect x={lx + 0.5} y={tty + 7} width={3} height={th - 14} rx={1.5}
              fill={col} />
            {/* Bande haute tintée */}
            <rect x={lx + 3} y={tty} width={tw - 3} height={25}
              fill={col} opacity={0.1} rx="6" />

            {/* Badge rang */}
            <rect x={lx + tw - 23} y={tty + 5} width={19} height={15} rx={4}
              fill={isFirst ? "#f59e0b" : "rgba(255,255,255,0.07)"}
              stroke={isFirst ? "#fcd34d" : col} strokeWidth="0.6" strokeOpacity="0.7" />
            <text x={lx + tw - 13.5} y={tty + 12.5}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize={6}
              fill={isFirst ? "#000" : col}>
              #{rank + 1}
            </text>

            {/* Nom de la marque */}
            <text x={lx + 10} y={tty + 13}
              dominantBaseline="middle"
              fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize={7.5} fill="#fff">
              {bid.nom}
            </text>

            {/* Séparateur 1 */}
            <line x1={lx + 8} y1={tty + 26} x2={lx + tw - 8} y2={tty + 26}
              stroke={col} strokeWidth="0.4" opacity="0.3" />

            {/* Montant */}
            <text x={lx + 10} y={tty + 36}
              dominantBaseline="middle"
              fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize={8.5}
              fill={col} style={{ filter: `drop-shadow(0 0 5px ${col})` }}>
              {bid.montant} €
            </text>
            {/* Clics */}
            <text x={lx + tw - 8} y={tty + 36}
              textAnchor="end" dominantBaseline="middle"
              fontFamily="'Inter', sans-serif" fontSize={5.5}
              fill="rgba(255,255,255,0.55)">
              {"👁 "}{bidClicks.toLocaleString("fr-FR")}
            </text>

            {/* Barre de progression bid / max */}
            <rect x={pbX} y={tty + 48} width={pbW} height={4} rx={2}
              fill="rgba(255,255,255,0.08)" />
            <rect x={pbX} y={tty + 48} width={pbFill} height={4} rx={2}
              fill={col} style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
            <text x={lx + tw - 8} y={tty + 59}
              textAnchor="end" dominantBaseline="middle"
              fontFamily="'Inter', sans-serif" fontSize={4.5}
              fill="rgba(255,255,255,0.28)">
              {Math.round((bid.montant / maxMontant) * 100)}{"% du max"}
            </text>

            {/* CTA Surpasser (non-leaders) */}
            {!isFirst && minToSurpass && (
              <>
                <line x1={lx + 8} y1={tty + 63} x2={lx + tw - 8} y2={tty + 63}
                  stroke={col} strokeWidth="0.4" opacity="0.2" />
                <text x={cx} y={tty + 73}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Outfit', sans-serif" fontWeight="700" fontSize={5.5}
                  fill="#f59e0b">
                  {"⚡ Surpasser · "}{minToSurpass}{" €"}
                </text>
              </>
            )}

            {/* Flèche pointant vers l'immeuble */}
            <polygon points={`${cx - 5.5},${tby} ${cx + 5.5},${tby} ${cx},${tby + ah}`}
              fill="#06101f" stroke={col} strokeWidth="0.9" strokeOpacity="0.9" />
            {/* Effacer la bordure entre rect et flèche */}
            <line x1={cx - 4.5} y1={tby} x2={cx + 4.5} y2={tby}
              stroke="#06101f" strokeWidth="1.8" />
          </g>
        );
      })()}
    </g>
  );
}

// ─── Skyline en arrière-plan ──────────────────────────────────
function BackgroundSkyline({ svgW }) {
  const bgs = useMemo(() => {
    const buildings = [];
    let x = 0;
    let i = 0;
    while (x < svgW + 80) {
      const w = 30 + sr(i * 6.1 + 1) * 60;
      const h = 40 + sr(i * 4.3 + 2) * 130;
      buildings.push({ x, w, h, id: i });
      x += w + 2 + sr(i * 2.9 + 3) * 8;
      i++;
    }
    return buildings;
  }, [svgW]);

  return (
    <g opacity="0.35">
      {bgs.map(b => (
        <rect key={b.id}
          x={b.x} y={BASE_Y - b.h - 8}
          width={b.w} height={b.h}
          fill="#07111e"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="0.5"
        />
      ))}
      {/* Quelques fenêtres allumées en arrière-plan */}
      {bgs.filter((_, i) => i % 3 === 0).map(b => {
        const rows = Math.floor(b.h / 14);
        const cols = Math.floor(b.w / 12);
        return Array.from({ length: Math.min(rows * cols, 12) }, (_, wi) => {
          const col = wi % Math.max(1, cols);
          const row = Math.floor(wi / Math.max(1, cols));
          const lit = sr(b.id * 17 + wi) > 0.6;
          if (!lit) return null;
          return (
            <rect key={wi}
              x={b.x + col * 12 + 3} y={BASE_Y - b.h - 8 + row * 14 + 4}
              width={6} height={7} rx="0.5"
              fill="rgba(255,215,90,0.4)"
            />
          );
        });
      })}
    </g>
  );
}

// ─── Voitures ────────────────────────────────────────────────
const CAR_CFGS = [
  { id: 1, dir: 1,  color: "#c0392b", dur: 9,  delay: 0,  type: "car"  },
  { id: 2, dir: 1,  color: "#2980b9", dur: 13, delay: 4,  type: "car"  },
  { id: 3, dir: 1,  color: "#f1c40f", dur: 11, delay: 8,  type: "taxi" },
  { id: 4, dir: -1, color: "#8e44ad", dur: 10, delay: 2,  type: "car"  },
  { id: 5, dir: -1, color: "#e67e22", dur: 8,  delay: 6,  type: "car"  },
  { id: 6, dir: 1,  color: "#1abc9c", dur: 15, delay: 11, type: "car"  },
  { id: 7, dir: -1, color: "#e74c3c", dur: 12, delay: 7,  type: "car"  },
];

function CarSVG({ cfg: c }) {
  const isRight = c.dir === 1;
  const carY    = BASE_Y + (isRight ? 18 : 32);
  const anim    = isRight ? "carRight" : "carLeft";
  const isTaxi  = c.type === "taxi";
  return (
    <g style={{ animation: `${anim} ${c.dur}s linear ${c.delay}s infinite` }}>
      <g transform={`translate(0,${carY}) scale(${isRight ? 1 : -1},1)`}>
        {/* Carrosserie */}
        <rect x="-22" y="-10" width="44" height="11" fill={c.color} rx="3"/>
        <rect x="-10" y="-20" width="23" height="11" fill={c.color} rx="2" opacity=".85"/>
        {/* Vitres */}
        <rect x="7"   y="-19" width="6"  height="9" fill="rgba(100,180,220,.35)" rx="1"/>
        <rect x="-13" y="-19" width="6"  height="9" fill="rgba(100,180,220,.35)" rx="1"/>
        <rect x="-4"  y="-19" width="8"  height="9" fill="rgba(100,180,220,.2)"  rx="1"/>
        {/* Roues */}
        <circle cx="-14" cy="1" r="5.5" fill="#111"/>
        <circle cx="-14" cy="1" r="3"   fill="#2a2a44"/>
        <circle cx="-14" cy="1" r="1.2" fill="#444"/>
        <circle cx="14"  cy="1" r="5.5" fill="#111"/>
        <circle cx="14"  cy="1" r="3"   fill="#2a2a44"/>
        <circle cx="14"  cy="1" r="1.2" fill="#444"/>
        {/* Phares */}
        <rect x="20"  y="-8" width="4" height="4" fill="rgba(255,250,200,.95)" rx="1"/>
        <ellipse cx="22" cy="-6" rx="8" ry="3" fill="rgba(255,250,200,.12)" />
        {/* Feux arrière */}
        <rect x="-24" y="-8" width="3" height="4" fill="rgba(255,50,50,.9)" rx="1"/>
        {/* Signe taxi */}
        {isTaxi && (
          <rect x="-6" y="-26" width="12" height="6" fill="#f1c40f" rx="2"/>
        )}
        {/* Reflet sur la carrosserie */}
        <rect x="-18" y="-9" width="12" height="1.5" fill="rgba(255,255,255,0.15)" rx="1"/>
      </g>
    </g>
  );
}

function formatAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  return `il y a ${Math.floor(mins / 60)}h`;
}

function StatsBar({ pageViews, activeUsers, totalRevenu, recentBids }) {
  const last = recentBids[0];
  return (
    <div className="rue-stats-bar">
      <div className="stat-pill">
        <span>👁</span>
        <strong>{pageViews.toLocaleString("fr-FR")}</strong>
        <span>vues</span>
      </div>
      <div className="stat-pill live">
        <span className="live-dot" />
        <strong>{activeUsers}</strong>
        <span>en ligne maintenant</span>
      </div>
      <div className="stat-pill">
        <span>💰</span>
        <strong>{totalRevenu.toLocaleString("fr-FR")} €</strong>
        <span>misés au total</span>
      </div>
      {last && (
        <div className="stat-pill accent">
          <span>⚡</span>
          <span>
            <strong style={{ color: last.couleur }}>{last.nom}</strong>
            {" a enchéri "}
            <strong>{last.montant} €</strong>
            {" · "}{formatAgo(last.ts)}
          </span>
        </div>
      )}
    </div>
  );
}

function LiveTicker({ recentBids }) {
  if (!recentBids.length) return null;
  const items = [...recentBids, ...recentBids, ...recentBids];
  return (
    <div className="live-ticker-wrapper">
      <span className="ticker-live-badge">🔴 LIVE</span>
      <div className="ticker-overflow">
        <div className="ticker-track">
          {items.map((b, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" style={{ background: b.couleur }} />
              <strong>{b.nom}</strong>
              {" a placé "}
              <strong style={{ color: b.couleur }}>{b.montant} €</strong>
              {" · "}{formatAgo(b.ts)}
              <span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RueParis() {
  const { parisBids, clicks, recordClick, pageViews, activeUsers, recentBids, totalRevenu } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const top = parisBids.slice(0, TOP_MAX);
  const maxMontant = top[0]?.montant || 1;
  const handleHover   = useCallback((id) => setHoveredId(id), []);
  const handleUnhover = useCallback(() => setHoveredId(null), []);

  // Positions X des bâtiments (dépend uniquement du nombre)
  const positions = useMemo(() => {
    let x = 15;
    return top.map((_, i) => {
      const { fw }   = cfg(i);
      const { sw }   = side(fw);
      const pos = x;
      x += fw + sw + GAP;
      return pos;
    });
  }, [top.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Largeur totale du SVG
  const svgW = useMemo(() => {
    if (top.length === 0) return 1200;
    const li = top.length - 1;
    const { fw } = cfg(li);
    const { sw } = side(fw);
    return (positions[li] || 0) + fw + sw + 20;
  }, [top.length, positions]);

  return (
    <div className="rue-container">
      <div className="pg-banner">
        <div className="pg-banner-left">
          <span className="pg-banner-icon">🏙</span>
          <div>
            <h2 className="pg-banner-title">Rue de Paris</h2>
            <p className="pg-banner-sub">Top {TOP_MAX} pubs — plus tu enchéris, plus ton immeuble est grand et visible</p>
          </div>
        </div>
        <div className="pg-banner-right">
          <button className="btn-primary btn-gold" onClick={() => setShowForm(true)}>
            ✦ Prendre une place
          </button>
        </div>
      </div>

      <StatsBar
        pageViews={pageViews}
        activeUsers={activeUsers}
        totalRevenu={totalRevenu}
        recentBids={recentBids}
      />
      <LiveTicker recentBids={recentBids} />

      {/* ══ SCÈNE SVG 3D ══ */}
      <div className="rue-scene-wrapper">
        <svg viewBox={`0 0 ${svgW} ${SVG_H}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", display: "block" }}>

          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#06010e" />
              <stop offset="30%"  stopColor="#0d0320" />
              <stop offset="60%"  stopColor="#180530" />
              <stop offset="82%"  stopColor="#2a0640" />
              <stop offset="100%" stopColor="#180a28" />
            </linearGradient>
            <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#12152a" />
              <stop offset="100%" stopColor="#08080f" />
            </linearGradient>
            <radialGradient id="cityGlow1" cx="50%" cy="100%" r="60%">
              <stop offset="0%"   stopColor="#6d28d9" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cityGlow2" cx="30%" cy="90%" r="40%">
              <stop offset="0%"   stopColor="#db2777" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cityGlow3" cx="75%" cy="90%" r="40%">
              <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ciel */}
          <rect x="0" y="0" width={svgW} height={SVG_H} fill="url(#skyGrad)" />
          {/* Lueurs de ville colorées */}
          <rect x="0" y="0" width={svgW} height={SVG_H} fill="url(#cityGlow1)" />
          <rect x="0" y="0" width={svgW} height={SVG_H} fill="url(#cityGlow2)" />
          <rect x="0" y="0" width={svgW} height={SVG_H} fill="url(#cityGlow3)" />

          {/* Lune (croissant) */}
          <circle cx={svgW * 0.9} cy={45} r={18} fill="#fffef0" opacity={0.75} />
          <circle cx={svgW * 0.9 + 10} cy={41} r={15} fill="#0d0320" />

          {/* Étoiles */}
          {STARS.map(s => (
            <circle key={s.id}
              cx={s.cx > svgW ? s.cx % svgW : s.cx}
              cy={s.cy} r={s.r} fill="white"
              style={{
                opacity: s.op,
                animation: `twinkle ${s.dur}s ease-in-out infinite ${s.delay}s alternate`,
              }}
            />
          ))}

          {/* Lueurs d'horizon urbaines colorées */}
          <ellipse cx={svgW * 0.35} cy={BASE_Y - 10} rx={svgW * 0.3} ry={60}
            fill="rgba(109,40,217,0.09)" />
          <ellipse cx={svgW * 0.65} cy={BASE_Y - 10} rx={svgW * 0.3} ry={55}
            fill="rgba(219,39,119,0.07)" />
          <ellipse cx={svgW / 2} cy={BASE_Y} rx={svgW * 0.65} ry={40}
            fill="rgba(14,165,233,0.05)" />

          {/* ── Skyline arrière-plan ── */}
          <BackgroundSkyline svgW={svgW} />

          {/* ── Bâtiments ── */}
          {top.map((bid, i) => (
            <Building3D key={bid.id}
              bid={bid} rank={i}
              x={positions[i] ?? 0}
              maxMontant={maxMontant}
              clicks={clicks[bid.id] || 0}
              minToSurpass={i === 0 ? null : top[i - 1].montant + 1}
              onBid={() => setShowForm(true)}
              hovered={hoveredId === bid.id}
              onHover={() => handleHover(bid.id)}
              onLeave={handleUnhover}
              recordClick={recordClick}
            />
          ))}

          {/* Message si vide */}
          {top.length === 0 && (
            <text x={svgW / 2} y={SVG_H / 2 - 30}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="'Inter', sans-serif" fontSize="14"
              fill="rgba(100,116,139,0.8)">
              Aucune pub — soyez le premier !
            </text>
          )}

          {/* Lampadaires */}
          {[0.07, 0.25, 0.5, 0.75, 0.93].map((frac, i) => {
            const lx = svgW * frac;
            return (
              <g key={i}>
                <line x1={lx} y1={BASE_Y} x2={lx} y2={BASE_Y - 54}
                  stroke="#1e2d3d" strokeWidth="2" />
                <line x1={lx} y1={BASE_Y - 54} x2={lx + 17} y2={BASE_Y - 59}
                  stroke="#1e2d3d" strokeWidth="1.5" />
                <ellipse cx={lx + 17} cy={BASE_Y - 60} rx={8} ry={4}
                  fill="rgba(254,243,199,0.12)" />
                <circle cx={lx + 17} cy={BASE_Y - 60} r={4}
                  fill="rgba(254,243,199,0.95)"
                  style={{ filter: "drop-shadow(0 0 6px rgba(254,243,199,0.7))" }} />
              </g>
            );
          })}

          {/* Trottoir */}
          <rect x="0" y={BASE_Y} width={svgW} height={9} fill="#1a2a3e" />
          {/* Bordure trottoir */}
          <line x1="0" y1={BASE_Y} x2={svgW} y2={BASE_Y}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Chaussée */}
          <rect x="0" y={BASE_Y + 9} width={svgW} height={SVG_H - BASE_Y - 9}
            fill="url(#roadGrad)" />

          {/* Ligne centrale en pointillés */}
          <line x1="0" y1={BASE_Y + 37} x2={svgW} y2={BASE_Y + 37}
            stroke="rgba(255,255,255,0.12)" strokeWidth="2"
            strokeDasharray="28,22" />

          {/* Passage piéton à droite */}
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i}
              x={svgW - 80 + i * 11} y={BASE_Y + 10}
              width={7} height={SVG_H - BASE_Y - 10}
              fill="rgba(255,255,255,0.055)"
            />
          ))}

          {/* Voitures */}
          {CAR_CFGS.map(c => <CarSVG key={c.id} cfg={c} />)}

          {/* Reflets néon des enseignes sur la route */}
          {top.slice(0, 8).map((bid, i) => {
            const bx = positions[i];
            if (bx === undefined) return null;
            const { fw } = cfg(i);
            return (
              <g key={bid.id}>
                <ellipse cx={bx + fw / 2} cy={BASE_Y + 22}
                  rx={fw * 0.7} ry={10}
                  fill={bid.couleur} opacity={0.11} />
                <ellipse cx={bx + fw / 2} cy={BASE_Y + 40}
                  rx={fw * 0.45} ry={5}
                  fill={bid.couleur} opacity={0.07} />
              </g>
            );
          })}
        </svg>
      </div>

      {parisBids.length > TOP_MAX && (
        <div className="rue-invisible-notice">
          ⚠ {parisBids.length - TOP_MAX} pub(s) ne s'affiche(nt) pas — surenchérissez pour réapparaître
        </div>
      )}

      {showForm && (
        <FormulaireEnchere type="paris" onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
