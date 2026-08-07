"use client";

import { cn } from "@/utils/helpers";
import { Close } from "@/utils/icons";
import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/react";
import { Drawer, DialogProps } from "vaul";

export type DrawerProps = DialogProps & {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  backdrop?: "opaque" | "blur" | "transparent";
  fullWidth?: boolean;
  hiddenTitle?: boolean;
  hiddenHandler?: boolean;
  scrollable?: boolean;
  withCloseButton?: boolean;
  classNames?: {
    overlay?: string;
    content?: string;
    title?: string;
    handler?: string;
    contentWrapper?: string;
    /** Was `scollWrapper` — a typo. No call site used it (grepped before
        renaming), so this is safe. */
    scrollWrapper?: string;
    childrenWrapper?: string;
  };
};

export default function VaulDrawer({
  children,
  trigger,
  title,
  backdrop = "opaque",
  fullWidth,
  hiddenTitle,
  direction = "bottom",
  hiddenHandler,
  scrollable = true,
  withCloseButton,
  classNames,
  ...props
}: DrawerProps) {
  return (
    <Drawer.Root {...props} direction={direction}>
      {trigger && (
        <Drawer.Trigger asChild>
          {typeof trigger === "string" ? <Button>{trigger}</Button> : trigger}
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn("fixed inset-0 z-90 bg-black/70", classNames?.overlay, {
            // Was backdrop-blur-xs (the weakest tier, barely perceptible),
            // then backdrop-blur-md. Now backdrop-blur-lg — matching
            // `glass-panel`'s blur strength (`--glass-blur-lg`, §6) without
            // importing its border/background, which are meant for a
            // floating card, not a full-viewport scrim.
            "backdrop-blur-lg": backdrop === "blur",
            "bg-transparent": backdrop === "transparent",
          })}
        />
        <Drawer.Content
          className={cn(
            // z-90/z-91 (§6): was z-9998/z-9999 — arbitrary huge numbers with
            // no relation to the rest of the app's z-index scale. z-90
            // matches the design's own sheet/panel tier
            // (`docs/design/PHONE_SPEC.md` §B "z-index 90"), one step above
            // `DetailModal`'s z-80 so a sheet opened from within a detail
            // modal still sits on top of it.
            "fixed z-91 place-self-center border border-white/10 bg-[#111218]/96 text-white shadow-2xl shadow-black/60 outline-hidden backdrop-blur-2xl",
            classNames?.contentWrapper,
            {
              "right-0 bottom-0 left-0 mt-24 max-h-[97%] w-full rounded-t-2xl":
                direction === "bottom",
              "top-0 right-0 left-0 mb-24 max-h-[97%] w-full rounded-b-2xl": direction === "top",
              "top-0 right-0 bottom-0 h-full w-full rounded-l-2xl": direction === "right",
              "top-0 bottom-0 left-0 h-full w-full rounded-r-2xl": direction === "left",
              "md:w-max": !fullWidth && (direction === "bottom" || direction === "top"),
              "md:max-w-lg": !fullWidth && (direction === "right" || direction === "left"),
              "w-full": fullWidth,
            },
          )}
        >
          <div
            className={cn(
              "relative flex h-full flex-col space-y-5 pt-4 pb-6",
              classNames?.content,
              {
                "rounded-t-2xl": direction === "bottom",
                "rounded-b-2xl": direction === "top",
                "rounded-l-2xl": direction === "right",
                "rounded-r-2xl": direction === "left",
              },
            )}
          >
            {withCloseButton && (
              <Button
                isIconOnly
                aria-label="Close"
                radius="full"
                variant="light"
                className="absolute top-3 right-3"
                size="sm"
                onPress={props.onClose}
              >
                <Close size={24} />
              </Button>
            )}
            {!hiddenHandler && (
              <div
                className={cn(
                  "bg-foreground/50 mx-auto h-1.5 w-12 shrink-0 rounded-full",
                  classNames?.handler,
                )}
              />
            )}
            <Drawer.Title
              aria-hidden={hiddenTitle ? true : undefined}
              className={cn("text-center text-xl", classNames?.title, {
                hidden: hiddenTitle,
              })}
            >
              {title}
            </Drawer.Title>
            <Drawer.Description aria-hidden className="hidden" />
            <ScrollShadow isEnabled={scrollable} className={classNames?.scrollWrapper}>
              <div
                className={cn("mx-auto", classNames?.childrenWrapper, {
                  "max-w-lg": !fullWidth,
                })}
              >
                {children}
              </div>
            </ScrollShadow>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
