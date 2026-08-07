"use client";

import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { ContentType } from "@/types";
import { Anime, Movie, TV } from "@/utils/icons";
import { Tabs, Tab, TabsProps } from "@heroui/react";

interface ContentTypeSelectionProps extends TabsProps {
  onTypeChange?: (type: ContentType) => void;
}

const ContentTypeSelection: React.FC<ContentTypeSelectionProps> = ({ onTypeChange, ...props }) => {
  const { content, setContent, resetFilters } = useDiscoverFilters();

  const handleTabChange = (key: ContentType) => {
    resetFilters();
    setContent(key);
    onTypeChange?.(key);
  };

  return (
    <Tabs
      size="lg"
      variant="underlined"
      selectedKey={content}
      aria-label="Content Type Selection"
      // One accent (Phase 1/3, §1.1.3 / §5.2): was primary/warning/secondary
      // by content type — the same media-type-taxonomy pattern removed from
      // the players and detail-page spinners.
      color="primary"
      onSelectionChange={(value) => handleTabChange(value as ContentType)}
      classNames={{
        tabContent: "pb-2",
        cursor: "h-1 rounded-full",
      }}
      {...props}
    >
      <Tab
        key="movie"
        title={
          <div className="flex items-center space-x-2">
            <Movie />
            <span>Movies</span>
          </div>
        }
      />
      <Tab
        key="tv"
        title={
          <div className="flex items-center space-x-2">
            <TV />
            <span>TV Series</span>
          </div>
        }
      />
      <Tab
        key="anime"
        title={
          <div className="flex items-center space-x-2">
            <Anime />
            <span>Anime</span>
          </div>
        }
      />
    </Tabs>
  );
};

export default ContentTypeSelection;

