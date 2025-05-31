"use client"

import Link from 'next/link';
import { AnimatedBackground } from "../components/animated-background";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 backdrop-blur-sm bg-zinc-900/30 p-8 rounded-lg border border-zinc-800">
          <h1 className="text-8xl font-bold mb-4 font-redHatDisplay">
            <span className="text-transparent font-medium" style={{ WebkitTextStroke: '1px white'}}>404</span>
          </h1>
          
          <h2 className="text-2xl font-semibold text-white mb-6 font-redHatDisplay">Page Not Found</h2>
          
          <p className="text-gray-300 mb-8 leading-relaxed font-redHatDisplay">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-4">
            <Link href="/" passHref>
              <Button 
                className="w-full group relative overflow-hidden transition-all duration-300"
                variant="default"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Return to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
