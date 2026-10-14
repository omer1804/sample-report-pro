export default function formatAnalyticsInk(fabric) {
  const hasData = Object.entries(fabric).some(([key, value]) => key.startsWith('ink_consumption_') && key !== 'ink_consumption_unit' && value !== '' && value !== null && value !== undefined);
  if (!hasData) return '';
  const number = value => parseFloat(value) || 0;
  const unit = fabric.ink_consumption_unit || 'ml/m²';
  const mode = fabric.ink_color_mode || (fabric.ink_consumption_red || fabric.ink_consumption_green ? 'CMYKRG' : 'CMYK');
  const color = fabric.ink_consumption_color_total !== undefined && fabric.ink_consumption_color_total !== ''
    ? number(fabric.ink_consumption_color_total)
    : ['cyan', 'magenta', 'yellow', 'black', 'red', 'green'].reduce((sum, key) => sum + number(fabric[`ink_consumption_${key}`]), 0);
  const neonOn = fabric.ink_neon_enabled === true || (fabric.ink_neon_enabled !== false && !!(fabric.ink_consumption_neon || fabric.ink_consumption_neon_pink || fabric.ink_consumption_neon_yellow));
  const neon = number(fabric.ink_consumption_neon || (number(fabric.ink_consumption_neon_pink) + number(fabric.ink_consumption_neon_yellow)));
  const binderOn = fabric.ink_binder_enabled === true || (fabric.ink_binder_enabled !== false && !!fabric.ink_consumption_fof_color);
  const binder = number(fabric.ink_consumption_fof_color);
  const white = number(fabric.ink_consumption_white);
  const duratech = number(fabric.ink_consumption_fof_white);
  const topOn = fabric.top_coat_dtg_related !== false;
  const u10 = number(fabric.ink_consumption_u10);
  const topWhite = number(fabric.ink_consumption_fof_white_top_coat);
  const amount = value => `${value.toFixed(2)} ${unit}`;
  return [
    `${mode}: ${amount(color)}`,
    `Neon: ${neonOn ? amount(neon) : 'Not used'}`,
    `Binder${fabric.ink_binder_type ? ` (${fabric.ink_binder_type})` : ''}: ${binderOn ? amount(binder) : 'Not used'}`,
    `White: ${amount(white)} | Duratech: ${amount(duratech)}`,
    `Top Coat U10: ${topOn ? amount(u10) : 'Not used'}`,
    `FoF White Top Coat: ${topOn ? amount(topWhite) : 'Not used'}`,
    `Total ink: ${amount(color + (neonOn ? neon : 0) + (binderOn ? binder : 0) + white + duratech + (topOn ? u10 + topWhite : 0))}`
  ].join('\n');
}