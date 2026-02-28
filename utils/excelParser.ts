import * as XLSX from 'xlsx';
import { AdCampaign, ReportData } from '../types';

// Helper to clean currency strings to numbers
const parseCurrency = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove currency symbols, dots (thousands), and replace comma with dot
  // Assumes BRL format "R$ 1.000,00" or similar
  const clean = value.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

const parseNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
};

export const parseExcel = async (file: File): Promise<ReportData> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to array of arrays (header: 1)
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (jsonData.length === 0) {
    throw new Error("O arquivo está vazio.");
  }

  // First row is headers
  const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase().replace(/"/g, ''));
  
  const data: AdCampaign[] = [];

  // Helper to find index by fuzzy matching
  const getIndex = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

  // Map indexes
  const idxName = getIndex(['campaign name', 'nome da campanha', 'nome da ação']);
  const idxFormat = getIndex(['format', 'formato']); // New format column
  const idxBudget = getIndex(['budget', 'orçamento', 'investimento']);
  const idxSpent = getIndex(['amount spent', 'valor usado', 'valor gasto']);
  
  // Metrics
  const idxReach = getIndex(['reach', 'alcance']);
  const idxImpressions = getIndex(['impressions', 'impressões']);
  const idxPostEng = getIndex(['post_engagement', 'engajamento', 'post engagement']);
  const idxLinkClicks = getIndex(['link_click', 'cliques no link', 'direcionamento']);
  const idxThruPlay = getIndex(['thruplay', 'visualizações', 'plays', 'visualização']);
  const idxResults = getIndex(['results', 'resultados', 'result']);
  
  // Costs
  // Priority: Custo por Resultado (covers CPM, CPE, CPV etc depending on objective)
  const idxCostPerResult = getIndex(['cost per result', 'custo por resultado', 'custo por resultados']);
  
  const idxCpm = getIndex(['cpm', 'custo por 1.000', 'custo por 1.000 impressões', 'custo por 1.000 pessoas']);
  const idxCpe = getIndex(['cost per post engagement', 'custo por engajamento', 'custo por interação']);
  const idxCpl = getIndex(['cost per link click', 'custo por clique']);
  const idxCpv = getIndex(['cost per thruplay', 'custo por thruplay']);

  // Iterate from row 1 (index 1)
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    // Skip empty rows
    if (!row || row.length === 0) continue;

    // Helper to safely get value at index
    const getVal = (idx: number) => idx >= 0 ? row[idx] : undefined;

    const nameRaw = getVal(idxName);
    if (!nameRaw) continue; // Skip if no name

    const name = String(nameRaw);
    const rawName = name.toUpperCase();
    const rawFormat = String(getVal(idxFormat) || '').toLowerCase();

    // Logic defined by user
    // AL/ALC -> Alcance
    // ENG -> Engajamento
    // Whats -> Link (Direcionamento)
    // Implicit logic for Reels if ThruPlay exists or name has REEL

    let objective: AdCampaign['objective'] = 'Outro';
    
    // 1. Try to detect objective from the "Format" column if it exists
    if (rawFormat) {
        if (rawFormat.includes('reach') || rawFormat === 'alcance' || rawFormat === 'reconhecimento') {
            objective = 'Alcance';
        } else if (rawFormat.includes('post_engagement') || rawFormat === 'engajamento') {
            objective = 'Engajamento';
        } else if (
            rawFormat.includes('messaging_conversation_started') || 
            rawFormat.includes('link_click') || 
            rawFormat.includes('omni_landing_page_view') ||
            rawFormat.includes('whats') || 
            rawFormat.includes('tráfego') || 
            rawFormat.includes('trafego')
        ) {
            objective = 'Link';
        } else if (rawFormat.includes('video_thruplay') || rawFormat.includes('reel')) {
            objective = 'Reel';
        }
    }

    // 2. Fallback to Name detection if objective is still Outro
    if (objective === 'Outro') {
        if (rawName.includes('ALC') || rawName.includes(' AL ') || (idxReach > -1 && parseNumber(getVal(idxReach)) > 0)) {
            objective = 'Alcance';
        } 
        
        if (rawName.includes('ENG') || (idxPostEng > -1 && parseNumber(getVal(idxPostEng)) > 0)) {
            objective = 'Engajamento';
        }

        if (rawName.includes('WHATS') || rawName.includes('LINK') || (idxLinkClicks > -1 && parseNumber(getVal(idxLinkClicks)) > 0)) {
            objective = 'Link';
        }

        if (rawName.includes('REEL') || rawName.includes('VÍDEO') || rawName.includes('VIDEO') || (idxThruPlay > -1 && parseNumber(getVal(idxThruPlay)) > 0)) {
            objective = 'Reel';
        }

        // Override based on strong naming conventions provided
        if (rawName.includes('ALC') || rawName.includes(' AL ')) objective = 'Alcance';
        if (rawName.includes('ENG')) objective = 'Engajamento';
        if (rawName.includes('WHATS')) objective = 'Link'; 
        if (rawName.includes('REEL')) objective = 'Reel';
    }

    // Extract format from name: between first and second hyphen
    // Example: "Tem Obra Tem Prêmios - Carrossel - 06/02/26 - Al" -> "Carrossel"
    let displayFormat = '-';
    const nameParts = name.split('-');
    if (nameParts.length >= 3) {
        displayFormat = nameParts[1].trim();
    } else {
        // Fallback if pattern doesn't match, maybe use objective?
        // Or leave as '-' or try to use the raw format?
        // Let's use the objective as fallback if extraction fails, or just keep '-'
        // User request was specific about the pattern.
        // If pattern fails, let's try to be smart or just leave it.
        // Let's leave it as '-' or maybe the objective name for clarity?
        // Let's use objective for now if extraction fails so it's not empty.
        displayFormat = objective;
    }

    // Extract metrics
    let reach = parseNumber(getVal(idxReach));
    let engagement = parseNumber(getVal(idxPostEng));
    let views = parseNumber(getVal(idxThruPlay));
    let clicks = parseNumber(getVal(idxLinkClicks));
    const results = parseNumber(getVal(idxResults));

    // Special logic: For Engagement campaigns, prioritize 'Results' column if available
    // User said: Resultados = Quando Engajamento = ENGAJAMENTO
    if (objective === 'Engajamento') {
        if (engagement === 0 && results > 0) engagement = results;
    }

    // User said: Resultados = Quando Reel = VISUALIZAÇÃO
    if (objective === 'Reel') {
        if (views === 0 && results > 0) views = results;
    }

    // User said: Resultados = Quando Whats = CUSTO POR INTERAÇÃO (Likely typo, assuming they meant Interaction/Clicks)
    // But sticking to standard 'Link' logic for now:
    if (objective === 'Link') {
        if (clicks === 0 && results > 0) clicks = results;
    }

    // Calculate Cost based on format
    const spent = parseCurrency(getVal(idxSpent));
    
    // Priority: Try Generic "Cost per Result" first
    let cost = parseCurrency(getVal(idxCostPerResult));

    // Override cost based on user specific mapping if available
    if (objective === 'Reel') {
        // Custo por resultados quando Reel = CUSTO POR THRUPLAY
        const costThruPlay = parseCurrency(getVal(idxCpv));
        if (costThruPlay > 0) cost = costThruPlay;
        else if (cost === 0 && views > 0) cost = spent / views;
    } else if (objective === 'Alcance') {
        // Custo por resultados quando ALCANCE = CUSTO POR 1.000 PESSOAS
        const cost1000 = parseCurrency(getVal(idxCpm));
        if (cost1000 > 0) cost = cost1000;
        else if (cost === 0 && parseNumber(getVal(idxImpressions)) > 0) cost = (spent / parseNumber(getVal(idxImpressions))) * 1000;
    } else if (objective === 'Engajamento') {
        // Custo por resultados quando Engajamento = CUSTO POR INTERAÇÃO
        const costInteraction = parseCurrency(getVal(idxCpe));
        if (costInteraction > 0) cost = costInteraction;
        else if (cost === 0 && engagement > 0) cost = spent / engagement;
    } else if (objective === 'Link') {
        // Fallback for Link
        const costLink = parseCurrency(getVal(idxCpl));
        if (costLink > 0) cost = costLink;
        else if (cost === 0 && clicks > 0) cost = spent / clicks;
    }

    // Extract date from name if possible
    // Format: dd/mm/yy or dd/mm/yyyy
    const dateMatch = name.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/);
    let date: Date | undefined;
    if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
        let year = parseInt(dateMatch[3], 10);
        if (year < 100) year += 2000; // Assume 20xx
        date = new Date(year, month, day);
    }

    data.push({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      format: displayFormat,
      objective: objective,
      validity: 'Mensal', 
      investment: parseCurrency(getVal(idxBudget)),
      amountSpent: spent,
      costPerResult: cost,
      reach: reach,
      engagement: engagement,
      views: views,
      clicks: clicks,
      date: date
    });
  }

  // Sort Logic:
  // 1. Date Ascending
  // 2. Base Name (without type suffix) Ascending
  // 3. Type Priority: Alcance > Engajamento > Link > Reel
  
  const getTypePriority = (fmt: string) => {
      if (fmt === 'Alcance') return 1;
      if (fmt === 'Engajamento') return 2;
      if (fmt === 'Link') return 3;
      if (fmt === 'Reel') return 4;
      return 5;
  };

  // Helper to get base name by stripping common suffixes
  // e.g. "Campaign - Al" -> "Campaign"
  const getBaseName = (name: string) => {
      // Remove date part first to avoid confusion
      let base = name.replace(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/, '').trim();
      // Remove type suffixes
      base = base.replace(/[\s\-]*(AL|ALC|ENG|WHATS|REEL|LINK|POST|CARROSSEL|VÍDEO|VIDEO)[\s\-]*$/i, '').trim();
      // Remove trailing punctuation
      base = base.replace(/[\-\.]+$/, '').trim();
      return base.toLowerCase();
  };

  data.sort((a, b) => {
      // 1. Date
      if (a.date && b.date) {
          const diff = a.date.getTime() - b.date.getTime();
          if (diff !== 0) return diff;
      } else if (a.date) {
          return -1; // a comes first
      } else if (b.date) {
          return 1; // b comes first
      }

      // 2. Base Name
      const baseA = getBaseName(a.name);
      const baseB = getBaseName(b.name);
      if (baseA < baseB) return -1;
      if (baseA > baseB) return 1;

      // 3. Type Priority
      return getTypePriority(a.objective) - getTypePriority(b.objective);
  });

  return {
    campaigns: data
  };
};