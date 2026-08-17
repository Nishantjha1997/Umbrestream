import GenresSelect from "@/components/ui/input/GenresSelect";
import ContentTypeSelection from "@/components/ui/other/ContentTypeSelection";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { DiscoverMoviesFetchQueryType } from "@/types/movie";
import { Select, SelectItem, Button } from "@heroui/react";

interface DiscoverFiltersProps {
  /** `/browse` (Phase 3, §7) already has its own Films/Series/Categories
      tab driving the same `content` state — showing this component's own
      movie/tv/anime tabs on top of it would be two conflicting switchers
      for one piece of state. `/discover` (unchanged) still wants both. */
  hideContentTypeTabs?: boolean;
}

const DiscoverFilters = ({ hideContentTypeTabs }: DiscoverFiltersProps = {}) => {
  const { types, content, genres, queryType, setQueryType, setGenres, resetFilters } =
    useDiscoverFilters();
  const hasActiveFilters = queryType !== "discover" || genres.size > 0;

  return (
    <div
      className="flex w-full flex-wrap justify-center gap-3"
      aria-label="Browse filters"
      data-browse-filters
    >
      {!hideContentTypeTabs && <ContentTypeSelection className="mb-5 justify-center" />}
      <div className="flex w-full flex-wrap justify-center gap-3" role="group" aria-label="Filter catalogue">
        <Select
          id="discover-type"
          disallowEmptySelection
          selectionMode="single"
          size="sm"
          label="Type"
          aria-label="Catalogue type"
          placeholder="Select type"
          className="max-w-xs"
          selectedKeys={[queryType]}
          onChange={({ target }) => {
            setQueryType(target.value as DiscoverMoviesFetchQueryType);
            setGenres(null);
          }}
          value={queryType}
        >
          {types.map(({ name, key }) => {
            return <SelectItem key={key}>{name}</SelectItem>;
          })}
        </Select>
        <GenresSelect
          id="discover-genres"
          type={content}
          aria-label={`${content === "tv" ? "Series" : "Movie"} genres`}
          selectedKeys={genres}
          onGenreChange={(genres) => {
            setGenres(genres);
            setQueryType("discover");
          }}
        />
      </div>
      <Button
        size="sm"
        variant={hasActiveFilters ? "solid" : "flat"}
        isDisabled={!hasActiveFilters}
        onPress={resetFilters}
        aria-label={hasActiveFilters ? "Reset active browse filters" : "No active browse filters"}
      >
        Reset Filters
      </Button>
    </div>
  );
};

export default DiscoverFilters;
