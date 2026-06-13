import React from 'react';
import { motion } from 'framer-motion';

const AboutUs = () => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-24">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-accent font-bold tracking-widest uppercase text-xs mb-4"
          >
            Our Story
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-heading font-bold text-primary mb-6 leading-tight"
          >
            Redefining Hospitality & Mobility
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mx-auto"
        >
          <img src="/images/hero.png" alt="Office" className="w-full h-[500px] object-cover mb-20" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            <div className="md:col-span-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-2">01</h2>
              <h3 className="text-2xl font-heading font-bold text-primary">The Beginning</h3>
            </div>
            <div className="md:col-span-8">
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                Innovative Hotel Solution was born out of a simple frustration: why does booking a luxury hotel and arranging a reliable cab to get there require jumping between multiple disconnected apps? We set out to create a unified platform that handles both with absolute elegance and seamless integration.
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 mb-24"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            <div className="md:col-span-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-2">02</h2>
              <h3 className="text-2xl font-heading font-bold text-primary">Our Mission</h3>
            </div>
            <div className="md:col-span-8">
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                Our mission is to empower travelers with a seamless, end-to-end journey. From the moment you step out of your door to the moment you sink into your hotel bed, we are there to ensure safety, comfort, and transparency.
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 mb-24"></div>

          <div className="mb-24">
            <h3 className="text-3xl font-heading font-bold text-primary mb-12 text-center">Our Core Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Elegance</h4>
                <p className="text-gray-500 font-light leading-relaxed">A premium, carefully curated experience in every interaction.</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Trust</h4>
                <p className="text-gray-500 font-light leading-relaxed">Transparent pricing with zero hidden fees, ever.</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Innovation</h4>
                <p className="text-gray-500 font-light leading-relaxed">Constantly pushing the boundaries of travel technology.</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Partnership</h4>
                <p className="text-gray-500 font-light leading-relaxed">Growing sustainably alongside our hotel and cab network.</p>
              </div>
            </div>
          </div>
          
        </motion.div>

      </div>
    </div>
  );
};

export default AboutUs;
