/**
 * Minimal typings for archiver v8's class-based API. The published
 * @types/archiver package still describes the old v7 factory export, so it
 * cannot be used here. Only the surface we actually rely on is declared.
 */
declare module 'archiver' {
  import { Readable } from 'stream';

  interface ZipArchiveOptions {
    /** Store entries uncompressed (already-compressed images). */
    store?: boolean;
    /** Emit Zip64 extensions so archives over 4 GB stay valid. */
    zip64?: boolean;
    zlib?: { level?: number };
  }

  interface EntryData {
    name: string;
    date?: Date;
  }

  class ZipArchive extends Readable {
    constructor(options?: ZipArchiveOptions);
    file(filepath: string, data: EntryData): this;
    append(source: Readable | Buffer | string, data: EntryData): this;
    finalize(): Promise<void>;
    abort(): this;
    pointer(): number;
  }

  export { ZipArchive, ZipArchiveOptions, EntryData };
}
