"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
  useInView,
  animate,
  useMotionValue,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

// Animated Counter Component
const AnimatedCounter = ({
  target,
  isActive,
}: {
  target: number;
  isActive: boolean;
}) => {
  const [current, setCurrent] = useState(0);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (isActive) {
      setCurrent(0); // Reset to 0 first
      const controls = animate(motionValue, target, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (latest) => {
          setCurrent(Math.round(latest));
        },
      });

      return controls.stop;
    } else {
      // Show the target value immediately for non-active steps
      setCurrent(target);
    }
  }, [target, isActive, motionValue]);

  return <span>{current}</span>;
};

export const Timeline = ({
  data,
  currentStep,
  completionPercentage,
  title = "IP Licensing Form", // Add default title prop
}: {
  data: TimelineEntry[];
  currentStep: number;
  completionPercentage: number;
  title?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  // Auto-scroll to current step when currentStep changes
  useEffect(() => {
    const currentStepElement = stepRefs.current[currentStep];
    if (currentStepElement) {
      currentStepElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [currentStep]);

  // Calculate progress based on current step instead of scroll
  const progress = data.length > 1 ? currentStep / (data.length - 1) : 0;
  const heightTransform = height * progress;
  const opacityTransform = progress > 0 ? 1 : 0;

  return (
    <div
      className="w-full bg-white dark:bg-neutral-950 font-sans md:px-10"
      ref={containerRef}
    >
      {/* Centered Header Container */}
      <div className="flex flex-col items-center justify-center text-center py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-5xl mb-4 text-black dark:text-white font-redHatDisplay">
          {title}
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base max-w-md font-redHatDisplay">
          Complete the form step by step to complete your task.
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
            className={`flex justify-start pt-10 md:pt-40 md:gap-10 transition-opacity duration-300 min-h-screen ${
              index === currentStep
                ? "opacity-100"
                : "opacity-30 pointer-events-none"
            }`}
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center">
                <div
                  className={`h-4 w-4 rounded-full border font-redHatDisplay border-neutral-300 dark:border-neutral-700 p-2 transition-colors ${
                    index <= currentStep
                      ? "bg-blue-500 border-blue-500"
                      : "bg-neutral-200 dark:bg-neutral-800"
                  }`}
                />
              </div>
              <div className="hidden md:block md:pl-20">
                <h3 className="text-xl md:text-5xl font-bold font-redHatDisplay text-neutral-300 dark:text-neutral-300">
                  {item.title}
                </h3>
                <div className="text-sm font-redHatDisplay text-blue-600 dark:text-blue-400 font-medium mt-2">
                  <AnimatedCounter
                    target={completionPercentage}
                    isActive={index === currentStep}
                  />{" "}
                  % Complete
                </div>
              </div>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <div className="md:hidden block mb-4">
                <h3 className="text-2xl font-bold text-neutral-500 dark:text-neutral-500">
                  {item.title}
                </h3>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                  <AnimatedCounter
                    target={completionPercentage}
                    isActive={index === currentStep}
                  />{" "}
                  % Complete
                </div>
              </div>
              {item.content}
            </div>
          </div>
        ))}

        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            animate={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
