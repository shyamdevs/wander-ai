// Mutable view state shared between the globe, camera and UI (like `pointer`).
// scale: user zoom multiplier | atMin: camera is fully zoomed in
// lat/lon: point currently facing the camera | pinScale: keeps pins readable while zooming
export const view = { scale: 1, atMin: false, pinScale: 1, lat: 0, lon: 0 };

// factor < 1 zooms in. Returns true when the user tries to zoom in past the closest
// globe distance, i.e. "take me to the satellite map".
export function zoomBy(factor) {
  if (factor < 1 && view.atMin) return true;
  view.scale *= factor;
  return false;
}
