import React from 'react';
import { motion } from 'framer-motion';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I book a hotel and a cab together?",
      answer: "First, reserve your hotel room. Once confirmed, seamlessly navigate to the cab section to book your transport to the destination."
    },
    {
      question: "What payment methods are supported?",
      answer: "We support major Credit/Debit cards and UPI. For cab rides, we also offer a Cash on Delivery (COD) option where you pay the driver directly."
    },
    {
      question: "Is there a cancellation fee?",
      answer: "Cancellations made 24 hours prior to the booking are fully refundable. Specific policies depend on the hotel or cab provider."
    },
    {
      question: "How do I become a Service Provider?",
      answer: "Click 'Become a Partner' or 'Register', select the Service Provider role, and fill out our streamlined onboarding form."
    },
    {
      question: "Are the cab fares fixed?",
      answer: "Cab fares are estimated based on distance and demand. The final fare is transparently displayed before you confirm the booking."
    }
  ];

  return (
    <div className="pt-32 pb-32 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-24">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-accent font-bold tracking-widest uppercase text-xs mb-4"
          >
            Support Center
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading font-bold text-primary mb-6"
          >
            Questions & Answers
          </motion.h2>
        </div>

        <div className="space-y-12">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-b border-gray-200 pb-12"
            >
              <h3 className="font-heading font-bold text-2xl text-primary mb-4">{faq.question}</h3>
              <p className="text-gray-500 font-light text-lg leading-relaxed max-w-3xl">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default FAQ;
