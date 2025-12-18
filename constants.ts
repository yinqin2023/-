
import { StyleOption } from './types';

export const STYLES: StyleOption[] = [
  {
    id: 'minimalist',
    name: '极简北欧 (Nordic)',
    description: '明亮通透的现代家居，柔和自然光与原木质感。',
    previewUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=400',
    promptTemplate: 'Place the product in a minimalist Scandinavian living room. Bright, airy atmosphere, soft shadows, light oak textures, and white walls. High-end interior design photography.'
  },
  {
    id: 'nature',
    name: '户外自然 (Nature)',
    description: '新鲜的户外环境，绿植环绕与晨曦微光。',
    previewUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400',
    promptTemplate: 'The product is positioned on a flat natural stone surrounded by lush green moss and fern leaves. Soft morning sunlight filtering through trees with light fog. Cinematic forest lighting.'
  },
  {
    id: 'luxury',
    name: '奢华精品 (Luxury)',
    description: '高端零售氛围，大理石台面与精致金属点缀。',
    previewUrl: 'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&q=80&w=400',
    promptTemplate: 'Product showcased in a high-end luxury boutique. Dark emerald marble surfaces, subtle gold accents, dramatic spotlighting, and reflective glass. Sophisticated and premium aesthetic.'
  },
  {
    id: 'tech',
    name: '赛博科技 (Tech)',
    description: '现代电竞或科技办公桌面，冷色调灯光与极客感。',
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
    promptTemplate: 'A modern high-tech cyberpunk workstation. Dark carbon fiber desk, subtle cyan and magenta neon rim lighting in the background. Ultra-sharp focus, futuristic tech feel.'
  },
  {
    id: 'studio',
    name: '经典影棚 (Studio)',
    description: '专业商业摄影棚，纯净背景与精准控光。',
    previewUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400',
    promptTemplate: 'Professional commercial studio shoot. Clean grey gradient background, three-point softbox lighting setup, high-gloss surface with soft realistic reflection. Ultra-sharp product focus.'
  },
  {
    id: 'cafe',
    name: '复古咖啡 (Vintage Cafe)',
    description: '温馨惬意的午后氛围，木质桌面与复古格调。',
    previewUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400',
    promptTemplate: 'Product on a rustic dark wood cafe table. Warm indoor ambient lighting, blurred coffee shop background with rich bokeh, warm brown tones. Nostalgic and inviting mood.'
  }
];

export const ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1' },
  { label: '16:9 宽屏', value: '16:9' },
  { label: '9:16 竖屏', value: '9:16' },
  { label: '4:3 经典', value: '4:3' }
];

export const TARGET_MARKETS = ['欧美', '东南亚', '中东', '全球通用'];
export const CATEGORIES = ['厨房家居', '户外运动', '服装服饰', '3C电子产品', '书籍', '美容个护', '其他'];
export const PLATFORMS = ['亚马逊', 'TEMU', 'Shein', '独立站', '速卖通', 'TikTok', 'Instagram/FB'];
