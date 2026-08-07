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

  return (
    <div className="flex w-full flex-wrap justify-center gap-3">
      {!hideContentTypeTabs && <ContentTypeSelection className="mb-5 justify-center" />}
      <div className="flex w-full flex-wrap justify-center gap-3">
        <Select
          disallowEmptySelection
          selectionMode="single"
          size="sm"
          label="Type"
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
          type={content}
          selectedKeys={genres}
          onGenreChange={(genres) => {
            setGenres(genres);
            setQueryType("discover");
          }}
        />
      </div>
      <Button size="sm" onPress={resetFilters}>
        Reset Filters
      </Button>
    </div>
  );
};

export default DiscoverFilters;
