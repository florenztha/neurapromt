'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Upload, RefreshCw, AlertCircle, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { smartGenerateContent } from "@/lib/ai";
import { useWallet } from '@/context/WalletContext';
import Image from 'next/image';

import { useLanguage } from '@/context/LanguageContext';

export default function ImageEditorTool({ language = 'English' }: { language?: 'Indonesia' | 'English' }) {
  const { t } = useLanguage();
  
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [masterPrompt, setMasterPrompt] = useState<string | null>(null);
  const [inputs, setInputs] = useState({
    mode: 'enhancement',
    style: 'photorealistic',
    lighting: 'exposure correction',
    color: 'color grading',
    detail: 'sharpen',
    camera: 'Eye Level',
    instruction: '',
    refPurpose: 'style transfer',
    preservationRules: ['identity', 'pose', 'perspective', 'proportions', 'realism'],
    negativeConstraints: 'avoid distortion, artifacts, warped face, fake texture, watermark, text errors'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const { account, connect } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setQuotaError(false);
      setError(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'ref') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'source') {
          setSourceImage(event.target?.result as string);
          setEditedImage(null);
        } else {
          setRefImage(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyEdit = async () => {
    if (!sourceImage || !inputs.instruction.trim() || loading) return;

    setLoading(true);
      if (!account) {
        await connect();
      }
    setError(null);
    setQuotaError(false);
    try {
      const prompt = `
ROLE: Advanced AI Image Editor
EDIT MODE: ${inputs.mode}
STYLE: ${inputs.style}
LIGHTING: ${inputs.lighting}
COLOR: ${inputs.color}
CAMERA: ${inputs.camera}
DETAIL: ${inputs.detail}
INSTRUCTION: ${inputs.instruction}
REFERENCE PURPOSE: ${refImage ? inputs.refPurpose : 'none'}
PRESERVATION RULES: ${inputs.preservationRules.join(', ')}
NEGATIVE CONSTRAINTS: ${inputs.negativeConstraints}
      `;

      setMasterPrompt(prompt);

      const response = await smartGenerateContent({
        preferredModel: "llama-3.3-70b-versatile",
        fallbackModels: [],
        contents: prompt,
        config: {
          systemInstruction: "You are an expert AI Image Editor. Since you are a text model, explain how the image should be edited based on the instructions. Provide a detailed technical breakdown."
        }
      });

      if (response.text) {
        // Now generate the actual image using the master prompt
        const { generateImage } = await import("@/lib/ai");
        const editedImageUrl = await generateImage(response.text, sourceImage);
        
        if (editedImageUrl) {
          setEditedImage(editedImageUrl);
        } else {
          throw new Error(language === 'Indonesia' ? 'Gagal menghasilkan gambar yang diedit.' : 'Failed to generate edited image.');
        }
      }

    } catch (err: any) {
      console.error("Image editing error:", err);
      const errorMsg = err.message?.toLowerCase() || "";
      const isQuotaError = errorMsg.includes('429') || 
                          errorMsg.includes('resource_exhausted') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('rate exceeded');
      
      if (isQuotaError) {
        setQuotaError(true);
      }
      setError(err.message || (language === 'Indonesia' ? 'Gagal mengedit gambar. Silakan coba lagi.' : 'Failed to edit image. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const downloadEditedImage = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `edited-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-40">
      {/* Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Source */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{language === 'Indonesia' ? 'Gambar Asli' : 'Original Image'}</h3>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider">Required</span>
          </div>
          <div className="aspect-square bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm relative group">
            {sourceImage ? (
              <>
                <Image src={sourceImage} alt="Source" fill className="object-contain p-4" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setSourceImage(null)}
                  className="absolute top-4 right-4 p-2.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-3">
                <div className="p-6 bg-zinc-50 rounded-full border border-dashed border-zinc-200">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest">{language === 'Indonesia' ? 'Belum ada gambar yang diunggah' : 'No image uploaded yet'}</span>
              </div>
            )}
            {!sourceImage && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}
            <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'source')} accept="image/*" className="hidden" />
          </div>
        </motion.div>

        {/* Reference */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{language === 'Indonesia' ? 'Gambar Referensi' : 'Reference Image'}</h3>
            <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[9px] font-bold uppercase tracking-wider">Optional</span>
          </div>
          <div className="aspect-square bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm relative group">
            {refImage ? (
              <>
                <Image src={refImage} alt="Reference" fill className="object-contain p-4" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setRefImage(null)}
                  className="absolute top-4 right-4 p-2.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-3">
                <div className="p-6 bg-zinc-50 rounded-full border border-dashed border-zinc-200">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest">{language === 'Indonesia' ? 'Referensi Gaya/Warna' : 'Style/Color Reference'}</span>
              </div>
            )}
            {!refImage && (
              <button 
                onClick={() => refInputRef.current?.click()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}
            <input type="file" ref={refInputRef} onChange={(e) => handleImageUpload(e, 'ref')} accept="image/*" className="hidden" />
          </div>
          {refImage && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider ml-1">{language === 'Indonesia' ? 'Tujuan Referensi' : 'Reference Purpose'}</label>
              <select 
                value={inputs.refPurpose}
                onChange={(e) => setInputs({...inputs, refPurpose: e.target.value})}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
              >
                {['style transfer', 'color reference', 'lighting reference', 'character consistency'].map(opt => (
                  <option key={opt} value={opt}>{opt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        {/* Result */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{language === 'Indonesia' ? 'Hasil Edit AI' : 'AI Edited Result'}</h3>
            {editedImage && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">Done</span>}
          </div>
          <div className="aspect-square bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm relative group">
            <AnimatePresence mode="wait">
              {editedImage ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full relative"
                >
                  <Image src={editedImage} alt="Edited" fill className="object-contain p-4" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={downloadEditedImage}
                      className="p-4 bg-white text-zinc-900 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
                    >
                      <Download className="w-4 h-4 text-blue-600" /> {language === 'Indonesia' ? 'Unduh' : 'Download'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-3">
                  <div className="p-6 bg-zinc-50 rounded-full border border-dashed border-zinc-200">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">{language === 'Indonesia' ? 'Hasil edit AI akan muncul di sini' : 'AI edit result will appear here'}</span>
                </div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-10">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-blue-600 animate-pulse uppercase tracking-widest text-[10px]">{language === 'Indonesia' ? 'Neura sedang mengedit...' : 'Neura is editing...'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Master Prompt Display */}
      <AnimatePresence>
        {masterPrompt && editedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Optimized Master Prompt</h3>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(masterPrompt);
                  // Optional: add toast notification here
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Copy Prompt
              </button>
            </div>
            <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800">
              <pre className="text-zinc-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {masterPrompt}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Controls Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 lg:p-12 shadow-sm space-y-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Edit Mode */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.editMode}</label>
            <select 
              value={inputs.mode}
              onChange={(e) => setInputs({...inputs, mode: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              {['enhancement', 'inpainting', 'outpainting', 'relighting', 'recolor', 'retouch', 'style transfer', 'object replace'].map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Style Control */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.styleControl}</label>
            <select 
              value={inputs.style}
              onChange={(e) => setInputs({...inputs, style: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              {['photorealistic', 'cinematic', 'fashion editorial', 'anime style', 'luxury commercial'].map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Lighting */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.lightingAdjustment}</label>
            <select 
              value={inputs.lighting}
              onChange={(e) => setInputs({...inputs, lighting: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              {['exposure correction', 'cinematic lighting', 'shadow balance'].map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.gradingAdjustment}</label>
            <select 
              value={inputs.color}
              onChange={(e) => setInputs({...inputs, color: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              {['color grading', 'tone adjustment', 'white balance'].map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Camera Position */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.cameraPosition}</label>
            <select 
              value={inputs.camera}
              onChange={(e) => setInputs({...inputs, camera: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              {t.cameraPositions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Detail */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{language === 'Indonesia' ? 'Peningkatan Detail' : 'Detail Enhancement'}</label>
            <select 
              value={inputs.detail}
              onChange={(e) => setInputs({...inputs, detail: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-semibold text-zinc-900 focus:ring-2 ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              {['sharpen', 'denoise', 'texture recovery'].map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Preservation Rules */}
          <div className="space-y-3 lg:col-span-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{language === 'Indonesia' ? 'Aturan Pelestarian' : 'Preservation Rules'}</label>
            <div className="flex flex-wrap gap-3">
              {['identity', 'pose', 'perspective', 'proportions', 'realism'].map(rule => (
                <button
                  key={rule}
                  onClick={() => {
                    const newRules = inputs.preservationRules.includes(rule)
                      ? inputs.preservationRules.filter(r => r !== rule)
                      : [...inputs.preservationRules, rule];
                    setInputs({...inputs, preservationRules: newRules});
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    inputs.preservationRules.includes(rule)
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-zinc-200'
                  }`}
                >
                  {rule}
                </button>
              ))}
            </div>
          </div>

          {/* Negative Constraints */}
          <div className="space-y-3 lg:col-span-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">{language === 'Indonesia' ? 'Batasan Negatif' : 'Negative Constraints'}</label>
            <textarea
              value={inputs.negativeConstraints}
              onChange={(e) => setInputs({...inputs, negativeConstraints: e.target.value})}
              rows={2}
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-zinc-300 text-xs font-medium"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1 ml-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{t.editInstruction}</label>
              <p className="text-[9px] text-zinc-400 italic">{language === 'Indonesia' ? 'Terserah apa yang kamu ingin edit, silahkan di tulis bebas di kotak bawah ini.' : 'Feel free to type anything you want to edit in the box below.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'remove background', 'change outfit', 'make cinematic lighting', 'upscale image', 'fix face', 'add object',
                'change background', 'recolor hair', 'add sunglasses', 'make it sunset', 'add snow effect', 'make it vintage',
                'add neon glow', 'remove object', 'change eye color', 'add tattoos', 'make it anime style', 'add rain effect',
                'change season to autumn', 'make it black and white'
              ].map(action => (
                <button
                  key={action}
                  onClick={() => {
                    const current = inputs.instruction.trim();
                    const newValue = current ? `${current}, ${action}` : action;
                    setInputs({...inputs, instruction: newValue});
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <textarea
              value={inputs.instruction}
              onChange={(e) => setInputs({...inputs, instruction: e.target.value})}
              placeholder={t.placeholder_instructions}
              rows={4}
              className="w-full px-8 py-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] focus:ring-4 ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-zinc-300 text-base font-medium"
            />
            
            <div className="flex justify-end">
              <button
                onClick={applyEdit}
                disabled={loading || !sourceImage || !inputs.instruction.trim()}
                className="px-12 py-5 bg-blue-600 text-white font-bold rounded-[1.5rem] shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-3 text-xs uppercase tracking-widest"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? t.btn_processing : t.btn_apply}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center gap-4 text-amber-600 font-bold text-[11px] uppercase tracking-[0.2em]">
            <AlertCircle className="w-6 h-6 shrink-0" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
