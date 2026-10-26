import { ChevronDown } from 'lucide-react';

// Keep both ends recognizable; the native disclosure exposes the complete value.
export function Hostname({ value, id, describe = value => value }: {
  value: string; id?: string; describe?: (value: string) => string;
}) {
  if (value.length <= 44) return <p id={id} className="description hostname" title={value}>{describe(value)}</p>;
  const short = value.slice(0, 16) + '…' + value.slice(-24);
  return <details id={id} className="description hostname hostname-details">
    <summary aria-label={describe(value)} title={value}>
      <span>{describe(short)}</span><ChevronDown size={14} aria-hidden="true" />
    </summary>
    <p className="hostname-full">{value}</p>
  </details>;
}
