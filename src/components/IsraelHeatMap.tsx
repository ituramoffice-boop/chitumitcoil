import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, MapPin, Building2, Waves, Train, GraduationCap, Flame } from "lucide-react";

interface AreaData {
  name: string;
  region: string;
  avgPricePerSqm: number;
  trend: number;
  demandLevel: "high" | "medium" | "low";
  nearBeach: boolean;
  nearTrain: boolean;
  schools: number;
}

interface Props {
  areas: AreaData[];
  selectedArea: string;
  onSelectArea: (name: string) => void;
}

// Approximate geographic positions for each region on the map (percentage-based)
const REGION_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  "תל אביב":   { x: 18, y: 52, w: 14, h: 10 },
  "גוש דן":    { x: 24, y: 48, w: 18, h: 14 },
  "שרון":      { x: 20, y: 34, w: 20, h: 14 },
  "מרכז":      { x: 32, y: 54, w: 18, h: 12 },
  "ירושלים":   { x: 48, y: 58, w: 16, h: 12 },
  "חיפה":      { x: 22, y: 18, w: 16, h: 12 },
  "דרום":      { x: 32, y: 72, w: 28, h: 20 },
  "צפון":      { x: 32, y: 6,  w: 24, h: 14 },
};

// Group areas by region
function groupByRegion(areas: AreaData[]) {
  const map = new Map<string, AreaData[]>();
  for (const a of areas) {
    const list = map.get(a.region) || [];
    list.push(a);
    map.set(a.region, list);
  }
  return map;
}

function priceToColor(price: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (price - min) / (max - min)));
  // from cool blue → warm yellow → hot red
  if (t < 0.33) {
    const s = t / 0.33;
    return `hsl(${200 - s * 40}, ${60 + s * 20}%, ${55 - s * 5}%)`;
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33;
    return `hsl(${160 - s * 120}, ${80 + s * 10}%, ${50 - s * 5}%)`;
  } else {
    const s = (t - 0.66) / 0.34;
    return `hsl(${40 - s * 40}, ${90}%, ${50 - s * 8}%)`;
  }
}

