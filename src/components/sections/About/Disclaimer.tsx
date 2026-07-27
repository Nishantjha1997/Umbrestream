import { DISCLAIMER_PARAGRAPHS, DISCLAIMER_TITLE } from "@/config/disclaimer";
import SectionTitle from "@/components/ui/other/SectionTitle";

/**
 * Static disclaimer section for /about.
 *
 * Replaces the blocking modal that previously interrupted every first visit
 * with a 10-second countdown before its Agree button unlocked. Same copy, read
 * on demand instead of enforced up front.
 */
const AboutDisclaimer: React.FC = () => {
  return (
    <section id="disclaimer" className="flex flex-col gap-3">
      <SectionTitle>{DISCLAIMER_TITLE}</SectionTitle>
      <div className="text-default-600 flex flex-col gap-3 text-sm leading-relaxed">
        {DISCLAIMER_PARAGRAPHS.map(({ id, content, emphasis, continuation }) => (
          <p key={id}>
            {content}
            {emphasis && (
              <>
                {" "}
                <strong className="text-foreground">{emphasis}</strong>
              </>
            )}
            {continuation && ` ${continuation}`}
          </p>
        ))}
      </div>
    </section>
  );
};

export default AboutDisclaimer;
