
import React, { useState, useRef } from 'react';
import { STYLES, ASPECT_RATIOS, TARGET_MARKETS, CATEGORIES, PLATFORMS } from './constants';
import { GenerationConfig, GeneratedImage, UploadedImage, EditablePoint } from './types';
import { Card, Button, SectionTitle, LoadingOverlay } from './components/UI';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: '1:1',
    imageSize: '1K',
    style: STYLES[0],
    sellingPoints: '',
    competitorLink: '',
    targetMarket: TARGET_MARKETS[0],
    category: CATEGORIES[0],
    marketingPlatform: PLATFORMS[0],
    uploadedImages: [],
    selectedImageId: null,
    visualAnalysis: { subject: '', accessories: '', materials: '' }
  });

  const [editablePoints, setEditablePoints] = useState<EditablePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const processFile = (file: File): Promise<UploadedImage> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          base64: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (replacingId) {
      if (files.length > 0) {
        const processed = await processFile(files[0]);
        setConfig(prev => ({
          ...prev,
          uploadedImages: prev.uploadedImages.map(img => img.id === replacingId ? processed : img),
          selectedImageId: prev.selectedImageId === replacingId ? processed.id : prev.selectedImageId
        }));
      }
      setReplacingId(null);
    } else {
      const remaining = 9 - config.uploadedImages.length;
      const toProcess = files.slice(0, remaining);
      const newImgs = await Promise.all(toProcess.map(processFile));
      setConfig(prev => ({
        ...prev,
        uploadedImages: [...prev.uploadedImages, ...newImgs],
        selectedImageId: prev.selectedImageId || newImgs[0]?.id || null
      }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  const deleteImage = (id: string) => {
    setConfig(prev => {
      const filtered = prev.uploadedImages.filter(img => img.id !== id);
      return {
        ...prev,
        uploadedImages: filtered,
        selectedImageId: prev.selectedImageId === id ? (filtered[0]?.id || null) : prev.selectedImageId
      };
    });
  };

  const triggerAnalysis = async () => {
    const selectedImg = config.uploadedImages.find(i => i.id === config.selectedImageId);
    if (selectedImg) {
      setIsLoading(true);
      setLoadingMessage('正在分析产品主体与材质细节...');
      try {
        const analysis = await geminiService.analyzeProduct(selectedImg.base64, config.competitorLink);
        setConfig(prev => ({ ...prev, visualAnalysis: analysis }));
      } catch (e) {
        alert('分析失败');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTranslate = async (idx: number, fromZh: boolean) => {
    const point = editablePoints[idx];
    const textToTranslate = fromZh ? point.promptZh : point.promptEn;
    if (!textToTranslate) return;

    setIsLoading(true);
    setLoadingMessage('同步翻译中...');
    try {
      const translated = await geminiService.translatePrompt(textToTranslate, fromZh);
      setEditablePoints(prev => {
        const next = [...prev];
        if (fromZh) next[idx].promptEn = translated;
        else next[idx].promptZh = translated;
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePoints = async () => {
    if (!config.selectedImageId || !config.sellingPoints) return;
    const points = config.sellingPoints.split(/[\n,;，；]/).map(p => p.trim()).filter(p => p.length > 0);
    
    setIsLoading(true);
    setLoadingMessage(`正在为 ${points.length} 个卖点生成专属提示词...`);
    try {
      const result = await geminiService.refinePromptsForPoints(
        config.style.promptTemplate,
        points,
        config.visualAnalysis,
        config.targetMarket,
        config.category,
        config.marketingPlatform,
        config.competitorLink
      );
      setEditablePoints(result);
    } catch (e) {
      alert('提示词生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const startBatchGen = async () => {
    const selectedImg = config.uploadedImages.find(i => i.id === config.selectedImageId);
    if (!selectedImg || editablePoints.length === 0) return;

    setIsLoading(true);
    const newResults: GeneratedImage[] = [];
    for (let i = 0; i < editablePoints.length; i++) {
      const item = editablePoints[i];
      setLoadingMessage(`正在渲染图片 (${i + 1}/${editablePoints.length}): ${item.slogan}...`);
      try {
        const url = await geminiService.generateProductScene(selectedImg.base64, item, config.aspectRatio);
        newResults.push({
          id: Math.random().toString(36).substr(2, 9),
          url,
          prompt: item.promptEn,
          slogan: item.slogan,
          sourceImageId: selectedImg.id,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error("Point gen failed", i);
      }
    }
    setResults(prev => [...newResults, ...prev]);
    setIsLoading(false);
  };

  const regenerateSingle = async (oldImg: GeneratedImage) => {
    const point = editablePoints.find(p => p.slogan === oldImg.slogan);
    if (!point) {
      alert('原始提示词已丢失，请重新生成所有图片');
      return;
    }
    setIsLoading(true);
    setLoadingMessage(`重新渲染: ${point.slogan}...`);
    try {
      const selectedImg = config.uploadedImages.find(i => i.id === oldImg.sourceImageId);
      if (!selectedImg) throw new Error("Image not found");
      const url = await geminiService.generateProductScene(selectedImg.base64, point, config.aspectRatio);
      setResults(prev => prev.map(img => img.id === oldImg.id ? { ...img, url, timestamp: Date.now() } : img));
    } catch (e) {
      alert('重试失败');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-scene-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <input type="file" ref={replaceInputRef} onChange={handleFileUpload} hidden accept="image/*" />

      <header className="bg-white border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fas fa-magic text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI 智能产品场景大师</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">High Fidelity Commercial Studio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>重置</Button>
          <Button onClick={startBatchGen} disabled={editablePoints.length === 0 || isLoading}>一键生成所有卖点图</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 space-y-6">
            {/* STEP 1: IMAGE GALLERY */}
            <Card className="p-6">
              <SectionTitle title="第一步：管理产品库" subtitle="最多上传9张，点击选择一张进行生成" icon="fas fa-images" />
              <div className="grid grid-cols-3 gap-3 mb-6">
                {config.uploadedImages.map(img => (
                  <div key={img.id} className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer relative group transition-all ${config.selectedImageId === img.id ? 'border-indigo-500 shadow-md scale-95' : 'border-slate-100'}`} onClick={() => setConfig(prev => ({ ...prev, selectedImageId: img.id }))}>
                    <img src={img.base64} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-indigo-500" onClick={(e) => { e.stopPropagation(); setReplacingId(img.id); replaceInputRef.current?.click(); }}><i className="fas fa-sync-alt text-xs"></i></button>
                      <button className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                ))}
                {config.uploadedImages.length < 9 && (
                  <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50">
                    <i className="fas fa-plus"></i>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden multiple accept="image/*" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase">竞品参考链接</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Amazon/Tmall link..." className="flex-1 text-sm border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={config.competitorLink} onChange={e => setConfig({...config, competitorLink: e.target.value})} />
                  <Button variant="outline" onClick={triggerAnalysis} disabled={!config.selectedImageId}>智能分析</Button>
                </div>
              </div>
            </Card>

            {/* STEP 2: EDITABLE ANALYSIS */}
            <Card className="p-6 bg-indigo-50/30 border-indigo-100">
              <SectionTitle title="视觉分析报告 (手动修正)" icon="fas fa-fingerprint" />
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-indigo-400">产品主体</label>
                  <input className="w-full text-sm font-semibold bg-white border border-indigo-100 rounded-lg px-3 py-2" value={config.visualAnalysis.subject} onChange={e => setConfig({...config, visualAnalysis: {...config.visualAnalysis, subject: e.target.value}})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-400">配件</label>
                    <input className="w-full text-sm font-semibold bg-white border border-indigo-100 rounded-lg px-3 py-2" value={config.visualAnalysis.accessories} onChange={e => setConfig({...config, visualAnalysis: {...config.visualAnalysis, accessories: e.target.value}})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-400">材质</label>
                    <input className="w-full text-sm font-semibold bg-white border border-indigo-100 rounded-lg px-3 py-2" value={config.visualAnalysis.materials} onChange={e => setConfig({...config, visualAnalysis: {...config.visualAnalysis, materials: e.target.value}})} />
                  </div>
                </div>
              </div>
            </Card>

            {/* STEP 3: MARKET SETTINGS */}
            <Card className="p-6">
              <SectionTitle title="参数设定" icon="fas fa-cog" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select value={config.targetMarket} onChange={e => setConfig({...config, targetMarket: e.target.value})} className="text-sm border-slate-200 rounded-lg py-2">
                    {TARGET_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={config.category} onChange={e => setConfig({...config, category: e.target.value})} className="text-sm border-slate-200 rounded-lg py-2">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <select value={config.marketingPlatform} onChange={e => setConfig({...config, marketingPlatform: e.target.value})} className="w-full text-sm border-slate-200 rounded-lg py-2">
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <textarea value={config.sellingPoints} onChange={e => setConfig({...config, sellingPoints: e.target.value})} className="w-full text-sm border-slate-200 rounded-lg h-24 p-3 outline-none" placeholder="输入卖点，每行一个..." />
                <Button onClick={generatePoints} className="w-full bg-slate-900 text-white" disabled={!config.selectedImageId || !config.sellingPoints}>
                   生成卖点提示词
                </Button>
              </div>
            </Card>

            {/* STEP 4: EDITABLE POINTS LIST */}
            {editablePoints.length > 0 && (
              <div className="space-y-4">
                <SectionTitle title="提示词编辑器" subtitle="支持双语实时互转，每个卖点对应一张图" icon="fas fa-edit" />
                {editablePoints.map((item, idx) => (
                  <Card key={item.id} className="p-5 space-y-4 border-indigo-100">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-indigo-600">卖点分项 {idx + 1}</span>
                      <input className="text-xs font-bold bg-slate-100 px-2 py-1 rounded" value={item.slogan} onChange={e => {
                        const next = [...editablePoints];
                        next[idx].slogan = e.target.value;
                        setEditablePoints(next);
                      }} />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400">中文场景参考 (编辑自动转英文)</label>
                          <button onClick={() => handleTranslate(idx, true)} className="text-[10px] text-indigo-500"><i className="fas fa-sync"></i> 翻译至英文</button>
                        </div>
                        <textarea className="w-full text-xs p-2 bg-slate-50 rounded h-16 border-0" value={item.promptZh} onChange={e => {
                          const next = [...editablePoints];
                          next[idx].promptZh = e.target.value;
                          setEditablePoints(next);
                        }} onBlur={() => handleTranslate(idx, true)} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400">英文绘图指令 (编辑自动转中文)</label>
                          <button onClick={() => handleTranslate(idx, false)} className="text-[10px] text-indigo-500"><i className="fas fa-sync"></i> 翻译至中文</button>
                        </div>
                        <textarea className="w-full text-xs p-2 bg-slate-50 rounded h-16 border-0 font-mono" value={item.promptEn} onChange={e => {
                          const next = [...editablePoints];
                          next[idx].promptEn = e.target.value;
                          setEditablePoints(next);
                        }} onBlur={() => handleTranslate(idx, false)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">标语大小</label>
                        <select className="w-full text-[10px] border-slate-200 rounded" value={item.fontSize} onChange={e => {
                          const next = [...editablePoints];
                          next[idx].fontSize = e.target.value;
                          setEditablePoints(next);
                        }}>
                          <option value="small">较小 (Small)</option>
                          <option value="medium">中等 (Medium)</option>
                          <option value="large">较大 (Large)</option>
                          <option value="extra large">特大 (XL)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">标语颜色</label>
                        <select className="w-full text-[10px] border-slate-200 rounded" value={item.fontColor} onChange={e => {
                          const next = [...editablePoints];
                          next[idx].fontColor = e.target.value;
                          setEditablePoints(next);
                        }}>
                          <option value="white">白色 (White)</option>
                          <option value="black">黑色 (Black)</option>
                          <option value="gold">金色 (Gold)</option>
                          <option value="red">红色 (Red)</option>
                          <option value="cyan">青色 (Cyan)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">绘图备注 (优化出图细节)</label>
                      <input className="w-full text-xs p-2 bg-slate-50 rounded border-0" placeholder="例如：背景虚化深一点，光线从左边打过来..." value={item.remarks} onChange={e => {
                        const next = [...editablePoints];
                        next[idx].remarks = e.target.value;
                        setEditablePoints(next);
                      }} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* GALLERY PANEL */}
          <div className="lg:col-span-7">
            <SectionTitle title="出图画廊" subtitle="高保真商业场景呈现" icon="fas fa-swatchbook" />
            {results.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 h-[600px] flex flex-col items-center justify-center text-slate-400 shadow-sm text-center px-12">
                <i className="far fa-image text-5xl mb-6 opacity-20"></i>
                <p className="font-medium text-slate-500">完成左侧卖点配置后点击批量出图，AI 将确保产品尺寸与材质细节 100% 还原</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {results.map(img => (
                  <Card key={img.id} className="overflow-hidden group flex flex-col shadow-lg border-0 bg-white rounded-2xl">
                    <div className="aspect-square relative overflow-hidden bg-slate-50">
                      <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                         <Button onClick={() => downloadImage(img.url)} variant="outline" className="bg-white text-slate-900 border-0 hover:bg-slate-100">下载</Button>
                         <Button onClick={() => regenerateSingle(img)} className="bg-indigo-500 text-white border-0 hover:bg-indigo-600">重绘</Button>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg uppercase">
                          {img.slogan}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 border-t border-slate-50">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">最终生成指令</p>
                      <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">"{img.prompt}"</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
