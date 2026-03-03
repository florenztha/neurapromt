'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Package, User, Hand, Clapperboard, Type, 
  Layout, Image as ImageIcon, Download, RefreshCw, 
  Trash2, Plus, Volume2, Settings2, ChevronRight, X,
  MessageSquare, Megaphone, Globe, Copy, Check, Map, Zap,
  ShieldCheck, BookOpen, Smile, Hotel, Coffee, Sun, 
  Dumbbell, TreePine, Camera, UserCheck, Terminal, Wand2, Focus,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { smartGenerateContent, smartChat } from "@/lib/ai";
import Image from 'next/image';

import { useLanguage } from '@/context/LanguageContext';

interface UGCToolProps {
  language?: 'Indonesia' | 'English';
}

export default function UGCTool({ language = 'English' }: UGCToolProps) {
  const { t } = useLanguage();
  // App State
  const [activeTab, setActiveTab] = useState('editor');
  const [feature, setFeature] = useState('ugc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);

  // Inputs
  const [productImage, setProductImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [productDesc, setProductDesc] = useState('');
  const [selectedTone, setSelectedTone] = useState('enthusiastic');
  const [customTone, setCustomTone] = useState('');
  const [selectedBg, setSelectedBg] = useState('aesthetic_room');
  const [customBg, setCustomBg] = useState('');
  const [selectedLang, setSelectedLang] = useState(language === 'Indonesia' ? 'id' : 'en');

  const [refOptions, setRefOptions] = useState<string[]>([]);
  const [visualAdjustments, setVisualAdjustments] = useState({
    lighting: 'exposure correction',
    color: 'color grading',
    detail: 'sharpen'
  });
  const [negativeConstraints, setNegativeConstraints] = useState('avoid distortion, artifacts, warped face, fake texture, watermark, text errors');

  // Outputs
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedCaptions, setGeneratedCaptions] = useState<{ caption: string, hashtags: string[] } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<any | null>(null);
  const [isGeneratingVideoPrompt, setIsGeneratingVideoPrompt] = useState(false);
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<number | null>(null);

  // Video Prompt Parameters
  const [videoStyle, setVideoStyle] = useState('minimalist_luxury');
  const [videoAtmosphere, setVideoAtmosphere] = useState('high_energy');
  const [videoMotion, setVideoMotion] = useState('slow_dolly_zoom');
  const [videoLighting, setVideoLighting] = useState('soft_rim_light');
  const [videoSound, setVideoSound] = useState('upbeat_lofi');
  const [customSpokenLines, setCustomSpokenLines] = useState('');

  const videoVisualStyles = [
    { id: 'minimalist_luxury', label: { en: 'Minimalist Luxury', id: 'Mewah Minimalis' } },
    { id: 'cinematic_high_fashion', label: { en: 'Cinematic High-Fashion', id: 'Sinematik High-Fashion' } },
    { id: 'organic_natural', label: { en: 'Organic & Natural', id: 'Organik & Alami' } },
    { id: 'tech_noir', label: { en: 'Tech-Noir', id: 'Tech-Noir' } },
    { id: 'vibrant_pop', label: { en: 'Vibrant Pop', id: 'Vibrant Pop' } },
  ];

  const videoAtmospheres = [
    { id: 'ethereal', label: { en: 'Ethereal', id: 'Ethereal' } },
    { id: 'high_energy', label: { en: 'High-Energy', id: 'Energi Tinggi' } },
    { id: 'moody', label: { en: 'Moody', id: 'Moody' } },
    { id: 'sophisticated', label: { en: 'Sophisticated', id: 'Canggih' } },
    { id: 'calm', label: { en: 'Calm & Peaceful', id: 'Tenang & Damai' } },
  ];

  const videoCameraMotions = [
    { id: 'slow_dolly_zoom', label: { en: 'Slow Dolly Zoom', id: 'Slow Dolly Zoom' } },
    { id: 'orbital_pan', label: { en: 'Orbital Pan', id: 'Orbital Pan' } },
    { id: 'handheld_shake', label: { en: 'Handheld Shake', id: 'Handheld Shake' } },
    { id: 'macro_sweep', label: { en: 'Macro Sweep', id: 'Macro Sweep' } },
    { id: 'static', label: { en: 'Static', id: 'Statis' } },
  ];

  const videoLightings = [
    { id: 'volumetric_rays', label: { en: 'Volumetric Rays', id: 'Sinar Volumetrik' } },
    { id: 'golden_hour', label: { en: 'Golden Hour', id: 'Golden Hour' } },
    { id: 'soft_rim_light', label: { en: 'Soft Rim Light', id: 'Soft Rim Light' } },
    { id: 'neon_accents', label: { en: 'Neon Accents', id: 'Aksen Neon' } },
    { id: 'studio_softbox', label: { en: 'Studio Softbox', id: 'Studio Softbox' } },
  ];

  const videoSounds = [
    { id: 'upbeat_lofi', label: { en: 'Upbeat Lo-Fi', id: 'Upbeat Lo-Fi' } },
    { id: 'cinematic_orchestral', label: { en: 'Cinematic Orchestral', id: 'Orkestra Sinematik' } },
    { id: 'crisp_asmr', label: { en: 'Crisp ASMR', id: 'ASMR Jernih' } },
    { id: 'modern_pop', label: { en: 'Modern Pop', id: 'Pop Modern' } },
    { id: 'minimal_ambient', label: { en: 'Minimal Ambient', id: 'Ambient Minimal' } },
  ];

  const tones = [
    { id: 'enthusiastic', label: 'Ceria & Energik', icon: Megaphone },
    { id: 'professional', label: 'Profesional & Formal', icon: ShieldCheck },
    { id: 'relaxed', label: 'Santai & Friendly', icon: MessageSquare },
    { id: 'luxury', label: 'Mewah & Eksklusif', icon: Sparkles },
    { id: 'educational', label: 'Edukatif & Informatif', icon: BookOpen },
    { id: 'urgent', label: 'Mendesak (FOMO)', icon: Zap },
    { id: 'humorous', label: 'Lucu & Menghibur', icon: Smile },
    { id: 'cinematic', label: 'Drama & Sinematik', icon: Clapperboard },
    { id: 'whisper', label: 'ASMR / Berbisik', icon: Volume2 },
    { id: 'custom', label: 'Kustom Gaya...', icon: Type },
  ];

  const backgrounds = [
    { id: 'aesthetic_room', label: 'Kamar Tidur Aesthetic', prompt: 'Aesthetic cozy bedroom, soft natural sunlight', icon: Layout },
    { id: 'minimalist_studio', label: 'Studio Putih Minimalis', prompt: 'Clean white minimalist studio, soft commercial lighting', icon: ImageIcon },
    { id: 'luxury_hotel', label: 'Lobby Hotel Mewah', prompt: 'High-end luxury hotel lobby, grand lighting', icon: Hotel },
    { id: 'modern_cafe', label: 'Cafe Kekinian', prompt: 'Trendy minimalist urban cafe, blurred background', icon: Coffee },
    { id: 'luxury_living', label: 'Ruang Tamu Mewah', prompt: 'Modern luxury living room, high-end interior', icon: Sun },
    { id: 'modern_kitchen', label: 'Dapur Modern', prompt: 'Contemporary clean kitchen with daylight', icon: Layout },
    { id: 'gym_fitness', label: 'Gym / Fitness Center', prompt: 'Modern high-tech gym interior', icon: Dumbbell },
    { id: 'outdoor_garden', label: 'Taman / Hutan Pinus', prompt: 'Lush green garden, natural sunlight, bokeh trees', icon: TreePine },
    { id: 'industrial_office', label: 'Industrial Office', prompt: 'Creative industrial workspace, brick walls', icon: Camera },
    { id: 'custom', label: 'Kustom Latar...', prompt: '', icon: Type },
  ];

  const languages = [
    { id: 'id', label: 'Indonesia' },
    { id: 'en', label: 'English' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'model' | 'ref') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (type === 'product') setProductImage(event.target.result as string);
          if (type === 'model') setModelImage(event.target.result as string);
          if (type === 'ref') setRefImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pcmToWav = (base64Pcm: string, sampleRate: number) => {
    const pcm = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const writeString = (offset: number, string: string) => { 
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); 
    };
    writeString(0, 'RIFF'); 
    view.setUint32(4, 32 + pcm.length, true); 
    writeString(8, 'WAVE');
    writeString(12, 'fmt '); 
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); 
    view.setUint32(28, sampleRate * 2, true); 
    view.setUint16(32, 2, true); 
    view.setUint16(34, 16, true);
    writeString(36, 'data'); 
    view.setUint32(40, pcm.length, true);
    return new Blob([header, pcm], { type: 'audio/wav' });
  };

  const generateVideoPrompt = async () => {
    if (feature !== 'storyboard' && selectedImageForVideo === null) return;
    setIsGeneratingVideoPrompt(true);
    setVideoPrompt(null);
    try {
      const currentLang = selectedLang as 'en' | 'id';
      const selectedStyleLabel = videoVisualStyles.find(v => v.id === videoStyle)?.label[currentLang];
      const selectedAtmosphereLabel = videoAtmospheres.find(v => v.id === videoAtmosphere)?.label[currentLang];
      const selectedMotionLabel = videoCameraMotions.find(v => v.id === videoMotion)?.label[currentLang];
      const selectedLightingLabel = videoLightings.find(v => v.id === videoLighting)?.label[currentLang];
      const selectedSoundLabel = videoSounds.find(v => v.id === videoSound)?.label[currentLang];
      const spokenLines = customSpokenLines || generatedCaptions?.caption || 'Professional UGC Review';

      const promptReq = `Create a highly creative and detailed AI Video Generation Prompt for a professional social media ad.
      Product: ${productDesc}
      Feature Type: ${feature}
      Requested Visual Style: ${selectedStyleLabel}
      Requested Atmosphere: ${selectedAtmosphereLabel}
      Requested Camera Motion: ${selectedMotionLabel}
      Requested Lighting: ${selectedLightingLabel}
      Requested Sound & Music: ${selectedSoundLabel}
      Spoken Lines: ${spokenLines}
      Tone: ${selectedTone === 'custom' ? customTone : selectedTone}
      
      Instructions:
      1. Expand the "visual_style" into a rich, descriptive aesthetic paragraph.
      2. Describe the "atmosphere" vividly.
      3. Detail the "camera_motion" technical execution.
      4. Specify the "lighting" setup in professional terms.
      5. Describe "sound_and_music" to match the energy.
      6. Use the provided "spoken_lines" exactly. Ensure they are short, clear, and impactful for a product promotion.
      7. Combine everything into a "full_technical_prompt" optimized for high-end AI video models (Luma, Kling, Runway). The model in the video must be speaking the spoken lines naturally while promoting the product.
      
      Technical parts must be in English. Spoken lines must be in ${languages.find(l => l.id === selectedLang)?.label}.`;

      const response = await smartGenerateContent({
        preferredModel: 'llama-3.3-70b-versatile',
        fallbackModels: [],
        contents: promptReq,
        config: { 
          systemInstruction: "You are a highly creative and detailed AI Video Generation Prompt expert. Return ONLY a JSON object.",
        }
      });

      if (response.text) {
        // Try to extract JSON from text if it's not pure JSON
        let jsonStr = response.text;
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const promptData = JSON.parse(jsonStr);
        setVideoPrompt(promptData);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      console.error("Video Prompt Error:", err);
      const errorMsg = err.message?.toLowerCase() || "";
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate exceeded')) {
        setQuotaError(true);
      }
      setVideoPrompt({ 
        error: t.videoPromptError,
        visual_style: "Error generating style",
        atmosphere: "Error generating atmosphere",
        camera_motion: "Error generating motion",
        lighting: "Error generating lighting",
        sound_and_music: "Error generating sound",
        spoken_lines: "Error generating lines",
        full_technical_prompt: "Failed to generate prompt. Please try again."
      });
    } finally {
      setIsGeneratingVideoPrompt(false);
    }
  };

  const generateContent = async () => {
    if (!productImage) {
      setError(t.uploadProductError);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuotaError(false);
    setGeneratedImages([]);
    setAudioUrl(null);
    setVideoPrompt(null);
    setSelectedImageForVideo(null);

    try {
      const productBase64 = productImage.split(',')[1];
      const modelBase64 = modelImage ? modelImage.split(',')[1] : null;
      const refBase64 = refImage ? refImage.split(',')[1] : null;
      
      const bgPromptText = selectedBg === 'custom' ? customBg : backgrounds.find(b => b.id === selectedBg)?.prompt;
      const toneLabel = selectedTone === 'custom' ? customTone : tones.find(t => t.id === selectedTone)?.label;
      const langLabel = languages.find(l => l.id === selectedLang)?.label;

      const count = 3; 
      const newImages: string[] = [];
      
      const storyboardActions = [
        "Take 1 (Intro): Model introducing the product with high energy and a big smile. Professional studio look.",
        "Take 2 (Detail): Close up of the product being used or shown in detail. Background must match Take 1.",
        "Take 3 (CTA): Model giving a happy expression/result. Visual identity lock: same face, hair, and outfit."
      ];

      const visualAdjustmentsPrompt = `
      VISUAL ADJUSTMENTS:
      - Lighting: ${visualAdjustments.lighting}
      - Color: ${visualAdjustments.color}
      - Detail: ${visualAdjustments.detail}
      NEGATIVE CONSTRAINTS: ${negativeConstraints}
      `;

      const identityLock = `[CRITICAL IDENTITY REQUIREMENT]: 
      - The person in the output MUST be the EXACT SAME PERSON as the provided model image. 
      - ABSOLUTELY NO FILTERS, NO STYLIZATION, NO TONE MODIFICATION, NO BEAUTY FILTERS.
      - Preserve the original skin texture, facial structure, eye shape, and all unique features with 100% RAW fidelity.
      - The face must look like a real, unedited photo of the person in the reference image.
      - Product MUST be exactly the same as provided product image.
      - Environment: ${bgPromptText}.
      - Reference Context: ${refOptions.length > 0 ? refOptions.join(', ') : 'none'}.
      ${visualAdjustmentsPrompt}
      - Output: Ultra-high quality commercial photography, 9:16 vertical, photorealistic, 8k resolution, NO TYPOS, NO TEXT.`;

      // Image generation is disabled as it requires Gemini
      console.warn("Image generation is disabled.");
      setGeneratedImages([]);
      
      // Generate Creative Caption
      const textPrompt = `Create a highly creative, viral-style social media caption for this product: "${productDesc}".
      Language: ${langLabel}. Tone: ${toneLabel}.
      Don't be generic. Use hooks, storytelling, or emotional triggers. 
      Format JSON: { "caption": "...", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"] }`;

      const textResponse = await smartGenerateContent({
        preferredModel: 'llama-3.3-70b-versatile',
        fallbackModels: [],
        contents: textPrompt,
        config: { systemInstruction: "Return ONLY a JSON object." }
      });
      
      let jsonStr = textResponse.text || '{}';
      const jsonMatch = textResponse.text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const captionObj = JSON.parse(jsonStr);
      setGeneratedCaptions(captionObj);

      // Audio (TTS) is disabled as it requires Gemini
      console.warn("TTS is disabled.");
      setAudioUrl(null);

      setActiveTab('results');
      if (feature === 'storyboard') {
        generateVideoPrompt();
      }
    } catch (err: any) {
      const errorMsg = err.message?.toLowerCase() || "";
      const isQuotaError = errorMsg.includes('429') || 
                          errorMsg.includes('resource_exhausted') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('rate exceeded');
      
      if (isQuotaError) {
        setQuotaError(true);
      }
      setError(t.descriptionRequiredError);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full space-y-8">
      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto pb-40">
        <div className="space-y-12">
          {/* Feature Switcher (Centered) */}
          <div className="flex items-center justify-center bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-3xl p-4 shadow-sm">
            <div className="flex bg-zinc-100/80 p-1.5 rounded-2xl gap-1 shadow-inner overflow-x-auto no-scrollbar">
              {[
                { id: 'ugc', icon: User, label: t.reviewModel, shortLabel: 'Review' },
                { id: 'pov', icon: Hand, label: t.productPOV, shortLabel: 'POV' },
                { id: 'storyboard', icon: Clapperboard, label: 'Storyboard', shortLabel: 'Story' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFeature(f.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
                    feature === f.id 
                      ? "bg-white text-blue-600 shadow-sm scale-[1.02]" 
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-white/40"
                  )}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{f.label}</span>
                  <span className="md:hidden">{f.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'editor' ? (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 text-left">{t.productReference} (3:4)</h3>
                  </div>
                  <div className="aspect-[3/4] max-h-[420px] rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-zinc-400 shadow-inner">
                    {productImage ? (
                      <>
                        <Image src={productImage} alt="Product" fill className="object-cover" referrerPolicy="no-referrer" />
                        <button onClick={() => setProductImage(null)} className="absolute top-5 right-5 p-2.5 bg-black/60 hover:bg-red-600 rounded-2xl text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer text-center p-8 flex flex-col items-center w-full h-full justify-center">
                        <Plus className="w-8 h-8 text-zinc-300 group-hover:text-blue-600 mb-4" />
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{t.uploadProduct}</p>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'product')} />
                      </label>
                    )}
                  </div>
                </div>

                {feature !== 'pov' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 text-left">{t.modelIdentity} (3:4)</h3>
                    </div>
                    <div className="aspect-[3/4] max-h-[420px] rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-zinc-400 shadow-inner">
                      {modelImage ? (
                        <>
                          <Image src={modelImage} alt="Model" fill className="object-cover" referrerPolicy="no-referrer" />
                          <button onClick={() => setModelImage(null)} className="absolute top-5 right-5 p-2.5 bg-black/60 hover:bg-red-600 rounded-2xl text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer text-center p-8 flex flex-col items-center w-full h-full justify-center">
                          <User className="w-8 h-8 text-zinc-300 group-hover:text-blue-500 mb-4" />
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{t.uploadFace}</p>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'model')} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 text-left">{t.referenceImage} (3:4)</h3>
                  </div>
                  <div className="aspect-[3/4] max-h-[420px] rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-zinc-400 shadow-inner">
                    {refImage ? (
                      <>
                        <Image src={refImage} alt="Reference" fill className="object-cover" referrerPolicy="no-referrer" />
                        <button onClick={() => setRefImage(null)} className="absolute top-5 right-5 p-2.5 bg-black/60 hover:bg-red-600 rounded-2xl text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer text-center p-8 flex flex-col items-center w-full h-full justify-center">
                        <Plus className="w-8 h-8 text-zinc-300 group-hover:text-purple-500 mb-4" />
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{t.uploadReference}</p>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'ref')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-left">
                  <Type className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 text-left">{t.descriptionLabel}</h3>
                </div>
                <textarea 
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl p-10 text-sm min-h-[140px] focus:ring-2 ring-blue-500/10 outline-none transition-all placeholder:text-zinc-300 shadow-inner resize-none text-left text-zinc-900 font-medium"
                />
              </div>

              {/* Production Settings (Inline) */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 space-y-10 shadow-sm">
                <div className="flex items-center gap-3 border-b border-zinc-100 pb-6">
                  <Settings2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Production Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider px-1">Tone & Voice</span>
                      <div className="grid grid-cols-2 gap-2">
                        {tones.map(t => (
                          <button 
                            key={t.id} 
                            onClick={() => setSelectedTone(t.id)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all",
                              selectedTone === t.id ? "border-blue-500 bg-blue-500/10 text-blue-600" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                            )}
                          >
                            <t.icon className="w-3.5 h-3.5" /> {t.label}
                          </button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {selectedTone === 'custom' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                          >
                            <input 
                              type="text" 
                              value={customTone} 
                              onChange={(e) => setCustomTone(e.target.value)}
                              placeholder="Ketik gaya bicara kustom di sini..."
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:ring-2 ring-blue-500/10 outline-none text-zinc-900"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider px-1">Reference Image Options</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'style transfer', 'color reference', 'lighting reference', 'character consistency',
                          'change outfit', 'fix face', 'add object', 'make cinematic lighting',
                          'photorealistic', 'fashion editorial', 'luxury commercial', 'anime style'
                        ].map(opt => (
                          <label 
                            key={opt}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border text-[9px] font-bold transition-all cursor-pointer",
                              refOptions.includes(opt) ? "border-purple-500 bg-purple-500/10 text-purple-600" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                            )}
                          >
                            <input 
                              type="checkbox"
                              className="hidden"
                              checked={refOptions.includes(opt)}
                              onChange={() => {
                                const newOpts = refOptions.includes(opt)
                                  ? refOptions.filter(o => o !== opt)
                                  : [...refOptions, opt];
                                setRefOptions(newOpts);
                              }}
                            />
                            {opt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider px-1">Latar Ruangan</span>
                      <div className="grid grid-cols-2 gap-2">
                        {backgrounds.map(bg => (
                          <button 
                            key={bg.id}
                            onClick={() => setSelectedBg(bg.id)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all",
                              selectedBg === bg.id ? "border-blue-500 bg-blue-500/10 text-blue-600" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                            )}
                          >
                            <bg.icon className="w-3.5 h-3.5" /> {bg.label}
                          </button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {selectedBg === 'custom' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                          >
                            <input 
                              type="text" 
                              value={customBg} 
                              onChange={(e) => setCustomBg(e.target.value)}
                              placeholder="Ketik latar ruangan kustom di sini..."
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:ring-2 ring-blue-500/10 outline-none text-zinc-900"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider px-1">Visual Adjustments</span>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Lighting</label>
                          <select 
                            value={visualAdjustments.lighting}
                            onChange={(e) => setVisualAdjustments({...visualAdjustments, lighting: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 outline-none"
                          >
                            {['exposure correction', 'cinematic lighting', 'shadow balance'].map(opt => (
                              <option key={opt} value={opt}>{opt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Color</label>
                          <select 
                            value={visualAdjustments.color}
                            onChange={(e) => setVisualAdjustments({...visualAdjustments, color: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 outline-none"
                          >
                            {['color grading', 'tone adjustment', 'white balance'].map(opt => (
                              <option key={opt} value={opt}>{opt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Detail</label>
                          <select 
                            value={visualAdjustments.detail}
                            onChange={(e) => setVisualAdjustments({...visualAdjustments, detail: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 outline-none"
                          >
                            {['sharpen', 'denoise', 'texture recovery'].map(opt => (
                              <option key={opt} value={opt}>{opt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider px-1">Negative Constraints</span>
                  <textarea 
                    value={negativeConstraints}
                    onChange={(e) => setNegativeConstraints(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-xs focus:ring-2 ring-blue-500/10 outline-none text-zinc-900 resize-none"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={generateContent}
                    disabled={isGenerating || !productImage}
                    className={cn(
                      "w-full py-6 rounded-2xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-4 shadow-sm transition-all",
                      isGenerating || !productImage ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01]"
                    )}
                  >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {t.generateContentBtn}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setActiveTab('editor')}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{t.backBtn}</span>
                    </button>
                    <div className="space-y-1 text-left">
                      <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                         {feature === 'storyboard' 
                           ? t.storyboardModeDesc 
                           : t.ugcModeDesc}
                      </p>
                    </div>
                  </div>
                  {audioUrl && (
                    <div className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                      <div className="bg-blue-600 p-3 rounded-2xl shadow-sm text-white"><Volume2 className="w-5 h-5" /></div>
                      <div className="flex flex-col pr-4 text-left">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Audio Ad</span>
                        <div className="flex items-center gap-3">
                           <audio src={audioUrl} controls className="h-7 w-44" />
                           <a href={audioUrl} download="ugc-audio-final.wav" className="p-2 bg-zinc-100 rounded-xl hover:text-blue-600 transition-all">
                              <Download className="w-4 h-4" />
                           </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {generatedImages.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => feature !== 'storyboard' && setSelectedImageForVideo(i)}
                      className={cn(
                        "group relative aspect-[9/16] rounded-3xl overflow-hidden bg-zinc-100 border-4 shadow-sm transition-all cursor-pointer",
                        selectedImageForVideo === i ? "border-blue-500 scale-[1.01]" : "border-zinc-100 hover:border-zinc-300"
                      )}
                    >
                      <Image src={img} alt={`Result ${i}`} fill className="object-cover" referrerPolicy="no-referrer" />
                      
                      {feature !== 'storyboard' && (
                        <div className="absolute top-6 right-6 z-20">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all",
                            selectedImageForVideo === i ? "bg-blue-600 border-blue-600 scale-110 shadow-lg" : "bg-black/60 border-white/20"
                          )}>
                             {selectedImageForVideo === i && <Check className="w-6 h-6 text-white font-bold" />}
                          </div>
                        </div>
                      )}

                      <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); const l = document.createElement('a'); l.href = img; l.download = `ugc-final-${i}.png`; l.click(); }}
                          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl text-zinc-900 hover:bg-blue-600 hover:text-white shadow-xl"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-8 text-center">
                        <span className="text-[11px] font-semibold text-white bg-blue-600/80 backdrop-blur-sm px-5 py-2 rounded-full uppercase tracking-wider shadow-sm">
                           {feature === 'storyboard' ? `TAKE ${i+1}` : `SHOT ${i+1}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 rounded-[3rem] border border-zinc-200 shadow-sm space-y-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[120px] rounded-full"></div>
                  
                  <div className="text-center space-y-3 relative z-10">
                    <h4 className="text-3xl font-bold text-zinc-900 tracking-tight uppercase flex items-center justify-center gap-4">
                      <Terminal className="w-8 h-8 text-blue-600" /> {t.aiVideoPromptEngine}
                    </h4>
                    <p className="text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed">
                      {feature === 'storyboard' 
                        ? 'Dapatkan prompt video untuk keseluruhan cerita iklan Anda.' 
                        : 'Klik salah satu gambar di atas, lalu atur parameter di bawah untuk hasilkan prompt gerakan sinematik.'}
                    </p>
                  </div>

                  {/* Video Parameters Dropdowns */}
                  {(feature === 'storyboard' || selectedImageForVideo !== null) && (
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">{t.visualStyleLabel}</label>
                        <select 
                          value={videoStyle} 
                          onChange={(e) => setVideoStyle(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer"
                        >
                          {videoVisualStyles.map(v => (
                            <option key={v.id} value={v.id}>{v.label[selectedLang as 'en' | 'id']}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">{t.atmosphereLabel}</label>
                        <select 
                          value={videoAtmosphere} 
                          onChange={(e) => setVideoAtmosphere(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer"
                        >
                          {videoAtmospheres.map(v => (
                            <option key={v.id} value={v.id}>{v.label[selectedLang as 'en' | 'id']}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">{t.cameraMotionLabel}</label>
                        <select 
                          value={videoMotion} 
                          onChange={(e) => setVideoMotion(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer"
                        >
                          {videoCameraMotions.map(v => (
                            <option key={v.id} value={v.id}>{v.label[selectedLang as 'en' | 'id']}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">{t.lightingLabel}</label>
                        <select 
                          value={videoLighting} 
                          onChange={(e) => setVideoLighting(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer"
                        >
                          {videoLightings.map(v => (
                            <option key={v.id} value={v.id}>{v.label[selectedLang as 'en' | 'id']}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">{t.soundMusicLabel}</label>
                        <select 
                          value={videoSound} 
                          onChange={(e) => setVideoSound(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer"
                        >
                          {videoSounds.map(v => (
                            <option key={v.id} value={v.id}>{v.label[selectedLang as 'en' | 'id']}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">{t.spokenLinesLabel}</label>
                        <input 
                          type="text"
                          value={customSpokenLines || generatedCaptions?.caption || ''}
                          onChange={(e) => setCustomSpokenLines(e.target.value)}
                          placeholder={t.spokenLinesPlaceholder}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 focus:ring-2 ring-blue-500/10 outline-none"
                        />
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={generateVideoPrompt}
                    disabled={isGeneratingVideoPrompt || (feature !== 'storyboard' && selectedImageForVideo === null)}
                    className={cn(
                      "relative z-10 px-16 py-6 rounded-3xl font-semibold text-xs uppercase tracking-wider flex items-center gap-6 transition-all shadow-sm",
                      isGeneratingVideoPrompt || (feature !== 'storyboard' && selectedImageForVideo === null) ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-blue-600 text-white hover:scale-[1.02]"
                    )}
                  >
                    {isGeneratingVideoPrompt ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6" />
                        {feature === 'storyboard' 
                          ? t.generateStoryPromptBtn 
                          : t.generateMotionPromptBtn}
                      </>
                    )}
                  </button>

                  {videoPrompt && (
                    <div className="w-full max-w-4xl animate-in slide-in-from-top-4 duration-500 text-left">
                      <div className="bg-white rounded-3xl border border-zinc-200 p-10 relative group/prompt overflow-hidden shadow-sm space-y-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl"></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                           <div />
                           <button 
                            onClick={() => copyToClipboard(videoPrompt.full_technical_prompt || JSON.stringify(videoPrompt), 'v-prompt')}
                            className="flex items-center gap-2 text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 px-4 py-2 rounded-xl transition-all shadow-sm"
                           >
                             {copiedId === 'v-prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                             {copiedId === 'v-prompt' ? t.promptCopied : t.copyFullPrompt}
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                          {[
                            { id: 'v-style', label: t.visualStyleLabel, value: videoPrompt.visual_style, icon: Wand2 },
                            { id: 'v-atmos', label: t.atmosphereLabel, value: videoPrompt.atmosphere, icon: Sparkles },
                            { id: 'v-motion', label: t.cameraMotionLabel, value: videoPrompt.camera_motion, icon: Camera },
                            { id: 'v-light', label: t.lightingLabel, value: videoPrompt.lighting, icon: Sun },
                            { id: 'v-sound', label: t.soundMusicLabel, value: videoPrompt.sound_and_music, icon: Volume2 },
                            { id: 'v-spoken', label: t.spokenLinesLabel, value: videoPrompt.spoken_lines, icon: MessageSquare },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1.5 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group/item relative">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                                  <item.icon className="w-3 h-3 text-blue-500" />
                                  {item.label}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(item.value || '', item.id)}
                                  className="opacity-0 group-hover/item:opacity-100 p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-400 hover:text-blue-600 transition-all shadow-sm"
                                >
                                  {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              <p className="text-xs text-stone-700 font-medium leading-relaxed pr-8">{item.value || 'N/A'}</p>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 relative z-10">
                          <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider block mb-3">Full Technical Prompt (Optimized for AI Video)</span>
                          <div className="p-6 bg-zinc-900 rounded-2xl text-zinc-300 font-mono text-xs leading-relaxed border border-white/5">
                            &quot;{videoPrompt.full_technical_prompt || 'N/A'}&quot;
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generatedCaptions && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> {t.captionLabel}
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(generatedCaptions.caption, 'caption')}
                        className={cn(
                          "flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-xl transition-all border shadow-sm",
                          copiedId === 'caption' ? "bg-blue-600 border-blue-600 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                        )}
                      >
                        {copiedId === 'caption' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'caption' ? t.copiedLabel : t.copyCaptionBtn}
                      </button>
                    </div>
                    <div className="bg-zinc-50 rounded-3xl p-10 border border-zinc-200 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full group-hover:bg-blue-600/10 transition-colors"></div>
                      <p className="text-xl font-bold leading-relaxed text-zinc-800 relative z-10">
                        &quot;{generatedCaptions.caption}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Megaphone className="w-4 h-4" /> {t.smartHashtagsLabel}
                    </h4>
                    <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-200 flex flex-wrap gap-3 shadow-sm min-h-[150px] content-start">
                      {generatedCaptions.hashtags?.map((tag, i) => (
                        <button 
                          key={i} 
                          onClick={() => copyToClipboard(tag, `tag-${i}`)}
                          className={cn(
                            "group flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all border",
                            copiedId === `tag-${i}` ? "bg-blue-600 border-blue-600 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:border-blue-500 hover:bg-blue-50"
                          )}
                        >
                          {tag}
                          {copiedId === `tag-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative w-40 h-40 mb-10">
              <div className="absolute inset-0 border-[6px] border-blue-600/10 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-blue-600 rounded-full border-t-transparent animate-[spin_1.5s_linear_infinite]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-4 uppercase">{t.synergizingAssets}</h2>
            <p className="text-zinc-400 text-sm max-w-sm font-semibold uppercase tracking-wider leading-relaxed">
              {t.synergizingMessage.replace('{feature}', feature)}
            </p>
            <div className="mt-12 w-80 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-blue-600"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
      `}} />
    </div>
  );
}
