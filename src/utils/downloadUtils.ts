import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function downloadBlob(data: Uint8Array | Blob, filename: string): void {
  const blob = data instanceof Blob ? data : new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, filename);
}

export async function downloadAsZip(
  files: { name: string; data: Uint8Array }[],
  zipName: string,
): Promise<void> {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.data);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
}

export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
}
