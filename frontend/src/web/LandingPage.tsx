import React from 'react';
import Navbar from './Navbar';
import Hero from './landingPageSubComponents/Hero';
import About from './landingPageSubComponents/About';
import Features from './landingPageSubComponents/Features';
import Enterprise from './landingPageSubComponents/Enterprise';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home" className="min-h-screen">
        <Hero />
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen">
        <About />
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen">
        <Features />
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="min-h-screen">
        <Enterprise />
      </section>

  
    </div>
  );
};

export default LandingPage;