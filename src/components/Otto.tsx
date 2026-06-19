type OttoMood = "star" | "bookmark" | "blanket" | "lamp";

export function Otto({ mood = "star" }: { mood?: OttoMood }) {
  return (
    <svg className="otto-illustration" viewBox="0 0 180 180" role="img" aria-label="Otto mascot">
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#8B6A4E" floodOpacity="0.16" />
        </filter>
      </defs>

      <ellipse cx="91" cy="156" rx="51" ry="9" fill="#E9DDCC" opacity="0.62" />
      <g filter="url(#softShadow)">
        <path
          d="M43 88c0-34 21-62 49-62s49 28 49 62c0 38-19 62-49 62S43 126 43 88Z"
          fill="#C79E73"
        />
        <path
          d="M55 91c0-27 15-48 37-48s37 21 37 48c0 29-14 47-37 47S55 120 55 91Z"
          fill="#E6CBA6"
        />
        <circle cx="51" cy="51" r="22" fill="#B68159" />
        <circle cx="130" cy="51" r="22" fill="#B68159" />
        <circle cx="53" cy="53" r="13" fill="#DAB58B" />
        <circle cx="128" cy="53" r="13" fill="#DAB58B" />
        <path
          d="M37 84c-12 13-13 34 1 50 7 9 20 2 16-9-6-17-6-29 1-41 5-9-10-8-18 0Z"
          fill="#B68159"
        />
        <path
          d="M143 84c13 13 14 34 0 50-8 9-21 2-17-9 6-17 6-29-1-41-5-9 10-8 18 0Z"
          fill="#B68159"
        />
      </g>

      <path d="M66 78c6-5 13-5 19 0" stroke="#7A543A" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <path d="M99 78c6-5 13-5 19 0" stroke="#7A543A" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <circle cx="75" cy="92" r="5" fill="#493426" />
      <circle cx="108" cy="92" r="5" fill="#493426" />
      <path d="M88 103c3-5 7-5 10 0 2 4 0 8-5 8s-7-4-5-8Z" fill="#6A4630" />
      <path d="M78 119c11 8 23 8 34 0" stroke="#6A4630" strokeWidth="4" strokeLinecap="round" />
      <circle cx="73" cy="104" r="6" fill="#DDB9AF" opacity="0.45" />
      <circle cx="113" cy="104" r="6" fill="#DDB9AF" opacity="0.45" />

      {mood === "star" && (
        <g className="otto-prop-svg">
          <path
            d="M128 111l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2 7-14Z"
            fill="#F3D47A"
            stroke="#7B5A3E"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M128 120v19M119 130h19" stroke="#FFF6C9" strokeWidth="3" strokeLinecap="round" opacity="0.72" />
        </g>
      )}

      {mood === "bookmark" && (
        <g className="otto-prop-svg">
          <path d="M121 110h28v45l-14-9-14 9v-45Z" fill="#A8B7A1" stroke="#6B7A63" strokeWidth="4" />
          <path d="M128 121h14M128 132h10" stroke="#F8F3EA" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {mood === "blanket" && (
        <g className="otto-prop-svg">
          <path
            d="M105 121c10-9 33-9 44 0v27c-11-7-34-7-44 0v-27Z"
            fill="#DDB9AF"
            stroke="#9D746B"
            strokeWidth="4"
          />
          <path d="M116 124v20M130 121v21M143 124v20" stroke="#F8F3EA" strokeWidth="3" opacity="0.58" />
        </g>
      )}

      {mood === "lamp" && (
        <g className="otto-prop-svg">
          <path d="M125 134h24" stroke="#7B5A3E" strokeWidth="5" strokeLinecap="round" />
          <path d="M137 111v23" stroke="#7B5A3E" strokeWidth="5" strokeLinecap="round" />
          <path d="M121 108c4-14 28-14 32 0l-8 13h-16l-8-13Z" fill="#F3D47A" stroke="#7B5A3E" strokeWidth="4" />
          <path d="M112 110c-8 4-15 12-18 22" stroke="#F3D47A" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        </g>
      )}
    </svg>
  );
}
