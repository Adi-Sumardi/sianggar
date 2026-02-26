// ---------------------------------------------------------------------------
// Animated navbar background — Accounting vector icons
//
// Subtle, floating accounting-themed SVG icons drifting across the navbar.
// Icons include: calculator, bar chart, pie chart, coins, document, wallet,
// receipt, percent sign — all rendered at very low opacity on white.
// ---------------------------------------------------------------------------

const FILL = 'rgba(37,99,235,0.07)';
const STROKE = 'rgba(37,99,235,0.10)';

// ---------------------------------------------------------------------------
// Accounting icon SVG paths (24x24 viewBox each)
// ---------------------------------------------------------------------------

const icons = {
    // Calculator
    calculator: (
        <>
            <rect x={4} y={2} width={16} height={20} rx={2} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <rect x={7} y={5} width={10} height={4} rx={1} fill={FILL} />
            <circle cx={9} cy={13} r={1} fill={FILL} />
            <circle cx={12} cy={13} r={1} fill={FILL} />
            <circle cx={15} cy={13} r={1} fill={FILL} />
            <circle cx={9} cy={16.5} r={1} fill={FILL} />
            <circle cx={12} cy={16.5} r={1} fill={FILL} />
            <circle cx={15} cy={16.5} r={1} fill={FILL} />
            <circle cx={9} cy={20} r={1} fill={FILL} />
            <rect x={11.5} y={19} width={4} height={2} rx={0.5} fill={FILL} />
        </>
    ),

    // Bar chart
    barChart: (
        <>
            <line x1={3} y1={22} x2={21} y2={22} stroke={STROKE} strokeWidth={1.2} />
            <rect x={5} y={12} width={3} height={10} rx={0.5} fill={FILL} />
            <rect x={10.5} y={6} width={3} height={16} rx={0.5} fill={FILL} />
            <rect x={16} y={9} width={3} height={13} rx={0.5} fill={FILL} />
        </>
    ),

    // Pie chart
    pieChart: (
        <>
            <circle cx={12} cy={12} r={9} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <path d="M12,3 A9,9 0 0,1 21,12 L12,12 Z" fill={FILL} />
            <path d="M12,12 L12,3 A9,9 0 0,0 5.5,18 Z" fill="none" stroke={STROKE} strokeWidth={0.8} />
        </>
    ),

    // Coins / money stack
    coins: (
        <>
            <ellipse cx={10} cy={16} rx={7} ry={4} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <ellipse cx={10} cy={14} rx={7} ry={4} fill="none" stroke={STROKE} strokeWidth={0.8} />
            <ellipse cx={14} cy={10} rx={7} ry={4} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <ellipse cx={14} cy={8} rx={7} ry={4} fill={FILL} />
            <text x={14} y={10.5} textAnchor="middle" fontSize={5} fill={STROKE} fontWeight="bold">$</text>
        </>
    ),

    // Document / ledger
    document: (
        <>
            <path d="M6,2 L14,2 L20,8 L20,22 L6,22 Z" fill="none" stroke={STROKE} strokeWidth={1.2} />
            <path d="M14,2 L14,8 L20,8" fill="none" stroke={STROKE} strokeWidth={1} />
            <line x1={9} y1={12} x2={17} y2={12} stroke={FILL} strokeWidth={1.2} />
            <line x1={9} y1={15} x2={17} y2={15} stroke={FILL} strokeWidth={1.2} />
            <line x1={9} y1={18} x2={14} y2={18} stroke={FILL} strokeWidth={1.2} />
        </>
    ),

    // Wallet
    wallet: (
        <>
            <rect x={2} y={6} width={20} height={14} rx={2} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <path d="M2,6 L16,6 L16,4 C16,3 15,2 14,2 L6,2 C4,2 2,4 2,6 Z" fill="none" stroke={STROKE} strokeWidth={1} />
            <rect x={16} y={11} width={6} height={4} rx={1} fill="none" stroke={STROKE} strokeWidth={1} />
            <circle cx={19} cy={13} r={1} fill={FILL} />
        </>
    ),

    // Receipt
    receipt: (
        <>
            <path d="M5,2 L5,22 L8,20 L11,22 L14,20 L17,22 L19,20 L19,2 Z" fill="none" stroke={STROKE} strokeWidth={1.2} />
            <line x1={8} y1={7} x2={16} y2={7} stroke={FILL} strokeWidth={1.2} />
            <line x1={8} y1={10} x2={16} y2={10} stroke={FILL} strokeWidth={1.2} />
            <line x1={8} y1={13} x2={12} y2={13} stroke={FILL} strokeWidth={1.2} />
            <line x1={14} y1={13} x2={16} y2={13} stroke={FILL} strokeWidth={1.5} />
        </>
    ),

    // Percent sign
    percent: (
        <>
            <circle cx={8} cy={8} r={3} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <circle cx={16} cy={16} r={3} fill="none" stroke={STROKE} strokeWidth={1.2} />
            <line x1={19} y1={5} x2={5} y2={19} stroke={STROKE} strokeWidth={1.2} />
        </>
    ),

    // Trend line / growth
    trendUp: (
        <>
            <polyline points="3,20 8,14 13,16 21,4" fill="none" stroke={STROKE} strokeWidth={1.2} strokeLinejoin="round" />
            <polyline points="16,4 21,4 21,9" fill="none" stroke={STROKE} strokeWidth={1.2} />
            <line x1={3} y1={22} x2={21} y2={22} stroke={STROKE} strokeWidth={0.8} />
        </>
    ),

    // Shield / audit
    shield: (
        <>
            <path d="M12,2 L20,6 L20,12 C20,17 16,21 12,22 C8,21 4,17 4,12 L4,6 Z" fill="none" stroke={STROKE} strokeWidth={1.2} />
            <polyline points="9,12 11,14 15,10" fill="none" stroke={FILL} strokeWidth={1.5} />
        </>
    ),
};

