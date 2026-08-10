/**
 * Disclaimer copy, kept in one place.
 *
 * This used to live inside the blocking modal component. It now renders as a
 * static section on /about instead, so the text has a single source rather
 * than being duplicated between a modal and a page.
 */
export interface DisclaimerParagraph {
  id: string;
  content: string;
  emphasis?: string;
  continuation?: string;
}

export const DISCLAIMER_TITLE = "Disclaimer";

export const DISCLAIMER_PARAGRAPHS: DisclaimerParagraph[] = [
  {
    id: "welcome",
    content:
      "Welcome to StreamFree. Please read this disclaimer carefully before using this website.",
  },
  {
    id: "purpose",
    content: "StreamFree is developed solely for",
    emphasis: "educational and learning purposes.",
    continuation:
      "This website is an open-source project intended to demonstrate web development skills and is not meant to promote or encourage digital piracy in any form.",
  },
  {
    id: "content-source",
    content:
      "All content displayed on StreamFree (including but not limited to movies, images, posters, and related information) is sourced from",
    emphasis: "third-party providers through APIs or embedding.",
    continuation:
      "I do not host, store, or distribute any media files on my servers. The website merely aggregates content that is already available on the internet.",
  },
  {
    id: "responsibility",
    content:
      "By using StreamFree, you acknowledge that we bear no responsibility for user actions, content accuracy, or any direct or indirect damages arising from the use of this website. Users are solely responsible for their actions while using this service. We respect intellectual property rights and will respond to legitimate requests from copyright holders for content removal.",
  },
  {
    id: "usage",
    content:
      "This website should only be used for learning purposes. Any illegal activities, including but not limited to unauthorized downloading, redistribution of content, or commercial use, are strictly prohibited. By using StreamFree, you acknowledge that",
    emphasis: "you use the service at your own risk.",
  },
];
