import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Stats } from '@/components/Stats';
import { Community } from '@/components/Community';
import { Contribute } from '@/components/Contribute';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="fixed inset-0 bg-black opacity-50 z-0" />
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
      </div>

      <div className="relative z-10">
        <Header />

        <main>
          <Hero />
          <Features />
          <Stats />
          <Community />
          <Contribute />
        </main>

        <Footer />
      </div>
    </div>
  );
}