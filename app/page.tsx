'use client';

import AppLayout from '@/components/AppLayout';
import { motion } from 'motion/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Shield, 
  Cpu, 
  PenTool, 
  Image as ImageIcon, 
  Video, 
  Mic2, 
  RotateCcw, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  
  const toolCategories = [
    {
      title: t.contentLab,
      icon: PenTool,
      color: "bg-blue-50 text-blue-600",
      tools: [
        { name: t.tool1Name, href: "/tools/content-suite", desc: t.allInOneContent },
        { name: t.tool6Name, href: "/tools/shorts-factory", desc: t.viralShortVideo },
      ]
    },
    {
      title: t.imageStudio,
      icon: ImageIcon,
      color: "bg-purple-50 text-purple-600",
      tools: [
        { name: t.tool3Name, href: "/tools/text-to-image", desc: t.aiImageGeneration },
        { name: t.tool4Name, href: "/tools/image-editor", desc: t.professionalAIEditing },
      ]
    },
    {
      title: t.videoFactory,
      icon: Video,
      color: "bg-orange-50 text-orange-600",
      tools: [
        { name: t.tool5Name, href: "/tools/text-to-video", desc: t.cinematicAIVideo },
        { name: t.tool7Name, href: "/tools/film-generator", desc: t.fullLengthFilm },
        { name: t.tool8Name, href: "/tools/full-video", desc: t.endToEndVideo },
      ]
    },
    {
      title: t.voiceLab,
      icon: Mic2,
      color: "bg-emerald-50 text-emerald-600",
      tools: [
        { name: t.tool10Name, href: "/tools/sound-generator", desc: t.aiSoundEffects },
        { name: t.tool11Name, href: "/tools/voice-generator", desc: t.naturalVoiceCloning },
      ]
    },
    {
      title: t.reverseEngineering,
      icon: RotateCcw,
      color: "bg-zinc-100 text-zinc-600",
      tools: [
        { name: t.tool12Name, href: "/tools/image-extractor", desc: t.deconstructAIImages },
        { name: t.tool13Name, href: "/tools/video-extractor", desc: t.analyzeAIVideos },
      ]
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-16 py-10">
        {/* Hero Section */}
        <section className="relative flex flex-col items-start text-left">
          <div className="relative space-y-6 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[11px] font-bold tracking-wider text-blue-600 uppercase"
            >
              <Sparkles size={12} />
              {t.heroBadge}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.1]"
            >
              {t.futureOf} <br />
              <span className="text-blue-600">{t.creativeIntelligence}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-lg text-zinc-500 font-medium leading-relaxed"
            >
              {t.heroDesc}
            </motion.p>
          </div>
        </section>

        {/* Bento Grid Tools */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Assistant Card - Featured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 lg:col-span-1 p-8 rounded-[2.5rem] bg-zinc-900 text-white flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
          >
            <Link href="/chat" className="absolute inset-0 z-10" />
            <div className="relative z-20">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <MessageSquare size={24} className="text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold mb-3 tracking-tight">{t.aiAssistant}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                {t.aiAssistantDesc}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-blue-400 font-bold text-sm group-hover:gap-4 transition-all relative z-20">
              {t.launchAssistant} <ArrowRight size={16} />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 blur-[60px] rounded-full" />
          </motion.div>

          {/* Tool Categories */}
          {toolCategories.map((category, i) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-8 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", category.color)}>
                  <category.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{category.title}</h3>
              </div>

              <div className="space-y-3 flex-grow">
                {category.tools.map((tool) => (
                  <Link 
                    key={tool.name}
                    href={tool.href}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-all group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-900">{tool.name}</p>
                      <p className="text-[11px] text-zinc-400 font-medium">{tool.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </section>

        {/* Stats Section - Minimal */}
        <section className="py-12 border-t border-zinc-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: t.stat1, value: "13+" },
              { label: t.stat2, value: "99.9%" },
              { label: t.stat3, value: "< 2s" },
              { label: t.stat4, value: "Llama 3.3" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-3xl font-bold tracking-tight text-zinc-900">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
