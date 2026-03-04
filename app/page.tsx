import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Listings from "@/components/Listings";
import RoommateSection from "@/components/Roommatesection";
import SecuritySection from "@/components/securitysection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Features />
      <Listings />
      <RoommateSection />
      <SecuritySection />
      <Footer />
    </main>
  );
}