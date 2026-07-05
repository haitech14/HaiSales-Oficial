import { lazy, Suspense } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPromoBanner } from "@/components/landing/LandingPromoBanner";
import { LandingProductShowcase } from "@/components/landing/LandingProductShowcase";
import { LandingGrowthShowcase } from "@/components/landing/LandingGrowthShowcase";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Loader2 } from "lucide-react";

const LandingPlatformShowcase = lazy(() =>
  import("@/components/landing/LandingPlatformShowcase").then((module) => ({
    default: module.LandingPlatformShowcase,
  })),
);
const LandingClosingSections = lazy(() =>
  import("@/components/landing/LandingClosingSections").then((module) => ({
    default: module.LandingClosingSections,
  })),
);

function SectionFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center bg-[#050816]">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
  );
}

const Landing = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="bg-[#050816]">
        <LandingHeader />
        <LandingHero />
      </div>

      <Suspense fallback={<SectionFallback />}>
        <LandingPlatformShowcase />
      </Suspense>

      <LandingPromoBanner compact />

      <LandingProductShowcase />

      <LandingGrowthShowcase />

      <Suspense fallback={<SectionFallback />}>
        <LandingClosingSections />
      </Suspense>

      <LandingFooter />
    </div>
  );
};

export default Landing;
