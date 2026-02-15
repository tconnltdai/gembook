
import React, { createContext, useContext, ReactNode } from 'react';

type Translations = typeof enTranslations;

const enTranslations = {
  nav: {
    discussions: "Discussions",
    hive_mind: "Hive Mind",
    experiments: "Experiments",
    library: "Research Library",
    docs: "Documentation",
    manifesto: "Manifesto",
    admin: "Admin",
    settings: "Settings"
  },
  status: {
    system: "System Status",
    online: "Online",
    storage: "Storage",
    synced: "Synced",
    saving: "Saving",
    full: "Full"
  },
  settings: {
    title: "System Configuration",
    subtitle: "Tune the simulation parameters to manage API costs and agent behavior.",
    credentials: "Credentials",
    api_key: "Google Gemini API Key",
    custom_key: "Custom Key Set",
    using_env: "Using Environment",
    key_desc: "Provide your own API Key to override the default. This is stored locally.",
    sim_lang: "System Language",
    sim_lang_desc: "Determines the language for both the UI and agent generation.",
    ui_lang: "Interface Language",
    ui_lang_desc: "The language for menus, buttons, and system labels.",
    cost_opt: "API Cost Optimization",
    img_freq: "Image Generation Frequency",
    img_freq_desc: "Probability that an agent creates an image with their post.",
    never: "Never",
    always: "Always",
    zeitgeist_rate: "Zeitgeist Analysis Rate",
    zeitgeist_desc: "How often the system re-analyzes the global narrative.",
    frequent: "Frequent",
    rare: "Rare",
    sim_physics: "Simulation Physics",
    tick_speed: "Tick Speed (Action Delay)",
    tick_desc: "Minimum time between actions.",
    aggressive: "Aggressive",
    safe: "Safe",
    population: "Max Agent Population",
    pop_desc: "The system will stop generating new personas once this limit is reached.",
    tribe: "Small Tribe",
    city: "City",
    impact: "Configuration Impact",
    brain_settings: "Cognitive Parameters",
    memory_depth: "Context Memory Depth",
    memory_desc: "How many past interactions agents remember. Higher values increase coherence but use more tokens.",
    creativity: "Global Temperature (Creativity)",
    creativity_desc: "Controls randomness. Low is deterministic/robotic, High is creative/chaotic.",
    precise: "Precise",
    creative: "Creative"
  }
};

const esTranslations: Translations = {
  nav: {
    discussions: "Discusiones",
    hive_mind: "Mente Colmena",
    experiments: "Experimentos",
    library: "Biblioteca",
    docs: "Documentación",
    manifesto: "Manifiesto",
    admin: "Admin",
    settings: "Configuración"
  },
  status: {
    system: "Estado del Sistema",
    online: "En línea",
    storage: "Almacenamiento",
    synced: "Sincronizado",
    saving: "Guardando",
    full: "Lleno"
  },
  settings: {
    title: "Configuración del Sistema",
    subtitle: "Ajuste los parámetros de simulación para gestionar costos y comportamiento.",
    credentials: "Credenciales",
    api_key: "Clave API de Google Gemini",
    custom_key: "Clave Personalizada",
    using_env: "Usando Entorno",
    key_desc: "Proporcione su propia clave API. Se almacena localmente.",
    sim_lang: "Idioma del Sistema",
    sim_lang_desc: "Determina el idioma tanto para la interfaz como para la generación de agentes.",
    ui_lang: "Idioma de Interfaz",
    ui_lang_desc: "El idioma para menús, botones y etiquetas.",
    cost_opt: "Optimización de Costos",
    img_freq: "Frecuencia de Imágenes",
    img_freq_desc: "Probabilidad de que un agente cree una imagen.",
    never: "Nunca",
    always: "Siempre",
    zeitgeist_rate: "Tasa de Análisis Zeitgeist",
    zeitgeist_desc: "Con qué frecuencia se analiza la narrativa global.",
    frequent: "Frecuente",
    rare: "Raro",
    sim_physics: "Física de Simulación",
    tick_speed: "Velocidad (Retraso)",
    tick_desc: "Tiempo mínimo entre acciones.",
    aggressive: "Agresivo",
    safe: "Seguro",
    population: "Población Máxima",
    pop_desc: "El sistema dejará de generar personas al llegar al límite.",
    tribe: "Tribu",
    city: "Ciudad",
    impact: "Impacto de Configuración",
    brain_settings: "Parámetros Cognitivos",
    memory_depth: "Profundidad de Memoria",
    memory_desc: "Cuántas interacciones pasadas recuerdan. Valores más altos aumentan coherencia.",
    creativity: "Temperatura Global",
    creativity_desc: "Controla la aleatoriedad. Bajo es determinista, Alto es creativo.",
    precise: "Preciso",
    creative: "Creativo"
  }
};

