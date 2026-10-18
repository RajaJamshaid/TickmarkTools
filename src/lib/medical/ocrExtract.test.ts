import { describe, expect, it } from 'vitest'
import { extractOcrResult } from './ocrExtract'

describe('extractOcrResult', () => {
  it('reads nested blocks and uses the lowest word confidence per line', () => {
    const data = {
      text: 'Lab panel 45.00\n',
      confidence: 87.6,
      blocks: [
        {
          paragraphs: [
            {
              lines: [
                {
                  text: 'Lab panel 45.00\n',
                  confidence: 90,
                  words: [
                    { text: 'Lab', confidence: 95 },
                    { text: 'panel', confidence: 91 },
                    { text: '45.00', confidence: 62.4 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    expect(extractOcrResult(data)).toEqual({ text: 'Lab panel 45.00\n', meanConfidence: 88, lines: [{ text: 'Lab panel 45.00', confidence: 62 }] })
  })

  it('uses top-level lines when present', () => {
    const r = extractOcrResult({ text: 'a', lines: [{ text: 'a b', confidence: 70 }] })
    expect(r.lines).toEqual([{ text: 'a b', confidence: 70 }])
  })

  it('falls back to splitting text with unknown confidence', () => {
    const r = extractOcrResult({ text: 'one\n\ntwo\n' })
    expect(r.lines).toEqual([
      { text: 'one', confidence: null },
      { text: 'two', confidence: null },
    ])
    expect(r.meanConfidence).toBeNull()
  })

  it('returns empty results for unknown shapes instead of inventing text', () => {
    expect(extractOcrResult(null)).toEqual({ text: '', meanConfidence: null, lines: [] })
    expect(extractOcrResult({ blocks: 'nope', lines: 5 })).toEqual({ text: '', meanConfidence: null, lines: [] })
  })
})
