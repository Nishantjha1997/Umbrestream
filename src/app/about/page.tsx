import { FaGithub } from "react-icons/fa6";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { NextPage } from "next";
const FAQ = dynamic(() => import("@/components/sections/About/FAQ"));
const AboutDisclaimer = dynamic(() => import("@/components/sections/About/Disclaimer"));

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
};

const AboutPage: NextPage = () => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <Suspense>
          <FAQ />
        </Suspense>
        <Suspense>
          <AboutDisclaimer />
        </Suspense>
        <Link target="_blank" href={siteConfig.socials.github} className="flex justify-center">
          <FaGithub size={30} />
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
