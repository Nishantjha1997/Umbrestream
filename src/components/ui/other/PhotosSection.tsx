"use client";

import SectionTitle from "@/components/ui/other/SectionTitle";
import { isEmpty } from "@/utils/helpers";
import { Eye } from "@/utils/icons";
import { getImageUrl } from "@/utils/movies";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Image as ImageProps } from "tmdb-ts";
import { Slide } from "yet-another-react-lightbox";

const Gallery = dynamic(() => import("@/components/ui/overlay/Gallery"), { ssr: false });

/** The grid shows this many; the rest live behind the "+N" tile. */
const VISIBLE = 4;

interface PhotosSectionProps {
  images: ImageProps[];
  /**
   * @deprecated Inert. This used to pick between a blue and an amber accent bar
   * on the heading — colour as media-type taxonomy, which Apple TV+ does not do
   * (§1.1.3). Kept so the movie and TV pages keep compiling.
   */
  type?: "movie" | "tv";
}

/**
 * Backdrop gallery.
 *
 * Two things changed beyond the colour removal. The thumbnails used to be
 * `Image`s with an `onClick`, so the lightbox was unreachable by keyboard;
 * they are real `<button>`s now, with a focus ring at least as loud as the
 * hover state. And the whole section returns `null` when a title has no
 * backdrops, instead of rendering a "Photos" heading over an empty grid.
 */
const PhotosSection: React.FC<PhotosSectionProps> = ({ images }) => {
  const [index, setIndex] = useState<number>(-1);

  if (isEmpty(images)) return null;

  const slides: Slide[] = images.map(({ file_path, width, height }) => ({
    src: getImageUrl(file_path, "backdrop", true),
    description: `${width}x${height}`,
  }));

  const visible = images.slice(0, VISIBLE);
  const remaining = images.length - visible.length;

  return (
    <section id="gallery" className="z-3 flex flex-col gap-3">
      <SectionTitle size="h5">Photos</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visible.map(({ file_path }, i) => {
          const isOverflowTile = i === VISIBLE - 1 && remaining > 0;

          return (
            <button
              key={file_path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={
                isOverflowTile
                  ? `View all ${images.length} photos`
                  : `View photo ${i + 1} of ${images.length}`
              }
              className="group relative aspect-video w-full overflow-hidden rounded-(--radius-card) bg-default-200 shadow-(--elevation-card) ring-1 ring-white/0 transition duration-(--duration-base) ease-(--ease-out-quint) hover:ring-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
            >
              {/* Decorative: the button already carries the accessible name. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(file_path, "backdrop")}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                draggable={false}
                className="size-full object-cover object-center transition-transform duration-(--duration-base) ease-(--ease-out-quint) group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />

              {isOverflowTile ? (
                <span className="glass-control pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-0 text-lg font-semibold">
                  +{remaining}
                </span>
              ) : (
                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <span className="glass-control flex size-11 items-center justify-center rounded-full border opacity-0 transition-opacity duration-(--duration-base) ease-(--ease-out-quint) group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                    <Eye className="size-5" />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Gallery open={index >= 0} index={index} close={() => setIndex(-1)} slides={slides} />
    </section>
  );
};

export default PhotosSection;
