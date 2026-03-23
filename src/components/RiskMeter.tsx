import { cn } from "@/lib/utils";

interface RiskMeterProps {
  score: number; // 0-100
}

// Utility: convert polar (math convention, y-up) to SVG cartesian (y-down)
const polarToSvg = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
};

// Build SVG arc path between two math-convention angles (counterclockwise = decreasing angle)
const arcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToSvg(cx, cy, r, startAngle);
  const end = polarToSvg(cx, cy, r, endAngle);
  const sweep = startAngle - endAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
};

const CX = 100;
const CY = 115;
const R = 75;
const STROKE = 14;
const SWEEP = 270; // total degrees
const START_ANGLE = 225; // score 0 → lower-left (math convention)
// score 100 → START_ANGLE - SWEEP = -45° → lower-right

// Zone boundaries (score thresholds)
const ZONE_RED_END = 40; // 0-40 = high risk (red)
const ZONE_YELLOW_END = 70; // 40-70 = medium (yellow)
// 70-100 = low risk (green)

const scoreToAngle = (score: number) => START_ANGLE - (score / 100) * SWEEP;

const RiskMeter = ({ score }: RiskMeterProps) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  const getColor = () => {
    if (clampedScore >= 70) return { text: "text-success", fill: "hsl(var(--success))", label: "סיכון נמוך" };
    if (clampedScore >= 40) return { text: "text-warning", fill: "hsl(var(--warning))", label: "סיכון בינוני" };
    return { text: "text-destructive", fill: "hsl(var(--destructive))", label: "סיכון גבוה" };
  };

  const { text, fill, label } = getColor();

  // Needle
  const needleAngle = scoreToAngle(clampedScore);
  const needleTip = polarToSvg(CX, CY, R - STROKE / 2 - 8, needleAngle);

  // Arc paths for each zone
  const bgArc = arcPath(CX, CY, R, START_ANGLE, scoreToAngle(100));
  const redArc = arcPath(CX, CY, R, scoreToAngle(0), scoreToAngle(ZONE_RED_END));
  const yellowArc = arcPath(CX, CY, R, scoreToAngle(ZONE_RED_END), scoreToAngle(ZONE_YELLOW_END));
  const greenArc = arcPath(CX, CY, R, scoreToAngle(ZONE_YELLOW_END), scoreToAngle(100));

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 145" className="w-64 h-40">
        {/* Background arc */}
        <path
          d={bgArc}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Red zone (0-40) */}
        <path
          d={redArc}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth={STROKE}
          strokeLinecap="round"
          opacity="0.35"
        />
        {/* Yellow zone (40-70) */}
        <path
          d={yellowArc}
          fill="none"
          stroke="hsl(var(--warning))"
          strokeWidth={STROKE}
          strokeLinecap="round"
          opacity="0.35"
        />
        {/* Green zone (70-100) */}
        <path
          d={greenArc}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth={STROKE}
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Needle */}
        <line
          x1={CX}
          y1={CY}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={fill}
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        {/* Needle center dot */}
        <circle cx={CX} cy={CY} r="5" fill={fill} />

        {/* Score text */}
        <text
          x={CX}
          y={CY - 12}
          textAnchor="middle"
          fill="currentColor"
          style={{ fontSize: "24px", fontWeight: 700 }}
          className="text-foreground"
        >
          {clampedScore}
        </text>
      </svg>
      <div className="text-center -mt-2">
        <span className={cn("text-lg font-bold", text)}>{label}</span>
        <p className="text-xs text-muted-foreground mt-1">ציון {clampedScore} מתוך 100</p>
      </div>
    </div>
  );
};

export default RiskMeter;
