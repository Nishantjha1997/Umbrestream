import { Tooltip } from "@heroui/react";
import Link from "next/link";

interface ActionButtonProps {
  children: React.ReactNode;
  label: string;
  tooltip?: string;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  label,
  tooltip,
  disabled,
  href,
  onClick,
}) => {
  const content = (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/70 disabled:opacity-40"
    >
      {children}
    </button>
  );

  if (disabled) return content;

  if (href) {
    return (
      <Link href={href} aria-label={label}>
        {content}
      </Link>
    );
  }

  if (tooltip) {
    return (
      <Tooltip content={tooltip} placement="bottom" delay={300}>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default ActionButton;
