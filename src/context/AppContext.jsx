import { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  collection, doc, onSnapshot, runTransaction, setDoc,
  serverTimestamp, orderBy, query, increment, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { MOCK_BIDS, MOCK_PARIS } from "../data/mockData";

const AppContext = createContext(null);

const COL = {
  DEPT:   "departements",
  PARIS:  "parisBids",
  CLICKS: "clicks",
  RECENT: "recentBids",
};

export const MIN_BID = 5;

const FALLBACK_DEPT  = MOCK_BIDS.reduce((acc, bid) => { acc[bid.departement] = bid; return acc; }, {});
const FALLBACK_PARIS = [...MOCK_PARIS].sort((a, b) => b.montant - a.montant);
const FALLBACK_CLICKS = {};
[...MOCK_BIDS, ...MOCK_PARIS].forEach(b => { FALLBACK_CLICKS[b.id] = Math.floor(40 + Math.random() * 460); });

export function AppProvider({ children }) {
  const [departementBids, setDepartementBids] = useState(FALLBACK_DEPT);
  const [parisBids,       setParisBids]       = useState(FALLBACK_PARIS);
  const [clicks,          setClicks]          = useState(FALLBACK_CLICKS);
  const [recentBids,      setRecentBids]      = useState([]);
  const [pageViews,       setPageViews]       = useState(2400 + Math.floor(Math.random() * 500));
  const [activeUsers,     setActiveUsers]     = useState(11  + Math.floor(Math.random() * 10));
  const [ready,           setReady]           = useState(false);

  /* ── Firestore real-time listeners ── */
  useEffect(() => {
    const unsubDept = onSnapshot(
      collection(db, COL.DEPT),
      (snap) => {
        const data = {};
        snap.forEach(d => { data[d.id] = d.data(); });
        setDepartementBids(Object.keys(data).length ? data : FALLBACK_DEPT);
        setReady(true);
      },
      (err) => { console.error("[Firestore] departements:", err.code, err.message); setReady(true); }
    );

    const unsubParis = onSnapshot(
      query(collection(db, COL.PARIS), orderBy("montant", "desc"), limit(50)),
      (snap) => {
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        setParisBids(data.length ? data : FALLBACK_PARIS);
      },
      (err) => { console.error("[Firestore] parisBids:", err.code, err.message); }
    );

    const unsubClicks = onSnapshot(
      collection(db, COL.CLICKS),
      (snap) => {
        const data = {};
        snap.forEach(d => { data[d.id] = d.data().count || 0; });
        setClicks(prev => ({ ...FALLBACK_CLICKS, ...data }));
      },
      (err) => { console.error("[Firestore] clicks:", err.code, err.message); }
    );

    const unsubRecent = onSnapshot(
      query(collection(db, COL.RECENT), orderBy("ts", "desc"), limit(6)),
      (snap) => {
        const data = snap.docs.map(d => ({ key: d.id, ...d.data() }));
        if (data.length) setRecentBids(data);
      },
      (err) => { console.error("[Firestore] recentBids:", err.code, err.message); }
    );

    return () => { unsubDept(); unsubParis(); unsubClicks(); unsubRecent(); };
  }, []);

  /* ── Simulated live stats ── */
  useEffect(() => {
    const iv = setInterval(() => {
      const pv = Math.floor(Math.random() * 3);
      if (pv > 0) setPageViews(v => v + pv);
      setActiveUsers(v => {
        const delta = Math.random() > 0.65 ? 1 : Math.random() > 0.5 ? -1 : 0;
        const next = Math.max(6, Math.min(40, v + delta));
        return next === v ? v : next;
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  /* ── Click tracking ── */
  async function recordClick(id) {
    setClicks(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    try {
      await setDoc(doc(db, COL.CLICKS, String(id)), { count: increment(1) }, { merge: true });
    } catch {}
  }

  function writeRecentBid(tx, { nom, montant, couleur, zone }) {
    tx.set(doc(collection(db, COL.RECENT)), { nom, montant, couleur, ts: serverTimestamp(), zone });
  }

  /* ── Place bid on a département ── */
  async function placerEnchereDepartement({ departement, nom, lien, couleur, montant }) {
    const amount = Number(montant);
    const minRequired = getMinDepartement(departement);
    if (amount < minRequired)
      return { succes: false, message: `Montant minimum : ${minRequired} €` };

    const docRef = doc(db, COL.DEPT, departement);
    const id = `d-${departement}-${Date.now()}`;

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(docRef);
        const current = snap.exists() ? snap.data() : null;
        const min = current ? current.montant + 1 : MIN_BID;
        if (amount < min) throw new Error(`Montant minimum : ${min} €`);
        tx.set(docRef, { id, nom, lien, couleur, montant: amount, departement, ts: serverTimestamp() });
        writeRecentBid(tx, { nom, montant: amount, couleur, zone: departement });
      });
      return { succes: true };
    } catch (err) {
      return { succes: false, message: err.message || "Erreur réseau" };
    }
  }

  /* ── Place bid in Rue de Paris ── */
  async function placerEnchereParis({ nom, lien, couleur, montant }) {
    const amount = Number(montant);
    if (amount < MIN_BID)
      return { succes: false, message: `Montant minimum : ${MIN_BID} €` };

    const id = `p-${Date.now()}`;
    try {
      await runTransaction(db, async (tx) => {
        tx.set(doc(db, COL.PARIS, id), { id, nom, lien, couleur, montant: amount, ts: serverTimestamp() });
        writeRecentBid(tx, { nom, montant: amount, couleur, zone: "Paris" });
      });
      return { succes: true };
    } catch (err) {
      return { succes: false, message: err.message || "Erreur réseau" };
    }
  }

  function getMinDepartement(code) {
    const actuel = departementBids[code];
    return actuel ? actuel.montant + 1 : MIN_BID;
  }
  function getMinParis() { return MIN_BID; }

  const totalRevenu = useMemo(
    () =>
      Object.values(departementBids).reduce((s, b) => s + b.montant, 0) +
      parisBids.reduce((s, b) => s + b.montant, 0),
    [departementBids, parisBids]
  );

  const occupiedCount = Object.keys(departementBids).length;
  const freeCount     = 96 - occupiedCount;
  const parisFree     = Math.max(0, 12 - parisBids.length);

  return (
    <AppContext.Provider value={{
      departementBids, parisBids,
      placerEnchereDepartement, placerEnchereParis,
      getMinDepartement, getMinParis,
      clicks, recordClick,
      pageViews, activeUsers, recentBids, totalRevenu,
      occupiedCount, freeCount, parisFree,
      ready,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
