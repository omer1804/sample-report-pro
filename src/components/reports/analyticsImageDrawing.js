const drawingNs = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
const mainNs = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

export default function analyticsImageDrawing(images, column) {
  const anchors = images.map(({ row, width, height }, i) => {
    const scale = Math.min(140 / width, 100 / height);
    const cx = Math.round(width * scale * 9525), cy = Math.round(height * scale * 9525);
    return `<xdr:oneCellAnchor><xdr:from><xdr:col>${column}</xdr:col><xdr:colOff>47625</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>47625</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 1}" name="Design ${i + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="${drawingNs}" xmlns:a="${mainNs}" xmlns:r="${relNs}">${anchors}</xdr:wsDr>`;
}