declare const FS: {
  writeFile: (path: string, data: Uint8Array | string) => void
  readFile: (path: string) => Uint8Array
}

declare namespace FS {
  function writeFile(path: string, data: Uint8Array | string): void
  function readFile(path: string): Uint8Array
}
