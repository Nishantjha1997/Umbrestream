import { forwardRef, memo, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Select,
  SelectItem,
  Input,
  ScrollShadow,
  Tabs,
  Tab,
  Tooltip,
} from "@heroui/react";
import { Season } from "tmdb-ts";
import { Grid, List, Search, SortAlpha } from "@/utils/icons";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import dynamic from "next/dynamic";
import IconButton from "@/components/ui/button/IconButton";
import SectionTitle from "@/components/ui/other/SectionTitle";
import { titleCase } from "string-ts";
const TvShowEpisodesSelection = dynamic(() => import("./Episodes"));

interface Props {
  id: number;
  seasons: Season[];
}

const TvShowsSeasonsSelection = forwardRef<HTMLElement, Props>(({ id, seasons }, ref) => {
  const DISPLAY_SEASONS = useMemo(() => {
    const regular = seasons.filter((s) => s.season_number > 0);
    return regular.length > 0 ? regular : seasons;
  }, [seasons]);

  const [sortedByName, { toggle, close }] = useDisclosure(false);
  const [search, setSearch] = useState("");
  const [searchQuery] = useDebouncedValue(search, 300);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [seasonNumber, setSeasonNumber] = useState(() =>
    DISPLAY_SEASONS[0]?.season_number?.toString() || "1",
  );

  return (
    <section ref={ref} id="seasons-episodes" className="z-3 flex flex-col gap-3">
      {/* No `color` any more: amber here meant "this is the TV page", which is
          colour as taxonomy (§1.1.3). */}
      <SectionTitle size="h5">Episodes</SectionTitle>
      <Card shadow="none" className="border border-white/10 bg-white/[0.025] sm:p-3">
        <CardHeader className="grid grid-cols-1 grid-rows-[1fr_auto] gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <Select
            aria-label="Seasons"
            selectedKeys={[seasonNumber]}
            disallowEmptySelection={true}
            classNames={{ trigger: "border border-white/10 bg-white/[0.035]" }}
            onChange={(e) => {
              close();
              setSearch("");
              setSeasonNumber(e.target.value);
            }}
          >
            {DISPLAY_SEASONS.map(({ season_number, name }) => (
              <SelectItem key={season_number.toString()}>{name}</SelectItem>
            ))}
          </Select>
          <Input
            isClearable
            aria-label="Search Episodes"
            placeholder="Search episodes..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search />}
            classNames={{ inputWrapper: "border border-white/10 bg-white/[0.035]" }}
          />
          <Tooltip content={titleCase(layout)}>
            <Tabs
              aria-label="Layout Select"
              size="sm"
              classNames={{ tabList: "border border-white/10 bg-white/[0.035]" }}
              onSelectionChange={(value) => setLayout(value as typeof layout)}
              selectedKey={layout}
            >
              <Tab key="list" title={<List />} />
              <Tab key="grid" title={<Grid />} />
            </Tabs>
          </Tooltip>
          {/* `solid`, not `shadow`: the shadow variant emits a coloured glow (§9). */}
          <IconButton
            tooltip="Sort by name"
            className="p-2"
            icon={<SortAlpha />}
            onPress={toggle}
            aria-pressed={sortedByName}
            variant={sortedByName ? "solid" : "faded"}
          />
        </CardHeader>
        <CardBody className="p-0 sm:p-3">
          <ScrollShadow className="py-2 pr-0 md:max-h-[600px] md:pr-3">
            <TvShowEpisodesSelection
              id={id}
              seasonNumber={Number(seasonNumber)}
              filters={{ searchQuery, sortedByName, layout }}
            />
          </ScrollShadow>
        </CardBody>
      </Card>
    </section>
  );
});

TvShowsSeasonsSelection.displayName = "TvShowsSeasonsSelection";

export default memo(TvShowsSeasonsSelection);
