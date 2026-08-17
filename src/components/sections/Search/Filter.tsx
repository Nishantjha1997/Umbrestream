"use client";

import { getSearchSuggestions } from "@/actions/search";
import SearchInput from "@/components/ui/input/SearchInput";
import ContentTypeSelection from "@/components/ui/other/ContentTypeSelection";
import Highlight from "@/components/ui/other/Highlight";
import useBreakpoints from "@/hooks/useBreakpoints";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { SEARCH_HISTORY_STORAGE_KEY } from "@/utils/constants";
import { cn, isEmpty } from "@/utils/helpers";
import { ArrowUpLeft, Close, History, Movie, Search, TV } from "@/utils/icons";
import { spring, transition, useReducedMotionSafe } from "@/utils/motion";
import { useRouter } from "@bprogress/next/app";
import { Button, Listbox, ListboxItem } from "@heroui/react";
import { useDebouncedValue, useLocalStorage } from "@mantine/hooks";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useState } from "react";

interface SearchFilterProps extends React.HTMLAttributes<HTMLFormElement> {
  isLoading?: boolean;
  onSearchSubmit?: (value: string) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ isLoading, onSearchSubmit, ...props }) => {
  const router = useRouter();
  const { mobile } = useBreakpoints();
  const { content } = useDiscoverFilters();
  const reduceMotion = useReducedMotionSafe();
  const [triggered, setTriggered] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [searchHistories, setSearchHistories] = useLocalStorage<string[]>({
    key: SEARCH_HISTORY_STORAGE_KEY,
    defaultValue: [],
  });
  const enableFetch = debouncedSearchQuery.length > 3 && !isLoading && !triggered;
  const { data, isFetching } = useQuery({
    enabled: enableFetch,
    queryKey: ["search-suggestions", debouncedSearchQuery],
    queryFn: async () => await getSearchSuggestions(debouncedSearchQuery),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
  const showSuggestions = enableFetch && !isFetching;
  const showHistory = !showSuggestions && !isEmpty(searchHistories) && !isLoading && !triggered;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTriggered(!isEmpty(searchQuery));
      onSearchSubmit?.(searchQuery);
      if (searchQuery && !searchHistories.includes(searchQuery)) {
        const newHistories = [...searchHistories, searchQuery];
        if (newHistories.length > 5) {
          newHistories.shift();
        }
        setSearchHistories(newHistories);
      }
    },
    [onSearchSubmit, searchHistories, searchQuery, setSearchHistories],
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setTriggered(false);
    setActiveSuggestion(-1);
    onSearchSubmit?.("");
  }, [onSearchSubmit, setSearchQuery]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const suggestions = data?.data ?? [];
      if (!showSuggestions || suggestions.length === 0) {
        if (event.key === "Escape") setActiveSuggestion(-1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((current) => (current + 1) % suggestions.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      } else if (event.key === "Escape") {
        event.preventDefault();
        setActiveSuggestion(-1);
      } else if (event.key === "Enter" && activeSuggestion >= 0) {
        event.preventDefault();
        const suggestion = suggestions[activeSuggestion];
        if (suggestion) router.push(`/${suggestion.type}/${suggestion.id}`);
      }
    },
    [activeSuggestion, data?.data, router, showSuggestions],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex w-full max-w-xl flex-col justify-center gap-5 text-center", {
        "absolute-center px-3 md:px-0": !triggered,
      })}
      {...props}
    >
      <ContentTypeSelection className="justify-center" />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2">
          <SearchInput
            autoFocus
            placeholder={`Search your favorite ${content === "movie" ? "movies" : content === "tv" ? "TV shows" : "anime"}...`}
            isLoading={isLoading}
            value={searchQuery}
            onKeyDown={handleSearchKeyDown}
            aria-controls={showSuggestions ? "search-suggestions" : undefined}
            aria-expanded={showSuggestions}
            aria-activedescendant={
              activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined
            }
            onValueChange={(val) => {
              setSearchQuery(val);
              setActiveSuggestion(-1);
              if (isEmpty(val)) setTriggered(false);
            }}
            onClear={!isEmpty(searchQuery) ? handleClear : undefined}
          />
          <AnimatePresence>
            {!isEmpty(searchQuery) && (
              /*
                This used to animate `width: 0 -> auto`, which is a layout
                property: every frame re-ran layout for the whole row and the
                input reflowed alongside it. Scale and opacity are composited,
                so the button now pops in without touching layout — the row
                resizes once, on mount, instead of thirty times.
              */
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                transition={reduceMotion ? transition.fast : spring}
              >
                <Button
                  isLoading={isLoading}
                  isIconOnly={mobile}
                  type="submit"
                  radius="full"
                  variant="flat"
                  color={content === "movie" ? "primary" : "warning"}
                >
                  {mobile ? <Search /> : "Search"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/*
          The gating condition lives *inside* AnimatePresence now. It used to
          wrap it, so when the dropdown closed the AnimatePresence unmounted
          along with its child and the exit animation never got a chance to
          run — the panel simply vanished.

          The wrapper also carries the absolute positioning that used to sit on
          the Listbox. That is load-bearing: a `transform` makes an element the
          containing block for its absolutely-positioned descendants, so
          translating a static wrapper would have re-anchored `top-12` to the
          wrapper instead of the relative row and dropped the panel down the
          page. Positioning the animated element itself keeps the anchor.
        */}
        <AnimatePresence>
          {(showSuggestions || showHistory) && !(showSuggestions && isEmpty(data?.data)) && (
            <motion.div
              // Was `height: 0 -> auto` — a layout animation. Transform and
              // opacity only.
              className="absolute top-12 z-999 w-full md:top-13"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={reduceMotion ? transition.fast : transition.base}
            >
              <Listbox
                variant="flat"
                emptyContent={<p className="text-center">No search suggestions</p>}
                aria-label="Search Suggestions"
                id="search-suggestions"
                className="bg-content1 rounded-medium w-full shadow-2xl"
                classNames={{
                  list: "max-h-[10rem] md:max-h-[15rem] overflow-y-auto",
                }}
              >
                <>
                  {showHistory &&
                    searchHistories.map((history, index) => (
                      <ListboxItem
                        key={`history-${index}`}
                        className="text-start"
                        startContent={<History />}
                        endContent={
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="size-6"
                            onPress={() =>
                              setSearchHistories(
                                searchHistories.filter(
                                  (currentHistory) => currentHistory !== history,
                                ),
                              )
                            }
                          >
                            <Close size={24} />
                          </Button>
                        }
                        onPress={() => setSearchQuery(history)}
                      >
                        {history}
                      </ListboxItem>
                    ))}
                  {showSuggestions &&
                    (data?.data || []).map(({ id, title, type }, index) => (
                      <ListboxItem
                        key={`suggestion-${index}`}
                        id={`search-suggestion-${index}`}
                        className="text-start"
                        aria-selected={activeSuggestion === index}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        startContent={
                          type === "movie" ? (
                            <Movie className="text-primary" />
                          ) : (
                            <TV className="text-warning" />
                          )
                        }
                        endContent={
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="size-6"
                            onPress={() => {
                              setSearchQuery(title);
                            }}
                          >
                            <ArrowUpLeft size={20} />
                          </Button>
                        }
                        onPress={() => router.push(`/${type}/${id}`)}
                      >
                        <Highlight markType="bold" highlight={debouncedSearchQuery}>
                          {title}
                        </Highlight>
                      </ListboxItem>
                    ))}
                </>
              </Listbox>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
};

export default SearchFilter;
