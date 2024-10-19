import * as zip from '@zip.js/zip.js'
import { readFileConent } from './file'

export interface Sheet {
  data: (string | null)[][]
  meta: {
    cols: Element[]
  }
}

export const getXlsxData = async (file: Blob) => {
  const zipReader = new zip.ZipReader(new zip.BlobReader(file))
  const { sharedString, worksheets } = await zipReader.getEntries().then(async (entries) => {
    const worksheetEntries = entries.filter(entry => !entry.directory && entry.filename.startsWith('xl/worksheets'))
    const [sharedString, ...worksheets] = await Promise.all([
      entries.find(entry => !entry.directory && entry.filename.startsWith('xl/sharedStrings.xml'))?.getData?.(new zip.BlobWriter()),
      ...worksheetEntries.map(entry => entry.getData!(new zip.BlobWriter()))
    ])
    return {
      sharedString,
      worksheets
    }
  })

  const sharedStringXML = await readFileConent(sharedString as Blob)
  const sharedStringXMLDoc = new DOMParser().parseFromString(sharedStringXML, 'application/xml')
  const tArray = sharedStringXMLDoc.querySelectorAll('si t')
  const sharedStringArray = Array.from(tArray).map(t => t.textContent)

  const worksheetXMLs = await Promise.all(worksheets.map(readFileConent))
  return worksheetXMLs.map((worksheetXML) => {
    const worksheetXMLDoc = new DOMParser().parseFromString(worksheetXML, 'application/xml')
    const rows = worksheetXMLDoc.querySelectorAll('sheetData row')
    const rowsArray = Array.from(rows)
    const cols = worksheetXMLDoc.querySelectorAll('cols col')
    const colsArray = Array.from(cols)
    const data = rowsArray.map((row) => {
      const cells = row.querySelectorAll('c')
      const cellsArray = Array.from(cells)
      return cellsArray.map((cell) => {
        const t = cell.getAttribute('t')
        if (t === 's') {
          // shared string
          return sharedStringArray[Number(cell.querySelector('v')?.textContent)]!
        } else {
          return cell.querySelector('v')?.textContent ?? null
        }
      })
    })
    return {
      data,
      meta: {
        cols: colsArray
      }
    } satisfies Sheet
  })
}