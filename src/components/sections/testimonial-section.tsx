import React from 'react';

const TestimonialSection = () => {
  const bgImageUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/37f43346-3716-43c8-b720-aa9f901e52d7-terminal-industries-com/assets/images/filters:format(jpeg):quality(85)-2.jpg?";

  return (
    <section
      className="relative bg-cover bg-center text-white font-primary"
      style={{ backgroundImage: `url('${bgImageUrl}')` }}
    >
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
      <div className="relative container py-32 md:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote>
            <p className="text-4xl lg:text-5xl font-light leading-tight tracking-tight">
              “We have not seen this kind of accuracy with rocket technology… this is a significant milestone in the race to modernize space exploration.”
            </p>
          </blockquote>
          <cite className="mt-8 block not-italic">
            <p className="text-lg font-medium">Karen Jones</p>
            <p className="mt-1 text-neutral-300">Head of New Product, Ryder System, Inc.</p>
          </cite>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;