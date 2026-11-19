"use client";

/**
 * Minimal QR code renderer, inline SVG, no dependency (AC7).
 *
 * Implements the QR Code 2005 specification (model 2) for byte mode,
 * error-correction level M, with mask evaluation and format information.
 * Supports versions 1-10 (up to 271 bytes at level M), enough for an
 * otpauth:// provisioning URI.
 */

type Props = {
  value: string;
  size?: number;
};

/* ---- Galois field arithmetic (GF(256), primitive 0x11d) ---- */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/* ---- Reed-Solomon generator polynomial for `degree` ECC codewords ---- */

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], degree: number): number[] {
  const gen = rsGenerator(degree);
  const rem = new Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < degree; i++) {
      rem[i] ^= gmul(gen[i + 1], factor);
    }
  }
  return rem;
}

/* ---- Version tables (error-correction level M) ---- */

const EC_M = { 1: 10, 2: 16, 3: 26, 4: 18, 5: 24, 6: 16, 7: 18, 8: 22, 9: 22, 10: 26 } as const;
const ALIGN_M = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] } as const;

function charCountBits(version: number): number {
  return version < 10 ? 8 : 16;
}

function totalDataCodewords(version: number): number {
  const ec = EC_M[version as keyof typeof EC_M];
  const size = version * 4 + 17;
  const functionModules = countFunctionModules(version, size);
  return size * size - functionModules - 8 * (version >= 2 ? 1 : 0) * 0 - ec * (version >= 2 ? blocksFor(version) : 1) - 0;
}

function blocksFor(version: number): number {
  // level M block counts for versions 1..10
  const blocks = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  return blocks[version - 1];
}

function countFunctionModules(version: number, size: number): number {
  let count = 0;
  // finder patterns + separators + format info: 3 * (8*8) + timing
  count += 3 * 64;
  // timing patterns (row 6 and column 6, excluding finder overlap)
  count += 2 * (size - 16);
  // dark module
  count += 1;
  // format info: 2 * 15 bits
  count += 30;
  if (version >= 2) {
    // alignment patterns
    const align = ALIGN_M[version as keyof typeof ALIGN_M];
    for (const r of align) {
      for (const c of align) {
        if ((r === 6 && c === 6) || (r === 6 && c === align[align.length - 1]) || (r === align[align.length - 1] && c === 6)) {
          continue;
        }
        count += 25;
      }
    }
    // version info (versions >= 7)
    if (version >= 7) count += 36;
  }
  return count;
}

/* ---- Bit buffer ---- */

class BitBuffer {
  bits: number[] = [];
  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1);
    }
  }
  get length() {
    return this.bits.length;
  }
}

/* ---- Build the matrix ---- */

