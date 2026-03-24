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
          {/* Israel silhouette SVG — accurate geographic outline */}
          <svg viewBox="0 0 200 500" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="borderGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
              </filter>
            </defs>
            {/* Country outline — accurate Israel shape */}
            <path
              d="M23 24 L51 51 L72 76 L92 80 L87 88 L82 118 L80 142 L75 158 L74 168 L72 184 L67 202 L54 218 L46 232 L22 272 L15 286 L20 310 L23 346 L31 382 L46 430 L87 478 L92 480 L97 478 L108 442 L113 394 L118 358 L128 322 L133 298 L139 274 L146 250 L149 238 L149 214 L154 202 L154 178 L159 154 L161 130 L162 118 L169 100 L164 88 L175 70 L180 52 L185 28 L169 24 L149 48 L128 52 L113 48 L97 46 L72 44 L46 36 L23 24 Z"
              fill="hsl(160,84%,39%)"
              fillOpacity="0.1"
              stroke="hsl(160,84%,50%)"
              strokeWidth="2"
              strokeOpacity="0.45"
              strokeLinejoin="round"
            />
            {/* Outer glow */}
            <path
              d="M23 24 L51 51 L72 76 L92 80 L87 88 L82 118 L80 142 L75 158 L74 168 L72 184 L67 202 L54 218 L46 232 L22 272 L15 286 L20 310 L23 346 L31 382 L46 430 L87 478 L92 480 L97 478 L108 442 L113 394 L118 358 L128 322 L133 298 L139 274 L146 250 L149 238 L149 214 L154 202 L154 178 L159 154 L161 130 L162 118 L169 100 L164 88 L175 70 L180 52 L185 28 L169 24 L149 48 L128 52 L113 48 L97 46 L72 44 L46 36 L23 24 Z"
              fill="none"
              stroke="hsl(160,84%,50%)"
              strokeWidth="6"
              strokeOpacity="0.08"
              filter="url(#borderGlow)"
            />

            {/* Lebanon border (north) */}
            <path d="M10 20 L23 24" stroke="white" strokeWidth="0.6" strokeOpacity="0.15" strokeDasharray="3,2" fill="none" />
            <text x="8" y="16" fontSize="5" fill="white" fillOpacity="0.15" fontFamily="Heebo">לבנון 🇱🇧</text>

            {/* Syria border (northeast) */}
            <path d="M185 28 L195 15" stroke="white" strokeWidth="0.6" strokeOpacity="0.15" strokeDasharray="3,2" fill="none" />
            <text x="186" y="12" fontSize="5" fill="white" fillOpacity="0.15" fontFamily="Heebo">סוריה 🇸🇾</text>

            {/* Jordan border (east) */}
            <text x="178" y="250" fontSize="5.5" fill="white" fillOpacity="0.13" fontFamily="Heebo" transform="rotate(80,178,250)">🇯🇴 ירדן</text>

            {/* Egypt border (southwest) */}
            <path d="M22 272 L8 290 L5 350 L15 420 L46 430" stroke="white" strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="3,2" fill="none" />
            <text x="5" y="380" fontSize="5.5" fill="white" fillOpacity="0.13" fontFamily="Heebo" transform="rotate(-80,5,380)">🇪🇬 מצרים</text>

            {/* Sea of Galilee / כנרת */}
            <ellipse cx="157" cy="80" rx="6" ry="10" fill="hsl(210,80%,40%)" fillOpacity="0.3" stroke="hsl(210,80%,55%)" strokeWidth="0.6" strokeOpacity="0.4" />
            <text x="157" y="83" textAnchor="middle" fontSize="4.5" fill="hsl(210,80%,65%)" fillOpacity="0.6" fontFamily="Heebo">כנרת</text>

            {/* Dead Sea / ים המלח */}
            <ellipse cx="147" cy="236" rx="4" ry="22" fill="hsl(195,70%,35%)" fillOpacity="0.25" stroke="hsl(195,70%,50%)" strokeWidth="0.5" strokeOpacity="0.3" />
            <text x="147" y="238" textAnchor="middle" fontSize="4" fill="hsl(195,70%,55%)" fillOpacity="0.5" fontFamily="Heebo">ים המלח</text>

            {/* Jordan River */}
            <path d="M157 92 Q155 120 152 160 Q150 190 148 215" stroke="hsl(210,80%,55%)" strokeWidth="0.6" strokeOpacity="0.18" fill="none" />

            {/* Negev desert */}
            <text x="60" y="380" textAnchor="middle" fontSize="7" fill="white" fillOpacity="0.06" fontFamily="Heebo" letterSpacing="5">מדבר הנגב</text>

            {/* City dots — accurate positions */}
            {[
              { x: 75, y: 170, name: "ת\"א", size: 3 },
              { x: 121, y: 206, name: "ירושלים", size: 3 },
              { x: 96, y: 81, name: "חיפה", size: 2.5 },
              { x: 76, y: 268, name: "ב\"ש", size: 2 },
              { x: 61, y: 202, name: "אשדוד", size: 1.8 },
              { x: 83, y: 138, name: "נתניה", size: 1.8 },
              { x: 92, y: 471, name: "אילת", size: 1.5 },
            ].map(city => (
              <g key={city.name}>
                <circle cx={city.x} cy={city.y} r={city.size} fill="white" fillOpacity="0.1" />
                <circle cx={city.x} cy={city.y} r={city.size * 0.4} fill="white" fillOpacity="0.5" />
                <text x={city.x - 2} y={city.y + city.size + 6} textAnchor="middle" fontSize="4.5" fill="white" fillOpacity="0.25" fontFamily="Heebo">{city.name}</text>
              </g>
            ))}
          </svg>

          {/* Mediterranean sea */}
          <div className="absolute left-0 top-0 bottom-0 w-[18%] bg-gradient-to-r from-[hsl(210,80%,22%)]/30 to-transparent">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] text-[hsl(210,80%,60%)]/30 font-medium -rotate-90 whitespace-nowrap tracking-[0.3em]">הים התיכון</span>
            </div>
          </div>

          {/* Golan Heights */}
          <div className="absolute top-[5%] right-[5%] flex items-center gap-1">
            <span className="text-[9px] text-white/20 font-medium">🏔️ רמת הגולן</span>
          </div>

          {/* Flag — prominent */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-lg">
            <span className="text-3xl">🇮🇱</span>
            <div className="flex flex-col">
              <span className="text-sm text-white/50 font-bold leading-tight">מדינת ישראל</span>
              <span className="text-[10px] text-white/25">State of Israel</span>
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
