declare namespace FS {
  interface FSNode {
    name: string
    parent: FSNode
    mode: number
    mount: FSMount
  }
  interface FSMount {
    opts: { root: string }
  }
  interface NodeOps {}
  interface StreamOps {}
  interface Mount {
    opts: { root?: string }
  }
  function isDir(mode: number): boolean
  function isFile(mode: number): boolean
  function isLink(mode: number): boolean
  class ErrnoError extends Error {
    constructor(errno: number)
    errno: number
  }
  class FSNode {
    constructor(
      parent: FSNode | null,
      name: string,
      mode: number,
      rdev?: number,
    )
    name: string
    parent: FSNode
    mode: number
    node_ops: NodeOps
    stream_ops: StreamOps
    mount: FSMount
  }
}

declare module '@zenfs/emscripten/plugin' {
  export default class EmscriptenPlugin {
    constructor(fs: unknown, em_fs: typeof FS, path?: unknown)
    mount(mount: FS.Mount): FS.FSNode
    createNode(
      parent: FS.FSNode | null,
      name: string,
      mode: number,
      rdev?: number,
    ): FS.FSNode
    getMode(path: string): number
    realPath(node: FS.FSNode): string
    node_ops: FS.NodeOps
    stream_ops: FS.StreamOps
  }
}
