import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Heart, Sparkles, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="font-body overflow-x-hidden selection:bg-accent selection:text-white bg-[#FAF9F5] text-[#2C2C2C] min-h-screen pt-24 lg:pt-32 pb-16 lg:pb-24">
      <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12">
        
        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-20 lg:mb-32">
          <div className="w-full lg:w-1/2 z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-4 md:mb-6"
            >
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Our Story</span>
              <div className="h-px w-8 md:w-12 bg-gray-300"></div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-[76px] font-heading font-normal text-[#2C2C2C] leading-[1.05] mb-3 md:mb-4"
            >
              Redefining <br className="hidden md:block" />
              <span className="text-3xl md:text-5xl lg:text-[56px] block mt-1 md:mt-0">the way you travel</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-script text-2xl md:text-3xl text-[#8A9A74] mb-6 md:mb-8"
            >
              with elegance and trust...
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-gray-500 text-sm md:text-base font-light mb-8 md:mb-10 max-w-md leading-relaxed"
            >
              Innovative Hotel Solution was born out of a simple frustration: why does booking a luxury hotel and arranging a reliable cab to get there require jumping between multiple disconnected apps? We set out to create a unified platform that handles both with absolute elegance and seamless integration.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative z-20 h-[350px] md:h-[500px] xl:h-[650px]"
          >
            <div className="w-full h-full rounded-[30px] md:rounded-[40px] overflow-hidden shadow-2xl shadow-[#8A9A74]/20 border-[6px] md:border-[10px] border-white">
              <img src="/images/hero1.png" alt="Our Story" className="w-full h-full object-cover object-center" />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white rounded-full p-4 md:p-6 shadow-xl border border-gray-100 flex items-center justify-center">
              <span className="font-heading text-xl md:text-3xl text-[#8A9A74]">Est. 2024</span>
            </div>
          </motion.div>
        </div>

        {/* MISSION SECTION */}
        <div className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-16 shadow-sm border border-gray-100 mb-20 lg:mb-32 flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-[#F3F1EB] rounded-bl-full -z-10 opacity-50"></div>
          
          <div className="w-full md:w-1/3">
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#2C2C2C] mb-1 md:mb-2">Our Mission</h2>
            <p className="font-script text-xl md:text-2xl text-[#8A9A74]">beyond boundaries</p>
          </div>
          
          <div className="w-full md:w-2/3 border-t-2 md:border-t-0 md:border-l-2 border-[#F3F1EB] pt-6 md:pt-0 pl-0 md:pl-12">
            <p className="text-lg md:text-2xl text-gray-600 font-light leading-relaxed">
              "To empower travelers with a seamless, end-to-end journey. From the moment you step out of your door to the moment you sink into your hotel bed, we are there to ensure safety, comfort, and absolute transparency."
            </p>
          </div>
        </div>

        {/* CORE VALUES */}
        <div className="mb-16 lg:mb-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3 md:mb-4">
                <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Principles</span>
                <div className="h-px w-8 md:w-12 bg-gray-300"></div>
              </div>
              <h2 className="text-3xl md:text-5xl font-heading text-[#2C2C2C] leading-tight">
                Our Core Values
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: <Sparkles size={20} className="md:w-6 md:h-6" />, title: "Elegance", desc: "A premium, carefully curated experience in every interaction." },
              { icon: <ShieldCheck size={20} className="md:w-6 md:h-6" />, title: "Trust", desc: "Transparent pricing with zero hidden fees, ever." },
              { icon: <Globe size={20} className="md:w-6 md:h-6" />, title: "Innovation", desc: "Constantly pushing the boundaries of travel technology." },
              { icon: <Heart size={20} className="md:w-6 md:h-6" />, title: "Partnership", desc: "Growing sustainably alongside our hotel and cab network." }
            ].map((val, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-[#F3F1EB] rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:bg-[#8A9A74] transition-colors duration-500 cursor-default"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl shadow-sm flex items-center justify-center text-[#8A9A74] mb-6 md:mb-8 group-hover:text-[#2C2C2C] transition-colors">
                  {val.icon}
                </div>
                <h4 className="text-lg md:text-xl font-bold text-[#2C2C2C] mb-2 md:mb-3 group-hover:text-white transition-colors">{val.title}</h4>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed group-hover:text-[#F3F1EB] transition-colors">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
