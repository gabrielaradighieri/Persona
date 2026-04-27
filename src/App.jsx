import { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserCircle, 
  Search, 
  Layers,
  Map,
  Music,
  Smartphone,
  Compass,
  MapPin,
  ExternalLink,
  Activity,
  BarChart3,
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  Link2,
} from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

const App = () => {
  const [activeTab, setActiveTab] = useState('matrix'); 
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);
  
  // AI Analysis State
  const [profileInput, setProfileInput] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [groundingSources, setGroundingSources] = useState([]);
  
  // Chat AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState("");

  // Base Data with initial personas
  const [artistData, setArtistData] = useState({
    name: "Lunar",
    targetAudience: {
      title: "Público-Alvo",
      description: "Jovens adultos (18-35 anos), residentes em capitais, entusiastas de festivais e tecnologia, usuários assíduos de streaming.",
      base: "Classe B/C, interessados em cultura urbana e tendências digitais."
    },
    icp: {
      title: "ICP (Ideal Customer Profile)",
      description: "Curadores de playlists 'Indie/Electronic' e produtores de eventos de experiência.",
      attributes: [
        "Busca artistas com estética visual 'Instagramável'",
        "Analisa taxa de retenção no Spotify",
        "Valoriza artistas com comunidade ativa no Discord/Telegram"
      ]
    },
    personas: [
      {
        name: "Enzo, o Curador",
        role: "Fã de Descoberta (Early Adopter)",
        adoptionStage: "Early Adopters",
        adoptionPercent: "13.5%",
        adoptionDesc: "Ele é o formador de opinião. Se ele valida, a Early Majority vem atrás.",
        pain: "Sente que a música atual é repetitiva; quer exclusividade.",
        motivation: "Ser o 'influenciador' do seu grupo; descobrir o próximo hit antes de todos.",
        touchpoints: ["Discord", "TikTok (ASMR/Trends)", "Instagram"],
        journeyColor: "text-purple-400",
        bgJourney: "border-purple-500/30",
        quickWin: "Enviar demos exclusivas via Close Friends/Discord.",
        demographics: {
          location: "Pinheiros, SP / Vila Madalena",
          age: "22 - 27 anos",
          socialMedia: ["Discord", "TikTok", "Instagram"],
          screenTime: "6h+",
        },
        lifestyle: {
          following: ["Boiler Room", "Colors Studios", "Niche Tech"],
          hobbies: ["Colecionar Vinis", "Sintetizadores", "Cafés Especiais"],
          outsideMusic: ["Jazz Experimental", "Industrial Techno", "UK Garage"],
          showBehavior: "Frequenta festas underground e Boiler Rooms.",
        },
        journeyDetails: {
          discovery: "Encontra um remix não lançado no TikTok.",
          consumption: "Ouve o catálogo completo para validar o gosto.",
          engagement: "Posta um 'recap' do Spotify mencionando o artista.",
          conversion: "Compra o ingresso 'Early Bird' do festival.",
          advocacy: "Cria uma playlist 'Hidden Gems' com o artista no topo."
        }
      }
    ]
  });

  const currentPersona = artistData.personas[activePersonaIndex];

  // Helper for API calls with backoff
  const fetchWithBackoff = async (url, options, retries = 5, delay = 1000) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchWithBackoff(url, options, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  // ANALYZE PROFILE/LINKS
  const analyzeProfile = async () => {
    if (!profileInput) return;
    const apiKey = GEMINI_API_KEY;
    setIsAnalysing(true);
    setError("");

    const systemPrompt = `Você é um Auditor Digital de Mercado Musical. 
    Analise perfis (links ou descrições) e mapeie o comportamento do fã.
    Use o Google Search para entender o contexto do perfil se houver links.
    RETORNE APENAS JSON.
    FORMATO:
    {
      "name": "Nome Sugerido",
      "role": "Papel (Super Fã, Casual, etc)",
      "adoptionStage": "Innovators/Early Adopters/Early Majority/Late Majority/Laggards",
      "adoptionPercent": "2.5% ou 13.5% ou 34% ou 16%",
      "pain": "Frustração",
      "motivation": "Motivação",
      "location": "Localização",
      "age": "Idade",
      "socialMedia": ["Redes"],
      "following": ["Referências"],
      "outsideMusic": ["Gêneros"],
      "currentRadar": ["Trend atual", "Hobbies"],
      "journey": {
        "discovery": "Como descobre",
        "consumption": "Como consome",
        "engagement": "Como interage",
        "conversion": "Como paga",
        "advocacy": "Como defende"
      }
    }`;

    try {
      const result = await fetchWithBackoff(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analise este fã: ${profileInput}` }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: [{ "google_search": {} }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      const data = JSON.parse(result.candidates[0].content.parts[0].text);
      const sources = result.candidates[0].groundingMetadata?.groundingAttributions?.map(a => ({ uri: a.web?.uri, title: a.web?.title })) || [];
      setGroundingSources(sources);

      const newPersona = {
        ...data,
        adoptionDesc: "Auditado via IA baseada em links digitais.",
        touchpoints: data.socialMedia,
        journeyColor: "text-blue-400",
        bgJourney: "border-blue-500/30",
        quickWin: `Ação imediata: Focar em ${data.currentRadar[0]}`,
        demographics: { location: data.location, age: data.age, socialMedia: data.socialMedia, screenTime: "Auditado" },
        lifestyle: { following: data.following, hobbies: data.currentRadar, outsideMusic: data.outsideMusic, showBehavior: "Comportamento identificado em auditoria." },
        journeyDetails: data.journey
      };

      setArtistData(prev => ({ ...prev, personas: [...prev.personas, newPersona] }));
      setActivePersonaIndex(artistData.personas.length);
      setActiveTab('personaDetail');
    } catch (err) {
      console.error(err);
      setError("Não foi possível analisar os links. Verifique se o perfil é público ou tente descrever os interesses da pessoa manualmente.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const callGemini = async (promptText) => {
    const apiKey = GEMINI_API_KEY;
    setIsAiLoading(true);
    setAiResponse("");

    const systemPrompt = `Você é o estrategista para o artista ${artistData.name}. Sua persona alvo agora é ${currentPersona.name}. Use os dados dela para sugerir estratégias reais.`;

    try {
      const result = await fetchWithBackoff(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: [{ "google_search": {} }]
          })
        }
      );
      setAiResponse(result.candidates[0].content.parts[0].text);
    } catch (err) {
      console.error(err);
      setError("Erro na conexão estratégica.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-200 p-4 md:p-10 font-sans selection:bg-blue-500/30">
      
      {/* HEADER DINÂMICO */}
      <header className="max-w-6xl mx-auto mb-10 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black mb-4 uppercase tracking-widest">
              <Activity size={12} className={isAnalysing ? "animate-spin" : ""} /> Digital Intel Matrix v7.0
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
              Audience <span className="bg-gradient-to-r from-blue-400 to-emerald-500 bg-clip-text text-transparent">Intelligence</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-xl">Mapeamento de fã em tempo real: Cole links sociais ou descrições para gerar auditorias de comportamento.</p>
          </div>
          
          <div className="flex gap-2 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto max-w-full">
            {artistData.personas.map((p, idx) => (
              <button 
                key={idx} 
                onClick={() => setActivePersonaIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activePersonaIndex === idx ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
              >
                {p.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 md:gap-6 border-b border-slate-900 pb-2">
          {[
            {id: 'matrix', label: 'Dashboard', icon: <Layers size={14}/>}, 
            {id: 'profileAnalyzer', label: '🔍 Auditoria de Links', icon: <Search size={14}/>},
            {id: 'personaDetail', label: 'Deep Analysis', icon: <Compass size={14}/>}, 
            {id: 'adoptionCurve', label: 'Adoção', icon: <BarChart3 size={14}/>},
            {id: 'journey', label: 'Jornada', icon: <Map size={14}/>},
            {id: 'aiConsultant', label: '✨ Estratégia IA', icon: <Sparkles size={14}/>}
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[10px] font-black uppercase tracking-widest pb-3 px-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        
        {/* ABA: DASHBOARD GERAL */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500 text-left">
             <div className="bg-slate-900/30 rounded-[2.5rem] p-8 border border-amber-500/10 hover:border-amber-500/20 transition-all group">
               <Users size={24} className="text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
               <h3 className="font-bold text-lg mb-2">Público-Alvo</h3>
               <p className="text-sm text-slate-400 leading-relaxed">{artistData.targetAudience.description}</p>
             </div>
             <div className="bg-slate-900/60 rounded-[2.5rem] p-8 border-2 border-blue-500/40 shadow-blue-500/5 shadow-2xl scale-105 z-10 relative">
               <div className="absolute -top-3 right-8 px-3 py-1 bg-blue-600 rounded-full text-[8px] font-black uppercase text-white shadow-lg shadow-blue-500/30 tracking-widest">Active Focus</div>
               <UserCircle size={24} className="text-blue-500 mb-4" />
               <h3 className="font-black text-xl mb-1">{currentPersona.name}</h3>
               <p className="text-[10px] text-blue-400 uppercase font-black mb-4 tracking-widest">{currentPersona.role}</p>
               <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
                 <p className="text-[9px] text-slate-500 font-black uppercase mb-2">Desafio Principal</p>
                 <p className="text-sm text-slate-300 italic leading-relaxed">"{currentPersona.pain}"</p>
               </div>
             </div>
             <div className="bg-slate-900/30 rounded-[2.5rem] p-8 border border-purple-500/10 hover:border-purple-500/20 transition-all group">
               <UserCheck size={24} className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
               <h3 className="font-bold text-lg mb-2">Business Strategy</h3>
               <p className="text-sm text-slate-400 leading-relaxed">{artistData.icp.description}</p>
             </div>
          </div>
        )}

        {/* ABA: AUDITORIA DE LINKS */}
        {activeTab === 'profileAnalyzer' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-3xl mx-auto">
            <div className="bg-slate-900/60 rounded-[3rem] p-10 border border-slate-800 shadow-3xl text-left relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><Link2 size={150} /></div>
               <h3 className="text-2xl font-black mb-4 flex items-center gap-3">Digital Audit</h3>
               <p className="text-slate-500 text-sm mb-8">Insira um link do Instagram, Spotify, X ou TikTok. A IA usará dados reais da web para construir o perfil.</p>
               
               <textarea 
                 value={profileInput}
                 onChange={(e) => setProfileInput(e.target.value)}
                 placeholder="Ex: instagram.com/perfil_fã ou @handle"
                 className="w-full h-40 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 mb-6 transition-all"
               />

               <button 
                 onClick={analyzeProfile}
                 disabled={isAnalysing || !profileInput}
                 className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all disabled:opacity-50"
               >
                 {isAnalysing ? <Loader2 className="animate-spin" /> : <Search size={16} />}
                 {isAnalysing ? "Conectando ao Google Search..." : "Auditar Identidade Digital"}
               </button>
            </div>
            {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
          </div>
        )}

        {/* ABA: DEEP ANALYSIS */}
        {activeTab === 'personaDetail' && (
          <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800">
                  <h4 className="font-bold text-[10px] text-blue-400 uppercase mb-6 flex items-center gap-2"><MapPin size={14}/> Contexto Geográfico</h4>
                  <p className="text-sm text-slate-300 font-bold mb-1">{currentPersona.demographics.location}</p>
                  <p className="text-xs text-slate-500">Estimativa de Idade: {currentPersona.demographics.age}</p>
                </div>
                <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800">
                  <h4 className="font-bold text-[10px] text-emerald-400 uppercase mb-6 flex items-center gap-2"><Smartphone size={14}/> Ecossistema Ativo</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentPersona.demographics.socialMedia.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="bg-slate-900/60 rounded-[3rem] p-10 border border-blue-500/20 shadow-2xl">
                  <h4 className="text-2xl font-black mb-8 flex items-center gap-3"><Activity size={24} className="text-blue-500"/> Radar de Comportamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-500 mb-4 tracking-widest">O que está no radar?</p>
                      <ul className="space-y-4">
                        {currentPersona.lifestyle.hobbies.map((h, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-500 mb-4 tracking-widest">Universo Musical Cruzado</p>
                      <div className="space-y-4">
                        {currentPersona.lifestyle.outsideMusic.map((g, i) => (
                          <div key={i} className="flex justify-between items-center text-xs text-slate-400 italic border-b border-slate-800 pb-2">
                            <span>{g}</span>
                            <Music size={12} className="opacity-30" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {groundingSources.length > 0 && (
                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4">
                      {groundingSources.slice(0, 3).map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 hover:underline flex items-center gap-1 bg-blue-500/5 px-2 py-1 rounded">
                          {s.title.substring(0, 30)}... <ExternalLink size={8} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: CURVA DE ADOÇÃO */}
        {activeTab === 'adoptionCurve' && (
          <div className="animate-in fade-in zoom-in-95 duration-700 bg-slate-900/40 rounded-[3rem] p-10 border border-slate-800">
             <div className="flex justify-between items-end mb-16">
               <h3 className="text-2xl font-black">Ciclo de Adoção</h3>
               <p className="text-xs text-slate-500">Estágio: <span className="text-blue-400 font-black">{currentPersona.adoptionStage}</span></p>
             </div>
             <div className="relative h-64 w-full mb-12">
                <svg viewBox="0 0 1000 300" className="w-full h-full drop-shadow-2xl">
                  <path d="M0,280 Q250,280 400,50 Q500,10 600,50 Q750,280 1000,280" fill="none" stroke="#1e293b" strokeWidth="6" />
                  <circle cx={currentPersona.adoptionStage.includes('Innovator') ? "100" : currentPersona.adoptionStage.includes('Early Adopter') ? "230" : "600"} cy={currentPersona.adoptionStage.includes('Innovator') ? "260" : currentPersona.adoptionStage.includes('Early Adopter') ? "160" : "60"} r="12" fill="#3b82f6" className="animate-pulse" />
                </svg>
                <div className="grid grid-cols-5 text-[8px] uppercase font-black text-slate-600 mt-6 text-center">
                  <div>Innovators<br/>2.5%</div>
                  <div className="text-blue-500">Early Adopters<br/>13.5%</div>
                  <div>Early Majority<br/>34%</div>
                  <div>Late Majority<br/>34%</div>
                  <div>Laggards<br/>16%</div>
                </div>
             </div>
             <p className="text-sm text-slate-400 text-center italic">"{currentPersona.adoptionDesc}"</p>
          </div>
        )}

        {/* ABA: JORNADA DO FÃ */}
        {activeTab === 'journey' && (
          <div className="animate-in slide-in-from-bottom duration-700 space-y-8 text-left">
            <div className="bg-slate-900/40 rounded-[3rem] p-10 border border-slate-800">
              <h3 className="text-2xl font-black mb-12">Fan Journey Map</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                 {Object.entries(currentPersona.journeyDetails).map(([key, value], i) => (
                   <div key={key} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 relative group hover:border-blue-500/30 transition-all">
                      <div className="absolute -top-3 left-6 px-2 py-1 bg-slate-800 rounded text-[7px] font-black uppercase text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all tracking-widest">Step {i+1}</div>
                      <p className="text-[9px] uppercase font-black text-blue-500/60 mb-3">{key}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{value}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA: CONSULTORIA IA */}
        {activeTab === 'aiConsultant' && (
           <div className="bg-slate-900/60 rounded-[3rem] p-10 border border-slate-800 shadow-3xl animate-in zoom-in-95 duration-500 min-h-[600px] flex flex-col text-left">
              <h3 className="text-2xl font-black mb-1">Estrategista Digital IA</h3>
              <p className="text-xs text-slate-500 mb-10 italic">Consultoria baseada na persona ativa e tendências de mercado filtradas via Google.</p>

              <div className="flex-1 space-y-6 mb-8 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
                {aiResponse && (
                  <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 leading-relaxed text-slate-300 text-sm whitespace-pre-wrap animate-in fade-in">
                    {aiResponse}
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-[10px] uppercase font-black text-slate-600 animate-pulse">Cruzando dados de mercado...</p>
                  </div>
                )}
                {!aiResponse && !isAiLoading && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20"><Music size={80} /></div>
                )}
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && callGemini(aiPrompt)}
                  placeholder="Ex: Como posso chamar a atenção dessa persona no TikTok hoje?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-full px-8 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-2xl transition-all"
                />
                <button 
                  onClick={() => callGemini(aiPrompt)}
                  disabled={isAiLoading || !aiPrompt}
                  className="absolute right-2 top-2 p-3.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
           </div>
        )}

      </main>

      <footer className="max-w-6xl mx-auto mt-20 pb-10 flex justify-between items-center text-slate-600 border-t border-slate-900 pt-10">
        <span className="text-[9px] uppercase font-black tracking-widest italic opacity-50">Auditoría Musical IA v7.0 • Powered by Gemini Engine</span>
      </footer>
    </div>
  );
};

export default App;
