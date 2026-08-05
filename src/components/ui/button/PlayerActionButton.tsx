import { cn } from "@/utils/helpers";
import { Tooltip } from "@heroui/react";
import Link from "next/link";

interface PlayerActionButtonProps {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  color?: "primary" | "warning" | "secondary" | "default";
}

const PlayerActionButton: React.FC<PlayerActionButtonProps> = ({
  label,
  href = "",
  children,
  onClick,
  tooltip,
  disabled,
  color = "primary",
}) => {
  const hoverColors = {
    primary: "hover:[&>svg]:text-primary",
    warning: "hover:[&>svg]:text-warning",
    secondary: "hover:[&>svg]:text-secondary",
    default: "hover:[&>svg]:text-default",
  };

  const Button = (
    <Tooltip content={tooltip} isDisabled={disabled || !tooltip} showArrow placement="bottom">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "group flex size-10 touch-manipulation items-center justify-center rounded-full drop-shadow-md sm:size-12 [&>svg]:transition-all",
          {
            [`hover:[&>svg]:scale-125 ${hoverColors[color]}`]: !disabled,
            "cursor-not-allowed opacity-50": disabled,
          },
        )}
      >
        {children}
      </button>
    </Tooltip>
  );

  return href && !disabled ? (
    <Link href={href} className="flex items-center">
      {Button}
    </Link>
  ) : (
    Button
  );
};

export default PlayerActionButton;
