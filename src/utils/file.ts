export const readFileConent = (file: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsText(file, 'application/xml')
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
  })
}