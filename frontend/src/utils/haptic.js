// Utilidad centralizada de feedback háptico
const haptic = {
  light:   () => navigator.vibrate?.(8),
  tap:     () => navigator.vibrate?.(12),
  medium:  () => navigator.vibrate?.([10, 30, 60]),
  heavy:   () => navigator.vibrate?.([50, 50, 120]),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error:   () => navigator.vibrate?.([100, 50, 100]),
  like:    () => navigator.vibrate?.([10, 30, 60]),
  sign:    () => navigator.vibrate?.([15, 40, 80]),
};

export default haptic;
