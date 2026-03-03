'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard,
  PenTool, 
  Image as ImageIcon, 
  Video, 
  Mic2, 
  RotateCcw, 
  MessageSquare,
  ChevronUp,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileActiveMenu, setMobileActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { 
      id: 'dashboard', 
      icon: LayoutDashboard, 
      label: t.dashboard, 
      href: '/' 
    },
    { 
      id: 'content', 
      icon: PenTool, 
      label: t.contentLab, 
      subItems: [
        { label: t.tool1Name, href: '/tools/content-suite' },
        { label: t.tool6Name, href: '/tools/shorts-factory' },
      ]
    },
    { 
      id: 'image', 
      icon: ImageIcon, 
      label: t.imageStudio, 
      subItems: [
        { label: t.tool3Name, href: '/tools/text-to-image' },
        { label: t.tool4Name, href: '/tools/image-editor' },
      ]
    },
    { 
      id: 'video', 
      icon: Video, 
      label: t.videoFactory, 
      subItems: [
        { label: t.tool5Name, href: '/tools/text-to-video' },
        { label: t.tool7Name, href: '/tools/film-generator' },
        { label: t.tool8Name, href: '/tools/full-video' },
      ]
    },
    { 
      id: 'voice', 
      icon: Mic2, 
      label: t.voiceLab, 
      subItems: [
        { label: t.tool10Name, href: '/tools/sound-generator' },
        { label: t.tool11Name, href: '/tools/voice-generator' },
      ]
    },
    { 
      id: 'reverse', 
      icon: RotateCcw, 
      label: t.reverseEngineering, 
      subItems: [
        { label: t.tool12Name, href: '/tools/image-extractor' },
        { label: t.tool13Name, href: '/tools/video-extractor' },
      ]
    },
    { 
      id: 'chat', 
      icon: MessageSquare, 
      label: t.aiAssistant, 
      href: '/chat' 
    },
    { 
      id: 'debug', 
      icon: ShieldCheck, 
      label: 'System Status', 
      href: '/debug' 
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <nav className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => {
              const isActive = activeMenu === item.id || (item.href && pathname === item.href);
              const hasSubItems = !!item.subItems;

              const content = (
                <div className="relative group px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all rounded-xl hover:bg-zinc-100">
                  <item.icon size={18} className={cn(isActive ? "text-blue-600" : "text-zinc-500")} />
                  <span className={cn(isActive ? "text-blue-600" : "text-zinc-600")}>{item.label}</span>
                  {hasSubItems && <ChevronUp size={14} className={cn("transition-transform duration-200 rotate-180", activeMenu === item.id && "rotate-0")} />}
                </div>
              );

              return (
                <div key={item.id} className="relative">
                  {hasSubItems ? (
                    <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="outline-none">
                      {content}
                    </button>
                  ) : (
                    <Link href={item.href!}>
                      {content}
                    </Link>
                  )}

                  <AnimatePresence>
                    {activeMenu === item.id && hasSubItems && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full mt-2 left-0 bg-white border border-zinc-200 shadow-2xl rounded-2xl p-2 min-w-[220px] overflow-hidden"
                      >
                        <div className="flex flex-col gap-1">
                          {item.subItems?.map((sub, idx) => (
                            <Link
                              key={idx}
                              href={sub.href}
                              onClick={() => setActiveMenu(null)}
                              className={cn(
                                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group",
                                pathname === sub.href ? "bg-blue-50 text-blue-600" : "text-zinc-600 hover:bg-zinc-50"
                              )}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

        <div className="flex items-center gap-4">
          {/* Language Switch */}
          <div className="hidden sm:flex items-center bg-zinc-100 rounded-xl p-1 gap-0.5">
            <button 
              onClick={() => setLanguage('English')}
              className={cn(
                "px-3 py-1 rounded-lg text-[11px] font-bold transition-all",
                language === 'English' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('Indonesia')}
              className={cn(
                "px-3 py-1 rounded-lg text-[11px] font-bold transition-all",
                language === 'Indonesia' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              ID
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-zinc-200 bg-white overflow-y-auto max-h-[calc(100vh-4rem)]"
          >
            <div className="p-4 flex flex-col gap-2 pb-8">
              {menuItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        pathname === item.href ? "bg-blue-50 text-blue-600" : "text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <item.icon size={18} className={pathname === item.href ? "text-blue-600" : "text-zinc-500"} />
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <button 
                        onClick={() => setMobileActiveMenu(mobileActiveMenu === item.id ? null : item.id)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          mobileActiveMenu === item.id ? "bg-zinc-50 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} className={mobileActiveMenu === item.id ? "text-blue-600" : "text-zinc-500"} />
                          {item.label}
                        </div>
                        <ChevronUp size={16} className={cn("transition-transform duration-200 rotate-180", mobileActiveMenu === item.id && "rotate-0")} />
                      </button>
                      <AnimatePresence>
                        {mobileActiveMenu === item.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-11 pr-4 py-1 flex flex-col gap-1">
                              {item.subItems?.map((sub, idx) => (
                                <Link
                                  key={idx}
                                  href={sub.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn(
                                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                    pathname === sub.href ? "text-blue-600" : "text-zinc-500 hover:text-zinc-900"
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              ))}
              
              <div className="h-px bg-zinc-100 my-2 sm:hidden" />
              <div className="flex items-center justify-between sm:hidden px-4 py-2">
                <span className="text-sm font-medium text-zinc-500">{t.language}</span>
                <div className="flex items-center bg-zinc-100 rounded-xl p-1 gap-0.5">
                  <button 
                    onClick={() => setLanguage('English')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold transition-all",
                      language === 'English' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setLanguage('Indonesia')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold transition-all",
                      language === 'Indonesia' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    ID
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
