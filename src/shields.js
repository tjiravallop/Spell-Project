export function shieldLayers(shield) {
  return shield?.layers.map((hp, index) => ({
    effect: shield.effect,
    expires: shield.expires,
    triggered: shield.triggered,
    ...(shield.grand && { grand: true }),
    ...(shield.large && { large: true }),
    ...shield.layerEffects?.[index],
    ...shield.layerDetails?.[index],
    hp,
  })) ?? [];
}

export function makeShield(layers) {
  if (!layers.length) return null;
  const { effect, triggered, grand, large } = layers[0];
  return {
    layers: layers.map(layer => layer.hp),
    expires: Math.max(...layers.map(layer => layer.expires)),
    effect, triggered,
    ...(grand && { grand: true }),
    ...(large && { large: true }),
    layerDetails: layers.map(({ hp, ...detail }) => detail),
  };
}

export function shieldProtection(shield, block = 0) {
  const details = shieldLayers(shield);
  return {
    amount: block + details.reduce((sum, layer) => sum + layer.hp, 0),
    layers: details.length,
    element: details[0]?.effect,
    layerEffects: details.map(layer => layer.elements ?? (layer.effect ? [layer.effect] : [])),
    grand: Boolean(details[0]?.grand),
    large: Boolean(details[0]?.large),
    details,
    block,
  };
}
