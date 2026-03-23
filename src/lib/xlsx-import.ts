import * as XLSX from 'xlsx'
import type { Card } from './types'
import { generateId } from './utils'

interface RawRow {
  Term?: unknown
  Answer?: unknown
  'Term #'?: unknown
  'Chapter #'?: unknown
  'Include?'?: unknown
}

export function parseXLSXBuffer(buffer: ArrayBuffer): Card[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames.includes('TermsDefinitions')
    ? 'TermsDefinitions'
    : workbook.SheetNames[0]

  if (!sheetName) throw new Error('No sheets found in workbook')

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`)

  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })

  return rows
    .map((row) => {
      const term = String(row['Term'] ?? '').trim()
      const answer = String(row['Answer'] ?? '').trim()
      if (!term) return null

      const chapterRaw = row['Chapter #']
      const chapter =
        chapterRaw !== '' && chapterRaw !== null && chapterRaw !== undefined
          ? Number(chapterRaw)
          : null

      const termNumRaw = row['Term #']
      const termNumber =
        termNumRaw !== '' && termNumRaw !== null && termNumRaw !== undefined
          ? Number(termNumRaw)
          : null

      const included = String(row['Include?'] ?? '').trim() === 'Yes'

      return {
        id: generateId(),
        term,
        answer,
        chapter: chapter !== null && !isNaN(chapter) ? chapter : null,
        termNumber: termNumber !== null && !isNaN(termNumber) ? termNumber : null,
        included,
      } satisfies Card
    })
    .filter((c): c is Card => c !== null)
}