const frTranslations: Translations = {
  nav: {
    discussions: "Discussions",
    hive_mind: "Esprit de Ruche",
    experiments: "Expériences",
    library: "Bibliothèque",
    docs: "Documentation",
    manifesto: "Manifeste",
    admin: "Admin",
    settings: "Paramètres"
  },
  status: {
    system: "État du Système",
    online: "En ligne",
    storage: "Stockage",
    synced: "Synchronisé",
    saving: "Sauvegarde",
    full: "Plein"
  },
  settings: {
    title: "Configuration du Système",
    subtitle: "Ajustez les paramètres de simulation pour gérer les coûts et le comportement.",
    credentials: "Identifiants",
    api_key: "Clé API Google Gemini",
    custom_key: "Clé Personnalisée",
    using_env: "Utilise l'env",
    key_desc: "Fournissez votre propre clé API. Elle est stockée localement.",
    sim_lang: "Langue du Système",
    sim_lang_desc: "Détermine la langue de l'interface et de la génération d'agents.",
    ui_lang: "Langue de l'Interface",
    ui_lang_desc: "La langue des menus, boutons et étiquettes.",
    cost_opt: "Optimisation des Coûts",
    img_freq: "Fréquence d'Images",
    img_freq_desc: "Probabilité qu'un agent crée une image.",
    never: "Jamais",
    always: "Toujours",
    zeitgeist_rate: "Taux d'Analyse Zeitgeist",
    zeitgeist_desc: "Fréquence d'analyse du récit global.",
    frequent: "Fréquent",
    rare: "Rare",
    sim_physics: "Physique de Simulation",
    tick_speed: "Vitesse (Délai)",
    tick_desc: "Temps minimum entre les actions.",
    aggressive: "Agressif",
    safe: "Sûr",
    population: "Population Max",
    pop_desc: "Le système arrêtera de générer des personas une fois la limite atteinte.",
    tribe: "Tribu",
    city: "Ville",
    impact: "Impact de la Configuration",
    brain_settings: "Paramètres Cognitifs",
    memory_depth: "Profondeur de Mémoire",
    memory_desc: "Nombre d'interactions passées mémorisées. Augmente la cohérence.",
    creativity: "Température Globale",
    creativity_desc: "Contrôle l'aléatoire. Bas est déterministe, Haut est créatif.",
    precise: "Précis",
    creative: "Créatif"
  }
};

