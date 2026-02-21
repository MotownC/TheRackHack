import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Image as ImageIcon, Loader2, Download, Sparkles, Camera, User, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateProductShot } from '@/services/gemini';

// Types
type GenerationMode = 'model' | 'glamour';
type ModelType = 'female' | 'male' | 'diverse' | 'mannequin';
type LightingStyle = 'studio' | 'golden-hour' | 'neon' | 'minimalist' | 'nature';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  // State
  const [uploadedImage, setUploadedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [refineSource, setRefineSource] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Configuration State
  const [mode, setMode] = useState<GenerationMode>('model');
  const [modelType, setModelType] = useState<ModelType>('female');
  const [lighting, setLighting] = useState<LightingStyle>('studio');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      // Remove data URL prefix for API
      const base64Data = base64String.split(',')[1];
      const mimeType = base64String.split(';')[0].split(':')[1];
      
      setUploadedImage({ data: base64Data, mimeType });
      setRefineSource(null); // Reset refine source when new file uploaded
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const source = refineSource ? { data: refineSource.url.split(',')[1], mimeType: 'image/png' } : uploadedImage;

    if (!source) {
      setError("Please upload an image or select a generated image to refine.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Construct prompt based on settings
      let promptText = "";
      
      if (refineSource) {
        promptText = `Modify the provided image based on these instructions: ${customPrompt || 'Enhance the professional quality'}. `;
        promptText += `Maintain the core clothing item and the overall composition of the reference image. `;
      } else {
        if (mode === 'model') {
          promptText = `Professional fashion photography of a ${modelType} model wearing the clothing item shown in the reference image. The clothing item must be preserved exactly. `;
        } else {
          promptText = `Professional product photography of the clothing item shown in the reference image. Standalone glamour shot, creative composition. The clothing item must be preserved exactly. `;
        }
      }

      promptText += `Lighting style: ${lighting}. High fashion, 4k resolution, photorealistic, highly detailed texture. `;
      
      if (!refineSource && customPrompt) {
        promptText += `Additional details: ${customPrompt}`;
      }

      const imageUrl = await generateProductShot(source.data, source.mimeType, promptText);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: promptText,
        timestamp: Date.now(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage);
      // We don't automatically set the new image as refine source to avoid confusion
      // but we keep the current refineSource if it was used

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `rack-hack-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] flex flex-col md:flex-row overflow-hidden font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* Sidebar / Configuration Panel */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-[400px] flex-shrink-0 border-r border-white/10 bg-[#0a0a0a] flex flex-col h-screen overflow-y-auto"
      >
        <div className="p-8 border-b border-white/10">
          <h1 className="font-serif text-3xl italic tracking-wide text-white">The Rack Hack Studio</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-2">AI Studio Pro</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          
          {/* Upload Section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">01. Source Material</h2>
            
            {refineSource ? (
              <div className="relative group rounded-xl overflow-hidden border border-[#D4AF37] aspect-[3/4] bg-black/40">
                <img 
                  src={refineSource.url} 
                  alt="Refine Source" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-2">Refining Mode</p>
                  <button 
                    onClick={() => setRefineSource(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-colors"
                  >
                    Switch to Original
                  </button>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-[#D4AF37] text-black text-[10px] font-bold rounded uppercase tracking-tighter">
                  Active Baseline
                </div>
              </div>
            ) : !uploadedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group h-48"
              >
                <Upload className="w-8 h-8 text-white/30 group-hover:text-[#D4AF37] transition-colors mb-4" />
                <p className="text-sm text-white/60 text-center">Upload clothing item</p>
                <p className="text-xs text-white/30 mt-2">JPG, PNG up to 10MB</p>
              </div>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4]">
                <img 
                  src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`} 
                  alt="Uploaded" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                  className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </section>

          {/* Configuration Section */}
          <section className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">02. Configuration</h2>
            
            {/* Mode Selection - Hidden if refining as we follow the baseline's mode mostly */}
            {!refineSource && (
              <div className="space-y-3">
                <label className="text-sm text-white/70">Shot Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('model')}
                    className={cn(
                      "p-3 rounded-lg border text-sm transition-all text-left flex items-center gap-2",
                      mode === 'model' 
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" 
                        : "border-white/10 hover:border-white/30 text-white/60"
                    )}
                  >
                    <User className="w-4 h-4" />
                    On Model
                  </button>
                  <button
                    onClick={() => setMode('glamour')}
                    className={cn(
                      "p-3 rounded-lg border text-sm transition-all text-left flex items-center gap-2",
                      mode === 'glamour' 
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" 
                        : "border-white/10 hover:border-white/30 text-white/60"
                    )}
                  >
                    <Camera className="w-4 h-4" />
                    Glamour Shot
                  </button>
                </div>
              </div>
            )}

            {/* Model Settings (Only if mode is model and not refining) */}
            <AnimatePresence>
              {mode === 'model' && !refineSource && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <label className="text-sm text-white/70">Model Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['female', 'male', 'diverse', 'mannequin'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setModelType(t)}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-xs capitalize transition-all",
                          modelType === t
                            ? "border-white bg-white text-black font-medium" 
                            : "border-white/10 hover:border-white/30 text-white/60"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lighting Settings */}
            <div className="space-y-3">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <Sun className="w-4 h-4" /> Lighting & Vibe
              </label>
              <select 
                value={lighting}
                onChange={(e) => setLighting(e.target.value as LightingStyle)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none"
              >
                <option value="studio">Studio Clean</option>
                <option value="golden-hour">Golden Hour</option>
                <option value="neon">Neon/Cyberpunk</option>
                <option value="minimalist">Minimalist</option>
                <option value="nature">Nature/Outdoor</option>
              </select>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-3">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> {refineSource ? 'Instructions for Edit' : 'Custom Details'}
              </label>
              <textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={refineSource ? "E.g. 'Change background to blue', 'Make the lighting warmer'..." : "E.g. 'Add a silk scarf', 'Red background', 'Holding a coffee'..."}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors min-h-[80px] resize-none"
              />
            </div>

          </section>
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!uploadedImage && !refineSource)}
            className={cn(
              "w-full py-4 rounded-full font-medium tracking-wide transition-all flex items-center justify-center gap-2",
              isGenerating || (!uploadedImage && !refineSource)
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : refineSource 
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#D4AF37] text-black hover:bg-[#F4CF57] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {refineSource ? 'REFINING...' : 'PROCESSING...'}
              </>
            ) : (
              <>
                {refineSource ? 'REFINE SELECTED' : 'GENERATE SHOOT'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Canvas / Preview Area */}
      <div className="flex-1 bg-[#050505] relative flex flex-col h-screen">
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-white/30">CANVAS_ID: {Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex items-center gap-6">
             {selectedImage && (
               <>
                 <button 
                   onClick={() => {
                     setRefineSource(selectedImage);
                     setCustomPrompt('');
                     // Scroll to top of sidebar if needed, but usually it's fine
                   }}
                   className={cn(
                     "flex items-center gap-2 text-xs uppercase tracking-widest transition-colors",
                     refineSource?.id === selectedImage.id ? "text-[#D4AF37]" : "hover:text-[#D4AF37]"
                   )}
                 >
                   <Sparkles className="w-4 h-4" />
                   {refineSource?.id === selectedImage.id ? 'Active Baseline' : 'Use as Baseline'}
                 </button>
                 <button 
                   onClick={() => handleDownload(selectedImage.url)}
                   className="flex items-center gap-2 text-xs uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
                 >
                   <Download className="w-4 h-4" />
                   Download Asset
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {selectedImage ? (
              <motion.div 
                key={selectedImage.id}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="relative max-h-full max-w-full shadow-2xl shadow-black/50 rounded-sm overflow-hidden border border-white/5"
              >
                <img 
                  src={selectedImage.url} 
                  alt="Generated" 
                  className="max-h-[calc(100vh-200px)] w-auto object-contain"
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-24 h-24 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-white/20 font-serif italic text-xl">Your masterpiece awaits...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Strip */}
        {generatedImages.length > 0 && (
          <div className="h-32 border-t border-white/10 bg-[#0a0a0a] p-4 flex gap-4 overflow-x-auto items-center">
            {generatedImages.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={cn(
                  "relative h-24 aspect-[3/4] rounded-lg overflow-hidden border transition-all flex-shrink-0",
                  selectedImage?.id === img.id 
                    ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" 
                    : "border-white/10 opacity-50 hover:opacity-100"
                )}
              >
                <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
