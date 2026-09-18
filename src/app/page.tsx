import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { About } from "@/components/home/About";
import { Experience } from "@/components/home/Experience";
import { Skills } from "@/components/home/Skills";
import { Recognition } from "@/components/home/Recognition";
import { ContactSection } from "@/components/home/ContactSection";
import { profile } from "@/data/profile";
import { siteUrl } from "@/lib/site";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: siteUrl,
    image: `${siteUrl}${profile.avatar}`,
    email: profile.email,
    jobTitle: "AI Engineer",
    description: profile.tagline,
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "National University of Sciences & Technology (NUST)",
    },
    address: { "@type": "PostalAddress", addressLocality: "Islamabad", addressCountry: "PK" },
    sameAs: [profile.links.github, profile.links.linkedin],
    knowsAbout: [...profile.interests],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <Marquee />
      <FeaturedProjects />
      <About />
      <Experience />
      <Skills />
      <Recognition />
      <ContactSection />
    </>
  );
}
