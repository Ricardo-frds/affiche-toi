import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function FormulaireEnchere({ type, departement, onClose }) {
  const {
    placerEnchereDepartement, placerEnchereParis,
    getMinDepartement, getMinParis,
    departementBids, parisBids,
  } = useApp();

  const minMontant = type === "paris" ? getMinParis() : getMinDepartement(departement?.code);
  const actuel = type === "departement" ? departementBids[departement?.code] : null;

  const [form, setForm] = useState({
    nom: "",
    lien: "",
    couleur: "#3B82F6",
    montant: minMontant,
  });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  const rangEstime =
    type === "paris"
      ? parisBids.filter((b) => b.montant >= Number(form.montant)).length + 1
      : null;

  // Close modal after success, with cleanup
  useEffect(() => {
    if (!succes) return;
    const t = setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [succes, onClose]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErreur("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim()) return setErreur("Le nom est requis.");
    if (Number(form.montant) < minMontant)
      return setErreur(`Montant minimum : ${minMontant} €`);

    const res = type === "paris"
      ? await placerEnchereParis(form)
      : await placerEnchereDepartement({ ...form, departement: departement.code });

    if (res.succes) {
      setSucces(true);
    } else {
      setErreur(res.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-enchere">
        <button className="modal-close" onClick={onClose}>✕</button>

        {succes ? (
          <div className="modal-succes">
            <div className="succes-icon">✓</div>
            <p>Pub publiée !</p>
            <div
              className="succes-brand-preview"
              style={{ background: `${form.couleur}22`, borderColor: `${form.couleur}55`, boxShadow: `0 0 24px ${form.couleur}33` }}
            >
              <span className="sbp-dot" style={{ background: form.couleur, boxShadow: `0 0 8px ${form.couleur}` }} />
              <span className="sbp-name" style={{ color: form.couleur }}>{form.nom}</span>
            </div>
            <small>Visible immédiatement · Paiement Stripe à venir</small>
          </div>
        ) : (
          <>
            {/* ── En-tête contextuel ── */}
            <div className="modal-head-band">
              <div
                className="mhb-icon"
                style={{ background: type === "paris" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)",
                          borderColor: type === "paris" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)" }}
              >
                {type === "paris" ? "🏙" : "🗺"}
              </div>
              <div className="mhb-text">
                <h3 className="mhb-title">
                  {type === "paris" ? "Rue de Paris" : departement?.nom}
                </h3>
                <p className="mhb-sub">
                  {type === "paris"
                    ? "Classement parmi les 12 vitrines visibles"
                    : "Enchérissez sur ce département"}
                </p>
              </div>
              <span className="mhb-demo">DÉMO</span>
            </div>

            {/* ── Info occupant / libre ── */}
            {actuel ? (
              <div className="modal-info-actuel">
                <div className="mia-row">
                  <span className="mia-dot" style={{ background: actuel.couleur, boxShadow: `0 0 6px ${actuel.couleur}` }} />
                  <span className="mia-nom">{actuel.nom}</span>
                  <span className="mia-montant">{actuel.montant} €</span>
                </div>
                <div className="mia-surpass">
                  Surenchère minimum : <strong>{minMontant} €</strong>
                </div>
              </div>
            ) : type === "departement" ? (
              <div className="modal-info-libre">
                <span className="mil-check">✓</span>
                <span>Emplacement libre — enchères dès <strong>5 €</strong></span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="enchere-form">

              {/* Nom */}
              <div className="form-field">
                <div className="form-field-label">
                  Nom de votre marque
                  <span className="form-required">*</span>
                </div>
                <div className="form-input-wrap">
                  <span className="form-input-icon">✦</span>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="ex: Ma Boutique"
                    maxLength={30}
                    required
                    className="form-input"
                  />
                  <span className="form-char-count" style={{ color: form.nom.length > 25 ? "#f59e0b" : undefined }}>
                    {form.nom.length}/30
                  </span>
                </div>
              </div>

              {/* Lien */}
              <div className="form-field">
                <div className="form-field-label">
                  Lien vers votre site
                  <span className="form-optional">optionnel</span>
                </div>
                <div className="form-input-wrap">
                  <span className="form-input-icon">↗</span>
                  <input
                    name="lien"
                    value={form.lien}
                    onChange={handleChange}
                    placeholder="https://monsite.fr"
                    type="url"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Couleur */}
              <div className="form-field">
                <div className="form-field-label">Couleur de votre marque</div>
                <div className="couleur-section">
                  <div className="couleur-picker-side">
                    <input
                      name="couleur"
                      value={form.couleur}
                      onChange={handleChange}
                      type="color"
                      className="color-picker"
                    />
                    <span className="couleur-hex">{form.couleur.toUpperCase()}</span>
                  </div>
                  <div
                    className="couleur-preview-card"
                    style={{
                      background: `linear-gradient(135deg, ${form.couleur}1a, ${form.couleur}2e)`,
                      borderColor: `${form.couleur}44`,
                    }}
                  >
                    <span className="cpc-dot" style={{ background: form.couleur, boxShadow: `0 0 10px ${form.couleur}` }} />
                    <span className="cpc-name" style={{ color: form.couleur, textShadow: `0 0 12px ${form.couleur}60` }}>
                      {form.nom || "Aperçu"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Montant */}
              <div className="form-field">
                <div className="form-field-label">
                  Montant de l'enchère
                  <span className="form-field-min">min. {minMontant} €</span>
                </div>
                <div className="form-input-wrap">
                  <span className="form-input-icon form-input-icon-euro">€</span>
                  <input
                    name="montant"
                    value={form.montant}
                    onChange={handleChange}
                    type="number"
                    min={minMontant}
                    step="1"
                    required
                    className="form-input form-input-amount"
                  />
                </div>
                {type === "paris" && (
                  <div className="rang-estime-band">
                    <div className="reb-top">
                      <span className="reb-label">Rang estimé</span>
                      <span className={`reb-value ${rangEstime > 12 ? "reb-value-warn" : "reb-value-ok"}`}>
                        #{Math.min(rangEstime, 12)}
                        {rangEstime > 12 && <span className="reb-warn-txt"> — hors top 12</span>}
                      </span>
                    </div>
                    <div className="reb-slots">
                      {Array.from({ length: 12 }, (_, i) => (
                        <div
                          key={i}
                          className={`reb-slot ${
                            i + 1 === Math.min(rangEstime, 12) && rangEstime <= 12
                              ? "reb-slot-you"
                              : i + 1 < Math.min(rangEstime, 12) || rangEstime > 12
                              ? "reb-slot-taken"
                              : "reb-slot-free"
                          }`}
                          title={`#${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {erreur && (
                <div className="form-erreur">
                  <span className="form-erreur-icon">⚠</span>
                  {erreur}
                </div>
              )}

              <button type="submit" className="btn-primary btn-submit">
                <span>Enchérir pour {form.montant} €</span>
                <span className="btn-submit-arrow">→</span>
              </button>

              <p className="form-note">
                Démo · aucun paiement réel effectué
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
