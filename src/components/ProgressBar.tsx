interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBar({ completed, total, className }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted">Progress</span>
        <span className="font-medium text-accent-light">
          {completed}/{total} steps · {percentage}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="progress-fill h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
