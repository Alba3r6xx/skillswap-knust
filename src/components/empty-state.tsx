import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline";
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  const cls =
    action.variant === "outline"
      ? "rounded-full"
      : "";

  if (action.href) {
    return (
      <Link href={action.href}>
        <Button variant={action.variant === "outline" ? "outline" : "default"} className={cls}>
          {action.label}
        </Button>
      </Link>
    );
  }
  return (
    <Button
      variant={action.variant === "outline" ? "outline" : "default"}
      className={cls}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-bounce-in", className)}>
      <div className="mb-4 w-14 h-14 rounded-2xl bg-navy-50 dark:bg-navy-900/50 flex items-center justify-center text-navy-400 dark:text-navy-500 [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {action && <ActionButton action={action} />}
          {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: "outline" }} />}
        </div>
      )}
    </div>
  );
}
