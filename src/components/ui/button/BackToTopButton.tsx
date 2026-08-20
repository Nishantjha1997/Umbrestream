"use client";

import { useWindowScroll } from "@mantine/hooks";
import IconButton from "./IconButton";
import { MdKeyboardArrowUp } from "react-icons/md";
import { cn } from "@/utils/helpers";

const BackToTopButton: React.FC = () => {
  const [{ y }, scrollTo] = useWindowScroll();
  const isVisible = y > 300;

  const scrollToTop = () => {
    scrollTo({ y: 0 });
  };

  if (!isVisible) return null;

  return (
    <div className={cn("fixed bottom-20 right-4 z-60 transition-opacity md:bottom-4")}>
      {/* Floats over page content, so it uses the glass-control tier rather
          than `variant="shadow"` — a coloured glow on a utility control pulls
          more attention than the control deserves (§9). */}
      <IconButton
        onPress={scrollToTop}
        icon={<MdKeyboardArrowUp size={24} />}
        variant="flat"
        className="glass-control motion-preset-focus border shadow-(--elevation-lift)"
        tooltip="Back to top"
        tooltipProps={{ placement: "left" }}
        radius="full"
        size="lg"
      />
    </div>
  );
};

export default BackToTopButton;
