import { useState, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Cell
} from "recharts";
import Papa from "papaparse";

// ─── Design Tokens ────────────────────────────────────────────────
const C = {
  bg: "#0A1628", card: "#111E31", card2: "#172540",
  orange: "#FF7C35", gold: "#F5B830", blue: "#4191E8",
  green: "#52C97C", red: "#EF5350",
  text: "#F0F4FF", muted: "#6A8BAD", border: "rgba(255,255,255,0.07)",
};

// ─── Default Demo Data ─────────────────────────────────────────────
const DEFAULT_MATCH = { date: "2025年6月14日", home: "山口大学", away: "周南公立大学", homeScore: 63, awayScore: 72 };

const DEFAULT_QUARTERS = {
  home: { Q1: 18, Q2: 15, Q3: 16, Q4: 14 },
  away: { Q1: 20, Q2: 17, Q3: 18, Q4: 17 },
};

const DEFAULT_TEAMS = {
  "山口大学": {
    color: C.orange,
    players: [
      { no:7,  name:"金子", gs:true,  pts:12, "3pm":1,"3pa":8,  "2pm":4,"2pa":10, ftm:1,fta:2,  or:1, dr:4,  ast:6, stl:0,blk:0,to:2,pf:1, min:"29:37" },
      { no:11, name:"新道", gs:false, pts:9,  "3pm":3,"3pa":4,  "2pm":0,"2pa":2,  ftm:0,fta:0,  or:0, dr:5,  ast:0, stl:0,blk:0,to:2,pf:1, min:"12:42" },
      { no:13, name:"西村", gs:true,  pts:8,  "3pm":0,"3pa":6,  "2pm":4,"2pa":10, ftm:0,fta:1,  or:2, dr:6,  ast:0, stl:0,blk:0,to:1,pf:2, min:"30:50" },
      { no:17, name:"小野", gs:true,  pts:2,  "3pm":0,"3pa":0,  "2pm":1,"2pa":3,  ftm:0,fta:1,  or:2, dr:5,  ast:0, stl:0,blk:0,to:0,pf:2, min:"21:32" },
      { no:19, name:"一瀬", gs:false, pts:0,  "3pm":0,"3pa":2,  "2pm":0,"2pa":2,  ftm:0,fta:0,  or:2, dr:1,  ast:0, stl:0,blk:0,to:1,pf:0, min:"9:59"  },
      { no:31, name:"新谷", gs:true,  pts:21, "3pm":5,"3pa":13, "2pm":3,"2pa":13, ftm:0,fta:2,  or:0, dr:7,  ast:1, stl:0,blk:0,to:1,pf:2, min:"34:51" },
      { no:34, name:"清水", gs:false, pts:2,  "3pm":0,"3pa":0,  "2pm":1,"2pa":1,  ftm:0,fta:0,  or:3, dr:4,  ast:0, stl:0,blk:0,to:1,pf:2, min:"15:37" },
      { no:39, name:"渡邊", gs:true,  pts:9,  "3pm":1,"3pa":3,  "2pm":2,"2pa":3,  ftm:2,fta:4,  or:2, dr:3,  ast:0, stl:0,blk:1,to:0,pf:0, min:"30:31" },
      { no:78, name:"平塚", gs:false, pts:0,  "3pm":0,"3pa":0,  "2pm":0,"2pa":1,  ftm:0,fta:0,  or:1, dr:4,  ast:0, stl:0,blk:0,to:0,pf:1, min:"14:15" },
    ],
  },
  "周南公立大学": {
    color: C.blue,
    players: [
      { no:4,  name:"山下", gs:true,  pts:0,  "3pm":0,"3pa":2,  "2pm":0,"2pa":2,  ftm:0,fta:0,  or:3, dr:0,  ast:3, stl:0,blk:0,to:0,pf:2, min:"20:59" },
      { no:12, name:"荒谷", gs:true,  pts:15, "3pm":3,"3pa":6,  "2pm":3,"2pa":5,  ftm:0,fta:0,  or:2, dr:1,  ast:1, stl:0,blk:0,to:1,pf:3, min:"30:04" },
      { no:15, name:"白潟", gs:true,  pts:14, "3pm":0,"3pa":3,  "2pm":6,"2pa":11, ftm:2,fta:4,  or:2, dr:17, ast:3, stl:1,blk:0,to:1,pf:2, min:"37:05" },
      { no:5,  name:"田中", gs:false, pts:18, "3pm":2,"3pa":5,  "2pm":4,"2pa":8,  ftm:2,fta:4,  or:1, dr:5,  ast:2, stl:1,blk:0,to:3,pf:2, min:"28:00" },
      { no:22, name:"佐藤", gs:true,  pts:12, "3pm":2,"3pa":6,  "2pm":2,"2pa":5,  ftm:2,fta:3,  or:0, dr:4,  ast:2, stl:0,blk:1,to:2,pf:2, min:"25:00" },
      { no:33, name:"鈴木", gs:true,  pts:8,  "3pm":1,"3pa":4,  "2pm":2,"2pa":6,  ftm:1,fta:2,  or:2, dr:3,  ast:1, stl:1,blk:0,to:2,pf:2, min:"22:00" },
      { no:44, name:"山田", gs:false, pts:5,  "3pm":0,"3pa":2,  "2pm":1,"2pa":5,  ftm:3,fta:4,  or:0, dr:2,  ast:0, stl:0,blk:0,to:0,pf:1, min:"17:00" },
    ],
  },
};

