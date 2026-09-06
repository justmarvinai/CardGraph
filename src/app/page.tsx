import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Showcase } from '@/components/landing/showcase';
import { Features } from '@/components/landing/features';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Showcase />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
