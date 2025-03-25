export function downloadBlob(
  blobPart: BlobPart,
  opts: BlobPropertyBag & { name: string }
) {
  const file = new Blob([blobPart], opts);

  const el = document.createElement("a");
  el.href = URL.createObjectURL(file);
  el.download = opts.name;

  document.body.appendChild(el);
  el.click();

  document.body.removeChild(el);
}