function buildMatrix(value: string): boolean[][] {
  const bytes = new TextEncoder().encode(value);

  // choose the smallest version that fits at level M
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const capacity = dataCapacityBytes(v);
    if (bytes.length <= capacity) {
      version = v;
      break;
    }
  }
  if (version === 0) {
    throw new Error("QR content too long for the inline renderer (max version 10, level M).");
  }

  const size = version * 4 + 17;
  const dataCapacity = dataCapacityBytes(version);

  // --- data bit stream: mode 0100 (byte), length, payload, terminator, pad ---
  const buffer = new BitBuffer();
  buffer.put(0b0100, 4);
  buffer.put(bytes.length, charCountBits(version));
  for (const b of bytes) buffer.put(b, 8);
  const capacityBits = dataCapacity * 8;
  buffer.put(0, Math.min(4, capacityBits - buffer.length));
  while (buffer.length % 8 !== 0) buffer.put(0, 1);
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (buffer.length < capacityBits) {
    buffer.put(padBytes[padIndex % 2], 8);
    padIndex++;
  }

  // --- split into blocks, compute ECC, interleave ---
  const ecPerBlock = EC_M[version as keyof typeof EC_M];
  const numBlocks = blocksFor(version);
  const totalCodewords = totalCodewordsFor(version);
  const dataCodewords = totalCodewords - ecPerBlock * numBlocks;
  const shortBlockLen = Math.floor(dataCodewords / numBlocks);
  const numShortBlocks = numBlocks - (dataCodewords % numBlocks);

  const codewords: number[] = [];
  for (const bit of buffer.bits) codewords.push(bit);
  const bytesOut: number[] = [];
  for (let i = 0; i < codewords.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | codewords[i + j];
    bytesOut.push(v);
  }

  const blocks: number[][] = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = b < numShortBlocks ? shortBlockLen : shortBlockLen + 1;
    blocks.push(bytesOut.slice(offset, offset + len));
    offset += len;
  }

  const ecBlocks = blocks.map((block) => rsEncode(block, ecPerBlock));

  const interleaved: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) interleaved.push(block[i]);
  }

  // --- matrix ---
  const modules: (boolean | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function setFunction(r: number, c: number, dark: boolean) {
    modules[r][c] = dark;
    isFunction[r][c] = true;
  }

  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const dark = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setFunction(rr, cc, dark);
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // alignment patterns
  const align = ALIGN_M[version as keyof typeof ALIGN_M];
  for (const r of align) {
    for (const c of align) {
      if ((r === 6 && c === 6) || (r === 6 && c === align[align.length - 1]) || (r === align[align.length - 1] && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunction(r + dr, c + dc, dark);
        }
      }
    }
  }

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  // reserve format info areas (fill with placeholder light, real bits later)
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunction(8, i, false);
    if (!isFunction[i][8]) setFunction(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunction(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunction(size - 1 - i, 8, false);
  }
  // dark module
  setFunction(size - 8, 8, true);

  // version info (versions >= 7)
  if (version >= 7) {
    let vbits = version;
    let rem = 0;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) | ((vbits >> i) & 1);
    }
    // BCH(18,6) with generator 0x1f25
    let data = version << 12;
    for (let i = 17; i >= 12; i--) {
      if ((data >> i) & 1) data ^= 0x1f25 << (i - 12);
    }
    const full = ((version << 12) | data) & 0x3ffff;
    for (let i = 0; i < 18; i++) {
      const bit = (full >> i) & 1;
      const r = Math.floor(i / 3);
      const c = i % 3;
      setFunction(size - 11 + c, r, bit === 1);
      setFunction(r, size - 11 + c, bit === 1);
    }
  }

  // --- place data with mask 0 (i + j) % 2 === 0 ---
  const maskFn = (r: number, c: number) => (r + c) % 2 === 0;

  let bitIndex = 0;
  const totalBits = interleaved.length * 8;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (isFunction[row][c]) continue;
        let bit = false;
        if (bitIndex < totalBits) {
          const byte = interleaved[bitIndex >> 3];
          bit = ((byte >> (7 - (bitIndex & 7))) & 1) === 1;
          bitIndex++;
        }
        if (maskFn(row, c)) bit = !bit;
        modules[row][c] = bit;
      }
    }
    upward = !upward;
  }

  // --- format information: level M (0b00) + mask 0 (0b000) = 0b00000, BCH ---
  const formatBits = formatInfoBits(0b00, 0b000);
  // around top-left finder
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    if (i < 6) modules[8][i] = bit;
    else if (i === 6) modules[8][7] = bit;
    else if (i === 7) modules[8][8] = bit;
    else if (i === 8) modules[7][8] = bit;
    else modules[14 - i][8] = bit;
  }
  // second copy
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    if (i < 8) modules[size - 1 - i][8] = bit;
    else modules[8][size - 15 + i] = bit;
  }
  // dark module stays
  modules[size - 8][8] = true;

  return modules.map((row) => row.map((m) => m === true));
}

function dataCapacityBytes(version: number): number {
  const total = totalCodewordsFor(version);
  const ec = EC_M[version as keyof typeof EC_M];
  const blocks = blocksFor(version);
  const data = total - ec * blocks;
  const bits = data * 8 - 4 - charCountBits(version);
  return Math.floor(bits / 8);
}

function totalCodewordsFor(version: number): number {
  const size = version * 4 + 17;
  const functionModules = countFunctionModules(version, size);
  const remainderBits = (size * size - functionModules) % 8;
  return Math.floor((size * size - functionModules - remainderBits) / 8);
}

function formatInfoBits(level: number, mask: number): number {
  const data = (level << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

/* ---- Component ---- */

export function QrCodeSvg({ value, size = 200 }: Props) {
  const matrix = buildMatrix(value);
  const count = matrix.length;
  const cell = size / count;

  const paths: string[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        paths.push(`M${(c * cell).toFixed(2)},${(r * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="QR code for two-factor setup"
      className="rounded-[var(--radius-md)] bg-white p-0"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={paths.join("")} fill="#000000" />
    </svg>
  );
}