// ─── Helper: calculate totals from players ─────────────────────────
function calcTotals(players) {
  const sum = (key) => players.reduce((s, p) => s + (Number(p[key]) || 0), 0);
  const _3pm = sum("3pm"), _3pa = sum("3pa");
  const _2pm = sum("2pm"), _2pa = sum("2pa");
  const ftm  = sum("ftm"), fta  = sum("fta");
  const or = sum("or"), dr = sum("dr");
  return {
    pts: sum("pts"),
    "3pm": _3pm, "3pa": _3pa, "3pp": _3pa > 0 ? Math.round(_3pm / _3pa * 100) : 0,
    "2pm": _2pm, "2pa": _2pa, "2pp": _2pa > 0 ? Math.round(_2pm / _2pa * 100) : 0,
    ftm, fta, ftp: fta > 0 ? Math.round(ftm / fta * 100) : 0,
    or, dr, tot: or + dr,
    ast: sum("ast"), stl: sum("stl"), blk: sum("blk"), to: sum("to"), pf: sum("pf"),
  };
}

// ─── Helper: add totals to teamsData ──────────────────────────────
function enrichTeams(raw) {
  return Object.fromEntries(
    Object.entries(raw).map(([name, team]) => [
      name,
      { ...team, totals: calcTotals(team.players) }
    ])
  );
}

// ─── CSV Template content ─────────────────────────────────────────
const CSV_TEMPLATE = `チーム,No,選手名,GS,PTS,3PM,3PA,2PM,2PA,FTM,FTA,OR,DR,AST,STL,BLK,TO,PF,MIN
チームA,7,選手A,1,12,1,8,4,10,1,2,1,4,6,0,0,2,1,29:37
チームA,11,選手B,0,9,3,4,0,2,0,0,0,5,0,0,0,2,1,12:42
チームB,4,選手C,1,15,3,6,3,5,0,0,2,1,1,0,0,1,3,30:04
チームB,12,選手D,1,14,0,3,6,11,2,4,2,17,3,1,0,1,2,37:05`;

// ─── Sub Components ───────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <div style={{ background: C.card2, borderRadius: 10, padding: "12px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: color || C.orange, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: 0.5 }}>{label}</div>
  </div>
);



// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("score");
  const [teamTab, setTeamTab]   = useState("");
  const [matchInfo, setMatchInfo] = useState(DEFAULT_MATCH);
  const [teamsData, setTeamsData] = useState(enrichTeams(DEFAULT_TEAMS));
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { ok, message }
  const [matchForm, setMatchForm] = useState(DEFAULT_MATCH);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvCopied, setCsvCopied]       = useState(false);
  const [quarters, setQuarters]         = useState(DEFAULT_QUARTERS);
  const [quarterForm, setQuarterForm]   = useState(DEFAULT_QUARTERS);
  const fileInputRef = useRef(null);

  const teamNames = Object.keys(teamsData);
  const activeTeam = teamTab || teamNames[0] || "";
  const team = teamsData[activeTeam];

  // ── CSV parsing logic ──────────────────────────────────────────
  const processCSV = useCallback((text) => {
    const result = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
    if (result.errors.length > 0 && result.data.length === 0) {
      setUploadStatus({ ok: false, message: "CSVの形式が正しくありません。テンプレートを確認してください。" });
      return;
    }

    const required = ["チーム", "No", "選手名", "PTS", "3PM", "3PA", "2PM", "2PA", "FTM", "FTA", "OR", "DR"];
    const headers = result.meta.fields || [];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      setUploadStatus({ ok: false, message: `必須列が不足しています: ${missing.join(", ")}` });
      return;
    }

    const colors = [C.orange, C.blue, C.gold, C.green];
    const grouped = {};
    result.data.forEach(row => {
      const tName = row["チーム"]?.trim();
      if (!tName) return;
      if (!grouped[tName]) grouped[tName] = [];
      grouped[tName].push({
        no:    Number(row["No"]) || 0,
        name:  row["選手名"]?.trim() || "",
        gs:    row["GS"] === "1" || row["GS"] === "●" || row["GS"]?.toLowerCase() === "true",
        pts:   Number(row["PTS"]) || 0,
        "3pm": Number(row["3PM"]) || 0,
        "3pa": Number(row["3PA"]) || 0,
        "2pm": Number(row["2PM"]) || 0,
        "2pa": Number(row["2PA"]) || 0,
        ftm:   Number(row["FTM"]) || 0,
        fta:   Number(row["FTA"]) || 0,
        or:    Number(row["OR"])  || 0,
        dr:    Number(row["DR"])  || 0,
        ast:   Number(row["AST"]) || 0,
        stl:   Number(row["STL"]) || 0,
        blk:   Number(row["BLK"]) || 0,
        to:    Number(row["TO"])  || 0,
        pf:    Number(row["PF"])  || 0,
        min:   row["MIN"]?.trim() || "-",
      });
    });

    const newTeams = {};
    Object.entries(grouped).forEach(([name, players], idx) => {
      newTeams[name] = { color: colors[idx % colors.length], players };
    });

    const enriched = enrichTeams(newTeams);
    setTeamsData(enriched);
    setTeamTab(Object.keys(enriched)[0]);

    const names = Object.keys(enriched);
    const totals = Object.values(enriched).map(t => t.totals.pts);
    setMatchInfo(prev => ({
      ...prev,
      home: names[0] || prev.home,
      away: names[1] || prev.away,
      homeScore: totals[0] ?? prev.homeScore,
      awayScore: totals[1] ?? prev.awayScore,
    }));
    setMatchForm(prev => ({
      ...prev,
      home: names[0] || prev.home,
      away: names[1] || prev.away,
      homeScore: totals[0] ?? prev.homeScore,
      awayScore: totals[1] ?? prev.awayScore,
    }));
    setAiText("");
    setUploadStatus({ ok: true, message: `✅ ${names.join(" vs ")} のデータを読み込みました（${result.data.length}選手）` });
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setUploadStatus({ ok: false, message: "CSVファイル(.csv)を選択してください。" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => processCSV(e.target.result);
    reader.readAsText(file, "UTF-8");
  }, [processCSV]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── CSV Template: open copy modal ─────────────────────────────
  const openCsvModal = () => { setShowCsvModal(true); setCsvCopied(false); };
  const copyCsvTemplate = async () => {
    try {
      await navigator.clipboard.writeText(CSV_TEMPLATE);
      setCsvCopied(true);
      setTimeout(() => setCsvCopied(false), 2500);
    } catch {
      // fallback: select textarea text
      const el = document.getElementById("csv-template-textarea");
      if (el) { el.select(); document.execCommand("copy"); setCsvCopied(true); setTimeout(() => setCsvCopied(false), 2500); }
    }
  };

  // ── Apply match form ──────────────────────────────────────────
  const applyMatchForm = () => {
    setMatchInfo({ ...matchForm });
    setQuarters({ ...quarterForm });
    setUploadStatus({ ok: true, message: "✅ 試合情報を更新しました" });
  };

  // ── Charts data ───────────────────────────────────────────────
  const scoringData = team ? team.players
    .filter(p => p.pts > 0 || p.tot > 3)
    .sort((a, b) => b.pts - a.pts)
    .map(p => ({ name: p.name, 得点: p.pts, リバウンド: p.tot || (p.or + p.dr), アシスト: p.ast })) : [];

  const t = team?.totals || {};

  const shootingData = team ? [
    { name: "3P%", 成功率: t["3pp"] || 0, fill: C.orange },
    { name: "2P%", 成功率: t["2pp"] || 0, fill: C.blue },
    { name: "FT%", 成功率: t.ftp     || 0, fill: C.gold },
  ] : [];

  const radarData = teamNames.length >= 2 ? [
    { stat: "得点",   ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.pts])) },
    { stat: "RBD",   ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.tot])) },
    { stat: "AST",   ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.ast])) },
    { stat: "3P%",   ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals["3pp"]])) },
    { stat: "FG%",   ...Object.fromEntries(teamNames.map(n => {
      const tt = teamsData[n].totals;
      const fgm = tt["3pm"] + tt["2pm"], fga = tt["3pa"] + tt["2pa"];
      return [n, fga > 0 ? Math.round(fgm / fga * 100) : 0];
    })) },
  ] : [];

  const teamCompBar = teamNames.length >= 2 ? [
    { name: "得点",       ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.pts])) },
    { name: "リバウンド", ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.tot])) },
    { name: "アシスト",   ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.ast])) },
    { name: "TO",         ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.to])) },
    { name: "スティール", ...Object.fromEntries(teamNames.map(n => [n, teamsData[n].totals.stl])) },
  ] : [];

  const teamColors = teamNames.map(n => teamsData[n].color);

  // ── Quarter chart data ────────────────────────────────────────
  const quarterChartData = ["Q1","Q2","Q3","Q4"].map(q => ({
    name: q,
    [matchInfo.home]: quarters.home[q] || 0,
    [matchInfo.away]: quarters.away[q] || 0,
  }));
  const homeTotal  = Object.values(quarters.home).reduce((s,v) => s+v, 0);
  const awayTotal  = Object.values(quarters.away).reduce((s,v) => s+v, 0);



  // ─── Render ────────────────────────────────────────────────────
  const tabs = [["score","📋","スコア"],["chart","📊","グラフ"],["data","📁","データ"]];

  const TeamSelector = () => (
    <div style={{ display:"flex", gap:6, marginBottom:12 }}>
      {teamNames.map(name => {
        const tc = teamsData[name].color;
        const active = activeTeam === name;
        return (
          <button key={name} onClick={() => setTeamTab(name)} style={{
            flex:1, padding:"9px 12px", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700,
            border:`1.5px solid ${active ? tc : C.border}`,
            background: active ? `${tc}22` : "transparent",
            color: active ? tc : C.muted, transition:"all 0.18s",
          }}>{name}</button>
        );
      })}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Noto Sans JP', system-ui, sans-serif", maxWidth:560, margin:"0 auto", padding:"16px 12px 48px" }}>

      {/* ── Scoreboard ─────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#162236,#1A2D45)", borderRadius:16, padding:"20px 24px 16px", marginBottom:14, border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:120, height:120, background:"radial-gradient(circle,rgba(255,124,53,0.08),transparent 70%)", pointerEvents:"none" }} />
        <div style={{ textAlign:"center", color:C.muted, fontSize:11, marginBottom:12, letterSpacing:1, textTransform:"uppercase" }}>
          {matchInfo.date} · 大学リーグ
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:12, fontWeight:700, color:teamColors[0]||C.orange, marginBottom:6 }}>{matchInfo.home}</div>
            <div style={{ fontSize:52, fontWeight:900, lineHeight:1, letterSpacing:-2 }}>{matchInfo.homeScore}</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:2 }}>FINAL</div>
            <div style={{ color:C.muted, fontSize:18, fontWeight:300, margin:"4px 0" }}>vs</div>
          </div>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:12, fontWeight:700, color:teamColors[1]||C.blue, marginBottom:6 }}>{matchInfo.away}</div>
            <div style={{ fontSize:52, fontWeight:900, lineHeight:1, letterSpacing:-2, color:C.gold }}>{matchInfo.awayScore}</div>
          </div>
        </div>

        {/* ── Quarter breakdown ── */}
        <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["",  "Q1","Q2","Q3","Q4","計"].map((h,i) => (
                  <th key={i} style={{ padding:"3px 4px", textAlign:"center", color:C.muted, fontWeight:600, fontSize:10, letterSpacing:0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: matchInfo.home, side:"home", color: teamColors[0]||C.orange },
                { label: matchInfo.away, side:"away", color: teamColors[1]||C.blue  },
              ].map(({ label, side, color }) => (
                <tr key={side}>
                  <td style={{ padding:"5px 4px", fontWeight:700, color, fontSize:11, maxWidth:72, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</td>
                  {["Q1","Q2","Q3","Q4"].map(q => {
                    const val    = quarters[side][q]  || 0;
                    const opp    = quarters[side==="home"?"away":"home"][q] || 0;
                    const isWin  = val > opp;
                    return (
                      <td key={q} style={{ padding:"5px 4px", textAlign:"center", fontWeight: isWin ? 800 : 400, color: isWin ? color : C.muted, fontSize:13 }}>
                        {val}
                      </td>
                    );
                  })}
                  <td style={{ padding:"5px 4px", textAlign:"center", fontWeight:900, color, fontSize:14 }}>
                    {side==="home" ? matchInfo.homeScore : matchInfo.awayScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tab Nav ────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:5, background:C.card, borderRadius:12, padding:5, marginBottom:14 }}>
        {tabs.map(([key,icon,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex:1, padding:"9px 2px", borderRadius:9, border:"none", cursor:"pointer",
            fontSize:11, fontWeight:700, letterSpacing:0.3,
            background: tab===key ? C.orange : "transparent",
            color: tab===key ? "#fff" : C.muted, transition:"all 0.18s",
          }}>{icon} {label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOX SCORE TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "score" && team && (
        <>
          <TeamSelector />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7, marginBottom:12 }}>
            <StatCard label="得点"  value={t.pts}            color={teamsData[activeTeam].color} />
            <StatCard label="3P%"   value={`${t["3pp"]}%`}   color={C.gold} />
            <StatCard label="RBD"   value={t.tot}            color={C.blue} />
            <StatCard label="AST"   value={t.ast}            color={C.green} />
          </div>
          <div style={{ background:C.card, borderRadius:12, overflow:"hidden", border:`1px solid ${C.border}` }}>
            <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:480 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {["#","選手","S","PTS","3P","2P","FT%","RBD","AST","TO","MIN"].map(h => (
                      <th key={h} style={{ padding:"10px 8px", textAlign:h==="選手"?"left":"center", color:C.muted, fontWeight:600, fontSize:11, background:"rgba(0,0,0,0.2)", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((p, i) => {
                    const rbdVal = p.tot !== undefined ? p.tot : (p.or + p.dr);
                    const ftpVal = p.fta > 0 ? Math.round(p.ftm / p.fta * 100) : null;
                    return (
                      <tr key={p.no} style={{ borderBottom:`1px solid ${C.border}`, background:i%2?"rgba(255,255,255,0.015)":"transparent" }}>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:C.muted, fontSize:11 }}>{p.no}</td>
                        <td style={{ padding:"10px 8px", fontWeight:600, whiteSpace:"nowrap" }}>{p.name}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center" }}>{p.gs ? <span style={{ color:C.gold, fontSize:9 }}>●</span> : ""}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:800, color:p.pts>=15?C.orange:p.pts>=8?C.text:C.muted }}>{p.pts}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:C.muted, whiteSpace:"nowrap" }}>{p["3pm"]}/{p["3pa"]}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:C.muted, whiteSpace:"nowrap" }}>{p["2pm"]}/{p["2pa"]}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:ftpVal!=null?(ftpVal>=70?C.green:C.text):C.muted }}>{ftpVal!=null?`${ftpVal}%`:"-"}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:rbdVal>=8?700:400, color:rbdVal>=8?C.blue:C.text }}>{rbdVal}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:p.ast>=3?C.green:C.text }}>{p.ast}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:p.to>=3?C.red:C.text }}>{p.to}</td>
                        <td style={{ padding:"10px 8px", textAlign:"center", color:C.muted, fontSize:11, whiteSpace:"nowrap" }}>{p.min}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background:`${teamsData[activeTeam].color}14`, borderTop:`1.5px solid ${teamsData[activeTeam].color}50` }}>
                    <td colSpan={3} style={{ padding:"10px 12px", fontWeight:800, color:teamsData[activeTeam].color, fontSize:11, letterSpacing:1 }}>TOTAL</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:800 }}>{t.pts}</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", color:C.muted, fontSize:11 }}>{t["3pm"]}/{t["3pa"]}</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", color:C.muted, fontSize:11 }}>{t["2pm"]}/{t["2pa"]}</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:700 }}>{t.ftp}%</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:700 }}>{t.tot}</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:700 }}>{t.ast}</td>
                    <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:700 }}>{t.to}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          CHART TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "chart" && team && (
        <>
          <TeamSelector />
          {/* Scoring bar chart */}
          <div style={{ background:C.card, borderRadius:12, padding:"16px 12px", marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>選手別スタッツ</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoringData} margin={{ top:0,right:4,left:-24,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fill:C.muted,fontSize:11 }} />
                <YAxis tick={{ fill:C.muted,fontSize:10 }} />
                <Tooltip contentStyle={{ background:"#1A2D45",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text }} cursor={{ fill:"rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={{ fontSize:11,paddingTop:8 }} />
                <Bar dataKey="得点"       fill={C.orange} radius={[3,3,0,0]} maxBarSize={22} />
                <Bar dataKey="リバウンド" fill={C.blue}   radius={[3,3,0,0]} maxBarSize={22} />
                <Bar dataKey="アシスト"   fill={C.gold}   radius={[3,3,0,0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Shooting % */}
          <div style={{ background:C.card, borderRadius:12, padding:"16px 12px", marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>シュート成功率</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={shootingData} layout="vertical" margin={{ top:0,right:36,left:8,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" domain={[0,100]} tick={{ fill:C.muted,fontSize:10 }} tickFormatter={v=>`${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill:C.muted,fontSize:11 }} width={36} />
                <Tooltip contentStyle={{ background:"#1A2D45",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text }} formatter={v=>[`${v}%`,"成功率"]} cursor={{ fill:"rgba(255,255,255,0.04)" }} />
                <Bar dataKey="成功率" radius={[0,5,5,0]} maxBarSize={24}>
                  {shootingData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Quarter-by-Quarter chart */}
          <div style={{ background:C.card, borderRadius:12, padding:"16px 12px", marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>クォーター別得点</div>
            <div style={{ display:"flex", gap:12, marginBottom:12 }}>
              {["Q1","Q2","Q3","Q4"].map(q => {
                const hv = quarters.home[q]||0, av = quarters.away[q]||0;
                const winner = hv > av ? "home" : av > hv ? "away" : null;
                return (
                  <div key={q} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:4, fontWeight:700 }}>{q}</div>
                    <div style={{ fontSize:16, fontWeight:800, color: winner==="home" ? (teamColors[0]||C.orange) : C.text }}>{hv}</div>
                    <div style={{ fontSize:10, color:C.muted, margin:"2px 0" }}>-</div>
                    <div style={{ fontSize:16, fontWeight:800, color: winner==="away" ? (teamColors[1]||C.blue) : C.text }}>{av}</div>
                  </div>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={quarterChartData} margin={{ top:0,right:4,left:-24,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fill:C.muted,fontSize:12 }} />
                <YAxis tick={{ fill:C.muted,fontSize:10 }} />
                <Tooltip contentStyle={{ background:"#1A2D45",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text }} cursor={{ fill:"rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={{ fontSize:11,paddingTop:8 }} />
                <Bar dataKey={matchInfo.home} fill={teamColors[0]||C.orange} radius={[3,3,0,0]} maxBarSize={32} />
                <Bar dataKey={matchInfo.away} fill={teamColors[1]||C.blue}   radius={[3,3,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          {teamNames.length >= 2 && (
            <div style={{ background:C.card, borderRadius:12, padding:"16px 12px", marginBottom:12, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>チーム比較レーダー</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top:0,right:20,left:20,bottom:0 }}>
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis dataKey="stat" tick={{ fill:C.muted,fontSize:11 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  {teamNames.map((name,i) => (
                    <Radar key={name} name={name} dataKey={name} stroke={teamColors[i]} fill={teamColors[i]} fillOpacity={0.18} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ background:"#1A2D45",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Team comp bar */}
          {teamNames.length >= 2 && (
            <div style={{ background:C.card, borderRadius:12, padding:"16px 12px", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>チーム比較</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={teamCompBar} margin={{ top:0,right:4,left:-24,bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill:C.muted,fontSize:11 }} />
                  <YAxis tick={{ fill:C.muted,fontSize:10 }} />
                  <Tooltip contentStyle={{ background:"#1A2D45",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text }} cursor={{ fill:"rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize:11,paddingTop:8 }} />
                  {teamNames.map((name,i) => (
                    <Bar key={name} dataKey={name} fill={teamColors[i]} radius={[3,3,0,0]} maxBarSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}



      {/* ══════════════════════════════════════════════════════════
          DATA UPLOAD TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === "data" && (
        <>
          {/* Status message */}
          {uploadStatus && (
            <div style={{ background: uploadStatus.ok ? "rgba(82,201,124,0.12)" : "rgba(239,83,80,0.12)", borderRadius:10, padding:"12px 16px", marginBottom:12, border:`1px solid ${uploadStatus.ok ? C.green : C.red}40`, fontSize:13, color: uploadStatus.ok ? C.green : C.red, lineHeight:1.5 }}>
              {uploadStatus.message}
            </div>
          )}

          {/* Step 1: Template download */}
          <div style={{ background:C.card, borderRadius:12, padding:18, marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
              STEP 1 · テンプレートをダウンロード
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:14 }}>
              CSVテンプレートに選手データを入力してください。<br />
              列: チーム / No / 選手名 / GS(1=スターター) / PTS / 3PM / 3PA / 2PM / 2PA / FTM / FTA / OR / DR / AST / STL / BLK / TO / PF / MIN
            </div>
            <button onClick={openCsvModal} style={{
              width:"100%", padding:13, borderRadius:10, border:`1.5px solid ${C.gold}`,
              background:"transparent", color:C.gold, fontWeight:700, fontSize:13, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              📥 テンプレート (.csv) をダウンロード
            </button>
          </div>

          {/* Step 2: Upload */}
          <div style={{ background:C.card, borderRadius:12, padding:18, marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
              STEP 2 · CSVをアップロード
            </div>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? C.orange : C.border}`,
                borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer",
                background: dragOver ? "rgba(255,124,53,0.06)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s", marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: dragOver ? C.orange : C.text, marginBottom: 4 }}>
                {dragOver ? "ここにドロップ！" : "CSVファイルをドロップ"}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>またはタップしてファイルを選択</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            <button onClick={() => fileInputRef.current?.click()} style={{
              width:"100%", padding:13, borderRadius:10, border:"none",
              background:`linear-gradient(135deg,${C.orange},#FF5500)`,
              color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
              boxShadow:"0 4px 16px rgba(255,124,53,0.25)",
            }}>
              📤 ファイルを選択してアップロード
            </button>
          </div>

          {/* Step 3: Match info */}
          <div style={{ background:C.card, borderRadius:12, padding:18, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
              STEP 3 · 試合情報を確認・編集
            </div>
            <div style={{ display:"grid", gap:10 }}>
              {[
                ["試合日", "date", "text", "2025年6月14日"],
                ["ホームチーム", "home", "text", "チームA"],
                ["ホームスコア", "homeScore", "number", "0"],
                ["アウェイチーム", "away", "text", "チームB"],
                ["アウェイスコア", "awayScore", "number", "0"],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4, fontWeight:600 }}>{label}</div>
                  <input
                    type={type}
                    placeholder={ph}
                    value={matchForm[key]}
                    onChange={e => setMatchForm(prev => ({ ...prev, [key]: type==="number" ? Number(e.target.value) : e.target.value }))}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card2, color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }}
                  />
                </div>
              ))}
            </div>

            {/* Quarter score inputs */}
            <div style={{ marginTop:14, padding:14, background:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.8, marginBottom:12 }}>クォーター別得点</div>
              {[
                { side:"home", label: matchForm.home || "ホーム", color: teamColors[0]||C.orange },
                { side:"away", label: matchForm.away || "アウェイ", color: teamColors[1]||C.blue },
              ].map(({ side, label, color }) => (
                <div key={side} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color, marginBottom:6 }}>{label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                    {["Q1","Q2","Q3","Q4"].map(q => (
                      <div key={q}>
                        <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginBottom:3 }}>{q}</div>
                        <input
                          type="number"
                          min="0"
                          value={quarterForm[side][q] || 0}
                          onChange={e => setQuarterForm(prev => ({
                            ...prev,
                            [side]: { ...prev[side], [q]: Number(e.target.value) }
                          }))}
                          style={{ width:"100%", padding:"8px 4px", borderRadius:8, border:`1px solid ${color}40`, background:C.card2, color, fontSize:14, fontWeight:700, textAlign:"center", outline:"none", boxSizing:"border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={applyMatchForm} style={{
              width:"100%", marginTop:14, padding:13, borderRadius:10, border:`1.5px solid ${C.blue}`,
              background:"transparent", color:C.blue, fontWeight:700, fontSize:13, cursor:"pointer",
            }}>
              ✅ 試合情報を更新
            </button>
          </div>
        </>
      )}
      {/* ── CSV Modal ──────────────────────────────────────────── */}
      {showCsvModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setShowCsvModal(false)}>
          <div style={{ background:C.card, borderRadius:16, padding:20, width:"100%", maxWidth:500, border:`1px solid ${C.border}`, maxHeight:"80vh", display:"flex", flexDirection:"column" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>CSVテンプレート</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>コピーしてメモ帳に貼り付け → .csv で保存</div>
              </div>
              <button onClick={() => setShowCsvModal(false)} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, color:C.muted, fontSize:18, cursor:"pointer", width:32, height:32 }}>✕</button>
            </div>

            {/* How-to steps */}
            <div style={{ background:"rgba(255,124,53,0.08)", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:C.muted, lineHeight:1.8, border:`1px solid ${C.orange}25` }}>
              ① 下の「コピー」ボタンを押す<br />
              ② メモ帳(Windows) または テキストエディット(Mac) を開く<br />
              ③ 貼り付けて <span style={{ color:C.orange, fontWeight:700 }}>basketball_stats.csv</span> という名前で保存
            </div>

            {/* CSV content */}
            <textarea
              id="csv-template-textarea"
              readOnly
              value={CSV_TEMPLATE}
              style={{ flex:1, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:12, color:C.text, fontSize:11, fontFamily:"monospace", resize:"none", outline:"none", lineHeight:1.6, minHeight:140 }}
            />

            {/* Copy button */}
            <button onClick={copyCsvTemplate} style={{
              marginTop:12, width:"100%", padding:13, borderRadius:10, border:"none", cursor:"pointer",
              background: csvCopied ? `linear-gradient(135deg,${C.green},#3aaa5e)` : `linear-gradient(135deg,${C.orange},#FF5500)`,
              color:"#fff", fontWeight:800, fontSize:14, transition:"background 0.3s",
              boxShadow:`0 4px 16px ${csvCopied ? "rgba(82,201,124,0.3)" : "rgba(255,124,53,0.3)"}`,
            }}>
              {csvCopied ? "✅ コピーしました！" : "📋 テンプレートをコピー"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}