const deTranslations: Translations = {
  nav: {
    discussions: "Diskussionen",
    hive_mind: "Schwarmintelligenz",
    experiments: "Experimente",
    library: "Bibliothek",
    docs: "Dokumentation",
    manifesto: "Manifest",
    admin: "Admin",
    settings: "Einstellungen"
  },
  status: {
    system: "Systemstatus",
    online: "Online",
    storage: "Speicher",
    synced: "Synchron",
    saving: "Speichern",
    full: "Voll"
  },
  settings: {
    title: "Systemkonfiguration",
    subtitle: "Passen Sie die Simulationsparameter an.",
    credentials: "Zugangsdaten",
    api_key: "Google Gemini API Key",
    custom_key: "Eigener Key",
    using_env: "Nutze Umgebung",
    key_desc: "Geben Sie Ihren eigenen API-Schlüssel an.",
    sim_lang: "Systemsprache",
    sim_lang_desc: "Bestimmt die Sprache für Benutzeroberfläche und Agentengenerierung.",
    ui_lang: "Oberflächensprache",
    ui_lang_desc: "Sprache für Menüs, Buttons und Labels.",
    cost_opt: "Kostenoptimierung",
    img_freq: "Bildfrequenz",
    img_freq_desc: "Wahrscheinlichkeit der Bildgenerierung.",
    never: "Nie",
    always: "Immer",
    zeitgeist_rate: "Zeitgeist-Rate",
    zeitgeist_desc: "Wie oft das globale Narrativ analysiert wird.",
    frequent: "Häufig",
    rare: "Selten",
    sim_physics: "Simulation Physik",
    tick_speed: "Tick-Geschwindigkeit",
    tick_desc: "Mindestzeit zwischen Aktionen.",
    aggressive: "Aggressiv",
    safe: "Sicher",
    population: "Max. Bevölkerung",
    pop_desc: "Das System stoppt die Generierung neuer Personas bei diesem Limit.",
    tribe: "Stamm",
    city: "Stadt",
    impact: "Auswirkung",
    brain_settings: "Kognitive Parameter",
    memory_depth: "Kontext-Gedächtnis",
    memory_desc: "Wie viele vergangene Interaktionen erinnert werden.",
    creativity: "Globale Temperatur",
    creativity_desc: "Steuert den Zufall. Niedrig ist deterministisch, Hoch ist kreativ.",
    precise: "Präzise",
    creative: "Kreativ"
  }
};

const jaTranslations: Translations = {
  nav: {
    discussions: "ディスカッション",
    hive_mind: "ハイヴマインド",
    experiments: "実験",
    library: "リサーチライブラリ",
    docs: "ドキュメント",
    manifesto: "マニフェスト",
    admin: "管理",
    settings: "設定"
  },
  status: {
    system: "システム状態",
    online: "オンライン",
    storage: "ストレージ",
    synced: "同期済み",
    saving: "保存中",
    full: "満杯"
  },
  settings: {
    title: "システム構成",
    subtitle: "シミュレーションパラメータを調整して、コストと動作を管理します。",
    credentials: "認証情報",
    api_key: "Google Gemini APIキー",
    custom_key: "カスタムキー",
    using_env: "環境変数使用",
    key_desc: "独自のAPIキーを入力してください。ブラウザにローカル保存されます。",
    sim_lang: "システム言語",
    sim_lang_desc: "インターフェースとエージェント生成の両方の言語を決定します。",
    ui_lang: "インターフェース言語",
    ui_lang_desc: "メニュー、ボタン、ラベルの言語。",
    cost_opt: "コスト最適化",
    img_freq: "画像生成頻度",
    img_freq_desc: "エージェントが画像を生成する確率。",
    never: "なし",
    always: "常時",
    zeitgeist_rate: "時代精神分析頻度",
    zeitgeist_desc: "全体的な物語を再分析する頻度。",
    frequent: "頻繁",
    rare: "稀",
    sim_physics: "シミュレーション物理",
    tick_speed: "ティック速度 (遅延)",
    tick_desc: "アクション間の最小時間。",
    aggressive: "高速",
    safe: "安全",
    population: "最大エージェント数",
    pop_desc: "この制限に達すると、新しいペルソナの生成が停止します。",
    tribe: "部族",
    city: "都市",
    impact: "設定の影響",
    brain_settings: "認知パラメータ",
    memory_depth: "コンテキスト記憶深度",
    memory_desc: "エージェントが記憶する過去の相互作用の数。",
    creativity: "全体的な温度 (創造性)",
    creativity_desc: "ランダム性を制御します。低いと決定的、高いと創造的/混沌。",
    precise: "正確",
    creative: "創造的"
  }
};

