import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { DEPARTEMENTS } from "../data/departements";

const DEPT_BY_CODE = Object.fromEntries(DEPARTEMENTS.map(d => [d.code, d.nom]));

function BrandCell({ bid }) {
  return (
    <div className="cl-brand">
      <span className="couleur-dot"
        style={{ backgroundColor: bid.couleur, boxShadow: `0 0 8px ${bid.couleur}` }} />
      {bid.lien
        ? <a href={bid.lien} target="_blank" rel="noreferrer">{bid.nom}</a>
        : bid.nom}
    </div>
  );
}

export default function Classement() {
  const { departementBids, parisBids, clicks, pageViews, activeUsers, totalRevenu } = useApp();

  const depList = useMemo(
    () => Object.values(departementBids)
      .sort((a, b) => b.montant - a.montant)
      .map(bid => ({ ...bid, depNom: DEPT_BY_CODE[bid.departement] || bid.departement })),
    [departementBids]
  );

  const parisTop  = parisBids.slice(0, 12);
  const maxDep    = depList[0]?.montant   || 1;
  const maxParis  = parisTop[0]?.montant  || 1;
  const totalBidders = depList.length + parisBids.length;

  const MEDAL = ["🥇", "🥈", "🥉"];

  const rowAccent = i => {
    if (i === 0) return { background: "rgba(245,158,11,0.07)", borderLeft: "3px solid #f59e0b" };
    if (i === 1) return { background: "rgba(148,163,184,0.04)", borderLeft: "3px solid #94a3b8" };
    if (i === 2) return { background: "rgba(202,138,4,0.04)",   borderLeft: "3px solid #ca8a04" };
    return { borderLeft: "3px solid transparent" };
  };

  return (
    <div className="classement-wrapper">

      {/* ── En-tête de page ── */}
      <div className="pg-banner">
        <div className="pg-banner-left">
          <span className="pg-banner-icon">🏆</span>
          <div>
            <h2 className="pg-banner-title">Classement live</h2>
            <p className="pg-banner-sub">{totalBidders} annonceurs actifs · mis à jour en temps réel</p>
          </div>
        </div>
        <div className="pg-banner-right">
          <div className="pg-banner-live">
            <span className="live-dot" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* ── Stats globales ── */}
      <div className="cl-header">
        <div className="cl-header-stat">
          <div className="cl-header-icon">💰</div>
          <div className="cl-header-val" style={{ color: "#4ade80" }}>{totalRevenu.toLocaleString("fr-FR")} €</div>
          <div className="cl-header-label">Total misé</div>
        </div>
        <div className="cl-header-sep" />
        <div className="cl-header-stat">
          <div className="cl-header-icon">📢</div>
          <div className="cl-header-val" style={{ color: "#60a5fa" }}>{totalBidders}</div>
          <div className="cl-header-label">Annonceurs</div>
        </div>
        <div className="cl-header-sep" />
        <div className="cl-header-stat">
          <div className="cl-header-icon">
            <span className="live-dot" style={{ width: 8, height: 8 }} />
          </div>
          <div className="cl-header-val" style={{ color: "#4ade80" }}>{activeUsers}</div>
          <div className="cl-header-label">En ligne</div>
        </div>
        <div className="cl-header-sep" />
        <div className="cl-header-stat">
          <div className="cl-header-icon">👁</div>
          <div className="cl-header-val" style={{ color: "#a78bfa" }}>{pageViews.toLocaleString("fr-FR")}</div>
          <div className="cl-header-label">Vues</div>
        </div>
      </div>

      <div className="classement-container">

        {/* ── Départements ── */}
        <div className="classement-card">
          <div className="classement-card-header">
            🗺 Top Départements
            <span className="cl-card-count">{depList.length} / 96 occupés</span>
          </div>
          <table className="classement-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Marque</th>
                <th>Département</th>
                <th>Enchère</th>
                <th>Clics</th>
              </tr>
            </thead>
            <tbody>
              {depList.map((bid, i) => (
                <tr key={bid.id} style={rowAccent(i)}>
                  <td className="rang">{MEDAL[i] ?? i + 1}</td>
                  <td><BrandCell bid={bid} /></td>
                  <td className="dep-nom">{bid.depNom}</td>
                  <td>
                    <div className="cl-amount-cell">
                      <span className="montant">{bid.montant} €</span>
                      <div className="cl-bar-track">
                        <div className="cl-bar-fill"
                          style={{ width: `${(bid.montant / maxDep) * 100}%`, background: bid.couleur }} />
                      </div>
                      <span className="cl-surpass-hint">
                        Surpasser : {bid.montant + 1} €
                      </span>
                    </div>
                  </td>
                  <td className="cl-clicks">
                    👁 {(clicks[bid.id] || 0).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
              {depList.length === 0 && (
                <tr>
                  <td colSpan={5} className="cl-empty">
                    Aucune enchère — soyez le premier !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Rue de Paris ── */}
        <div className="classement-card">
          <div className="classement-card-header">
            🏙 Rue de Paris
            <span className="cl-card-count">{parisBids.length} annonceurs</span>
          </div>
          <table className="classement-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Marque</th>
                <th>Enchère</th>
                <th>Clics</th>
              </tr>
            </thead>
            <tbody>
              {parisTop.map((bid, i) => (
                <tr key={bid.id} style={rowAccent(i)}>
                  <td className="rang">{MEDAL[i] ?? i + 1}</td>
                  <td><BrandCell bid={bid} /></td>
                  <td>
                    <div className="cl-amount-cell">
                      <span className="montant">{bid.montant} €</span>
                      <div className="cl-bar-track">
                        <div className="cl-bar-fill"
                          style={{ width: `${(bid.montant / maxParis) * 100}%`, background: bid.couleur }} />
                      </div>
                      {i === 0 && (
                        <span className="cl-leader-badge">🏆 Leader</span>
                      )}
                      {i > 0 && (
                        <span className="cl-surpass-hint">
                          +{parisTop[i - 1].montant - bid.montant + 1} € → rang #{i}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="cl-clicks">
                    👁 {(clicks[bid.id] || 0).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
              {parisBids.length > 12 && (
                <tr>
                  <td colSpan={4} className="cl-invisible-note">
                    ⚠ {parisBids.length - 12} pub(s) hors top 12 — invisible sur la rue
                  </td>
                </tr>
              )}
              {parisBids.length === 0 && (
                <tr>
                  <td colSpan={4} className="cl-empty">
                    Aucune enchère — soyez le premier !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
