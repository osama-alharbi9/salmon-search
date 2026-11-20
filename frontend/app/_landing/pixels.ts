// Pixel-art symbols shared by the planet's voxel orbiters and the deck's card
// suits. One string per row, # is a filled cell.

export type PixelArt = {
  rows: string[];
  /** Main colour, as a number for three.js and a hex string for CSS/SVG. */
  color: number;
  hex: string;
  /** Emissive tint for the 3D version. */
  glow: number;
  /** Width in planet units (the planet's radius is 1). */
  size: number;
};

export const PIXELS = {
  star: {
    rows: [
      ".....#.....",
      "....###....",
      "....###....",
      "###########",
      ".#########.",
      "..#######..",
      "...#####...",
      "..###.###..",
      "..##...##..",
      ".#.......#.",
    ],
    color: 0xffb400,
    hex: "#FFB400",
    glow: 0x7a3a00,
    size: 0.6,
  },
  heart: {
    rows: [
      ".##...##.",
      "####.####",
      "#########",
      "#########",
      ".#######.",
      "..#####..",
      "...###...",
      "....#....",
    ],
    color: 0xff3a64,
    hex: "#FF3A64",
    glow: 0x5a0a1c,
    size: 0.5,
  },
  bolt: {
    rows: [
      "....###",
      "...###.",
      "..###..",
      ".######",
      "....##.",
      "...##..",
      "..##...",
      ".##....",
    ],
    color: 0x8a5cff,
    hex: "#8A5CFF",
    glow: 0x2a1670,
    size: 0.46,
  },
} satisfies Record<string, PixelArt>;

/** A gold pixel coin, used only as a card suit (the planet's coins are real discs). */
export const PIXEL_COIN: Omit<PixelArt, "color" | "glow" | "size"> = {
  rows: [
    "..####..",
    ".######.",
    "##.##.##",
    "##.##.##",
    "###..###",
    "########",
    ".######.",
    "..####..",
  ],
  hex: "#F2A93B",
};

/** The filled cells of `rows` as one SVG path, one unit per cell. */
export function pixelPath(rows: readonly string[]): string {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== "#") {
        x++;
        continue;
      }
      let w = 0;
      while (row[x + w] === "#") w++;
      d += `M${x} ${y}h${w}v1h${-w}z`;
      x += w;
    }
  });
  return d;
}
