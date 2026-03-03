interface FloralProps {
  className?: string;
  style?: React.CSSProperties;
}

/* ============================================================
   FloralCornerFrame — L-shaped corner arrangement
   Rose bloom, leaves, eucalyptus segments, berry dots
   ============================================================ */
export function FloralCornerFrame({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {/* Main rose bloom */}
      <path d="M60,60 C65,50 75,45 80,50 C85,42 95,40 98,48 C102,38 115,38 115,48 C120,40 130,42 132,50 C138,45 145,50 140,60" />
      <path d="M55,65 C50,55 58,42 70,42 C65,35 78,28 88,35 C88,25 105,22 112,32 C118,22 132,25 132,35 C142,28 155,35 150,42 C162,42 170,55 165,65" />
      <path d="M52,72 C45,60 55,45 68,40 C62,30 80,18 95,28 C98,15 118,12 125,25 C135,12 155,18 152,30 C165,22 178,38 168,50 C180,55 175,72 165,75" />
      {/* Rose center spiral */}
      <path d="M100,58 C105,52 115,52 115,58 C115,62 108,65 103,62 C98,59 100,54 106,53" />

      {/* Stem going down-right (L shape) */}
      <path d="M108,75 C112,95 105,120 115,145 C125,170 130,195 140,220 C150,240 170,255 195,265 C220,275 245,278 280,280" />

      {/* Leaves along vertical stem */}
      <path d="M105,100 C90,90 78,95 75,105 C72,115 82,120 95,112" />
      <path d="M106,102 C90,102 80,100 75,105" />
      <path d="M118,130 C132,118 145,120 148,132 C151,144 138,150 125,140" />
      <path d="M120,132 C135,130 144,126 148,132" />

      {/* Leaves along horizontal stem */}
      <path d="M170,258 C162,242 168,228 180,225 C192,222 198,235 188,248" />
      <path d="M172,256 C170,240 166,230 180,225" />
      <path d="M220,272 C225,255 240,248 252,252 C264,256 262,270 248,275" />
      <path d="M222,270 C228,258 238,252 252,252" />

      {/* Small eucalyptus segment near corner bend */}
      <path d="M135,180 C128,172 118,175 116,182 C114,189 122,194 130,188" />
      <path d="M142,195 C148,186 158,188 160,196 C162,204 154,208 145,202" />

      {/* Bud near the rose */}
      <path d="M68,78 C62,72 55,74 55,80 C55,86 62,88 65,82" />
      <path d="M65,82 C63,90 60,98 58,105" />

      {/* Berry dots scattered */}
      <circle cx="92" cy="85" r="2" fill="currentColor" stroke="none" />
      <circle cx="148" cy="210" r="2" fill="currentColor" stroke="none" />
      <circle cx="200" cy="268" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="260" cy="278" r="2" fill="currentColor" stroke="none" />
      <circle cx="155" cy="165" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ============================================================
   EucalyptusSpray — Tall vertical branch, alternating round leaves
   ============================================================ */
export function EucalyptusSpray({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 150 600" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {/* Main stem — gentle S-curve */}
      <path d="M75,580 C72,540 80,500 76,460 C72,420 78,380 75,340 C72,300 80,260 76,220 C72,180 78,140 75,100 C73,70 76,40 78,20" />

      {/* Leaf pairs — alternating sides, diminishing size */}
      {/* Pair 1 (bottom, largest) */}
      <ellipse cx="45" cy="540" rx="22" ry="14" transform="rotate(-25 45 540)" />
      <ellipse cx="105" cy="520" rx="22" ry="14" transform="rotate(25 105 520)" />
      {/* Pair 2 */}
      <ellipse cx="42" cy="470" rx="20" ry="13" transform="rotate(-20 42 470)" />
      <ellipse cx="108" cy="450" rx="20" ry="13" transform="rotate(20 108 450)" />
      {/* Pair 3 */}
      <ellipse cx="44" cy="400" rx="19" ry="12" transform="rotate(-22 44 400)" />
      <ellipse cx="106" cy="380" rx="19" ry="12" transform="rotate(22 106 380)" />
      {/* Pair 4 */}
      <ellipse cx="46" cy="330" rx="17" ry="11" transform="rotate(-18 46 330)" />
      <ellipse cx="104" cy="310" rx="17" ry="11" transform="rotate(18 104 310)" />
      {/* Pair 5 */}
      <ellipse cx="48" cy="260" rx="15" ry="10" transform="rotate(-20 48 260)" />
      <ellipse cx="102" cy="240" rx="15" ry="10" transform="rotate(20 102 240)" />
      {/* Pair 6 */}
      <ellipse cx="50" cy="195" rx="13" ry="9" transform="rotate(-15 50 195)" />
      <ellipse cx="100" cy="175" rx="13" ry="9" transform="rotate(15 100 175)" />
      {/* Pair 7 (smaller) */}
      <ellipse cx="52" cy="135" rx="11" ry="8" transform="rotate(-18 52 135)" />
      <ellipse cx="98" cy="118" rx="11" ry="8" transform="rotate(18 98 118)" />
      {/* Pair 8 (tip, smallest) */}
      <ellipse cx="55" cy="80" rx="9" ry="6" transform="rotate(-12 55 80)" />
      <ellipse cx="95" cy="65" rx="9" ry="6" transform="rotate(12 95 65)" />
      {/* Tip leaves */}
      <ellipse cx="72" cy="38" rx="7" ry="5" transform="rotate(-8 72 38)" />
      <ellipse cx="82" cy="25" rx="5" ry="4" transform="rotate(8 82 25)" />

      {/* Petioles — short lines connecting leaves to stem */}
      <line x1="62" y1="538" x2="74" y2="545" />
      <line x1="88" y1="522" x2="76" y2="530" />
      <line x1="58" y1="468" x2="74" y2="472" />
      <line x1="92" y1="450" x2="76" y2="455" />
      <line x1="59" y1="398" x2="74" y2="402" />
      <line x1="91" y1="380" x2="76" y2="385" />
      <line x1="60" y1="328" x2="74" y2="335" />
      <line x1="90" y1="310" x2="76" y2="316" />
      <line x1="60" y1="258" x2="75" y2="262" />
      <line x1="90" y1="240" x2="76" y2="245" />
      <line x1="60" y1="194" x2="75" y2="198" />
      <line x1="90" y1="175" x2="76" y2="180" />
      <line x1="62" y1="134" x2="75" y2="138" />
      <line x1="88" y1="118" x2="76" y2="122" />
    </svg>
  );
}

/* ============================================================
   DelicateVine — Wide horizontal vine with heart-leaves and tiny flowers
   ============================================================ */
export function DelicateVine({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 800 100" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true" preserveAspectRatio="none">
      {/* Main vine — sine wave */}
      <path d="M0,50 C50,30 100,70 150,45 C200,20 250,65 300,50 C350,35 400,68 450,45 C500,22 550,62 600,48 C650,34 700,65 750,42 C775,32 790,40 800,50" />

      {/* Heart-shaped leaves alternating sides */}
      <path d="M80,38 C78,30 85,24 88,30 C91,24 98,30 96,38 C94,44 88,48 88,48 C88,48 82,44 80,38Z" />
      <path d="M180,60 C178,68 185,74 188,68 C191,74 198,68 196,60 C194,54 188,50 188,50 C188,50 182,54 180,60Z" />
      <path d="M280,42 C278,34 285,28 288,34 C291,28 298,34 296,42 C294,48 288,52 288,52 C288,52 282,48 280,42Z" />
      <path d="M400,58 C398,66 405,72 408,66 C411,72 418,66 416,58 C414,52 408,48 408,48 C408,48 402,52 400,58Z" />
      <path d="M520,36 C518,28 525,22 528,28 C531,22 538,28 536,36 C534,42 528,46 528,46 C528,46 522,42 520,36Z" />
      <path d="M640,56 C638,64 645,70 648,64 C651,70 658,64 656,56 C654,50 648,46 648,46 C648,46 642,50 640,56Z" />
      <path d="M740,38 C738,30 745,24 748,30 C751,24 758,30 756,38 C754,44 748,48 748,48 C748,48 742,44 740,38Z" />

      {/* Tiny 5-petal flowers */}
      <circle cx="130" cy="55" r="3" />
      <circle cx="130" cy="55" r="1" fill="currentColor" stroke="none" />
      <circle cx="350" cy="40" r="3" />
      <circle cx="350" cy="40" r="1" fill="currentColor" stroke="none" />
      <circle cx="570" cy="52" r="3" />
      <circle cx="570" cy="52" r="1" fill="currentColor" stroke="none" />
      <circle cx="700" cy="55" r="3" />
      <circle cx="700" cy="55" r="1" fill="currentColor" stroke="none" />

      {/* Curling tendrils */}
      <path d="M110,48 C105,40 95,38 92,42" />
      <path d="M230,55 C235,62 245,64 248,60" />
      <path d="M470,40 C465,32 455,30 452,34" />
      <path d="M590,48 C595,55 605,58 608,54" />
    </svg>
  );
}

/* ============================================================
   PeonyCluster — 2-3 peony blooms with layered petals + leaves
   ============================================================ */
export function PeonyCluster({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 250 250" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {/* Main peony — full open bloom */}
      <path d="M125,100 C130,88 145,82 150,90 C155,80 170,82 168,92 C175,85 185,90 180,100" />
      <path d="M118,105 C110,92 120,78 135,75 C128,65 145,55 158,65 C160,52 178,55 178,68 C188,58 198,68 192,80 C200,78 205,90 195,98" />
      <path d="M112,112 C102,98 112,78 128,72 C120,58 140,42 158,55 C162,38 185,40 186,58 C198,45 212,58 204,75 C215,72 220,88 208,100 C218,102 215,115 205,115" />
      {/* Center */}
      <circle cx="155" cy="92" r="5" />
      <circle cx="155" cy="92" r="2" fill="currentColor" stroke="none" />

      {/* Second peony — half open bud (left) */}
      <path d="M55,140 C60,130 72,128 75,135 C78,126 88,128 86,138" />
      <path d="M50,148 C42,135 52,122 65,120 C62,112 75,105 85,112 C88,102 100,108 95,120 C102,115 108,125 100,135" />
      <circle cx="72" cy="132" r="3" />

      {/* Third peony — small bud (right) */}
      <path d="M195,155 C200,148 208,147 210,152 C213,146 220,148 218,155" />
      <path d="M192,160 C188,152 194,145 202,143 C200,138 208,134 215,140 C218,134 225,138 222,146 C228,144 230,152 225,158" />

      {/* Stems */}
      <path d="M155,115 C150,140 145,165 140,200 C138,215 135,230 132,245" />
      <path d="M70,150 C75,170 85,185 100,200 C115,215 125,225 132,245" />
      <path d="M210,162 C200,180 185,195 170,210 C155,225 140,238 132,245" />

      {/* Compound leaves */}
      <path d="M142,170 C130,158 115,160 112,170 C109,180 120,188 135,178" />
      <path d="M140,172 C128,168 118,164 112,170" />
      <path d="M160,190 C172,178 188,180 190,190 C192,200 180,205 168,196" />
      <path d="M162,192 C174,188 185,184 190,190" />
      <path d="M125,210 C112,200 98,205 96,215 C94,225 105,228 118,220" />
      <path d="M123,212 C112,208 102,208 96,215" />
    </svg>
  );
}

/* ============================================================
   SingleLeafSprig — Minimal 3-4 leaf sprig
   ============================================================ */
export function SingleLeafSprig({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 80 120" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {/* Curved stem */}
      <path d="M40,115 C38,95 42,75 38,55 C35,40 38,25 42,10" />

      {/* Leaf 1 — bottom left */}
      <path d="M38,90 C28,82 20,85 18,92 C16,99 24,104 34,96" />
      <path d="M36,92 C26,90 22,88 18,92" />

      {/* Leaf 2 — right */}
      <path d="M40,70 C50,60 60,62 62,70 C64,78 55,82 45,75" />
      <path d="M42,72 C52,68 58,66 62,70" />

      {/* Leaf 3 — left */}
      <path d="M37,48 C27,40 18,44 16,52 C14,60 24,62 33,55" />
      <path d="M35,50 C26,48 20,47 16,52" />

      {/* Leaf 4 — tip, small */}
      <path d="M41,22 C48,15 55,18 55,24 C55,30 48,32 43,26" />
      <path d="M42,24 C48,20 52,20 55,24" />
    </svg>
  );
}

/* ============================================================
   SectionDivider — Organic wave SVG for section transitions
   ============================================================ */
export function SectionDivider({ className, fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={`block w-full h-[40px] sm:h-[60px] ${className || ""}`} aria-hidden="true">
      <path d="M0,40 C180,15 360,55 540,32 C720,9 900,48 1080,28 C1200,14 1320,42 1440,25 L1440,60 L0,60 Z" fill={fill} />
    </svg>
  );
}
