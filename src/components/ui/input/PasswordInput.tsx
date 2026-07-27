import { Check, Close, Eye, EyeOff } from "@/utils/icons";
import { Input, Progress } from "@heroui/react";
import { useDisclosure } from "@mantine/hooks";
import { forwardRef, memo } from "react";
import IconButton from "../button/IconButton";
import { cn } from "@/utils/helpers";

const requirements = [
  { re: /[0-9]/, label: "Includes number" },
  { re: /[a-z]/, label: "Includes lowercase letter" },
  { re: /[A-Z]/, label: "Includes uppercase letter" },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: "Includes special symbol" },
];

const getStrength = (password: string): number => {
  let multiplier = password.length > 7 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
};

const PasswordRequirement = memo(({ meets, label }: { meets: boolean; label: string }) => {
  return (
    <p
      className={cn(
        "text-small mt-1.5 flex items-center",
        meets ? "text-success" : "text-foreground-500",
      )}
    >
      {meets ? <Check className="text-xl" /> : <Close className="scale-150 text-xl" />}
      <span className="ml-2.5">{label}</span>
    </p>
  );
});

PasswordRequirement.displayName = "PasswordRequirement";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "endContent"> & {
  /**
   * Shows the strength meter and requirement checklist while the field has
   * focus. Only worth passing where a password is being *chosen* — on a login
   * form the password already exists and grading it is noise.
   */
  withStrengthMeter?: boolean;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ withStrengthMeter, ...props }, ref) => {
    const [show, { toggle }] = useDisclosure(false);
    const [meter, { open, close }] = useDisclosure(false);

    const value = typeof props.value === "string" ? props.value : "";
    const strength = getStrength(value);
    const color = strength === 100 ? "success" : strength > 50 ? "warning" : "danger";
    const showMeter = Boolean(withStrengthMeter && meter);

    const checks = requirements.map((requirement, index) => (
      <PasswordRequirement
        key={index}
        label={requirement.label}
        meets={requirement.re.test(value)}
      />
    ));

    return (
      <div className="relative flex flex-col" onFocusCapture={open} onBlurCapture={close}>
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          endContent={
            <IconButton
              size="sm"
              variant="light"
              onPress={toggle}
              aria-label={show ? "Hide password" : "Show password"}
              icon={show ? <EyeOff className="text-xl" /> : <Eye className="text-xl" />}
            />
          }
          {...props}
        />
        {showMeter && (
          /*
             Positioned off `top-full` rather than the old hardcoded
             `top-18` / `top-[5.3rem]` pair, which had to be hand-tuned for the
             error-message state and broke at any other input size. The panel
             also no longer reserves height on its container (`h-48`), so
             focusing the field can't push the card taller.
          */
          <div
            className={cn(
              "glass-panel absolute top-full left-0 z-100 mt-2 w-full",
              "rounded-(--radius-panel) border p-4",
            )}
          >
            <Progress
              aria-label="Password strength"
              color={color}
              value={strength}
              size="sm"
              className="mb-3"
            />
            <PasswordRequirement
              label="Includes at least 8 characters"
              meets={value.length > 7}
            />
            {checks}
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
