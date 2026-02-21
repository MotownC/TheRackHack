import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader2, Camera, User, Upload, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function GlamourGenerator({ onImageGenerated, onClose, currentImage }) {
  const [sourceImage, setSourceImage] = useState(null); // { data, mimeType }
  const [mode, setMode] = useState('model');
  const [modelType, setModelType] = useState('female');
  const [lighting, setLighting] = useState('studio');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [useExisting, setUseExisting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      const base64Data = base64String.split(',')[1];
      const mimeType = base64String.split(';')[0].split(':')[1];
      setSourceImage({ data: base64Data, mimeType });
      setUseExisting(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUseExisting = async () => {
    if (!currentImage) return;
    try {
      setError(null);
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        const base64Data = base64String.split(',')[1];
        const mimeType = blob.type || 'image/jpeg';
        setSourceImage({ data: base64Data, mimeType });
        setUseExisting(true);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError('Failed to load existing image. Try uploading directly.');
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      setError('Please upload an image or use the existing product image.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedUrl(null);

    try {
      const response = await fetch(`${API_URL}/api/generate-glamour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: sourceImage.data,
          mimeType: sourceImage.mimeType,
          mode,
          modelType,
          lighting,
          customPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedUrl(data.url);
    } catch (err) {
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">AI Glamour Studio</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Source Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Source Image
            </label>
            {sourceImage ? (
              <div className="relative">
                <img
                  src={useExisting ? currentImage : `data:${sourceImage.mimeType};base64,${sourceImage.data}`}
                  alt="Source"
                  className="w-full h-48 object-contain bg-slate-100 rounded-lg"
                />
                <button
                  onClick={() => { setSourceImage(null); setUseExisting(false); }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Upload Photo</p>
                    <p className="text-xs text-slate-400">From gallery</p>
                  </div>
                  <div
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Camera className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Take Photo</p>
                    <p className="text-xs text-slate-400">Use camera</p>
                  </div>
                </div>
                {currentImage && (
                  <button
                    onClick={handleUseExisting}
                    className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Use current product image
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
              capture="environment"
            />
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Shot Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('model')}
                className={`p-3 rounded-lg border text-sm flex items-center gap-2 transition-all ${
                  mode === 'model'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <User className="w-4 h-4" />
                On Model
              </button>
              <button
                type="button"
                onClick={() => setMode('glamour')}
                className={`p-3 rounded-lg border text-sm flex items-center gap-2 transition-all ${
                  mode === 'glamour'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Camera className="w-4 h-4" />
                Glamour Shot
              </button>
            </div>
          </div>

          {/* Model Type (only when mode = model) */}
          {mode === 'model' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Model Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['female', 'male', 'diverse', 'mannequin'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setModelType(t)}
                    className={`px-3 py-2 rounded-lg border text-xs capitalize transition-all ${
                      modelType === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lighting */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lighting Style</label>
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="studio">Studio Clean</option>
              <option value="golden-hour">Golden Hour</option>
              <option value="neon">Neon / Cyberpunk</option>
              <option value="minimalist">Minimalist</option>
              <option value="nature">Nature / Outdoor</option>
            </select>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Custom Details (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="E.g., 'Add a silk scarf', 'Red background', 'Holding a coffee'..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              rows="2"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Generated Preview */}
          {generatedUrl && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Generated Result</label>
              <img
                src={generatedUrl}
                alt="Generated glamour"
                className="w-full h-64 object-contain bg-slate-100 rounded-lg"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {generatedUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onImageGenerated(generatedUrl);
                    onClose();
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Use This Image
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-sm"
                >
                  Regenerate
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !sourceImage}
                className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  isGenerating || !sourceImage
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Glamour Photo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlamourGenerator;
