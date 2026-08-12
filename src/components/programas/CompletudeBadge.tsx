interface CompletudeBadgeProps {
  value: number; // 0–100
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function CompletudeBadge({
  value,
  showLabel = true,
  size = 'sm',
}: CompletudeBadgeProps) {
  const color =
    value === 100 ? 'bg-green-500' :
    value >= 60   ? 'bg-blue-500'  :
    value >= 30   ? 'bg-yellow-400':
                    'bg-gray-300'  ;

  const labelColor =
    value === 100 ? 'text-green-700' :
    value >= 60   ? 'text-blue-700'  :
    value >= 30   ? 'text-yellow-700':
                    'text-gray-500'  ;

  const barH = size === 'sm' ? 'h-1.5' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-col gap-1 w-full">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={`${textSize} ${labelColor} font-medium`}>
            {value}% preenchido
          </span>
          {value === 100 && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Completo
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${barH}`}>
        <div
          className={`${barH} rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
