import { cn } from "@/lib/utils";

interface RiskMeterProps {
  score: number; // 0-100
}

const RiskMeter = ({ score }: RiskMeterProps) => {
  const getColor = () => {
    if (score >= 70) return { text: "text-success", fill: "hsl(var(--success))", label: "סיכון נמוך" };
    if (score >= 40) return { text: "text-warning", fill: "hsl(var(--warning))", label: "סיכון בינוני" };
    return { text: "text-destructive", fill: "hsl(var(--destructive))", label: "סיכון גבוה" };
  };

  const { text, fill, label } = getColor();
  // Arc from -135 to 135 degrees (270 degree sweep)
  const angle = -135 + (score / 100) * 270;
  const radians = (angle * Math.PI) / 180;
  const needleX = 100 + 70 * Math.cos(radians);
  const needleY = 110 + 70 * Math.sin(radians);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 140" className="w-64 h-36">
        {/* Background arc */}
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Red zone */}
        <path
          d="M 20 110 A 80 80 0 0 1 55 42"
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Yellow zone */}
        <path
          d="M 55 42 A 80 80 0 0 1 145 42"
          fill="none"
          stroke="hsl(var(--warning))"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Green zone */}
        <path
          d="M 145 42 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Needle */}
        <line
          x1="100"
          y1="110"
          x2={needleX}
          y2={needleY}
          stroke={fill}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="100" cy="110" r="6" fill={fill} />
        {/* Score text */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="currentColor"
          style={{ fontSize: "24px", fontWeight: 700 }}
        >
          {score}
        </text>
      </svg>
      <div className="text-center -mt-2">
        <span className={cn("text-lg font-bold", text)}>{label}</span>
        <p className="text-xs text-muted-foreground mt-1">ציון {score} מתוך 100</p>
      </div>
    </div>
  );
};

export default RiskMeter;
