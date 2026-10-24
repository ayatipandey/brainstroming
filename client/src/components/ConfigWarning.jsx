// Shown in dev builds while business details are missing from
// shared/brand.config.js. Production builds refuse to build instead.
export default function ConfigWarning() {
  if (!__MISSING_BUSINESS__.length) return null;
  return (
    <p className="config-warning" role="alert">
      Build warning: business details missing from shared/brand.config.js: {__MISSING_BUSINESS__.join(', ')}. Production builds will fail until they are filled.
    </p>
  );
}
