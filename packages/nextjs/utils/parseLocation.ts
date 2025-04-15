const parseLocation = (location: string): [number, number] => {
  if (!location) return [0, 0];
  const [lng, lat] = location.split(",").map(coord => {
    const num = parseFloat(coord.trim());
    if (isNaN(num)) return 0;
    return num;
  });
  
  // Validate coordinates
  const validLat = Math.max(-90, Math.min(90, lat));
  const validLng = lng;
  
  return [validLng, validLat];
};

export default parseLocation;