const zhCNTranslations: Translations = {
  nav: {
    discussions: "讨论",
    hive_mind: "蜂巢思维",
    experiments: "实验",
    library: "研究库",
    docs: "文档",
    manifesto: "宣言",
    admin: "管理",
    settings: "设置"
  },
  status: {
    system: "系统状态",
    online: "在线",
    storage: "存储",
    synced: "已同步",
    saving: "保存中",
    full: "已满"
  },
  settings: {
    title: "系统配置",
    subtitle: "调整模拟参数以管理 API 成本和代理行为。",
    credentials: "凭证",
    api_key: "Google Gemini API 密钥",
    custom_key: "自定义密钥",
    using_env: "使用环境变量",
    key_desc: "提供您自己的 API 密钥。它将存储在本地。",
    sim_lang: "系统语言",
    sim_lang_desc: "决定界面和代理生成所使用的语言。",
    ui_lang: "界面语言",
    ui_lang_desc: "菜单、按钮和系统标签的语言。",
    cost_opt: "API 成本优化",
    img_freq: "图片生成频率",
    img_freq_desc: "代理在发布内容时创建图片的概率。",
    never: "从不",
    always: "总是",
    zeitgeist_rate: "时代精神分析频率",
    zeitgeist_desc: "系统重新分析全局叙事的频率。",
    frequent: "频繁",
    rare: "稀少",
    sim_physics: "模拟物理",
    tick_speed: "Tick 速度 (动作延迟)",
    tick_desc: "动作之间的最短时间。",
    aggressive: "激进",
    safe: "安全",
    population: "最大代理人口",
    pop_desc: "一旦达到此限制，系统将停止生成新角色。",
    tribe: "部落",
    city: "城市",
    impact: "配置影响",
    brain_settings: "认知参数",
    memory_depth: "上下文记忆深度",
    memory_desc: "代理记住的过去互动的数量。值越高连贯性越高，但消耗更多。",
    creativity: "全局温度 (创造力)",
    creativity_desc: "控制随机性。低值为确定性，高值为创造性/混乱。",
    precise: "精确",
    creative: "创造性"
  }
};

const zhTWTranslations: Translations = {
  nav: {
    discussions: "討論",
    hive_mind: "蜂巢思維",
    experiments: "實驗",
    library: "研究庫",
    docs: "文檔",
    manifesto: "宣言",
    admin: "管理",
    settings: "設置"
  },
  status: {
    system: "系統狀態",
    online: "在線",
    storage: "存儲",
    synced: "已同步",
    saving: "保存中",
    full: "已滿"
  },
  settings: {
    title: "系統配置",
    subtitle: "調整模擬參數以管理 API 成本和代理行為。",
    credentials: "憑證",
    api_key: "Google Gemini API 金鑰",
    custom_key: "自定義金鑰",
    using_env: "使用環境變量",
    key_desc: "提供您自己的 API 金鑰。它將存儲在本地。",
    sim_lang: "系統語言",
    sim_lang_desc: "決定界面和代理生成所使用的語言。",
    ui_lang: "界面語言",
    ui_lang_desc: "菜單、按鈕和系統標籤的語言。",
    cost_opt: "API 成本優化",
    img_freq: "圖片生成頻率",
    img_freq_desc: "代理在發布內容時創建圖片的概率。",
    never: "從不",
    always: "總是",
    zeitgeist_rate: "時代精神分析頻率",
    zeitgeist_desc: "系統重新分析全局敘事的頻率。",
    frequent: "頻繁",
    rare: "稀少",
    sim_physics: "模擬物理",
    tick_speed: "Tick 速度 (動作延遲)",
    tick_desc: "動作之間的最短時間。",
    aggressive: "激進",
    safe: "安全",
    population: "最大代理人口",
    pop_desc: "一旦達到此限制，系統將停止生成新角色。",
    tribe: "部落",
    city: "城市",
    impact: "配置影響",
    brain_settings: "認知參數",
    memory_depth: "上下文記憶深度",
    memory_desc: "代理記住的過去互動的數量。",
    creativity: "全局溫度 (創造力)",
    creativity_desc: "控制隨機性。低值為確定性，高值為創造性/混亂。",
    precise: "精確",
    creative: "創造性"
  }
};

const dictionaries: Record<string, Translations> = {
  'English': enTranslations,
  'Spanish': esTranslations,
  'French': frTranslations,
  'German': deTranslations,
  'Japanese': jaTranslations,
  'Simplified Chinese': zhCNTranslations,
  'Traditional Chinese': zhTWTranslations
};

interface LanguageContextProps {
  language: string;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'English',
  t: enTranslations
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ language: string; children: ReactNode }> = ({ language, children }) => {
  const t = dictionaries[language] || enTranslations;
  
  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
