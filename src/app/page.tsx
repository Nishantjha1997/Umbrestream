import { NextPage } from "next";
import DesktopHome from "@/components/shell/desktop/home/DesktopHome";
import PhoneHome from "@/components/shell/phone/home/PhoneHome";

/**
 * Home (Phase 4, §8). Phone and desktop diverge more here than anywhere else
 * in the app, so — like the nav shell (Phase 2, §6) — this is a fork, not one
 * component branching on a breakpoint: `PhoneHome` is `md:hidden`,
 * `DesktopHome` is `hidden md:block`, both always in the DOM so the browser's
 * CSS engine resolves the choice before first paint. There is no shared
 * "Home" component to speak of; each shell owns its own composition under
 * `src/components/shell/{phone,desktop}/home/`.
 */
const HomePage: NextPage = () => {
  return (
    <>
      <div className="md:hidden">
        <PhoneHome />
      </div>
      <div className="hidden md:block">
        <DesktopHome />
      </div>
    </>
  );
};

export default HomePage;
