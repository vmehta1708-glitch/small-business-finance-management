import { useState, useRef, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ReferenceLine, ComposedChart
} from "recharts";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => "₹" + Number(Math.abs(n || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => { const v = Math.abs(n || 0); return v >= 100000 ? "₹" + (v / 100000).toFixed(1) + "L" : v >= 1000 ? "₹" + (v / 1000).toFixed(1) + "k" : "₹" + v.toFixed(0); };
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── POCKET MITRA ICON ────────────────────────────────────────────────────────
function PocketMitraIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pmBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7AAACE" />
          <stop offset="100%" stopColor="#4A7FAB" />
        </linearGradient>
        <linearGradient id="pmGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD966" />
          <stop offset="100%" stopColor="#F4A100" />
        </linearGradient>
        <linearGradient id="pmWallet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
        <filter id="pmShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2a5f8f" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Rounded background circle */}
      <rect x="4" y="4" width="72" height="72" rx="20" fill="url(#pmBg)" filter="url(#pmShadow)" />

      {/* Decorative dot pattern top-right */}
      {[0,1,2].map(r => [0,1,2].map(c => (
        <circle key={`${r}-${c}`} cx={55 + c * 5} cy={12 + r * 5} r="1.2" fill="white" opacity="0.18" />
      )))}

      {/* Wallet body */}
      <rect x="14" y="28" width="44" height="30" rx="7" fill="url(#pmWallet)" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
      <rect x="14" y="28" width="44" height="30" rx="7" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />

      {/* Wallet flap / top band */}
      <rect x="14" y="28" width="44" height="11" rx="7" fill="white" fillOpacity="0.18" />
      <rect x="14" y="33" width="44" height="6" fill="white" fillOpacity="0.1" />

      {/* Coin slot accent line */}
      <rect x="22" y="41" width="24" height="2.5" rx="1.2" fill="white" fillOpacity="0.35" />
      <rect x="22" y="46" width="16" height="2" rx="1" fill="white" fillOpacity="0.22" />

      {/* Gold coin — overlapping top-right of wallet */}
      <circle cx="52" cy="30" r="11" fill="url(#pmGold)" stroke="white" strokeWidth="2" />
      <circle cx="52" cy="30" r="8" fill="none" stroke="#F4A100" strokeWidth="1" strokeOpacity="0.6" />
      {/* Rupee ₹ symbol inside coin */}
      <text x="52" y="35" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="Arial, sans-serif" style={{ userSelect: "none" }}>₹</text>

      {/* Small sparkle top-left */}
      <path d="M20 18 L21.2 21.5 L24.5 22.5 L21.2 23.5 L20 27 L18.8 23.5 L15.5 22.5 L18.8 21.5 Z" fill="white" fillOpacity="0.7" />

      {/* Tiny star bottom-right */}
      <path d="M62 56 L62.7 58 L64.5 58.5 L62.7 59 L62 61 L61.3 59 L59.5 58.5 L61.3 58 Z" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

// ─── SEED DATA ─────────────────────────────────────────────────────────────────
const MONTHLY = [
  { month: "Jan", revenue: 285000, expenses: 198000, profit: 87000 },
  { month: "Feb", revenue: 312000, expenses: 215000, profit: 97000 },
  { month: "Mar", revenue: 298000, expenses: 201000, profit: 97000 },
  { month: "Apr", revenue: 345000, expenses: 228000, profit: 117000 },
  { month: "May", revenue: 389000, expenses: 245000, profit: 144000 },
  { month: "Jun", revenue: 421000, expenses: 267000, profit: 154000 },
  { month: "Jul", revenue: 398000, expenses: 258000, profit: 140000 },
  { month: "Aug", revenue: 445000, expenses: 279000, profit: 166000 },
  { month: "Sep", revenue: 478000, expenses: 298000, profit: 180000 },
  { month: "Oct", revenue: 512000, expenses: 315000, profit: 197000 },
  { month: "Nov", revenue: 498000, expenses: 308000, profit: 190000 },
  { month: "Dec", revenue: 543000, expenses: 334000, profit: 209000 },
];

const EXP_CATS = [
  { name: "Rent", value: 35, color: "#7AAACE" },
  { name: "Salaries", value: 28, color: "#5B8DB8" },
  { name: "Inventory", value: 18, color: "#3D6B9A" },
  { name: "Utilities", value: 10, color: "#9BC5E0" },
  { name: "Marketing", value: 6, color: "#B8D9EE" },
  { name: "Other", value: 3, color: "#D4ECF7" },
];

const SEED_MANUAL = [
  { id: uid(), date: "2024-12-10", desc: "Customer Payment - Invoice #1042", amount: 45000, type: "credit", cat: "Sales", source: "manual" },
  { id: uid(), date: "2024-12-10", desc: "Electricity Bill", amount: 8500, type: "debit", cat: "Utilities", source: "manual" },
  { id: uid(), date: "2024-12-09", desc: "Staff Salaries", amount: 52000, type: "debit", cat: "Payroll", source: "manual" },
  { id: uid(), date: "2024-12-09", desc: "Product Sales - Retail", amount: 78000, type: "credit", cat: "Sales", source: "manual" },
  { id: uid(), date: "2024-12-08", desc: "Inventory Purchase", amount: 23000, type: "debit", cat: "Inventory", source: "manual" },
  { id: uid(), date: "2024-12-08", desc: "Online Orders", amount: 34500, type: "credit", cat: "Sales", source: "manual" },
  { id: uid(), date: "2024-12-07", desc: "Marketing Campaign", amount: 12000, type: "debit", cat: "Marketing", source: "manual" },
  { id: uid(), date: "2024-12-07", desc: "Rent Payment", amount: 28000, type: "debit", cat: "Rent", source: "manual" },
  { id: uid(), date: "2024-12-06", desc: "Wholesale Order", amount: 89500, type: "credit", cat: "Sales", source: "manual" },
  { id: uid(), date: "2024-12-06", desc: "GST Payment", amount: 12400, type: "debit", cat: "Tax", source: "manual" },
  { id: uid(), date: "2024-12-05", desc: "Service Revenue", amount: 27500, type: "credit", cat: "Services", source: "manual" },
  { id: uid(), date: "2024-12-05", desc: "Insurance Premium", amount: 4800, type: "debit", cat: "Insurance", source: "manual" },
];

const DEMO_STMT = () => {
  const rows = [
    { description: "NEFT - Sharma Enterprises Ltd", credit: 45000, debit: 0 },
    { description: "UPI Sale - Customer #2841", credit: 12500, debit: 0 },
    { description: "NACH DR - Rent Payment", credit: 0, debit: 28000 },
    { description: "IMPS - Supplier Invoice #204", credit: 0, debit: 15200 },
    { description: "POS - Inventory Purchase", credit: 0, debit: 8750 },
    { description: "NEFT - Patel & Co.", credit: 62000, debit: 0 },
    { description: "NACH DR - Loan EMI", credit: 0, debit: 18500 },
    { description: "UPI - Staff Salary", credit: 0, debit: 32000 },
    { description: "RTGS - Wholesale Order", credit: 89500, debit: 0 },
    { description: "DD - Electricity Board", credit: 0, debit: 6200 },
    { description: "NEFT - Kumar Traders", credit: 38000, debit: 0 },
    { description: "UPI - Marketing Agency", credit: 0, debit: 9500 },
    { description: "NEFT - Online Sales Payout", credit: 54200, debit: 0 },
    { description: "NACH DR - GST Payment", credit: 0, debit: 12400 },
    { description: "RTGS - Bulk Order Revenue", credit: 115000, debit: 0 },
  ];
  const dates = ["2024-12-01","2024-12-02","2024-12-03","2024-12-04","2024-12-05",
                  "2024-12-06","2024-12-07","2024-12-08","2024-12-09","2024-12-10",
                  "2024-12-11","2024-12-12","2024-12-13","2024-12-14","2024-12-15"];
  let bal = 250000;
  return rows.map((r, i) => { bal += r.credit - r.debit; return { ...r, date: dates[i % dates.length], balance: parseFloat(bal.toFixed(2)) }; });
};

const CATEGORIES = ["Sales", "Services", "Rent", "Salaries", "Inventory", "Utilities", "Marketing", "Tax", "Insurance", "Payroll", "Other"];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const accent = "#7AAACE", accentDark = "#5B8DB8";

  // Auth
  const [page, setPage] = useState("login");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", password: "", name: "", business: "Café", role: "owner" });

  // UI
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: "ai", text: "Namaste! 🙏 I'm Mitra, your AI financial companion. Ask me about cash flow, profit, recommendations, or upload a bank statement! 💰" }]);
  const [chatInput, setChatInput] = useState("");
  const [listening, setListening] = useState(false);

  // Manual cash entries (the new ledger)
  const [manualEntries, setManualEntries] = useState(SEED_MANUAL);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashEntry, setCashEntry] = useState({ date: today(), desc: "", amount: "", type: "credit", cat: "Sales", note: "" });
  const [ledgerDate, setLedgerDate] = useState(today());

  // Statement
  const [stmtFile, setStmtFile] = useState(null);
  const [stmtTxns, setStmtTxns] = useState([]);
  const [stmtStatus, setStmtStatus] = useState("idle");
  const [stmtProgress, setStmtProgress] = useState("");
  const [stmtPct, setStmtPct] = useState(0);
  const [stmtFilterDate, setStmtFilterDate] = useState("all");
  const [stmtDrag, setStmtDrag] = useState(false);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  // AI features
  const [recommendations, setRecommendations] = useState([]);
  const [riskPatterns, setRiskPatterns] = useState([]);
  const [cashPrediction, setCashPrediction] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [lastAiRun, setLastAiRun] = useState(null);

  // Reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // GST, Sim
  const [gstBase, setGstBase] = useState("");
  const [gstRate, setGstRate] = useState(18);
  const [simScenario, setSimScenario] = useState("incSales");
  const [simValue, setSimValue] = useState(15);
  const [simResult, setSimResult] = useState(null);

  // Colors
  const bg = dark ? "#1a1f2e" : "#F7F8F0";
  const cardBg = dark ? "#242b3d" : "#ffffff";
  const text = dark ? "#e8eaf0" : "#1a2332";
  const textMuted = dark ? "#8892a4" : "#6b7a99";
  const border = dark ? "#2d3650" : "#e2e8f0";
  const sidebarBg = dark ? "#1e2436" : "#7AAACE";

  // ── Combined ledger (manual + statement) ─────────────────────────────────────
  const allEntries = [
    ...manualEntries.map(e => ({
      id: e.id, date: e.date, desc: e.desc,
      credit: e.type === "credit" ? e.amount : 0,
      debit: e.type === "debit" ? e.amount : 0,
      cat: e.cat, source: "manual"
    })),
    ...stmtTxns.map((e, i) => ({
      id: "stmt_" + i, date: e.date, desc: e.description,
      credit: e.credit || 0, debit: e.debit || 0,
      cat: "Bank", source: "statement", balance: e.balance
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Daily ledger for selected date
  const dayEntries = allEntries.filter(e => e.date === ledgerDate);
  const dayRevenue = dayEntries.reduce((s, e) => s + e.credit, 0);
  const dayExpenses = dayEntries.reduce((s, e) => s + e.debit, 0);
  const dayProfit = dayRevenue - dayExpenses;
  const dayMargin = dayRevenue > 0 ? ((dayProfit / dayRevenue) * 100).toFixed(1) : 0;

  // All-time totals
  const totalRevenue = allEntries.reduce((s, e) => s + e.credit, 0);
  const totalExpenses = allEntries.reduce((s, e) => s + e.debit, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Monthly chart data from all entries
  const buildMonthlyFromEntries = () => {
    const map = {};
    allEntries.forEach(e => {
      const m = e.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, revenue: 0, expenses: 0 };
      map[m].revenue += e.credit;
      map[m].expenses += e.debit;
    });
    return Object.values(map).map(m => ({ ...m, profit: m.revenue - m.expenses })).slice(-6);
  };

  // ── AI Claude calls ───────────────────────────────────────────────────────────
  const callClaude = async (prompt, maxTokens = 800) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    return data.content.map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
  };

  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const summary = {
        totalRevenue, totalExpenses, totalProfit,
        profitMargin: parseFloat(profitMargin),
        entries: allEntries.slice(0, 30).map(e => ({ date: e.date, credit: e.credit, debit: e.debit, cat: e.cat })),
        monthly: MONTHLY.slice(-6),
        dayRevenue, dayExpenses, dayProfit
      };

      // Run 3 parallel AI calls
      const [recRaw, riskRaw, predRaw] = await Promise.all([
        // 1. Recommendations
        callClaude(`You are a financial advisor for a small Indian business. Based on this data: ${JSON.stringify(summary)}
Return ONLY a JSON array of 4 recommendations. Each object: {"title":"short title","detail":"1-2 sentence actionable advice","priority":"high|medium|low","icon":"single emoji","impact":"₹X potential monthly impact or % improvement"}
Output only the JSON array, no markdown.`, 600),

        // 2. Risk patterns
        callClaude(`Analyze financial risk patterns for a small Indian business: ${JSON.stringify(summary)}
Return ONLY a JSON array of 3-4 risk items. Each: {"risk":"risk title","detail":"explain the risk in 1 sentence","severity":"high|medium|low","trend":"improving|worsening|stable","icon":"emoji"}
Output only the JSON array, no markdown.`, 500),

        // 3. Cash flow prediction (next 6 months)
        callClaude(`Based on this transaction history for a small Indian business: ${JSON.stringify({ monthly: MONTHLY, recentEntries: allEntries.slice(0, 20) })}
Predict the next 6 months of cash flow. Return ONLY a JSON array of 6 objects:
{"month":"Jan 2025","predicted_revenue":number,"predicted_expenses":number,"predicted_profit":number,"confidence":"high|medium|low","note":"1 short insight"}
Use realistic numbers based on the trend. Output only the JSON array.`, 600)
      ]);

      try { setRecommendations(JSON.parse(recRaw)); } catch { setRecommendations([]); }
      try { setRiskPatterns(JSON.parse(riskRaw)); } catch { setRiskPatterns([]); }
      try { setCashPrediction(JSON.parse(predRaw)); } catch { setCashPrediction([]); }

      setLastAiRun(new Date().toLocaleTimeString());
    } catch (e) {
      // Fallback static data
      setRecommendations([
        { title: "Reduce Rent Cost", detail: "Rent is 35% of expenses. Consider subletting unused space or renegotiating lease to save ₹8,000-12,000/month.", priority: "high", icon: "🏠", impact: "₹10,000/month savings" },
        { title: "Diversify Revenue Streams", detail: "Add online sales or delivery service to increase revenue by 15-20% without proportional cost increase.", priority: "high", icon: "📈", impact: "15-20% revenue growth" },
        { title: "Inventory Optimization", detail: "Use just-in-time ordering to reduce inventory holding costs and improve cash flow.", priority: "medium", icon: "📦", impact: "₹5,000/month savings" },
        { title: "Automate Follow-ups", detail: "3 invoices overdue — automate payment reminders to improve collection by 30%.", priority: "medium", icon: "📋", impact: "₹18,500 faster recovery" },
      ]);
      setRiskPatterns([
        { risk: "Overspending on Rent", detail: "Rent consumes 35% of total expenses, significantly above the 20% industry benchmark.", severity: "high", trend: "stable", icon: "🏠" },
        { risk: "Revenue Concentration", detail: "Top 3 clients generate 70% of revenue — loss of any one would critically impact cash flow.", severity: "high", trend: "worsening", icon: "⚠️" },
        { risk: "Payroll Spike", detail: "Payroll increased 18% last month without corresponding revenue growth.", severity: "medium", trend: "worsening", icon: "👥" },
        { risk: "Low Cash Buffer", detail: "Current cash runway of 8.2 months is below the recommended 12-month safety net.", severity: "medium", trend: "stable", icon: "💰" },
      ]);
      setCashPrediction([
        { month: "Jan 2025", predicted_revenue: 565000, predicted_expenses: 348000, predicted_profit: 217000, confidence: "high", note: "Post-holiday demand boost" },
        { month: "Feb 2025", predicted_revenue: 532000, predicted_expenses: 335000, predicted_profit: 197000, confidence: "high", note: "Seasonal dip expected" },
        { month: "Mar 2025", predicted_revenue: 578000, predicted_expenses: 352000, predicted_profit: 226000, confidence: "medium", note: "Q4 end boost" },
        { month: "Apr 2025", predicted_revenue: 598000, predicted_expenses: 362000, predicted_profit: 236000, confidence: "medium", note: "Festival season prep" },
        { month: "May 2025", predicted_revenue: 621000, predicted_expenses: 375000, predicted_profit: 246000, confidence: "low", note: "Growth trajectory" },
        { month: "Jun 2025", predicted_revenue: 645000, predicted_expenses: 389000, predicted_profit: 256000, confidence: "low", note: "Optimistic projection" },
      ]);
      setLastAiRun(new Date().toLocaleTimeString() + " (demo)");
    }
    setAiLoading(false);
  };

  // ── File type detector ────────────────────────────────────────────────────────
  const getFileType = (file) => {
    const name = file.name.toLowerCase();
    const mime = file.type;
    if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (mime.includes("spreadsheet") || mime.includes("excel") || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) return "excel";
    if (mime.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) return "image";
    return "unknown";
  };

  const ACCEPTED_TYPES = ".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp";
  const FILE_TYPE_INFO = {
    pdf:   { icon: "📄", label: "PDF Statement",    color: "#dc2626", bg: "#fce4e4" },
    excel: { icon: "📊", label: "Excel / CSV",       color: "#16a34a", bg: "#dcfce7" },
    image: { icon: "🖼️", label: "Image / Photo",    color: "#f59e0b", bg: "#fef9c3" },
  };

  // ── PDF text extraction ───────────────────────────────────────────────────────
  const extractPdf = async (file) => {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!window.pdfjsLib) {
            await new Promise((ok, fail) => {
              const s = document.createElement("script");
              s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              s.onload = ok; s.onerror = fail; document.head.appendChild(s);
            });
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
          const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
          let txt = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const pg = await pdf.getPage(i);
            const c = await pg.getTextContent();
            txt += c.items.map(x => x.str).join(" ") + "\n";
          }
          res(txt);
        } catch (err) { rej(err); }
      };
      reader.onerror = rej; reader.readAsArrayBuffer(file);
    });
  };

  // ── Excel / CSV text extraction ───────────────────────────────────────────────
  const extractExcel = async (file) => {
    const name = file.name.toLowerCase();
    // CSV: plain text read
    if (name.endsWith(".csv")) {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.onerror = rej;
        r.readAsText(file);
      });
    }
    // XLSX/XLS: use SheetJS from CDN
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!window.XLSX) {
            await new Promise((ok, fail) => {
              const s = document.createElement("script");
              s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
              s.onload = ok; s.onerror = fail; document.head.appendChild(s);
            });
          }
          const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          let txt = "";
          wb.SheetNames.forEach(sheetName => {
            const ws = wb.Sheets[sheetName];
            txt += window.XLSX.utils.sheet_to_csv(ws) + "\n";
          });
          res(txt);
        } catch (err) { rej(err); }
      };
      reader.onerror = rej; reader.readAsArrayBuffer(file);
    });
  };

  // ── Image → base64 → Claude vision extraction ─────────────────────────────────
  const extractImage = async (file) => {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(",")[1];
          const mimeType = file.type || "image/jpeg";
          // Send image directly to Claude with vision
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 4000,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
                  { type: "text", text: `This is a bank statement image. Extract ALL transactions visible. Return ONLY a JSON array. Each object: {"date":"YYYY-MM-DD","description":"string","credit":number,"debit":number,"balance":number}. Remove commas from numbers. Cr/CR=credit, Dr/DR=debit. Use 2024 if year missing. Output only the JSON array, no markdown.` }
                ]
              }]
            })
          });
          const data = await response.json();
          const raw = data.content.map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
          res(JSON.parse(raw));
        } catch (err) { rej(err); }
      };
      reader.onerror = rej; reader.readAsDataURL(file);
    });
  };

  // ── Master process statement (handles all formats) ────────────────────────────
  const processStatement = async (file) => {
    const fileType = getFileType(file);
    if (fileType === "unknown") return;

    setStmtFile(file); setStmtStatus("loading"); setStmtTxns([]); setStmtPct(10);
    const typeLabel = FILE_TYPE_INFO[fileType]?.label || "File";

    try {
      let extracted = [];

      if (fileType === "image") {
        // Image: Claude Vision does everything in one shot
        setStmtProgress(`Reading ${typeLabel} with AI Vision...`); setStmtPct(30);
        try {
          extracted = await extractImage(file);
        } catch { extracted = []; }

      } else {
        // PDF or Excel: extract text first, then Claude parses
        setStmtProgress(`Reading ${typeLabel}...`); setStmtPct(20);
        let txt = "";
        try {
          txt = fileType === "pdf" ? await extractPdf(file) : await extractExcel(file);
        } catch { txt = ""; }

        setStmtProgress("Claude AI extracting transactions..."); setStmtPct(55);
        try {
          const raw = await callClaude(
            `Parse ALL transactions from this bank statement ${fileType === "excel" ? "(CSV/Excel data)" : "(PDF text)"}. Return ONLY a JSON array. Each object: {"date":"YYYY-MM-DD","description":"string","credit":number,"debit":number,"balance":number}. Remove commas from numbers. Cr=credit, Dr=debit. Use 2024 if year missing.\n\n${txt.slice(0, 14000)}`,
            4000
          );
          extracted = JSON.parse(raw);
        } catch { extracted = []; }
      }

      setStmtProgress("Building results..."); setStmtPct(90);
      await new Promise(r => setTimeout(r, 300));

      const final = (Array.isArray(extracted) && extracted.length > 0) ? extracted : DEMO_STMT();
      setStmtTxns(final);

      const tc = final.reduce((s, t) => s + (t.credit || 0), 0);
      const td = final.reduce((s, t) => s + (t.debit || 0), 0);
      try {
        const insight = await callClaude(`2-sentence financial insight for small Indian business: Credits ₹${tc.toFixed(0)}, Debits ₹${td.toFixed(0)}, Net ₹${(tc - td).toFixed(0)}, ${final.length} transactions. Practical, encouraging.`, 150);
        setAiInsight(insight);
      } catch { setAiInsight("Statement processed. Review transactions and use the date filter to analyse specific days."); }

      if (!Array.isArray(extracted) || extracted.length === 0) {
        setAiInsight(fileType === "image"
          ? "Demo data shown — ensure the image is clear and well-lit for best results."
          : `Demo data shown — upload a text-based ${typeLabel} for real extraction.`);
      }
      setStmtPct(100); setStmtStatus("done");

    } catch {
      setStmtTxns(DEMO_STMT()); setStmtPct(100); setStmtStatus("done");
      setAiInsight("Demo data shown. Please try again with a clearer file.");
    }
  };

  // Statement derived
  const stmtDates = [...new Set(stmtTxns.map(t => t.date))].sort((a, b) => b.localeCompare(a));
  const filteredStmt = stmtFilterDate === "all" ? stmtTxns : stmtTxns.filter(t => t.date === stmtFilterDate);
  const stmtCredit = filteredStmt.reduce((s, t) => s + (t.credit || 0), 0);
  const stmtDebit = filteredStmt.reduce((s, t) => s + (t.debit || 0), 0);
  const stmtNet = stmtCredit - stmtDebit;

  // ── Chat ──────────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    try {
      const ctx = `Business data: Revenue ₹${fmtShort(totalRevenue)}, Expenses ₹${fmtShort(totalExpenses)}, Profit ₹${fmtShort(totalProfit)}, Margin ${profitMargin}%, Entries: ${allEntries.length}. User question: ${msg}`;
      const reply = await callClaude(`You are a helpful financial assistant for a small Indian business. Answer concisely in 2-3 sentences. ${ctx}`, 300);
      setChatMessages(prev => [...prev, { role: "ai", text: reply }]);
    } catch {
      const lower = msg.toLowerCase();
      const r = lower.includes("profit") ? `Your current profit is ${fmt(totalProfit)} with a ${profitMargin}% margin. Focus on reducing top expenses to improve this further.`
        : lower.includes("expense") ? `Total expenses are ${fmt(totalExpenses)}. Top categories: Rent (35%), Salaries (28%), Inventory (18%). Consider reducing rent and optimizing inventory.`
        : lower.includes("revenue") ? `Total revenue is ${fmt(totalRevenue)}. Revenue is growing well — diversify your customer base to reduce concentration risk.`
        : lower.includes("recommendation") ? "Run the AI Analysis from the AI Insights section for personalized recommendations based on your transaction data!"
        : "I can help with profit analysis, expense reduction, revenue growth, and financial recommendations. Try asking about specific metrics!";
      setChatMessages(prev => [...prev, { role: "ai", text: r }]);
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.onresult = (e) => {
      const tr = e.results[0][0].transcript.toLowerCase();
      if (tr.includes("dark")) setDark(true);
      else if (tr.includes("light")) setDark(false);
      else if (tr.includes("ledger") || tr.includes("cash")) setActiveNav("ledger");
      else if (tr.includes("bank")) setActiveNav("bankStatement");
      else if (tr.includes("insight") || tr.includes("recommend")) setActiveNav("aiInsights");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.start(); recognitionRef.current = rec; setListening(true);
  };

  const gstCalc = gstBase ? (parseFloat(gstBase) * gstRate / 100).toFixed(2) : 0;
  const gstFinal = gstBase ? (parseFloat(gstBase) + parseFloat(gstCalc)).toFixed(2) : 0;

  // ── Styles ────────────────────────────────────────────────────────────────────
  const S = {
    app: { fontFamily: "'Outfit', sans-serif", background: bg, color: text, minHeight: "100vh", transition: "all 0.3s" },
    sbar: { width: sidebarOpen ? 248 : 64, background: sidebarBg, color: "#fff", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 100, display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden", boxShadow: "4px 0 24px rgba(122,170,206,0.3)" },
    main: { marginLeft: sidebarOpen ? 248 : 64, padding: "24px", transition: "margin-left 0.3s", minHeight: "100vh" },
    card: { background: cardBg, borderRadius: 16, padding: "20px", boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(122,170,206,0.12)", border: `1px solid ${border}` },
    btn: { background: `linear-gradient(135deg, ${accent}, ${accentDark})`, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
    inp: { background: dark ? "#1a1f2e" : "#f8faff", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", color: text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
    label: { fontSize: 12, color: textMuted, display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" },
  };

  const navItems = [
    { id: "dashboard", icon: "⬛", label: "Dashboard" },
    { id: "ledger", icon: "📒", label: "Daily Ledger", badge: dayEntries.length > 0 ? dayEntries.length : null },
    { id: "bankStatement", icon: "🏦", label: "Bank Statement", badge: stmtStatus === "done" ? "✓" : null },
    { id: "aiInsights", icon: "🧠", label: "AI Insights", badge: recommendations.length > 0 ? "NEW" : null },
    { id: "revenue", icon: "📈", label: "Revenue" },
    { id: "expenses", icon: "📉", label: "Expenses" },
    { id: "profit", icon: "💰", label: "Profit & Loss" },
    { id: "cashflow", icon: "💧", label: "Cash Flow" },
    { id: "invoices", icon: "📋", label: "Invoices" },
    { id: "budget", icon: "🎯", label: "Budget" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "gst", icon: "🧾", label: "GST Calculator" },
    { id: "whatif", icon: "🔮", label: "What-If Simulator" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  const StatCard = ({ label, value, icon, change, color, sub, border: brd }) => (
    <div style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: brd ? `4px solid ${brd}` : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
          <h3 style={{ margin: "5px 0 0", fontSize: 20, fontWeight: 800, color: color || text }}>{value}</h3>
          {change !== undefined && <p style={{ margin: "3px 0 0", fontSize: 11, color: change > 0 ? "#16a34a" : "#dc2626" }}>{change > 0 ? "↑" : "↓"} {Math.abs(change)}%</p>}
          {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: textMuted }}>{sub}</p>}
        </div>
        <div style={{ fontSize: 26 }}>{icon}</div>
      </div>
    </div>
  );

  // ── LOGIN ─────────────────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: dark
        ? "linear-gradient(145deg, #0f1623 0%, #1a2540 50%, #0f1e35 100%)"
        : "linear-gradient(145deg, #e8f4fd 0%, #dbeafe 40%, #eff6ff 70%, #f0fdf4 100%)",
      position: "fixed", inset: 0, overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes loginFadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }
      `}</style>

      {/* Decorative blobs */}
      <div style={{ position:"absolute", top:"-80px", left:"-80px", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle, ${accent}30, transparent 70%)`, animation:"pulse 6s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-60px", right:"-60px", width:260, height:260, borderRadius:"50%", background:`radial-gradient(circle, ${accentDark}25, transparent 70%)`, animation:"pulse 8s ease-in-out infinite 2s", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"40%", right:"8%", width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle, #8b5cf620, transparent 70%)`, animation:"pulse 5s ease-in-out infinite 1s", pointerEvents:"none" }} />

      {/* Center column: brand above + card below */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, animation:"loginFadeIn 0.6s ease both", zIndex:1 }}>

        {/* ── Brand block above the card ── */}
        <div style={{ textAlign:"center", marginBottom: 28, animation:"floatUp 4s ease-in-out infinite" }}>
          <PocketMitraIcon size={88} />
          <h1 style={{
            margin: "14px 0 4px",
            fontSize: 38, fontWeight: 800, letterSpacing: "-1px",
            background: `linear-gradient(135deg, ${accent}, ${accentDark}, #5B8DB8)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Pocket Mitra</h1>
          <p style={{ color: dark ? "#8892a4" : "#6b7a99", fontSize: 15, margin: 0, fontWeight: 500 }}>
            Your Trusted Financial Companion
          </p>
          {/* Feature pills */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:14, flexWrap:"wrap" }}>
            {["📒 Daily Ledger","🧠 AI Insights","📊 P&L Reports","🔮 Cash Forecast"].map(f => (
              <span key={f} style={{ background: dark ? "rgba(122,170,206,0.15)" : "rgba(122,170,206,0.18)", color: accent, border:`1px solid ${accent}35`, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600 }}>{f}</span>
            ))}
          </div>
        </div>

        {/* ── Login card ── */}
        <div style={{
          background: dark ? "rgba(36,43,61,0.95)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          borderRadius: 24, padding: "36px 40px 32px",
          width: 420, maxWidth: "calc(100vw - 32px)",
          boxShadow: dark
            ? "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(122,170,206,0.15)"
            : "0 24px 64px rgba(122,170,206,0.22), 0 0 0 1px rgba(122,170,206,0.12)",
          border: `1px solid ${dark ? "rgba(122,170,206,0.18)" : "rgba(122,170,206,0.2)"}`,
        }}>
          {/* Login / Signup tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:24, background: dark ? "#1a1f2e" : "#f1f5f9", borderRadius:12, padding:5 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => setAuthMode(m)} style={{
                flex:1, padding:"9px 0", border:"none", borderRadius:9, cursor:"pointer",
                fontWeight:700, fontSize:14,
                background: authMode === m ? `linear-gradient(135deg,${accent},${accentDark})` : "transparent",
                color: authMode === m ? "#fff" : dark ? "#8892a4" : "#6b7a99",
                transition:"all 0.25s", boxShadow: authMode === m ? `0 4px 12px ${accent}40` : "none",
              }}>{m === "login" ? "🔑 Login" : "✨ Sign Up"}</button>
            ))}
          </div>

          {/* Form fields */}
          <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
            {authMode === "signup" && <>
              <input style={{ ...S.inp, borderRadius:12 }} placeholder="👤  Full Name" value={loginData.name} onChange={e => setLoginData({ ...loginData, name: e.target.value })} />
              <select style={{ ...S.inp, borderRadius:12 }} value={loginData.business} onChange={e => setLoginData({ ...loginData, business: e.target.value })}>
                {["Café","Grocery Shop","Boutique","Freelancer","Bakery","Salon","Restaurant","Pharmacy","Electronics","Other"].map(b => <option key={b}>{b}</option>)}
              </select>
              <select style={{ ...S.inp, borderRadius:12 }} value={loginData.role} onChange={e => setLoginData({ ...loginData, role: e.target.value })}>
                <option value="owner">👑  Owner</option>
                <option value="manager">🗂️  Manager</option>
                <option value="accountant">🧾  Accountant</option>
              </select>
            </>}
            <input style={{ ...S.inp, borderRadius:12 }} type="email" placeholder="✉️  Email address" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
            <input style={{ ...S.inp, borderRadius:12 }} type="password" placeholder="🔒  Password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />

            <button style={{
              ...S.btn, width:"100%", padding:"14px 0", fontSize:16, borderRadius:12, marginTop:4,
              boxShadow: `0 6px 20px ${accent}45`,
              background:`linear-gradient(135deg, ${accent}, ${accentDark})`,
            }} onClick={() => {
              setUser({ name: loginData.name || "Business Owner", email: loginData.email, business: loginData.business || "Café", role: loginData.role });
              setPage("app");
            }}>
              {authMode === "login" ? "Login to Pocket Mitra →" : "Create My Account →"}
            </button>
          </div>

          {/* Language selector */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
            {[["en","EN"],["hi","हि"],["gu","ગુ"]].map(([c,l]) => (
              <button key={c} onClick={() => setLang(c)} style={{ padding:"5px 14px", borderRadius:20, border:`1px solid ${lang===c ? accent : border}`, background: lang===c ? accent : "transparent", color: lang===c ? "#fff" : dark ? "#8892a4" : "#6b7a99", cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.2s" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ color: dark ? "#4a5568" : "#94a3b8", fontSize:12, marginTop:20, textAlign:"center" }}>
          🔒 Your data stays private · Powered by Claude AI
        </p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── DAILY LEDGER VIEW ─────────────────────────────────────────────────────────
  function LedgerView() {
    const allDates = [...new Set(allEntries.map(e => e.date))].sort((a, b) => b.localeCompare(a));
    const selEntries = allEntries.filter(e => e.date === ledgerDate);
    const selRev = selEntries.reduce((s, e) => s + e.credit, 0);
    const selExp = selEntries.reduce((s, e) => s + e.debit, 0);
    const selProfit = selRev - selExp;
    const selMargin = selRev > 0 ? ((selProfit / selRev) * 100).toFixed(1) : "0.0";

    // By category
    const catMap = {};
    selEntries.forEach(e => {
      if (e.credit > 0) { catMap[e.cat || "Other"] = (catMap[e.cat || "Other"] || 0) + e.credit; }
    });
    const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    return (
      <div>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .row-hover:hover{background:${dark ? "#ffffff08" : "#f0f7ff"} !important}`}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 24 }}>📒 Daily Cash Ledger</h2>
            <p style={{ margin: "4px 0 0", color: textMuted, fontSize: 14 }}>Manual entries + bank statement data — combined profit & loss</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select style={{ ...S.inp, width: "auto", padding: "8px 14px", fontSize: 14, fontWeight: 600 }} value={ledgerDate} onChange={e => setLedgerDate(e.target.value)}>
              {allDates.map(d => <option key={d} value={d}>{d} ({allEntries.filter(e => e.date === d).length} entries)</option>)}
              {!allDates.includes(today()) && <option value={today()}>{today()} (today)</option>}
            </select>
            <button style={{ ...S.btn, display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", boxShadow: `0 4px 16px ${accent}40` }} onClick={() => setShowCashModal(true)}>
              <span style={{ fontSize: 18 }}>+</span> Add Cash Entry
            </button>
          </div>
        </div>

        {/* Daily KPI cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: "4px solid #16a34a", animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Day Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{fmtShort(selRev)}</div>
            <div style={{ fontSize: 11, color: textMuted }}>{selEntries.filter(e => e.credit > 0).length} credit entries</div>
          </div>
          <div style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: "4px solid #dc2626", animation: "fadeIn 0.4s ease 0.05s both" }}>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Day Expenses</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{fmtShort(selExp)}</div>
            <div style={{ fontSize: 11, color: textMuted }}>{selEntries.filter(e => e.debit > 0).length} debit entries</div>
          </div>
          <div style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: `4px solid ${selProfit >= 0 ? accent : "#f59e0b"}`, animation: "fadeIn 0.4s ease 0.1s both" }}>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Net Profit</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: selProfit >= 0 ? "#16a34a" : "#dc2626" }}>{selProfit >= 0 ? "+" : "-"}{fmtShort(selProfit)}</div>
            <div style={{ fontSize: 11, color: selProfit >= 0 ? "#16a34a" : "#dc2626" }}>{selProfit >= 0 ? "✅ Profitable" : "⚠️ Loss day"}</div>
          </div>
          <div style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: `4px solid #8b5cf6`, animation: "fadeIn 0.4s ease 0.15s both" }}>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Profit Margin</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6" }}>{selMargin}%</div>
            <div style={{ fontSize: 11, color: textMuted }}>Revenue efficiency</div>
          </div>
          <div style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: `4px solid #f59e0b`, animation: "fadeIn 0.4s ease 0.2s both" }}>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Total Entries</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{selEntries.length}</div>
            <div style={{ fontSize: 11, color: textMuted }}>{selEntries.filter(e => e.source === "manual").length} manual · {selEntries.filter(e => e.source === "statement").length} bank</div>
          </div>
        </div>

        {/* Row: table + mini chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
          {/* Ledger Table */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Ledger — {ledgerDate}</h3>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Credits: {selEntries.filter(e => e.credit > 0).length}</span>
                <span style={{ background: "#fce4e4", color: "#dc2626", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Debits: {selEntries.filter(e => e.debit > 0).length}</span>
              </div>
            </div>
            {selEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: textMuted }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>No entries for {ledgerDate}</div>
                <button style={{ ...S.btn, fontSize: 13 }} onClick={() => setShowCashModal(true)}>+ Add First Entry</button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: dark ? "#1e2436" : "#f0f7ff" }}>
                      {["#", "Description", "Category", "Source", "Credit", "Debit"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: textMuted, fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${accent}40`, textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selEntries.map((e, i) => (
                      <tr key={e.id} className="row-hover" style={{ borderBottom: `1px solid ${border}`, transition: "background 0.15s" }}>
                        <td style={{ padding: "10px 12px", color: textMuted, fontSize: 11 }}>{i + 1}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 500, maxWidth: 220 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.desc}>{e.desc}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: accent + "20", color: accent, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{e.cat || "—"}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: e.source === "manual" ? "#f5f3ff" : "#eff6ff", color: e.source === "manual" ? "#7c3aed" : "#1d4ed8", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            {e.source === "manual" ? "✏️ Manual" : "🏦 Bank"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          {e.credit > 0 ? <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>+{fmt(e.credit)}</span> : <span style={{ color: textMuted }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          {e.debit > 0 ? <span style={{ background: "#fce4e4", color: "#dc2626", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>-{fmt(e.debit)}</span> : <span style={{ color: textMuted }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: dark ? "#1e2436" : "#eff6ff", borderTop: `3px solid ${accent}` }}>
                      <td colSpan={4} style={{ padding: "12px", fontWeight: 800, fontSize: 14 }}>DAILY TOTAL</td>
                      <td style={{ padding: "12px", fontWeight: 800, color: "#16a34a", whiteSpace: "nowrap" }}>+{fmt(selRev)}</td>
                      <td style={{ padding: "12px", fontWeight: 800, color: "#dc2626", whiteSpace: "nowrap" }}>-{fmt(selExp)}</td>
                    </tr>
                    <tr style={{ background: dark ? "#1e2436" : "#eff6ff" }}>
                      <td colSpan={4} style={{ padding: "8px 12px", fontWeight: 800, fontSize: 14 }}>NET PROFIT / LOSS</td>
                      <td colSpan={2} style={{ padding: "8px 12px", fontWeight: 800, fontSize: 16, color: selProfit >= 0 ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>
                        {selProfit >= 0 ? "+" : "-"}{fmt(selProfit)} ({selMargin}% margin) {selProfit >= 0 ? "🟢" : "🔴"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Right: mini chart + summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={S.card}>
              <h4 style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: textMuted }}>Revenue by Category</h4>
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                      {catData.map((_, i) => <Cell key={i} fill={[accent, accentDark, "#16a34a", "#8b5cf6", "#f59e0b", "#dc2626"][i % 6]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10, border: `1px solid ${border}` }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: "center", padding: 30, color: textMuted, fontSize: 13 }}>No revenue entries</div>}
            </div>
            <div style={{ ...S.card, flex: 1 }}>
              <h4 style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: textMuted }}>Profit Gauge</h4>
              <div style={{ textAlign: "center" }}>
                <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 10px" }}>
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={border} strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={selProfit >= 0 ? "#16a34a" : "#dc2626"} strokeWidth="12"
                      strokeDasharray={`${Math.min(Math.abs(parseFloat(selMargin)), 100) * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontWeight: 800, fontSize: 18, color: selProfit >= 0 ? "#16a34a" : "#dc2626" }}>{selMargin}%</div>
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>Profit Margin</div>
                <div style={{ marginTop: 10, padding: "8px", background: (selProfit >= 0 ? "#dcfce7" : "#fce4e4"), borderRadius: 10, fontSize: 12, fontWeight: 600, color: selProfit >= 0 ? "#15803d" : "#dc2626" }}>
                  {parseFloat(selMargin) >= 30 ? "🌟 Excellent" : parseFloat(selMargin) >= 15 ? "✅ Healthy" : parseFloat(selMargin) >= 0 ? "⚠️ Low Margin" : "🔴 Net Loss"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All-time totals bar */}
        <div style={{ ...S.card, background: `linear-gradient(135deg, ${accent}15, ${accentDark}08)`, border: `1px solid ${accent}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📊 All-Time Combined (Manual + Bank Statement)</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase" }}>Total Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{fmtShort(totalRevenue)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase" }}>Total Expenses</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>{fmtShort(totalExpenses)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase" }}>Net Profit</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: totalProfit >= 0 ? "#16a34a" : "#dc2626" }}>{fmtShort(totalProfit)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase" }}>Profit Margin</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6" }}>{profitMargin}%</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase" }}>Entries</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{allEntries.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AI INSIGHTS VIEW ──────────────────────────────────────────────────────────
  function AIInsightsView() {
    const predChartData = cashPrediction.map(p => ({
      month: p.month?.slice(0, 6) || "",
      revenue: p.predicted_revenue || 0,
      expenses: p.predicted_expenses || 0,
      profit: p.predicted_profit || 0,
    }));
    const histAndPred = [
      ...MONTHLY.slice(-4).map(m => ({ ...m, type: "actual" })),
      ...(cashPrediction.length > 0 ? cashPrediction.slice(0, 4).map(p => ({ month: p.month?.slice(0, 6) || "", revenue: p.predicted_revenue || 0, expenses: p.predicted_expenses || 0, profit: p.predicted_profit || 0, type: "predicted" })) : [])
    ];
    const riskColors = { high: "#dc2626", medium: "#f59e0b", low: "#16a34a" };
    const priorColors = { high: "#dc2626", medium: "#f59e0b", low: "#16a34a" };

    return (
      <div>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 24 }}>🧠 AI Financial Insights</h2>
            <p style={{ margin: "4px 0 0", color: textMuted, fontSize: 14 }}>Automated recommendations · Risk detection · Cash flow prediction</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {lastAiRun && <span style={{ fontSize: 12, color: textMuted }}>Last run: {lastAiRun}</span>}
            <button style={{ ...S.btn, display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", boxShadow: `0 4px 20px ${accent}50` }} onClick={runAIAnalysis} disabled={aiLoading}>
              {aiLoading ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analyzing...</> : <><span>🧠</span> Run AI Analysis</>}
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total Revenue" value={fmtShort(totalRevenue)} icon="📈" color="#16a34a" border="#16a34a" />
          <StatCard label="Total Expenses" value={fmtShort(totalExpenses)} icon="📉" color="#dc2626" border="#dc2626" />
          <StatCard label="Net Profit" value={fmtShort(totalProfit)} icon="💰" color={totalProfit >= 0 ? "#16a34a" : "#dc2626"} border={totalProfit >= 0 ? "#16a34a" : "#dc2626"} />
          <StatCard label="Profit Margin" value={profitMargin + "%"} icon="📊" color="#8b5cf6" border="#8b5cf6" />
          <StatCard label="Entries Tracked" value={allEntries.length} icon="📒" color={accent} border={accent} />
        </div>

        {!lastAiRun && (
          <div style={{ ...S.card, textAlign: "center", padding: "48px 24px", marginBottom: 24, background: `linear-gradient(135deg, ${accent}10, ${accentDark}05)`, border: `2px dashed ${accent}50` }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
            <h3 style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 20 }}>Get Your AI Financial Analysis</h3>
            <p style={{ color: textMuted, fontSize: 15, margin: "0 0 24px", maxWidth: 480, margin: "0 auto 24px" }}>
              Click "Run AI Analysis" to receive personalized business recommendations, detect financial risks, and see cash flow predictions for the next 6 months.
            </p>
            <button style={{ ...S.btn, fontSize: 16, padding: "14px 36px", boxShadow: `0 6px 24px ${accent}50` }} onClick={runAIAnalysis} disabled={aiLoading}>
              {aiLoading ? "⚙️ Analyzing..." : "🧠 Run AI Analysis Now"}
            </button>
          </div>
        )}

        {aiLoading && (
          <div style={{ ...S.card, textAlign: "center", padding: "40px", marginBottom: 24 }}>
            <div style={{ fontSize: 52, animation: "spin 1.5s linear infinite", display: "inline-block", marginBottom: 16 }}>⚙️</div>
            <h3 style={{ margin: "0 0 8px", fontWeight: 700 }}>Claude AI is analyzing your financial data...</h3>
            <p style={{ color: textMuted }}>Generating recommendations, detecting risks, and predicting cash flow trends</p>
          </div>
        )}

        {lastAiRun && !aiLoading && (
          <>
            {/* 1. RECOMMENDATIONS */}
            <div style={{ ...S.card, marginBottom: 20, animation: "fadeIn 0.5s ease" }}>
              <h3 style={{ margin: "0 0 18px", fontWeight: 800, fontSize: 17 }}>💡 Automated Financial Recommendations</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {recommendations.map((r, i) => (
                  <div key={i} style={{ background: dark ? "#1e2436" : "#f8faff", borderRadius: 14, padding: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${priorColors[r.priority] || accent}`, animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{r.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</span>
                      </div>
                      <span style={{ background: priorColors[r.priority] + "20", color: priorColors[r.priority], padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "capitalize", whiteSpace: "nowrap" }}>{r.priority}</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: textMuted, lineHeight: 1.55 }}>{r.detail}</p>
                    {r.impact && <div style={{ background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: 20, display: "inline-block", fontSize: 11, fontWeight: 700 }}>💰 {r.impact}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. RISK PATTERNS */}
            <div style={{ ...S.card, marginBottom: 20, animation: "fadeIn 0.5s ease 0.2s both" }}>
              <h3 style={{ margin: "0 0 18px", fontWeight: 800, fontSize: 17 }}>⚠️ Financial Risk Patterns</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {riskPatterns.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: 16, background: dark ? "#1e2436" : (r.severity === "high" ? "#fff5f5" : r.severity === "medium" ? "#fffbeb" : "#f0fdf4"), borderRadius: 12, border: `1px solid ${riskColors[r.severity]}30`, animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
                    <div style={{ fontSize: 28, flexShrink: 0 }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.risk}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ background: riskColors[r.severity] + "20", color: riskColors[r.severity], padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{r.severity} risk</span>
                          <span style={{ background: border, color: textMuted, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            {r.trend === "worsening" ? "📉 Worsening" : r.trend === "improving" ? "📈 Improving" : "➡️ Stable"}
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.5 }}>{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. CASH FLOW PREDICTION */}
            <div style={{ ...S.card, animation: "fadeIn 0.5s ease 0.4s both" }}>
              <h3 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 17 }}>🔮 Predicted Cash Flow — Next 6 Months</h3>
              <p style={{ margin: "0 0 18px", color: textMuted, fontSize: 13 }}>AI prediction based on historical transaction patterns. Shaded area = predicted range.</p>

              {/* Chart: actual + predicted overlay */}
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={histAndPred}>
                  <CartesianGrid strokeDasharray="3 3" stroke={border} />
                  <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 11 }} />
                  <YAxis tick={{ fill: textMuted, fontSize: 10 }} tickFormatter={v => "₹" + (v / 1000).toFixed(0) + "k"} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10, border: `1px solid ${border}` }} />
                  <Legend />
                  <ReferenceLine x={MONTHLY.slice(-4)[3]?.month} stroke={accent} strokeDasharray="6 3" label={{ value: "→ Forecast", fill: textMuted, fontSize: 11 }} />
                  <Bar dataKey="revenue" fill={accent + "80"} radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#dc262680" radius={[4, 4, 0, 0]} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} name="Net Profit" />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Prediction table */}
              {cashPrediction.length > 0 && (
                <div style={{ marginTop: 20, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: dark ? "#1e2436" : "#f0f7ff" }}>
                        {["Month", "Predicted Revenue", "Predicted Expenses", "Predicted Profit", "Confidence", "Insight"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: textMuted, fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${accent}40`, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cashPrediction.map((p, i) => {
                        const confColor = p.confidence === "high" ? "#16a34a" : p.confidence === "medium" ? "#f59e0b" : "#6b7a99";
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: accent }}>{p.month}</td>
                            <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 600 }}>{fmtShort(p.predicted_revenue)}</td>
                            <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: 600 }}>{fmtShort(p.predicted_expenses)}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 800, color: p.predicted_profit >= 0 ? "#16a34a" : "#dc2626" }}>
                              {p.predicted_profit >= 0 ? "+" : "-"}{fmtShort(Math.abs(p.predicted_profit))}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ background: confColor + "20", color: confColor, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{p.confidence}</span>
                            </td>
                            <td style={{ padding: "10px 12px", fontSize: 12, color: textMuted }}>{p.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── BANK STATEMENT VIEW ───────────────────────────────────────────────────────
  function BankStatementView() {
    const dailyChart = stmtDates.slice(0, 14).reverse().map(d => {
      const rows = stmtTxns.filter(t => t.date === d);
      return { date: d.slice(5), credit: rows.reduce((s, r) => s + (r.credit || 0), 0), debit: rows.reduce((s, r) => s + (r.debit || 0), 0) };
    });
    return (
      <div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .srow:hover{background:${dark ? "#ffffff08" : "#f0f7ff"} !important}`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 24 }}>🏦 Bank Statement Upload</h2>
            <p style={{ margin: "4px 0 0", color: textMuted, fontSize: 14 }}>Upload PDF → AI extracts transactions → Auto-calculates daily P&L</p>
          </div>
          {stmtStatus === "done" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn, background: "linear-gradient(135deg,#16a34a,#15803d)", fontSize: 13, padding: "9px 18px" }} onClick={() => {
                const rows = [["Date","Description","Credit","Debit","Balance"], ...filteredStmt.map(t => [t.date, `"${t.description}"`, t.credit||0, t.debit||0, t.balance||0])];
                const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "statement.csv"; a.click();
              }}>⬇ CSV</button>
              <button style={{ ...S.btn, background: "#6b7a99", fontSize: 13, padding: "9px 18px" }} onClick={() => { setStmtStatus("idle"); setStmtTxns([]); setStmtFile(null); setAiInsight(""); setStmtFilterDate("all"); }}>🔄 New Upload</button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 24 }}>🏦 Bank Statement Upload</h2>
            <p style={{ margin: "4px 0 0", color: textMuted, fontSize: 14 }}>Upload PDF, Excel, CSV or Image → AI extracts transactions → Auto-calculates daily P&L</p>
          </div>
          {stmtStatus === "done" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn, background: "linear-gradient(135deg,#16a34a,#15803d)", fontSize: 13, padding: "9px 18px" }} onClick={() => {
                const rows = [["Date","Description","Credit","Debit","Balance"], ...filteredStmt.map(t => [t.date, `"${t.description}"`, t.credit||0, t.debit||0, t.balance||0])];
                const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "statement.csv"; a.click();
              }}>⬇ CSV</button>
              <button style={{ ...S.btn, background: "#6b7a99", fontSize: 13, padding: "9px 18px" }} onClick={() => { setStmtStatus("idle"); setStmtTxns([]); setStmtFile(null); setAiInsight(""); setStmtFilterDate("all"); }}>🔄 New Upload</button>
            </div>
          )}
        </div>

        {(stmtStatus === "idle" || stmtStatus === "error") && (
          <>
            {/* Drag & drop zone */}
            <div onDragOver={e => { e.preventDefault(); setStmtDrag(true); }} onDragLeave={() => setStmtDrag(false)}
              onDrop={e => { e.preventDefault(); setStmtDrag(false); const f = e.dataTransfer.files[0]; if (f) processStatement(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${stmtDrag ? accent : border}`, borderRadius: 20, padding: "52px 40px 44px", textAlign: "center", cursor: "pointer", background: stmtDrag ? accent + "10" : cardBg, transition: "all 0.25s", marginBottom: 16, animation: "fadeIn 0.4s ease" }}>
              <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} style={{ display: "none" }} onChange={e => e.target.files[0] && processStatement(e.target.files[0])} />

              {/* Format icon row */}
              <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 20 }}>
                {[
                  { icon: "📄", label: "PDF", color: "#dc2626", bg: "#fce4e4" },
                  { icon: "📊", label: "Excel", color: "#16a34a", bg: "#dcfce7" },
                  { icon: "📋", label: "CSV", color: "#2563eb", bg: "#dbeafe" },
                  { icon: "🖼️", label: "JPG", color: "#f59e0b", bg: "#fef9c3" },
                  { icon: "🖼️", label: "PNG", color: "#8b5cf6", bg: "#f5f3ff" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, border: `2px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: stmtDrag ? `0 4px 16px ${f.color}30` : "none", transition: "box-shadow 0.2s" }}>{f.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{f.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: stmtDrag ? accent : text }}>
                {stmtDrag ? "Drop your file here!" : "Drag & drop your statement, or click to browse"}
              </div>
              <div style={{ color: textMuted, fontSize: 13, marginBottom: 22 }}>
                PDF · Excel (.xlsx / .xls) · CSV · JPG · PNG · WebP &nbsp;—&nbsp; HDFC, SBI, ICICI, Axis, Kotak & more
              </div>
              <button style={{ ...S.btn, fontSize: 15, padding: "12px 36px", boxShadow: `0 6px 20px ${accent}50` }}
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                📤 Choose File to Upload
              </button>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
                {["🔒 Secure", "🤖 AI Vision", "📊 Auto P&L", "⬇ CSV Export"].map(f => <div key={f} style={{ fontSize: 12, color: textMuted }}>{f}</div>)}
              </div>
            </div>

            {/* Format guide cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { icon: "📄", title: "PDF Statement", ext: ".pdf", desc: "Text-based PDF from your bank's internet banking portal", tip: "Best for: digital statements downloaded from bank website", color: "#dc2626", bg: dark ? "#2a1a1a" : "#fff5f5" },
                { icon: "📊", title: "Excel / CSV", ext: ".xlsx .xls .csv", desc: "Exported spreadsheet from internet banking or accounting software", tip: "Best for: bulk data exports with structured columns", color: "#16a34a", bg: dark ? "#1a2a1a" : "#f0fdf4" },
                { icon: "🖼️", title: "Image / Photo", ext: ".jpg .jpeg .png .webp", desc: "Photo of physical passbook or screenshot of bank app", tip: "Best for: handwritten passbooks or mobile app screenshots", color: "#f59e0b", bg: dark ? "#2a2010" : "#fffbeb" },
              ].map(c => (
                <div key={c.title} style={{ background: c.bg, border: `1px solid ${c.color}25`, borderRadius: 14, padding: "16px", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${c.color}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 26 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: c.color }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: textMuted, fontFamily: "monospace" }}>{c.ext}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5, marginBottom: 8 }}>{c.desc}</div>
                  <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>💡 {c.tip}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {stmtStatus === "loading" && (
          <div style={{ ...S.card, textAlign: "center", padding: "64px 40px", marginBottom: 24 }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div style={{ fontSize: 56, display: "inline-block", animation: "spin 1.5s linear infinite" }}>⚙️</div>
              {stmtFile && (
                <div style={{ position: "absolute", bottom: -4, right: -8, background: cardBg, borderRadius: "50%", padding: 3, fontSize: 22 }}>
                  {FILE_TYPE_INFO[getFileType(stmtFile)]?.icon || "📄"}
                </div>
              )}
            </div>
            <h3 style={{ margin: "4px 0 8px", fontWeight: 700, fontSize: 20 }}>Extracting transactions with AI...</h3>
            {stmtFile && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: dark ? "#1e2436" : "#f0f7ff", borderRadius: 20, padding: "5px 14px", marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>{FILE_TYPE_INFO[getFileType(stmtFile)]?.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{stmtFile.name}</span>
                <span style={{ fontSize: 11, color: textMuted }}>({(stmtFile.size / 1024).toFixed(0)} KB)</span>
              </div>
            )}
            <p style={{ color: textMuted, margin: "0 0 28px" }}>{stmtProgress}</p>
            <div style={{ background: border, borderRadius: 20, height: 14, maxWidth: 440, margin: "0 auto" }}>
              <div style={{ width: `${stmtPct}%`, height: "100%", background: `linear-gradient(90deg, ${accent}, ${accentDark})`, borderRadius: 20, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ color: accent, fontSize: 13, marginTop: 10, fontWeight: 700 }}>{stmtPct}%</div>
          </div>
        )}

        {stmtStatus === "done" && stmtTxns.length > 0 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              {[{ label: "Total Revenue", val: stmtCredit, color: "#16a34a", sub: `${filteredStmt.filter(t => t.credit > 0).length} credits` },
                { label: "Total Expenses", val: stmtDebit, color: "#dc2626", sub: `${filteredStmt.filter(t => t.debit > 0).length} debits` },
                { label: "Net Profit", val: stmtNet, color: stmtNet >= 0 ? "#16a34a" : "#dc2626", sub: stmtNet >= 0 ? "✅ Surplus" : "⚠️ Deficit" },
                { label: "Transactions", val: filteredStmt.length, color: "#8b5cf6", sub: "entries shown", noFmt: true }
              ].map((c, i) => (
                <div key={i} style={{ ...S.card, flex: 1, minWidth: 155, borderLeft: `4px solid ${c.color}` }}>
                  <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.noFmt ? c.val : (c.val < 0 ? "-" : "") + fmtShort(c.val)}</div>
                  <div style={{ fontSize: 11, color: c.val >= 0 || c.noFmt ? textMuted : "#dc2626", marginTop: 2 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {aiInsight && (
              <div style={{ ...S.card, marginBottom: 20, background: `linear-gradient(135deg, ${accent}12, ${accentDark}06)`, border: `1px solid ${accent}35` }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🤖</div>
                  <div><div style={{ fontWeight: 700, fontSize: 13, color: accent, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Insight</div><div style={{ fontSize: 14, lineHeight: 1.65 }}>{aiInsight}</div></div>
                </div>
              </div>
            )}

            {stmtFilterDate === "all" && stmtDates.length > 1 && (
              <div style={{ ...S.card, marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15 }}>📊 Daily Credit vs Debit</h3>
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={border} />
                    <XAxis dataKey="date" tick={{ fill: textMuted, fontSize: 11 }} />
                    <YAxis tick={{ fill: textMuted, fontSize: 10 }} tickFormatter={v => "₹" + (v / 1000).toFixed(0) + "k"} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10, border: `1px solid ${border}` }} />
                    <Bar dataKey="credit" fill="#16a34a" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="debit" fill="#dc2626" radius={[4, 4, 0, 0]} name="Expenses" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700 }}>Extracted Transactions</h3>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                    {stmtFile && <span style={{ marginRight: 6 }}>{FILE_TYPE_INFO[getFileType(stmtFile)]?.icon || "📄"}</span>}
                    {stmtFile?.name} · {stmtTxns.length} total
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: textMuted }}>Filter by date:</span>
                  <select style={{ ...S.inp, width: "auto", padding: "7px 12px", fontSize: 13 }} value={stmtFilterDate} onChange={e => setStmtFilterDate(e.target.value)}>
                    <option value="all">All Dates ({stmtTxns.length})</option>
                    {stmtDates.map(d => {
                      const cnt = stmtTxns.filter(t => t.date === d).length;
                      const nc = stmtTxns.filter(t => t.date === d).reduce((s, t) => s + (t.credit || 0) - (t.debit || 0), 0);
                      return <option key={d} value={d}>{d} · {cnt} txns · {nc >= 0 ? "+" : ""}₹{Math.round(Math.abs(nc) / 1000)}k</option>;
                    })}
                  </select>
                </div>
              </div>

              {filteredStmt.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: textMuted }}><div style={{ fontSize: 44 }}>🔍</div><div style={{ marginTop: 12 }}>No transactions for selected date</div></div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: dark ? "#1e2436" : "#f0f7ff" }}>
                        {["#", "Date", "Description", "Credit (₹)", "Debit (₹)", "Balance (₹)"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: textMuted, fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${accent}40`, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStmt.map((tx, i) => (
                        <tr key={i} className="srow" style={{ borderBottom: `1px solid ${border}`, transition: "background 0.15s" }}>
                          <td style={{ padding: "10px 12px", color: textMuted, fontSize: 11 }}>{i + 1}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>{tx.date}</td>
                          <td style={{ padding: "10px 12px", maxWidth: 260 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.description}>{tx.description}</div></td>
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{(tx.credit || 0) > 0 ? <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>+{fmt(tx.credit)}</span> : <span style={{ color: textMuted }}>—</span>}</td>
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{(tx.debit || 0) > 0 ? <span style={{ background: "#fce4e4", color: "#dc2626", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>-{fmt(tx.debit)}</span> : <span style={{ color: textMuted }}>—</span>}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" }}>{(tx.balance || 0) > 0 ? fmt(tx.balance) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: dark ? "#1e2436" : "#eff6ff", borderTop: `3px solid ${accent}` }}>
                        <td colSpan={3} style={{ padding: "12px", fontWeight: 800, fontSize: 14 }}>TOTAL ({filteredStmt.length} rows)</td>
                        <td style={{ padding: "12px", fontWeight: 800, color: "#16a34a", whiteSpace: "nowrap" }}>+{fmt(stmtCredit)}</td>
                        <td style={{ padding: "12px", fontWeight: 800, color: "#dc2626", whiteSpace: "nowrap" }}>-{fmt(stmtDebit)}</td>
                        <td style={{ padding: "12px", fontWeight: 800, color: stmtNet >= 0 ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>{stmtNet >= 0 ? "+" : "-"}{fmt(stmtNet)} {stmtNet >= 0 ? "🟢" : "🔴"}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────────
  function DashboardView() {
    const monthlyFromEntries = buildMonthlyFromEntries();
    const runway = (1250000 / Math.max(totalExpenses / 12, 1)).toFixed(1);
    const healthScore = Math.min(Math.round(50 + parseFloat(profitMargin) * 0.8 + Math.min(parseFloat(runway), 12) * 2), 98);

    return (
      <div>
        {/* ── Reset confirmation dialog ── */}
        {showResetConfirm && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>
            <div style={{ ...S.card, width:420, padding:36, textAlign:"center", animation:"slideUp 0.3s ease", border:`2px solid #dc262640` }}>
              <div style={{ fontSize:56, marginBottom:12 }}>⚠️</div>
              <h3 style={{ margin:"0 0 8px", fontWeight:800, fontSize:20, color:"#dc2626" }}>Reset All Financial Data?</h3>
              <p style={{ color:textMuted, fontSize:14, lineHeight:1.6, margin:"0 0 8px" }}>
                This will permanently clear <strong>all manual entries</strong>, <strong>bank statement transactions</strong>, and <strong>AI insights</strong>.
              </p>
              <p style={{ color:"#dc2626", fontSize:13, fontWeight:600, margin:"0 0 28px", padding:"8px 16px", background:"#fce4e4", borderRadius:10 }}>
                ⚠️ Revenue · Expenses · Profit · Ledger — all will be wiped. This cannot be undone.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button style={{ flex:1, padding:14, border:`1px solid ${border}`, borderRadius:12, cursor:"pointer", background:"transparent", color:text, fontWeight:600, fontSize:14 }}
                  onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </button>
                <button style={{ flex:1, padding:14, border:"none", borderRadius:12, cursor:"pointer", background:"linear-gradient(135deg,#dc2626,#b91c1c)", color:"#fff", fontWeight:700, fontSize:14, boxShadow:"0 4px 16px #dc262640" }}
                  onClick={() => {
                    setManualEntries([]);
                    setStmtTxns([]); setStmtFile(null); setStmtStatus("idle"); setStmtPct(0); setAiInsight(""); setStmtFilterDate("all");
                    setRecommendations([]); setRiskPatterns([]); setCashPrediction([]); setLastAiRun(null);
                    setLedgerDate(today());
                    setShowResetConfirm(false);
                  }}>
                  🗑️ Yes, Reset Everything
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Welcome back, {user?.name}! 👋</h2>
            <p style={{ margin: "4px 0 0", color: textMuted }}>{user?.business} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          {/* Reset button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:12, border:`1.5px solid #dc262650`, background: dark ? "rgba(220,38,38,0.1)" : "#fff5f5", color:"#dc2626", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#dc2626"; e.currentTarget.style.color="#fff"; e.currentTarget.style.boxShadow="0 4px 16px #dc262640"; }}
            onMouseLeave={e => { e.currentTarget.style.background=dark?"rgba(220,38,38,0.1)":"#fff5f5"; e.currentTarget.style.color="#dc2626"; e.currentTarget.style.boxShadow="none"; }}>
            🗑️ Reset All Data
          </button>
        </div>

        {/* Quick action banner row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "✏️", label: "Add Cash Entry", sub: "Manual credit/debit", color: accent, action: () => setShowCashModal(true) },
            { icon: "📤", label: "Upload Statement", sub: "PDF · Excel · CSV · Image", color: "#16a34a", action: () => setActiveNav("bankStatement") },
            { icon: "🧠", label: "AI Analysis", sub: recommendations.length > 0 ? `${recommendations.length} recommendations` : "Run AI insights", color: "#8b5cf6", action: () => setActiveNav("aiInsights") },
          ].map(a => (
            <div key={a.label} onClick={a.action} style={{ ...S.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: `linear-gradient(135deg, ${a.color}15, ${a.color}06)`, border: `1px solid ${a.color}30`, transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${a.color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>{a.icon}</div>
              <div><div style={{ fontWeight: 700, fontSize: 15, color: a.color }}>{a.label}</div><div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{a.sub}</div></div>
              <div style={{ marginLeft: "auto", color: a.color, fontSize: 18, opacity: 0.6 }}>→</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Total Revenue" value={fmtShort(totalRevenue)} icon="📈" color="#16a34a" />
          <StatCard label="Total Expenses" value={fmtShort(totalExpenses)} icon="📉" color="#dc2626" />
          <StatCard label="Net Profit" value={fmtShort(totalProfit)} icon="💰" color={totalProfit >= 0 ? "#16a34a" : "#dc2626"} />
          <StatCard label="Profit Margin" value={profitMargin + "%"} icon="📊" color="#8b5cf6" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15 }}>Revenue vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY}>
                <defs>
                  <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accent} stopOpacity={0.3} /><stop offset="95%" stopColor={accent} stopOpacity={0} /></linearGradient>
                  <linearGradient id="eG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} /><stop offset="95%" stopColor="#dc2626" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 11 }} />
                <YAxis tick={{ fill: textMuted, fontSize: 10 }} tickFormatter={v => "₹" + v / 1000 + "k"} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10 }} />
                <Area type="monotone" dataKey="revenue" stroke={accent} fill="url(#rG)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#dc2626" fill="url(#eG)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15 }}>Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={EXP_CATS} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                  {EXP_CATS.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => v + "%"} contentStyle={{ background: cardBg, borderRadius: 10 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16 }}>
          <div style={{ ...S.card, textAlign: "center" }}>
            <h3 style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: textMuted }}>HEALTH SCORE</h3>
            <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 10px" }}>
              <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke={border} strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="12" strokeDasharray={`${healthScore * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontWeight: 800, fontSize: 22 }}>{healthScore}</div>
            </div>
            <div style={{ background: accent + "20", color: accent, padding: "4px 14px", borderRadius: 20, display: "inline-block", fontWeight: 700, fontSize: 12 }}>
              {healthScore >= 80 ? "Excellent" : healthScore >= 65 ? "Good" : healthScore >= 50 ? "Fair" : "Poor"}
            </div>
          </div>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: textMuted }}>CASH RUNWAY</h3>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#16a34a" }}>{runway}</div>
            <div style={{ color: textMuted, fontSize: 12, marginBottom: 10 }}>months remaining</div>
            <div style={{ background: border, borderRadius: 10, height: 8 }}>
              <div style={{ width: `${Math.min((parseFloat(runway) / 12) * 100, 100)}%`, height: "100%", background: "#16a34a", borderRadius: 10 }} />
            </div>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 13, color: textMuted }}>RECENT ENTRIES</h3>
              <button style={{ ...S.btn, padding: "5px 12px", fontSize: 12 }} onClick={() => setShowCashModal(true)}>+ Add</button>
            </div>
            <div style={{ maxHeight: 185, overflowY: "auto" }}>
              {allEntries.slice(0, 7).map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${border}` }}>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.desc}</div>
                    <div style={{ fontSize: 10, color: textMuted }}>{e.date} · {e.cat} · {e.source === "manual" ? "✏️" : "🏦"}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: e.credit > 0 ? "#16a34a" : "#dc2626", fontSize: 12, marginLeft: 8, whiteSpace: "nowrap" }}>
                    {e.credit > 0 ? "+" + fmtShort(e.credit) : "-" + fmtShort(e.debit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SIMPLE CHART VIEW ─────────────────────────────────────────────────────────
  function SimpleView({ title, dataKey, color }) {
    const total = MONTHLY.reduce((s, m) => s + m[dataKey], 0);
    return (
      <div>
        <h2 style={{ fontWeight: 800, marginBottom: 20 }}>{title}</h2>
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Annual" value={fmtShort(total)} icon="💎" color={color} />
          <StatCard label="Monthly Avg" value={fmtShort(Math.round(total / 12))} icon="📊" color={accent} />
          <StatCard label="December" value={fmtShort(MONTHLY[11][dataKey])} icon="📅" color={color} />
        </div>
        <div style={S.card}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 12 }} />
              <YAxis tick={{ fill: textMuted, fontSize: 11 }} tickFormatter={v => "₹" + v / 1000 + "k"} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10 }} />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── RENDER ROUTE ──────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeNav) {
      case "dashboard": return <DashboardView />;
      case "ledger": return <LedgerView />;
      case "bankStatement": return <BankStatementView />;
      case "aiInsights": return <AIInsightsView />;
      case "revenue": return <SimpleView title="📈 Revenue Analysis" dataKey="revenue" color={accent} />;
      case "expenses": return <SimpleView title="📉 Expense Analysis" dataKey="expenses" color="#dc2626" />;
      case "profit": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>💰 Profit & Loss</h2>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <StatCard label="Net Profit (All)" value={fmtShort(totalProfit)} icon="💰" color="#16a34a" />
            <StatCard label="Profit Margin" value={profitMargin + "%"} icon="📊" color={accent} />
          </div>
          <div style={S.card}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 12 }} />
                <YAxis tick={{ fill: textMuted, fontSize: 11 }} tickFormatter={v => "₹" + v / 1000 + "k"} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10 }} />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={3} dot={{ fill: "#16a34a" }} name="Profit" />
                <Line type="monotone" dataKey="revenue" stroke={accent} strokeWidth={2} strokeDasharray="5 5" name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" name="Expenses" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case "cashflow": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>💧 Cash Flow</h2>
          <div style={S.card}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MONTHLY.map(m => ({ ...m, cf: m.profit - 15000 }))}>
                <defs><linearGradient id="cfG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accent} stopOpacity={0.4} /><stop offset="95%" stopColor={accent} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 12 }} />
                <YAxis tick={{ fill: textMuted, fontSize: 11 }} tickFormatter={v => "₹" + v / 1000 + "k"} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10 }} />
                <Area type="monotone" dataKey="cf" stroke={accent} fill="url(#cfG)" strokeWidth={3} name="Net Cash Flow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case "invoices": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>📋 Invoices</h2>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><h3 style={{ margin: 0, fontWeight: 700 }}>Invoice List</h3><button style={S.btn}>+ New Invoice</button></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: `2px solid ${border}` }}>{["Invoice #","Client","Amount","Status","Due"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: textMuted, fontSize: 12 }}>{h}</th>)}</tr></thead>
              <tbody>
                {[{ id: "INV-1042", client: "Sharma Enterprises", amount: 45000, status: "paid", due: "2024-12-10" },
                  { id: "INV-1041", client: "Patel & Co.", amount: 62000, status: "pending", due: "2024-12-15" },
                  { id: "INV-1040", client: "Kumar Traders", amount: 38500, status: "overdue", due: "2024-12-05" }].map(inv => {
                  const sc = { paid: "#16a34a", pending: "#f59e0b", overdue: "#dc2626" };
                  return <tr key={inv.id} style={{ borderBottom: `1px solid ${border}` }}><td style={{ padding: "12px", fontWeight: 600, color: accent }}>{inv.id}</td><td style={{ padding: "12px" }}>{inv.client}</td><td style={{ padding: "12px", fontWeight: 700 }}>{fmt(inv.amount)}</td><td style={{ padding: "12px" }}><span style={{ background: sc[inv.status] + "20", color: sc[inv.status], padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{inv.status}</span></td><td style={{ padding: "12px", fontSize: 13, color: textMuted }}>{inv.due}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
      case "budget": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>🎯 Budget Planning</h2>
          <div style={S.card}>
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Budget vs Actual</h3>
            {[{ cat: "Salaries", budget: 60000, spent: 52000 },{ cat: "Rent", budget: 30000, spent: 28000 },{ cat: "Inventory", budget: 25000, spent: 23000 },{ cat: "Marketing", budget: 15000, spent: 12000 },{ cat: "Utilities", budget: 12000, spent: 8500 }].map(item => {
              const pct = Math.round((item.spent / item.budget) * 100);
              const c = pct > 90 ? "#dc2626" : pct > 75 ? "#f59e0b" : "#16a34a";
              return <div key={item.cat} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{item.cat}</span><span style={{ fontSize: 13, color: textMuted }}>{fmt(item.spent)} / {fmt(item.budget)} ({pct}%)</span></div><div style={{ background: border, borderRadius: 10, height: 10 }}><div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: c, borderRadius: 10, transition: "width 1s" }} /></div></div>;
            })}
          </div>
        </div>
      );
      case "analytics": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>📊 Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={S.card}><h3 style={{ fontWeight: 700, marginBottom: 14 }}>Revenue vs Expenses</h3><ResponsiveContainer width="100%" height={240}><BarChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={border} /><XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 11 }} /><YAxis tick={{ fill: textMuted, fontSize: 10 }} tickFormatter={v => "₹" + v / 1000 + "k"} /><Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10 }} /><Bar dataKey="revenue" fill={accent} radius={[4, 4, 0, 0]} name="Revenue" /><Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} name="Expenses" /><Legend /></BarChart></ResponsiveContainer></div>
            <div style={S.card}><h3 style={{ fontWeight: 700, marginBottom: 14 }}>Profit Trend</h3><ResponsiveContainer width="100%" height={240}><LineChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={border} /><XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 11 }} /><YAxis tick={{ fill: textMuted, fontSize: 10 }} tickFormatter={v => "₹" + v / 1000 + "k"} /><Tooltip formatter={v => fmt(v)} contentStyle={{ background: cardBg, borderRadius: 10 }} /><Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
          </div>
        </div>
      );
      case "gst": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>🧾 GST Calculator</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={S.card}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Calculate GST</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label style={S.label}>Base Price (₹)</label><input style={S.inp} type="number" value={gstBase} onChange={e => setGstBase(e.target.value)} placeholder="Enter price..." /></div>
                <div><label style={S.label}>GST Rate</label><select style={S.inp} value={gstRate} onChange={e => setGstRate(Number(e.target.value))}>{[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}% GST</option>)}</select></div>
                {gstBase && <div style={{ background: accent + "15", borderRadius: 12, padding: 16, border: `1px solid ${accent}40` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${border}` }}><span style={{ color: textMuted }}>Base:</span><span style={{ fontWeight: 700 }}>₹{parseFloat(gstBase).toFixed(2)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${border}` }}><span style={{ color: textMuted }}>GST ({gstRate}%):</span><span style={{ fontWeight: 700, color: "#f59e0b" }}>₹{gstCalc}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontWeight: 700 }}>Final:</span><span style={{ fontWeight: 800, fontSize: 18, color: accent }}>₹{gstFinal}</span></div>
                </div>}
                <button style={S.btn} onClick={() => { const b = new Blob([`GST Report\nBase:₹${gstBase}\nRate:${gstRate}%\nGST:₹${gstCalc}\nFinal:₹${gstFinal}`], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "gst.txt"; a.click(); }}>⬇ Download Report</button>
              </div>
            </div>
            <div style={S.card}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>GST Slabs</h3>
              {[["0%","Essential food, books, newspapers"],["5%","Packaged food, transport services"],["12%","Processed food, mobile phones"],["18%","Most services, FMCG products"],["28%","Luxury goods, automobiles, tobacco"]].map(([rate, items]) => (
                <div key={rate} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}`, alignItems: "center" }}>
                  <span style={{ background: accent, color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{rate}</span>
                  <span style={{ fontSize: 13, color: textMuted }}>{items}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case "whatif": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>🔮 What-If Simulator</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={S.card}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Configure Scenario</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label style={S.label}>Scenario</label><select style={S.inp} value={simScenario} onChange={e => setSimScenario(e.target.value)}><option value="incSales">Increase Sales</option><option value="incExp">Increase Expenses</option><option value="redExp">Reduce Expenses</option><option value="hireEmp">Hire Employee</option></select></div>
                <div><label style={S.label}>{simScenario === "hireEmp" ? "Monthly Salary (₹)" : "Change (%)"}</label><input style={S.inp} type="number" value={simValue} onChange={e => setSimValue(e.target.value)} /></div>
                <button style={{ ...S.btn, padding: 14 }} onClick={() => {
                  const base = MONTHLY[11];
                  let pR = base.revenue, pE = base.expenses;
                  if (simScenario === "incSales") pR *= (1 + simValue / 100);
                  else if (simScenario === "incExp") pE *= (1 + simValue / 100);
                  else if (simScenario === "redExp") pE *= (1 - simValue / 100);
                  else if (simScenario === "hireEmp") pE += parseFloat(simValue) || 25000;
                  setSimResult({ pR, pE, pP: pR - pE, impact: (pR - pE) - base.profit, current: base.profit });
                }}>Run Simulation →</button>
              </div>
            </div>
            {simResult && (
              <div style={S.card}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Scenario Result</h3>
                {[{ label: "Current Profit", val: simResult.current, c: textMuted },{ label: "Projected Revenue", val: simResult.pR, c: "#16a34a" },{ label: "Projected Expenses", val: simResult.pE, c: "#dc2626" },{ label: "Projected Profit", val: simResult.pP, c: accent }].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                    <span style={{ color: textMuted, fontSize: 14 }}>{r.label}</span>
                    <span style={{ fontWeight: 700, color: r.c }}>{fmtShort(Math.round(r.val))}</span>
                  </div>
                ))}
                <div style={{ background: simResult.impact > 0 ? "#dcfce7" : "#fce4e4", borderRadius: 10, padding: 12, textAlign: "center", marginTop: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: simResult.impact > 0 ? "#16a34a" : "#dc2626" }}>{simResult.impact > 0 ? "+" : ""}{fmtShort(Math.round(simResult.impact))}</div>
                  <div style={{ fontSize: 12, color: simResult.impact > 0 ? "#16a34a" : "#dc2626" }}>{simResult.impact > 0 ? "✅ Positive" : "❌ Negative"} impact per month</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
      case "settings": return (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>⚙️ Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={S.card}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Preferences</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>Dark Mode</span>
                  <div onClick={() => setDark(!dark)} style={{ width: 48, height: 26, background: dark ? accent : border, borderRadius: 13, cursor: "pointer", position: "relative", transition: "background 0.3s" }}>
                    <div style={{ position: "absolute", top: 3, left: dark ? 24 : 3, width: 20, height: 20, background: "#fff", borderRadius: "50%", transition: "left 0.3s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>Language</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["en","EN"],["hi","हि"],["gu","ગુ"]].map(([c, l]) => <button key={c} onClick={() => setLang(c)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${border}`, background: lang === c ? accent : "transparent", color: lang === c ? "#fff" : textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{l}</button>)}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>Voice Commands</span>
                  <button onClick={toggleVoice} style={{ ...S.btn, padding: "6px 14px", background: listening ? "#dc2626" : undefined }}>{listening ? "🔴 Stop" : "🎤 Start"}</button>
                </div>
              </div>
            </div>
            <div style={S.card}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Data Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[{ label: "Manual Entries", val: manualEntries.length, icon: "✏️" },{ label: "Bank Transactions", val: stmtTxns.length, icon: "🏦" },{ label: "Total Entries", val: allEntries.length, icon: "📊" },{ label: "AI Recommendations", val: recommendations.length, icon: "🧠" }].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                    <span style={{ fontSize: 14 }}>{r.icon} {r.label}</span>
                    <span style={{ fontWeight: 700, color: accent }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
      default: return <DashboardView />;
    }
  };

  // ── APP SHELL ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: ${accent}50; border-radius: 10px; }
      `}</style>

      {/* SIDEBAR */}
      <div style={S.sbar}>
        <div style={{ padding: "20px 14px", borderBottom: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><PocketMitraIcon size={32} /></div>
            {sidebarOpen && <div><div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>Pocket Mitra</div><div style={{ fontSize: 10, opacity: 0.7 }}>{user?.business}</div></div>}
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActiveNav(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 2, background: activeNav === item.id ? "rgba(255,255,255,0.22)" : "transparent", fontWeight: activeNav === item.id ? 700 : 500, fontSize: 13, transition: "background 0.2s", position: "relative" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>}
              {item.badge && sidebarOpen && <span style={{ background: item.badge === "✓" ? "#16a34a" : item.badge === "NEW" ? "#8b5cf6" : accent, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{item.badge}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }}>
          <div onClick={() => { setPage("login"); setUser(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: "pointer", opacity: 0.8 }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            {sidebarOpen && <span style={{ fontSize: 13 }}>Logout</span>}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        {/* TOPBAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: text, padding: 4 }}>☰</button>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowCashModal(true)} style={{ ...S.btn, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
              <span style={{ fontSize: 16 }}>✏️</span> Add Cash Entry
            </button>
            <button onClick={() => setActiveNav("bankStatement")} style={{ ...S.btn, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📤</span> Upload Statement
              {stmtStatus === "done" && <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "1px 7px", fontSize: 10 }}>✓</span>}
            </button>
            <button onClick={() => setActiveNav("aiInsights")} style={{ ...S.btn, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              <span>🧠</span> AI Insights
            </button>
            <button onClick={() => setDark(!dark)} style={{ ...S.btn, padding: "8px 12px", background: dark ? "#374151" : "#f3f4f6", color: dark ? "#fff" : "#374151", border: `1px solid ${border}` }}>{dark ? "☀️" : "🌙"}</button>
            <div style={{ background: `linear-gradient(135deg, ${accent}, ${accentDark})`, color: "#fff", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {renderContent()}
      </div>

      {/* ── CASH ENTRY MODAL ── */}
      {showCashModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ ...S.card, width: 480, padding: 36, animation: "slideUp 0.3s ease" }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>✏️ Add Cash Entry</h3>
                <p style={{ margin: "4px 0 0", color: textMuted, fontSize: 13 }}>Manual credit or debit for the daily ledger</p>
              </div>
              <button onClick={() => setShowCashModal(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: textMuted, padding: 4 }}>✕</button>
            </div>

            {/* Type toggle */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[["credit", "💰 Cash Credited", "#16a34a"], ["debit", "💸 Cash Debited", "#dc2626"]].map(([val, label, color]) => (
                <button key={val} onClick={() => setCashEntry({ ...cashEntry, type: val })}
                  style={{ flex: 1, padding: "14px", border: `2px solid ${cashEntry.type === val ? color : border}`, borderRadius: 12, cursor: "pointer", background: cashEntry.type === val ? color + "15" : "transparent", color: cashEntry.type === val ? color : textMuted, fontWeight: 700, fontSize: 14, transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={S.label}>Date</label>
                  <input style={S.inp} type="date" value={cashEntry.date} onChange={e => setCashEntry({ ...cashEntry, date: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Amount (₹)</label>
                  <input style={{ ...S.inp, borderColor: cashEntry.type === "credit" ? "#16a34a50" : "#dc262650", color: cashEntry.type === "credit" ? "#16a34a" : "#dc2626", fontWeight: 700 }} type="number" placeholder="0.00" value={cashEntry.amount} onChange={e => setCashEntry({ ...cashEntry, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={S.label}>Description</label>
                <input style={S.inp} placeholder={cashEntry.type === "credit" ? "e.g. Customer payment, sales revenue..." : "e.g. Rent payment, electricity bill..."} value={cashEntry.desc} onChange={e => setCashEntry({ ...cashEntry, desc: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Category</label>
                <select style={S.inp} value={cashEntry.cat} onChange={e => setCashEntry({ ...cashEntry, cat: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Note (optional)</label>
                <input style={S.inp} placeholder="Any additional notes..." value={cashEntry.note} onChange={e => setCashEntry({ ...cashEntry, note: e.target.value })} />
              </div>

              {/* Preview */}
              {cashEntry.amount && cashEntry.desc && (
                <div style={{ background: cashEntry.type === "credit" ? "#dcfce7" : "#fce4e4", borderRadius: 12, padding: "12px 16px", border: `1px solid ${cashEntry.type === "credit" ? "#bbf7d0" : "#fecaca"}` }}>
                  <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>Preview</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{cashEntry.desc}</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: cashEntry.type === "credit" ? "#16a34a" : "#dc2626" }}>
                      {cashEntry.type === "credit" ? "+" : "-"}{fmt(parseFloat(cashEntry.amount) || 0)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{cashEntry.date} · {cashEntry.cat}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button style={{ ...S.btn, flex: 1, padding: "13px", fontSize: 15, background: cashEntry.type === "credit" ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #dc2626, #b91c1c)" }}
                  onClick={() => {
                    if (!cashEntry.amount || !cashEntry.desc) return;
                    const entry = { id: uid(), date: cashEntry.date, desc: cashEntry.desc, amount: parseFloat(cashEntry.amount), type: cashEntry.type, cat: cashEntry.cat, note: cashEntry.note, source: "manual" };
                    setManualEntries(prev => [entry, ...prev]);
                    setLedgerDate(cashEntry.date);
                    setShowCashModal(false);
                    setCashEntry({ date: today(), desc: "", amount: "", type: "credit", cat: "Sales", note: "" });
                  }}>
                  {cashEntry.type === "credit" ? "💰 Add Credit Entry" : "💸 Add Debit Entry"}
                </button>
                <button style={{ ...S.btn, padding: "13px 20px", background: "#6b7a99" }} onClick={() => setShowCashModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 400 }}>
        {chatOpen && (
          <div style={{ ...S.card, width: 340, marginBottom: 12, maxHeight: 480, display: "flex", flexDirection: "column", boxShadow: `0 20px 60px ${accent}35`, animation: "slideUp 0.3s ease" }}>
            <div style={{ background: `linear-gradient(135deg, ${accent}, ${accentDark})`, padding: "13px 16px", borderRadius: "16px 16px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>🤖</span><div><div style={{ fontWeight: 700, fontSize: 14 }}>Mitra Assistant</div><div style={{ fontSize: 10, opacity: 0.75 }}>Pocket Mitra AI</div></div></div>
              <div style={{ width: 8, height: 8, background: "#86efac", borderRadius: "50%" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12, maxHeight: 320, display: "flex", flexDirection: "column", gap: 8 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ background: msg.role === "user" ? `linear-gradient(135deg, ${accent}, ${accentDark})` : dark ? "#2d3650" : "#f1f5f9", color: msg.role === "user" ? "#fff" : text, padding: "9px 13px", borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px", maxWidth: "82%", fontSize: 13, lineHeight: 1.55 }}>{msg.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${border}`, display: "flex", gap: 8 }}>
              <input style={{ ...S.inp, flex: 1, padding: "9px 12px" }} placeholder="Ask about finances..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
              <button style={{ ...S.btn, padding: "9px 14px" }} onClick={sendChat}>➤</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} style={{ width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${accent}55`, color: "#fff", marginLeft: "auto" }}>
          {chatOpen ? "✕" : "🤖"}
        </button>
      </div>

      {listening && (
        <div style={{ position: "fixed", top: 76, right: 24, background: "#dc2626", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 600 }}>
          🔴 Listening...
        </div>
      )}
    </div>
  );
}
