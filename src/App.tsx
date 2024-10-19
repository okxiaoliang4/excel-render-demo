import { useCallback, useState } from "react"
import './App.css'
import { getXlsxData, Sheet } from "./utils/xlsx"
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'


function App() {
  const [data, setData] = useState<Sheet[]>()
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const [sheet1] = await getXlsxData(file)
    console.log("🚀 ~ handleFileChange ~ sheet1:", sheet1)
    setData([sheet1])
  }, [])

  const columns = Array.from({ length: data?.[0]?.meta.cols.length ?? 0 }, (_, i) => ({
    accessorFn: (row: (string | null)[]) => {
      return row[i]
    },
    header: `Column ${i}`,
  }))

  const table = useReactTable({
    data: data?.[0]?.data ?? [],
    getCoreRowModel: getCoreRowModel(),
    columns,
  })

  return (
    <div>
      <input type="file" accept=".xlsx" onChange={handleFileChange}></input>
      <table className="t-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={table.getVisibleLeafColumns().length}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default App
