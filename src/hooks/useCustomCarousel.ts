"use client";

import useEmblaCarousel from "embla-carousel-react";
import { EmblaOptionsType, EmblaPluginType } from "embla-carousel";
import { useCallback, useEffect, useState } from "react";

/**
 * Custom hook that provides carousel functionality using Embla Carousel.
 *
 * @param {EmblaOptionsType} [options] - Optional configuration options for the Embla Carousel.
 * @param {EmblaPluginType[]} [plugins] - Optional array of plugins to enhance the carousel.
 * @returns {object} An object containing:
 * - `emblaRef`: Ref to attach to the carousel container.
 * - `scrollTo`: Function to scroll to a specific index.
 * - `scrollNext`: Function to scroll to the next item.
 * - `scrollPrev`: Function to scroll to the previous item.
 * - `selectedIndex`: The current selected index of the carousel.
 * - `canScrollNext`: Boolean indicating if the carousel can scroll to the next item.
 * - `canScrollPrev`: Boolean indicating if the carousel can scroll to the previous item.
 */
export const useCustomCarousel = (options?: EmblaOptionsType, plugins?: EmblaPluginType[]) => {
  const [emblaRef, embla] = useEmblaCarousel(options, plugins);

  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => embla?.scrollTo(index), [embla]);
  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  /**
   * §11.1: this used to run in the render body — `if (embla) embla.on("select", ...)`
   * — which registered a brand new handler on every single render and never
   * removed any of them. It also listened to `select` alone, so the
   * canScrollPrev/Next booleans went stale after a re-init or a viewport
   * resize (slidesToScroll: "auto" recalculates its snaps on both), leaving
   * arrows and ScrollShadow pointing the wrong way.
   */
  useEffect(() => {
    if (!embla) return;

    const sync = () => {
      setCanScrollPrev(embla.canScrollPrev());
      setCanScrollNext(embla.canScrollNext());
      setSelectedIndex(embla.selectedScrollSnap());
    };

    sync();
    embla.on("select", sync).on("reInit", sync).on("resize", sync).on("settle", sync);

    return () => {
      embla.off("select", sync).off("reInit", sync).off("resize", sync).off("settle", sync);
    };
  }, [embla]);

  return { emblaRef, scrollTo, scrollNext, scrollPrev, selectedIndex, canScrollNext, canScrollPrev };
};
