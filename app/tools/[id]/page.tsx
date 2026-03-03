'use client';

import React, { useState, use } from 'react';
import AppLayout from '@/components/AppLayout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight, 
  Info,
  ChevronDown,
  Zap,
  Upload,
  X,
  AlertCircle
} from 'lucide-react';
import { generatePrompt, generateImage } from '@/lib/ai';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ImageEditorTool from '@/components/ImageEditorTool';
import UGCTool from '@/components/UGCTool';
import { useLanguage } from '@/context/LanguageContext';

interface ToolConfig {
  id: string;
  name: string;
  description: string;
  fields: {
    id: string;
    label: string;
    type: 'select' | 'text' | 'textarea' | 'image' | 'video';
    options?: string[];
    placeholder?: string;
    rows?: number;
    condition?: (inputs: Record<string, string>) => boolean;
  }[];
}

export default function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { language, t } = useLanguage();

  const TOOLS: Record<string, ToolConfig> = {
    'content-suite': {
      id: 'content-suite',
      name: t.tool1Name,
      description: t.tool1Desc,
      fields: [
        { id: 'type', label: t.contentType, type: 'select', options: t.contentSuiteTypes },
        { id: 'objective', label: t.objective, type: 'select', options: t.contentSuiteObjectives },
        { id: 'tone', label: t.toneStyle, type: 'select', options: t.contentSuiteTones },
        { id: 'audience', label: t.targetAudience, type: 'select', options: t.contentSuiteAudiences },
        { id: 'mention', label: t.mention, type: 'text', placeholder: '@username', condition: (inputs) => inputs.type === t.contentSuiteTypes[1] },
        { id: 'hashtag', label: t.hashtag, type: 'text', placeholder: '#topic #ai', condition: (inputs) => inputs.type === t.contentSuiteTypes[1] },
        { id: 'topic', label: t.mainTopic, type: 'textarea', placeholder: 'What is your content about?' },
        { id: 'instructions', label: t.additionalInstructions, type: 'textarea', placeholder: t.additionalInstructionsPlaceholder, rows: 2 },
        { id: 'output', label: t.outputFormat, type: 'select', options: t.contentSuiteOutputs },
      ]
    },
    'text-to-image': {
      id: 'text-to-image',
      name: t.tool3Name,
      description: t.tool3Desc,
      fields: [
        { id: 'category', label: t.imageCategory, type: 'select', options: t.imageCategories },
        { id: 'style', label: t.visualStyle, type: 'select', options: t.visualStyles },
        { id: 'composition', label: t.composition, type: 'select', options: t.compositions },
        { id: 'camera', label: t.cameraLanguage, type: 'select', options: t.cameraLanguages },
        { id: 'lighting', label: t.lightingDesign, type: 'select', options: t.lightingDesigns },
        { id: 'color', label: t.colorDesign, type: 'select', options: t.colorDesigns },
        { id: 'mood', label: t.moodStory, type: 'select', options: t.moodStories },
        { id: 'subject', label: t.subject, type: 'textarea', placeholder: 'Describe the main subject of your image...' },
      ]
    },
    'text-to-video': {
      id: 'text-to-video',
      name: t.tool5Name,
      description: t.tool5Desc,
      fields: [
        { id: 'role_cinematography', label: t.cinematographyRole, type: 'select', options: t.cinematographyRoles },
        { id: 'role_modern', label: t.modernContentRole, type: 'select', options: t.modernContentRoles },
        { id: 'role_artistic', label: t.artisticRole, type: 'select', options: t.artisticRoles },
        { id: 'genre', label: t.genreVideo, type: 'select', options: t.genreVideoOptions },
        { id: 'motion', label: t.cameraMovement, type: 'select', options: t.cameraMovementOptions },
        { id: 'aspect_ratio', label: t.aspectRatio, type: 'select', options: t.aspectRatioOptions },
        { id: 'focus', label: t.cameraFocus, type: 'select', options: t.cameraFocusOptions },
        { id: 'emotion', label: t.emotionalFocus, type: 'select', options: t.emotionalFocusOptions },
        { id: 'lighting', label: t.lighting, type: 'select', options: t.lightingOptions },
        { id: 'texture', label: t.textureRealism, type: 'select', options: t.textureRealismOptions },
        { id: 'weather', label: t.weatherVariation, type: 'select', options: t.weatherVariationOptions },
        { id: 'duration', label: t.videoDuration, type: 'select', options: t.videoDurationOptions },
        { id: 'sound', label: t.soundDesign, type: 'select', options: t.soundDesignOptions },
        { id: 'description', label: t.sceneDescription, type: 'textarea', placeholder: 'Describe the action and environment...' },
      ]
    },
    'image-editor': {
      id: 'image-editor',
      name: t.tool4Name,
      description: t.tool4Desc,
      fields: [
        { id: 'image', label: t.uploadImage, type: 'image' },
        { id: 'mode', label: t.editMode, type: 'select', options: t.editModes },
        { id: 'style', label: t.styleControl, type: 'select', options: t.styleControls },
        { id: 'lighting', label: t.lightingAdjustment, type: 'select', options: t.lightingAdjustments },
        { id: 'grading', label: t.gradingAdjustment, type: 'select', options: t.gradingAdjustments },
        { id: 'changes', label: t.editInstruction, type: 'textarea', placeholder: 'e.g. remove background, change outfit, fix face, add object...' },
      ]
    },
    'shorts-factory': {
      id: 'shorts-factory',
      name: t.tool6Name,
      description: t.tool6Desc,
      fields: [
        { id: 'productImage', label: t.productPhoto, type: 'text', placeholder: 'Paste image URL or description...' },
        { id: 'modelImage', label: t.modelFacePhoto, type: 'text', placeholder: 'Paste image URL or description...' },
        { id: 'productName', label: t.productName, type: 'text', placeholder: 'e.g. Luxury Perfume, Skincare Serum...' },
        { id: 'background', label: t.backgroundSetting, type: 'select', options: t.backgroundSettings },
        { id: 'tone', label: t.toneVoice, type: 'select', options: t.toneVoices },
        { id: 'platform', label: t.platformTarget, type: 'select', options: t.platformTargets },
      ]
    },
    'film-generator': {
      id: 'film-generator',
      name: t.tool7Name,
      description: t.tool7Desc,
      fields: [
        { id: 'title', label: t.filmTitle, type: 'text', placeholder: 'Enter your film title...' },
        { id: 'concept', label: t.coreConcept, type: 'textarea', placeholder: 'What is the main concept or message?' },
        { id: 'genre', label: t.videoGenre, type: 'select', options: t.filmGenres },
        { id: 'shotCount', label: t.shotCount, type: 'text', placeholder: 'e.g. 5, 8, 12...' },
        { id: 'character', label: t.characterDetails, type: 'textarea', placeholder: 'Identity, appearance, emotion, action...' },
        { id: 'reference_image', label: t.referenceImage, type: 'image' },
        { id: 'environment', label: t.environmentDetails, type: 'textarea', placeholder: 'Location, time, weather, atmosphere...' },
      ]
    },
    'sound-generator': {
      id: 'sound-generator',
      name: t.tool10Name,
      description: t.tool10Desc,
      fields: [
        { id: 'genre', label: t.genre, type: 'select', options: t.soundGenres },
        { id: 'mood', label: t.mood, type: 'select', options: t.soundMoods },
        { id: 'description', label: t.soundDetails, type: 'textarea', placeholder: 'Describe the instruments, tempo, and texture...' },
      ]
    },
    'voice-generator': {
      id: 'voice-generator',
      name: t.tool11Name,
      description: t.tool11Desc,
      fields: [
        { id: 'gender', label: t.gender, type: 'select', options: t.genders },
        { id: 'emotion', label: t.emotion, type: 'select', options: t.emotions },
        { id: 'accent', label: t.accent, type: 'select', options: t.accents },
        { id: 'script', label: t.scriptTopic, type: 'textarea', placeholder: 'What should the voice say?' },
      ]
    },
    'full-video': {
      id: 'full-video',
      name: t.tool8Name,
      description: t.tool8Desc,
      fields: [
        { id: 'topic', label: t.videoTopic, type: 'textarea', placeholder: 'Create a cinematic video about...' },
      ]
    },
    'image-extractor': {
      id: 'image-extractor',
      name: t.tool12Name,
      description: t.tool12Desc,
      fields: [
        { id: 'image', label: t.uploadImage, type: 'image' },
      ]
    },
    'video-extractor': {
      id: 'video-extractor',
      name: t.tool13Name,
      description: t.tool13Desc,
      fields: [
        { id: 'video', label: 'Upload Video', type: 'video' },
      ]
    }
  };

  const tool = TOOLS[id];
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      setInputs({});
      setResult(null);
      setImageResult(null);
    }
  }, [language, mounted]);

  if (!tool) return <div className="p-12 text-center">{t.toolNotFound}</div>;

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setQuotaError(false);
    }
  };

  if (id === 'image-editor') {
    return (
      <AppLayout>
        <div className="max-w-full mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles size={12} />
              {t.neuraTool}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">{tool.name}</h1>
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-zinc-500 text-sm font-normal">{tool.description}</p>
            </div>
          </div>
          <ImageEditorTool language={language} />
        </div>
      </AppLayout>
    );
  }

  if (id === 'shorts-factory') {
    return (
      <AppLayout>
        <div className="max-w-full mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles size={12} />
              {t.neuraTool}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">{tool.name}</h1>
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-zinc-500 text-sm font-normal">{tool.description}</p>
            </div>
          </div>
          <UGCTool language={language} />
        </div>
      </AppLayout>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    setImageResult(null);
    setQuotaError(false);
    try {
      const promptText = await generatePrompt(tool.id, inputs, language);
      if (!promptText) {
        throw new Error('No response from AI. Please check your API key or try again.');
      }
      setResult(promptText);
      
      if ((tool.id === 'text-to-image' || tool.id === 'image-editor') && promptText) {
        try {
          const parsed = JSON.parse(promptText);
          const img = await generateImage(
            parsed.prompt || parsed.result || promptText,
            tool.id === 'image-editor' ? inputs.image : undefined
          );
          setImageResult(img);
        } catch (e) {
          const img = await generateImage(
            promptText,
            tool.id === 'image-editor' ? inputs.image : undefined
          );
          setImageResult(img);
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message?.toLowerCase() || "";
      const isQuotaError = errorMsg.includes('429') || 
                          errorMsg.includes('resource_exhausted') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('rate exceeded');
      
      if (isQuotaError) {
        setQuotaError(true);
      } else {
        setResult(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text?: string) => {
    const contentToCopy = text || result;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parsedResult = (() => {
    if (!result) return null;
    const dualOutputTools = [
      'content-suite', 
      'meta-llm', 
      'text-to-image', 
      'image-editor', 
      'image-extractor', 
      'video-extractor',
      'text-to-video'
    ];
    if (dualOutputTools.includes(id)) {
      try {
        return JSON.parse(result);
      } catch (e) {
        // If parsing fails for content tools, treat the whole response as the result
        if (id === 'content-suite' || id === 'meta-llm') {
          return { prompt: "Generated Content", result: result };
        }
        return { prompt: result, result: null };
      }
    }
    return { prompt: result, result: null };
  })();

  const isDualOutput = [
    'content-suite', 
    'meta-llm', 
    'text-to-image', 
    'image-editor', 
    'image-extractor', 
    'video-extractor',
    'text-to-video'
  ].includes(id);

  return (
    <AppLayout>
      <div className="max-w-full mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles size={12} />
            {t.neuraTool}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">{tool.name}</h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <p className="text-zinc-500 text-sm font-normal">{tool.description}</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Input Panel */}
          <div className="p-8 rounded-3xl bg-white border border-zinc-200 space-y-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900">{t.inputConfig}</h2>
              <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">{t.proMode}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Special Role Box for Text to Video */}
              {id === 'text-to-video' && (
                <div className="md:col-span-2 p-6 rounded-2xl bg-zinc-900 text-white space-y-6 border border-zinc-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full" />
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-blue-400" />
                    <h3 className="text-lg font-bold tracking-tight">AI PRODUCTION ROLE</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {tool.fields.filter(f => f.id.startsWith('role_')).map((field) => (
                      <div key={field.id} className="space-y-4">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          {field.id === 'role_cinematography' ? '🎥' : field.id === 'role_modern' ? '📹' : '🎨'} {field.label}
                        </label>
                        <div className="space-y-2.5">
                          {field.options?.map((opt) => {
                            const currentValues = Array.isArray(inputs[field.id]) ? (inputs[field.id] as unknown as any[]) : [];
                            const isChecked = currentValues.includes(opt);
                            return (
                              <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                                <div className="pt-0.5">
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200",
                                    isChecked 
                                      ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                                      : "bg-zinc-800 border-zinc-700 group-hover:border-zinc-500"
                                  )}>
                                    {isChecked && <Check size={10} className="text-white stroke-[3]" />}
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = isChecked 
                                      ? currentValues.filter((i: any) => i !== opt)
                                      : [...currentValues, opt];
                                    setInputs({ ...inputs, [field.id]: next });
                                  }}
                                />
                                <span className={cn(
                                  "text-xs transition-colors duration-200 leading-tight",
                                  isChecked ? "text-blue-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"
                                )}>
                                  {opt}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tool.fields.filter(f => !f.id.startsWith('role_')).map((field) => {
                if (field.condition && !field.condition(inputs)) return null;
                return (
                  <div key={field.id} className={cn("space-y-2", (field.type === 'textarea' || field.type === 'image') && "md:col-span-2")}>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">{field.label}</label>
                    {field.type === 'image' || field.type === 'video' ? (
                      <div className="space-y-4">
                        {!inputs[field.id] ? (
                          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 hover:border-blue-500/50 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-3 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                              <p className="mb-2 text-sm text-zinc-500"><span className="font-semibold">{t.clickToUpload}</span> or drag and drop</p>
                              <p className="text-xs text-zinc-400">{field.type === 'video' ? 'MP4, WebM, OGG (Max 50MB)' : t.uploadLimits}</p>
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept={field.type === 'video' ? "video/*" : "image/*"}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setInputs({ ...inputs, [field.id]: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200 group bg-zinc-50">
                            {field.type === 'video' ? (
                              <video 
                                src={inputs[field.id]} 
                                controls 
                                className="w-full max-h-[400px] object-contain"
                              />
                            ) : (
                              <div className="relative w-full h-48">
                                <Image 
                                  src={inputs[field.id]} 
                                  alt="Upload Preview" 
                                  fill 
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                const newInputs = { ...inputs };
                                delete newInputs[field.id];
                                setInputs(newInputs);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : field.type === 'select' ? (
                      <div className="relative group">
                        <select
                          value={inputs[field.id] || ''}
                          onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-[15px] appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer text-zinc-900 font-medium"
                        >
                          <option value="">{t.selectPlaceholder.replace('{field}', field.label)}</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-zinc-600 transition-colors" />
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={inputs[field.id] || ''}
                        onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={field.rows || 4}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none text-zinc-900 font-medium"
                      />
                    ) : (
                      <input
                        type="text"
                        value={inputs[field.id] || ''}
                        onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-zinc-900 font-medium"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t.generating}
                </>
              ) : (
                <>
                  {t.generateBtn} <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900">{t.results}</h2>
              {result && (
                <div className="flex gap-2">
                  {isDualOutput && parsedResult?.result && (
                    <button
                      onClick={() => copyToClipboard(parsedResult.result)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-[11px] font-bold text-emerald-600 uppercase tracking-wider hover:bg-emerald-100 transition-all"
                    >
                      {t.copyResult}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isDualOutput && parsedResult?.categories) {
                        const allContent = parsedResult.categories.map((c: any) => `### ${c.title}\n${c.content}`).join('\n\n');
                        copyToClipboard(allContent);
                      } else {
                        // For content-suite and meta-llm, copy the result. For others, copy the prompt.
                        const useResult = id === 'content-suite' || id === 'meta-llm';
                        copyToClipboard(isDualOutput ? (useResult ? parsedResult?.result : parsedResult?.prompt) : result);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? t.copiedBtn : isDualOutput ? (parsedResult?.categories ? t.copyAllBtn : (id === 'content-suite' || id === 'meta-llm' ? t.copyResult : t.copyPrompt)) : t.copyStrategyBtn}
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-[400px] p-8 rounded-3xl bg-white border border-zinc-200 backdrop-blur-sm relative overflow-hidden shadow-sm">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm animate-pulse font-medium">{t.processing}</p>
                  </motion.div>
                ) : parsedResult ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    {imageResult && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-semibold uppercase tracking-wider">
                          <Sparkles size={12} />
                          {t.output} {t.nanoBanana}
                        </div>
                        <div className="relative aspect-square w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-zinc-200 group">
                          <Image 
                            src={imageResult} 
                            alt="Generated AI" 
                            fill 
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a 
                              href={imageResult} 
                              download="neura-studio-ai.png"
                              className="px-6 py-3 bg-white text-zinc-900 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                            >
                              <ChevronDown size={18} className="rotate-180" />
                              {t.downloadImageBtn}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {parsedResult.result && !imageResult && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-semibold uppercase tracking-wider">
                          <Sparkles size={12} />
                          {t.output} {t.llamaModel}
                        </div>
                        <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 overflow-hidden">
                          <div className="prose prose-zinc prose-sm max-w-none prose-headings:text-zinc-900 text-zinc-900 break-words">
                            <ReactMarkdown>{parsedResult.result}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}

                    {parsedResult.categories && (
                      <div className="grid grid-cols-1 gap-8">
                        {parsedResult.categories.map((cat: any, idx: number) => (
                          <div key={idx} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-semibold uppercase tracking-wider">
                                <Sparkles size={12} />
                                {cat.title}
                              </div>
                              <button
                                onClick={() => {
                                  if (cat.items) {
                                    copyToClipboard(cat.items.join('\n\n'));
                                  } else {
                                    copyToClipboard(cat.content);
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase hover:bg-zinc-50 transition-all shadow-sm"
                              >
                                <Copy size={12} />
                                {t.copySpecificBtn.replace('{title}', cat.title)}
                              </button>
                            </div>
                            
                            {cat.items ? (
                              <div className="space-y-4">
                                {cat.items.map((item: string, i: number) => (
                                  <div key={i} className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 group/item relative overflow-hidden">
                                    <div className="prose prose-zinc prose-sm max-w-none prose-headings:text-zinc-900 text-zinc-900 break-words">
                                      <ReactMarkdown>{item}</ReactMarkdown>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(item)}
                                      className="absolute top-4 right-4 p-2 bg-white border border-zinc-200 rounded-lg text-zinc-400 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                                      title="Copy this point"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden">
                                <div className="prose prose-zinc prose-sm max-w-none prose-headings:text-zinc-900 text-zinc-900 break-words">
                                  <ReactMarkdown>{cat.content}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Master Prompt Section - Hidden for content-suite and meta-llm as per user request */}
                    {id !== 'content-suite' && id !== 'meta-llm' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 text-[11px] font-semibold uppercase tracking-wider">
                          <Zap size={12} />
                          {t.masterPrompt}
                        </div>
                        <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden">
                          <div className="prose prose-zinc prose-sm max-w-none prose-headings:text-zinc-900 text-zinc-900 break-words">
                            <ReactMarkdown>{parsedResult.prompt}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-4"
                  >
                    <div className="p-4 rounded-full bg-zinc-50 border border-zinc-100">
                      <Info size={24} className="text-zinc-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-400 font-medium">{t.noPrompt}</p>
                      <p className="text-zinc-300 text-xs font-normal">{t.configureMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
