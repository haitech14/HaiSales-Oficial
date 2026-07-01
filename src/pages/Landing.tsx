import { LandingHeader } from "@/components/landing/LandingHeader";

import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPromoBanner } from "@/components/landing/LandingPromoBanner";

import { LandingValueHero } from "@/components/landing/LandingValueHero";

import { LandingProductShowcase } from "@/components/landing/LandingProductShowcase";

import { LandingGrowthShowcase } from "@/components/landing/LandingGrowthShowcase";
import { LandingPlatformShowcase } from "@/components/landing/LandingPlatformShowcase";

import { LandingClosingSections } from "@/components/landing/LandingClosingSections";

import { LandingFooter } from "@/components/landing/LandingFooter";



const Landing = () => {

  return (

    <div className="min-h-screen overflow-x-hidden">

      <div className="bg-[#050816]">

        <LandingHeader />

        <LandingHero />

      </div>

      <LandingValueHero />

      <LandingPlatformShowcase />

      <LandingPromoBanner compact />

      <LandingProductShowcase />

      <LandingGrowthShowcase />

      <LandingClosingSections />

      <LandingFooter />

    </div>

  );

};



export default Landing;

