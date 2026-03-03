'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { motion } from 'motion/react';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen bg-[#f5f5f7] relative overflow-x-hidden">
      <Sidebar />
      <main className="w-full min-h-screen pt-16">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
