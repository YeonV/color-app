// import Shade from 'shade-generator'

// interface EnrichedColor {
//   hex: string;
//   contrast: string;
// }

// export function generateShades(color: string, steps: number): EnrichedColor[] {
//   const shades: EnrichedColor[] = []

//   const generator = Shade(color).steps(steps)

//   for (let i = 0; i < steps; i++) {
//     const shadeColor = generator.getColor(i)
//     shades.push({
//       hex: shadeColor,
//       contrast: calculateContrastColor(shadeColor),
//     })
//   }

//   return shades
// }

// function calculateContrastColor(hexColor: string): string {
//   const r = parseInt(hexColor.slice(1, 3), 16)
//   const g = parseInt(hexColor.slice(3, 5), 16)
//   const b = parseInt(hexColor.slice(5, 7), 16)
//   const yiq = (r * 299 + g * 587 + b * 114) / 1000
//   return yiq >= 128 ? '#000000' : '#ffffff'
// }


/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { array_move } from './helpers'

/* eslint-disable default-case */
interface HsvColor {
  h: number;
  s: number;
  v: number;
}

interface EnrichedColor {
  hex: string;
  contrast: string;
}

export function calculateContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#555' : '#ffffff'
}

export function colorShades(baseColor: string, steps: number): EnrichedColor[] {
  const out: EnrichedColor[] = []

  function getLight(color: string): HsvColor {
    const lightSat = 0.08
    const lightVal = 0.992
    const hsv = hexToHsv(color)
    hsv.s = lightSat
    hsv.v = lightVal
    return hsv
  }

  function hexToHsv(hex: string): HsvColor {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      v = 0

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return { h, s, v: max }
  }

  function hsvToHex(hsv: HsvColor): string {
    const { h, s, v } = hsv
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    let r = 0,
      g = 0,
      b = 0
    switch (i % 6) {
      case 0:
        r = v
        g = t
        b = p
        break
      case 1:
        r = q
        g = v
        b = p
        break
      case 2:
        r = p
        g = v
        b = t
        break
      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break
      case 5:
        r = v
        g = p
        b = q
        break
    }

    const hexR = Math.round(r * 255)
      .toString(16)
      .padStart(2, '0')
    const hexG = Math.round(g * 255)
      .toString(16)
      .padStart(2, '0')
    const hexB = Math.round(b * 255)
      .toString(16)
      .padStart(2, '0')
    return `#${hexR}${hexG}${hexB}`
  }

  function generateShades(color: string, steps: number): EnrichedColor[] {
    const spinFactor = 16
    const satFactor = 3
    const valFactor = 3
    const l = getLight(color)
    out.push({
      hex: color,
      contrast: calculateContrastColor(color),
    })

    for (let i = 1; i < steps; i++) {
      const c: HsvColor = {
        h: l.h + (i * spinFactor) / steps,
        s:
          l.s + Math.sin((i * Math.PI) / steps / satFactor),
        v:
          l.v * Math.cos((i * Math.PI) / steps / valFactor),
      }
      const hexColor = hsvToHex(c)
      out.push({
        hex: hexColor,
        contrast: calculateContrastColor(hexColor),
      })
    }
    // array_move(out, 0, Math.floor(steps / 2))
    return out
  }

  return generateShades(baseColor, steps)
}

// // Example usage:
// const shades: EnrichedColor[] = colorShades('#5dddc1', 9);
// console.log(shades);
