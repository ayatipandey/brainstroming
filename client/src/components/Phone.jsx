import { forwardRef } from 'react';

// A phone frame for showing real app UI. Purely presentational: the screen
// inside is inert, and the frame carries one accessible description.
const Phone = forwardRef(function Phone({ children, label, time = '2:47', className = '', dark = false }, ref) {
  return (
    <figure ref={ref} className={`phone ${dark ? 'phone-dark' : ''} ${className}`} aria-label={label} role="img">
      <div className="phone-screen" inert="" aria-hidden="true">
        <div className="phone-status">
          <span>{time}</span>
          <span className="phone-island" />
          <span className="phone-signal"><i /><i /><i /><i /></span>
        </div>
        {children}
      </div>
    </figure>
  );
});

export default Phone;
