import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import analyticsImageDrawing from '@/components/reports/analyticsImageDrawing';

async function loadImage(url, row) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('A design image could not be loaded. Please check that it opens in the analytics area.'));
    image.src = url;
  });
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return { row, width: canvas.width, height: canvas.height, base64: canvas.toDataURL('image/png').split(',')[1] };
}

export default async function exportAnalyticsImages(workbook, rows, imageColumn, filename) {
  const images = [];
  for (let index = 0; index < rows.length; index++) {
    if (rows[index].design_image) images.push(await loadImage(rows[index].design_image, index + 1));
  }
  const zip = await JSZip.loadAsync(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
  if (images.length && imageColumn >= 0) {
    const ns = 'http://schemas.openxmlformats.org/package/2006/relationships';
    zip.file('xl/drawings/drawing1.xml', analyticsImageDrawing(images, imageColumn));
    zip.file('xl/drawings/_rels/drawing1.xml.rels', `<Relationships xmlns="${ns}">${images.map((image, i) => {
      zip.file(`xl/media/design${i + 1}.png`, image.base64, { base64: true });
      return `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/design${i + 1}.png"/>`;
    }).join('')}</Relationships>`);
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', `<Relationships xmlns="${ns}"><Relationship Id="rIdDesign" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`);
    const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
    zip.file('xl/worksheets/sheet1.xml', sheet.replace('</worksheet>', '<drawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdDesign"/></worksheet>'));
    const types = await zip.file('[Content_Types].xml').async('string');
    zip.file('[Content_Types].xml', types.replace('</Types>', '<Default Extension="png" ContentType="image/png"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'));
  }
  const url = URL.createObjectURL(await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}