export const variants = [
  {id:'original',letter:'0',name:'当前原色',description:'原始深紫与金色，作为比较基准。',detail:'原始配色 · 透明底',logo:'/assets/storydate-logo.svg',mark:'/assets/storydate-mark.svg'},
  {id:'outline',letter:'A',name:'原色 · 细金边',description:'保留紫金填充，以细金边勾出深紫色的书本和字形。',detail:'保留原色 · 提升轮廓',logo:'/assets/logo-lab/outline-logo.svg',mark:'/assets/logo-lab/outline-mark.svg'},
  {id:'halo',letter:'B',name:'原色 · 柔光托底',description:'保留原始图形与颜色，在背后加一片渐隐的暖色柔光。',detail:'保留原色 · 柔和背衬',logo:'/assets/storydate-logo.svg',mark:'/assets/storydate-mark.svg',halo:true},
  {id:'antique',letter:'C',name:'古金 · 单色',description:'以一整套温暖古金色呈现书本和字标，强调统一的品牌印记。',detail:'古金单色 · 识别清楚',logo:'/assets/logo-lab/antique-logo.svg',mark:'/assets/logo-lab/antique-mark.svg'},
  {id:'ivory',letter:'D',name:'原金 · 暖白',description:'Story 保留原金色，深紫部分改为暖米白，让字形在黑底上更清楚。',detail:'原金 + 暖米白 · 明暗分明',logo:'/assets/logo-lab/ivory-logo.svg',mark:'/assets/logo-lab/ivory-mark.svg'}
];
export const getVariant = id => variants.find(variant=>variant.id===id)||variants[0];