export default function IsraelHeatMap({ areas, selectedArea, onSelectArea }: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regionGroups = useMemo(() => groupByRegion(areas), [areas]);
  const priceRange = useMemo(() => {
    const prices = areas.map(a => a.avgPricePerSqm);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [areas]);

  // Region-level averages
  const regionStats = useMemo(() => {
    const stats: Record<string, { avgPrice: number; avgTrend: number; count: number; areas: AreaData[] }> = {};
    for (const [region, items] of regionGroups) {
      const avgPrice = Math.round(items.reduce((s, a) => s + a.avgPricePerSqm, 0) / items.length);
      const avgTrend = +(items.reduce((s, a) => s + a.trend, 0) / items.length).toFixed(1);
      stats[region] = { avgPrice, avgTrend, count: items.length, areas: items };
    }
    return stats;
  }, [regionGroups]);

  const activeRegion = hoveredRegion || areas.find(a => a.name === selectedArea)?.region || null;
  const activeStats = activeRegion ? regionStats[activeRegion] : null;

  // Legend stops
  const legendStops = [
    { label: `₪${priceRange.min.toLocaleString()}`, color: priceToColor(priceRange.min, priceRange.min, priceRange.max) },
    { label: `₪${Math.round((priceRange.min + priceRange.max) / 2).toLocaleString()}`, color: priceToColor((priceRange.min + priceRange.max) / 2, priceRange.min, priceRange.max) },
    { label: `₪${priceRange.max.toLocaleString()}`, color: priceToColor(priceRange.max, priceRange.min, priceRange.max) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 relative aspect-[3/4] md:aspect-[4/5] rounded-2xl bg-[hsl(222,47%,6%)] border border-white/10 overflow-hidden">
          {/* Israel silhouette SVG with geographic features */}
          <svg viewBox="0 0 200 500" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Country outline — bolder */}
            <path
              d="M95 10 L105 8 L115 15 L120 25 L118 35 L125 42 L130 38 L132 30 L138 25 L140 32 L135 45 L128 55 L122 52 L115 58 L110 55 L108 60 L112 68 L108 75 L105 72 L100 78 L98 85 L102 90 L100 95 L95 92 L90 98 L88 105 L92 110 L90 118 L85 115 L82 120 L85 128 L83 135 L80 130 L78 138 L82 145 L80 155 L78 160 L82 168 L85 175 L83 185 L80 190 L78 200 L82 210 L85 220 L88 230 L90 240 L88 250 L85 260 L82 270 L80 280 L78 290 L75 310 L72 330 L70 350 L68 370 L70 390 L75 410 L80 430 L85 445 L90 455 L95 460 L100 465 L105 470 L108 475 L105 480 L100 485 L95 488 L90 490 L85 485 L80 475 L75 460 L70 445 L65 430 L60 410 L58 390 L55 370 L52 350 L50 330 L48 310 L50 290 L52 270 L55 250 L58 235 L60 220 L62 210 L60 200 L58 190 L55 180 L58 170 L62 160 L65 150 L68 140 L70 130 L72 120 L70 110 L68 100 L72 90 L75 82 L78 75 L80 68 L82 60 L85 50 L88 40 L90 30 L92 20 Z"
              fill="hsl(160,84%,39%)"
              fillOpacity="0.1"
              stroke="hsl(160,84%,50%)"
              strokeWidth="1.8"
              strokeOpacity="0.4"
            />
            {/* Border glow — outer */}
            <path
              d="M95 10 L105 8 L115 15 L120 25 L118 35 L125 42 L130 38 L132 30 L138 25 L140 32 L135 45 L128 55 L122 52 L115 58 L110 55 L108 60 L112 68 L108 75 L105 72 L100 78 L98 85 L102 90 L100 95 L95 92 L90 98 L88 105 L92 110 L90 118 L85 115 L82 120 L85 128 L83 135 L80 130 L78 138 L82 145 L80 155 L78 160 L82 168 L85 175 L83 185 L80 190 L78 200 L82 210 L85 220 L88 230 L90 240 L88 250 L85 260 L82 270 L80 280 L78 290 L75 310 L72 330 L70 350 L68 370 L70 390 L75 410 L80 430 L85 445 L90 455 L95 460 L100 465 L105 470 L108 475 L105 480 L100 485 L95 488 L90 490 L85 485 L80 475 L75 460 L70 445 L65 430 L60 410 L58 390 L55 370 L52 350 L50 330 L48 310 L50 290 L52 270 L55 250 L58 235 L60 220 L62 210 L60 200 L58 190 L55 180 L58 170 L62 160 L65 150 L68 140 L70 130 L72 120 L70 110 L68 100 L72 90 L75 82 L78 75 L80 68 L82 60 L85 50 L88 40 L90 30 L92 20 Z"
              fill="none"
              stroke="hsl(160,84%,50%)"
              strokeWidth="4"
              strokeOpacity="0.08"
              filter="url(#borderGlow)"
            />
            <defs>
              <filter id="borderGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
              </filter>
            </defs>
            {/* Lebanon border (north) */}
            <line x1="60" y1="8" x2="142" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.12" strokeDasharray="3,3" />
            <text x="100" y="6" textAnchor="middle" fontSize="4" fill="white" fillOpacity="0.12" fontFamily="Heebo">לבנון</text>
            {/* Syria border (northeast) */}
            <line x1="140" y1="10" x2="150" y2="70" stroke="white" strokeWidth="0.5" strokeOpacity="0.12" strokeDasharray="3,3" />
            <text x="152" y="40" fontSize="4" fill="white" fillOpacity="0.12" fontFamily="Heebo" transform="rotate(75,152,40)">סוריה</text>
            {/* Jordan border (east) */}
            <path d="M140 70 L145 120 L140 180 L135 240 L130 300 L120 380 L110 460 L100 490" stroke="white" strokeWidth="0.5" strokeOpacity="0.12" strokeDasharray="3,3" fill="none" />
            <text x="148" y="200" fontSize="4.5" fill="white" fillOpacity="0.12" fontFamily="Heebo" transform="rotate(85,148,200)">ירדן</text>
            {/* Egypt border (southwest) */}
            <path d="M48 310 L40 380 L35 430 L40 470 L90 490" stroke="white" strokeWidth="0.5" strokeOpacity="0.12" strokeDasharray="3,3" fill="none" />
            <text x="42" y="440" fontSize="4.5" fill="white" fillOpacity="0.12" fontFamily="Heebo" transform="rotate(-70,42,440)">מצרים</text>
            {/* Sea of Galilee / כנרת */}
            <ellipse cx="130" cy="55" rx="8" ry="12" fill="hsl(210,80%,40%)" fillOpacity="0.25" stroke="hsl(210,80%,50%)" strokeWidth="0.5" strokeOpacity="0.3" />
            <text x="130" y="58" textAnchor="middle" fontSize="5" fill="hsl(210,80%,60%)" fillOpacity="0.5" fontFamily="Heebo">כנרת</text>
            {/* Dead Sea / ים המלח */}
            <ellipse cx="125" cy="220" rx="5" ry="30" fill="hsl(195,70%,35%)" fillOpacity="0.2" stroke="hsl(195,70%,45%)" strokeWidth="0.5" strokeOpacity="0.25" />
            <text x="125" y="222" textAnchor="middle" fontSize="4.5" fill="hsl(195,70%,50%)" fillOpacity="0.45" fontFamily="Heebo">ים המלח</text>
            {/* Jordan River hint */}
            <path d="M128 68 Q130 100 128 140 Q126 170 125 190" stroke="hsl(210,80%,50%)" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
            {/* Negev desert texture */}
            <text x="85" y="400" textAnchor="middle" fontSize="6" fill="white" fillOpacity="0.06" fontFamily="Heebo" letterSpacing="4">מדבר הנגב</text>
            {/* City dots */}
            {[
              { x: 75, y: 160, name: "ת\"א" },
              { x: 100, y: 195, name: "י-ם" },
              { x: 82, y: 60, name: "חיפה" },
              { x: 80, y: 310, name: "ב\"ש" },
              { x: 78, y: 250, name: "אשדוד" },
              { x: 82, y: 120, name: "נתניה" },
            ].map(city => (
              <g key={city.name}>
                <circle cx={city.x} cy={city.y} r="2" fill="white" fillOpacity="0.15" />
                <circle cx={city.x} cy={city.y} r="0.8" fill="white" fillOpacity="0.4" />
                <text x={city.x + 5} y={city.y + 2} fontSize="4.5" fill="white" fillOpacity="0.2" fontFamily="Heebo">{city.name}</text>
              </g>
            ))}
          </svg>

          {/* Mediterranean sea */}
          <div className="absolute left-0 top-0 bottom-0 w-[22%] bg-gradient-to-r from-[hsl(210,80%,25%)]/25 to-transparent">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] text-[hsl(210,80%,60%)]/40 font-medium -rotate-90 whitespace-nowrap tracking-[0.3em]">הים התיכון</span>
            </div>
          </div>

          {/* Eilat indicator */}
          <div className="absolute bottom-[3%] left-[42%] flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(38,92%,50%)]/50 animate-pulse" />
            <span className="text-[9px] text-white/25 font-medium">אילת 🏖️</span>
          </div>
          {/* Golan */}
          <div className="absolute top-[2%] right-[15%] flex items-center gap-1">
            <span className="text-[9px] text-white/20 font-medium">🏔️ רמת הגולן</span>
          </div>
          {/* Flag — larger */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="text-2xl">🇮🇱</span>
            <div className="flex flex-col">
              <span className="text-xs text-white/50 font-bold leading-tight">מדינת ישראל</span>
              <span className="text-[9px] text-white/25">State of Israel</span>
            </div>
          </div>

          {/* Region bubbles */}
          {Object.entries(REGION_POSITIONS).map(([region, pos]) => {
            const stats = regionStats[region];
            if (!stats) return null;
            const color = priceToColor(stats.avgPrice, priceRange.min, priceRange.max);
            const isActive = activeRegion === region;
            const containsSelected = stats.areas.some(a => a.name === selectedArea);

            return (
              <div
                key={region}
                className="absolute cursor-pointer transition-all duration-500 group"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.w}%`,
                  height: `${pos.h}%`,
                }}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                {/* Heat blob */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl transition-all duration-500",
                    isActive ? "scale-110 z-10" : "scale-100"
                  )}
                  style={{
                    background: `radial-gradient(circle at center, ${color}55 0%, ${color}20 50%, transparent 75%)`,
                    boxShadow: isActive ? `0 0 40px ${color}40, inset 0 0 20px ${color}15` : `0 0 15px ${color}15`,
                  }}
                />

                {/* Region label */}
                <div className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 z-20",
                  isActive ? "scale-110" : ""
                )}>
                  <span className={cn(
                    "text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm transition-all",
                    containsSelected ? "bg-[hsl(160,84%,39%)]/30 text-[hsl(160,84%,65%)]" :
                    isActive ? "bg-white/15 text-white" : "bg-white/5 text-white/60"
                  )}>
                    {region}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold mt-1 tabular-nums" style={{ color }}>
                    ₪{stats.avgPrice.toLocaleString()}
                  </span>
                  <span className={cn(
                    "text-[8px] md:text-[9px] mt-0.5",
                    stats.avgTrend > 5 ? "text-[hsl(0,84%,60%)]" : "text-[hsl(160,84%,50%)]"
                  )}>
                    +{stats.avgTrend}%
                  </span>
                </div>

                {/* Pulse ring for high demand */}
                {stats.areas.some(a => a.demandLevel === "high") && (
                  <div
                    className="absolute inset-[15%] rounded-full animate-ping opacity-20"
                    style={{ background: color, animationDuration: "3s" }}
                  />
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 z-30">
            <span className="text-[9px] text-white/30">מחיר/מ"ר:</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden flex">
              {Array.from({ length: 20 }, (_, i) => {
                const t = i / 19;
                const price = priceRange.min + t * (priceRange.max - priceRange.min);
                return (
                  <div key={i} className="flex-1 h-full" style={{ backgroundColor: priceToColor(price, priceRange.min, priceRange.max) }} />
                );
              })}
            </div>
            <div className="flex gap-3 text-[8px] text-white/30">
              <span>₪{(priceRange.min / 1000).toFixed(0)}K</span>
              <span>₪{(priceRange.max / 1000).toFixed(0)}K</span>
            </div>
          </div>

          {/* Title overlay */}
          <div className="absolute top-4 right-4 z-30">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <Flame className="w-3 h-3 text-[hsl(38,92%,50%)]" />
              <span className="text-[10px] font-bold text-white/60">מפת חום נדל"ן ישראל 2026</span>
            </div>
          </div>
        </div>

        {/* Region detail panel */}
        <div className="lg:col-span-2 space-y-3">
          {activeStats && activeRegion ? (
            <div className="animate-[fadeSlideUp_0.3s_ease-out]">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[hsl(160,84%,50%)]" />
                    <h3 className="font-bold text-lg">{activeRegion}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                    {activeStats.count} אזורים
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-[10px] text-white/40 mb-1">ממוצע למ"ר</p>
                    <p className="text-xl font-black" style={{ color: priceToColor(activeStats.avgPrice, priceRange.min, priceRange.max) }}>
                      ₪{activeStats.avgPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-[10px] text-white/40 mb-1">מגמה שנתית</p>
                    <p className={cn("text-xl font-black", activeStats.avgTrend > 5 ? "text-[hsl(0,84%,60%)]" : "text-[hsl(160,84%,50%)]")}>
                      +{activeStats.avgTrend}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Area list */}
              <div className="mt-3 space-y-1.5">
                {activeStats.areas
                  .sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm)
                  .map(area => {
                    const isSelected = area.name === selectedArea;
                    const color = priceToColor(area.avgPricePerSqm, priceRange.min, priceRange.max);
                    return (
                      <button
                        key={area.name}
                        onClick={() => onSelectArea(area.name)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-right group",
                          isSelected
                            ? "bg-[hsl(160,84%,39%)]/10 border-[hsl(160,84%,39%)]/30"
                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}50` }} />
                          <span className={cn("text-sm font-medium", isSelected ? "text-[hsl(160,84%,65%)]" : "text-white/70")}>
                            {area.name}
                          </span>
                          {area.demandLevel === "high" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(0,84%,50%)]/10 text-[hsl(0,84%,60%)]">🔥</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex items-center gap-1.5 text-white/25">
                            {area.nearBeach && <Waves className="w-3 h-3" />}
                            {area.nearTrain && <Train className="w-3 h-3" />}
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-bold tabular-nums" style={{ color }}>₪{area.avgPricePerSqm.toLocaleString()}</span>
                            <span className="text-[10px] text-white/30 mr-1">/מ"ר</span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold tabular-nums",
                            area.trend > 5 ? "text-[hsl(0,84%,60%)]" : "text-[hsl(160,84%,50%)]"
                          )}>
                            +{area.trend}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
              <MapPin className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">העבר את העכבר על אזור במפה</p>
              <p className="text-xs text-white/25 mt-1">או לחץ על אזור לצפייה בפירוט</p>
            </div>
          )}

          {/* Top 5 most expensive */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-xs font-bold text-white/40 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[hsl(38,92%,50%)]" />
              5 האזורים היקרים
            </p>
            <div className="space-y-2">
              {[...areas]
                .sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm)
                .slice(0, 5)
                .map((area, i) => {
                  const color = priceToColor(area.avgPricePerSqm, priceRange.min, priceRange.max);
                  return (
                    <button
                      key={area.name}
                      onClick={() => onSelectArea(area.name)}
                      className="w-full flex items-center gap-2 text-xs hover:bg-white/5 rounded-lg p-1.5 transition-colors text-right"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-white/60">{area.name}</span>
                      <span className="font-bold tabular-nums" style={{ color }}>₪{area.avgPricePerSqm.toLocaleString()}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