type IconKey = keyof typeof icons;

// ---------------------------------------------------------------------------
// Icon layout — scattered positions for a natural, non-grid feel
// Positions are [x, y, iconIndex, scale, rotation]
// Distributed across a 1600-wide strip (doubled for seamless scroll)
// ---------------------------------------------------------------------------

const ICON_PLACEMENTS: ReadonlyArray<{
    x: number;
    y: number;
    icon: IconKey;
    scale: number;
    rotate: number;
}> = [
    { x: 30,   y: 8,   icon: 'calculator', scale: 0.7,  rotate: -8 },
    { x: 120,  y: 22,  icon: 'barChart',   scale: 0.6,  rotate: 5 },
    { x: 210,  y: 4,   icon: 'coins',      scale: 0.65, rotate: -3 },
    { x: 300,  y: 18,  icon: 'document',   scale: 0.7,  rotate: 6 },
    { x: 400,  y: 6,   icon: 'pieChart',   scale: 0.6,  rotate: -10 },
    { x: 490,  y: 24,  icon: 'receipt',    scale: 0.65, rotate: 4 },
    { x: 580,  y: 10,  icon: 'wallet',     scale: 0.7,  rotate: -5 },
    { x: 670,  y: 20,  icon: 'percent',    scale: 0.55, rotate: 8 },
    { x: 760,  y: 4,   icon: 'trendUp',    scale: 0.65, rotate: -4 },
    { x: 850,  y: 16,  icon: 'shield',     scale: 0.6,  rotate: 7 },
    { x: 940,  y: 8,   icon: 'calculator', scale: 0.6,  rotate: 10 },
    { x: 1030, y: 22,  icon: 'barChart',   scale: 0.65, rotate: -6 },
    { x: 1120, y: 6,   icon: 'coins',      scale: 0.7,  rotate: 3 },
    { x: 1210, y: 18,  icon: 'pieChart',   scale: 0.6,  rotate: -8 },
    { x: 1300, y: 4,   icon: 'document',   scale: 0.65, rotate: 5 },
    { x: 1400, y: 14,  icon: 'wallet',     scale: 0.6,  rotate: -7 },
    { x: 1500, y: 24,  icon: 'trendUp',    scale: 0.7,  rotate: 4 },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NavbarScene() {
    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden print:hidden"
            aria-hidden="true"
        >
            {/* Floating accounting icons — slow drift (100s per loop) */}
            <div className="navbar-batik-kawung absolute inset-0 w-[200%]">
                <svg
                    viewBox="0 0 3200 48"
                    className="h-full w-full"
                    preserveAspectRatio="xMidYMid slice"
                >
                    {/* Two copies for seamless loop */}
                    {[0, 1600].map((offsetX) => (
                        <g key={offsetX} transform={`translate(${offsetX},0)`}>
                            {ICON_PLACEMENTS.map((p, i) => (
                                <g
                                    key={i}
                                    transform={`translate(${p.x},${p.y}) scale(${p.scale}) rotate(${p.rotate},12,12)`}
                                >
                                    {icons[p.icon]}
                                </g>
                            ))}
                        </g>
                    ))}
                </svg>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary-300/40 to-transparent" />
        </div>
    );
}
