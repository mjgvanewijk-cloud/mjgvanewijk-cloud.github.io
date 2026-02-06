// scripts/ui/components/icons.js
// ICON: TRASH / PENCIL / TRAY

/**
 * PENCIL_SVG met de centrale class ff-svg-icon.
 */
export const PENCIL_SVG = `
  <svg class="ff-svg-icon ff-edit-icon ff-month-cat-pencil" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 20h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
`;

/**
 * TRASH_SVG krijgt nu ook de ff-svg-icon class voor een consistente hoogte.
 */
export const TRASH_SVG = `
  <svg class="ff-svg-icon ff-month-cat-trash ff-trash-sf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M10.2 6.5 C10.2 5.4 10.9 5.1 12 5.1 C13.1 5.1 13.8 5.4 13.8 6.5"
      fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
    </path>
    <path d="M6.3 8.2H17.7L16.2 21.0H7.8L6.3 8.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M10.6 11.2v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M13.4 11.2v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
`;

/**
 * TRAY_SVG + 3 bars (TRAY_FULL_SVG)
 */
export const TRAY_FULL_SVG = `
  <svg class="ff-svg-icon ff-ico ff-ico--tray" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="width: 24px; height: 24px;">
    <rect x="22" y="15" width="56" height="8" rx="4" fill="currentColor" />
    <rect x="22" y="33" width="56" height="8" rx="4" fill="currentColor" />
    <rect x="22" y="51" width="56" height="8" rx="4" fill="currentColor" />

    <path d="M8 46 V80 H92 V46"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
          stroke-linejoin="round" />
  </svg>
`;

/**
 * FOLDER_SVG
 */
export const FOLDER_SVG = `
<svg viewBox="0 0 1024 1024" width="100%" height="100%">
  <path 
    d="M 114 160 
       L 114 120 
       Q 114 64 170 64 
       L 390 64 
       Q 440 64 470 100 
       L 530 160 
       L 914 160 
       Q 970 160 970 216 
       L 970 300" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="56" 
    stroke-linecap="round" 
    stroke-linejoin="round" 
  />
  
  <path 
    d="M 110 220 
       L 914 220 
       Q 970 220 970 276 
       L 970 880 
       Q 970 936 914 936 
       L 110 936 
       Q 54 936 54 880 
       L 54 276 
       Q 54 220 110 220 Z" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="56" 
    stroke-linecap="round" 
    stroke-linejoin="round" 
  />

  <g stroke="currentColor" stroke-width="48" stroke-linecap="round">
    <line x1="660" y1="640" x2="860" y2="640" />
    <line x1="660" y1="730" x2="860" y2="730" />
    <line x1="660" y1="820" x2="860" y2="820" />
  </g>
</svg>`;

/**
 * GEAR_SVG
 */
export const GEAR_SVG = `
<svg viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
      <stop offset="45%" style="stop-color:#8e8e8e;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#666666;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c0c0c0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <path 
    d="M512 360a152 152 0 100 304 152 152 0 100-304z m-92-260L400 180q-50 20-100 50L220 180q-40-40-80 0L80 240q-40 40 0 80l80 60q-10 50-10 100t10 100l-80 60q-40 40 0 80l60 60q40 40 80 0l80-50q50 30 100 50l20 80q10 64 92 64t92-64l20-80q50-20 100-50l80 50q40 40 80 0l60-60q40-40 0-80l-80-60q10-50 10-100t-10-100l80-60q40-40 0-80l-60-60q-40-40-80 0l-80 50q-50-30-100-50l-20-80q-10-64-92-64t-92 64z" 
    fill="url(#metalGradient)" 
    stroke="#444" 
    stroke-width="30" 
    stroke-linecap="round" 
    stroke-linejoin="round" 
  />
</svg>`;

/**
 * UNDO_SVG
 */
export const UNDO_SVG = `
  <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M9 14L5 10l4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M5 10h9a5 5 0 1 1 0 10h-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

/**
 * REDO_SVG
 */
export const REDO_SVG = `
  <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M15 14l4-4-4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M19 10H10a5 5 0 1 0 0 10h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;