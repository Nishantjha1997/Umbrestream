"use client";

import useBreakpoints from "@/hooks/useBreakpoints";
import { Accordion, AccordionItem } from "@heroui/react";

const FAQS = [
  {
    title: "What is StreamFree?",
    description:
      "StreamFree is an entertainment discovery interface for browsing movies, TV series, and anime, with episode navigation, watch history, and a mobile-friendly player experience.",
  },
  {
    title: "Who operates the video players?",
    description:
      "Playback can be provided by independently operated third-party services. StreamFree does not knowingly host or store movie, television, or anime video files on its own servers.",
  },
  {
    title: "A player shows pop-ups or does not start. What should I do?",
    description: (
      <p>
        Close unexpected pop-ups and avoid downloading anything from them. If a provider is
        disruptive or does not start, return to the player menu and select another available server.
      </p>
    ),
  },
  {
    title: "Why can playback speed vary?",
    description:
      "StreamFree can display providers operated outside this site, so startup time and availability may vary by title, region, device, or provider load. The player remembers a successful choice during your session where supported.",
  },
  {
    title: "Does StreamFree offer downloads?",
    description:
      "No. StreamFree does not provide a download feature or store media files. Respect the rights and terms that apply to any content you access.",
  },
  {
    title: "How can a rights holder report a concern?",
    description:
      "Please use the specific reporting steps in the DMCA & Copyright Notice, including the exact StreamFree page URL and enough information to identify the concern.",
  },
];

const FAQ = () => {
  const { mobile } = useBreakpoints();

  return (
    <Accordion variant="splitted" isCompact={mobile}>
      {FAQS.map(({ title, description }) => (
        <AccordionItem key={title} aria-label={title} title={title}>
          {description}
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FAQ;
