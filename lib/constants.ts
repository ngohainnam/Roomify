export const PUTER_WORKER_URL = import.meta.env.VITE_PUTER_WORKER_URL || "";

// Storage Paths
export const STORAGE_PATHS = {
    ROOT: "roomify",
    SOURCES: "roomify/sources",
    RENDERS: "roomify/renders",
} as const;

// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const PROGRESS_INCREMENT = 15;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;

// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];

// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;

export const ROOMIFY_RENDER_PROMPT = `
TASK:
Convert the input 2D floor plan into a photorealistic, orthographic top-down 3D architectural render.

PRIORITY ORDER (CRITICAL):
1) Geometry accuracy (MOST IMPORTANT)
2) Clean output (no noise/artifacts)
3) Realistic materials and lighting

STRICT RULES (DO NOT VIOLATE):
- DO NOT modify layout under any circumstance.
- DO NOT infer or guess missing structures.
- If any part of the plan is unclear → leave it empty rather than guessing.

GEOMETRY CONSTRAINTS:
- Walls, rooms, doors, and windows must EXACTLY match the original 2D plan.
- Preserve absolute positions, proportions, and alignment.
- No shifting, scaling, bending, or distortion.
- Straight lines must remain perfectly straight.
- All walls must connect cleanly with no gaps or overlaps.

TEXT REMOVAL:
- Remove ALL text, labels, dimensions, and annotations.
- Replace text areas with continuous matching floor material.
- No visible artifacts or marks where text existed.

CAMERA:
- Strict orthographic projection (top-down 90° view).
- No perspective, no tilt, no angle.

STRUCTURE:
- Extrude walls vertically with consistent thickness and height.
- Maintain clean, sharp edges.

DOORS & WINDOWS:
- Doors: convert arcs into correctly hinged open doors aligned to walls.
- Windows: convert plan lines into clean glass elements aligned to walls.

FURNITURE RULE (VERY IMPORTANT):
- ONLY place furniture if a clear icon exists.
- If no icon, then leave the space empty.
- DO NOT guess or auto-fill interiors.

STYLE:
- Minimal, modern architectural visualization.
- Neutral daylight lighting.
- Realistic materials (wood, tile, glass).
- Clean, noise-free, artifact-free rendering.

NEGATIVE CONSTRAINTS:
- No distortion
- No hallucinated objects
- No extra rooms
- No sketch style
- No blur, no noise, no warping

FINAL GOAL:
A clean, precise 3D representation that preserves the exact structure of the original 2D plan with zero layout deviation.
`.trim();