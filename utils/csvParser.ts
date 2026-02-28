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

export const parseCSV = (csvText: string): ReportData => {
  const lines = csvText.split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  const data: AdCampaign[] = [];

  // Helper to find index by fuzzy matching
  const getIndex = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

  // Map indexes
  const idxName = getIndex(['campaign name', 'nome da campanha', 'nome da ação']);
  const idxBudget = getIndex(['budget', 'orçamento', 'investimento']);
  const idxSpent = getIndex(['amount spent', 'valor usado', 'valor gasto']);
  
  // Metrics
  const idxReach = getIndex(['reach', 'alcance']);
  const idxImpressions = getIndex(['impressions', 'impressões']);
  const idxPostEng = getIndex(['post_engagement', 'engajamento', 'post engagement']);
  const idxLinkClicks = getIndex(['link_click', 'cliques no link', 'direcionamento']);
  const idxThruPlay = getIndex(['thruplay', 'visualizações', 'plays']);
  
  // Costs
  const idxCpm = getIndex(['cpm', 'custo por 1.000']);
  const idxCpe = getIndex(['cost per post engagement', 'custo por engajamento']);
  const idxCpl = getIndex(['cost per link click', 'custo por clique']);
  const idxCpv = getIndex(['cost per thruplay', 'custo por thruplay']);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Basic CSV splitting handling quoted values
    const row: string[] = [];
    let inQuotes = false;
    let currentVal = '';
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal.trim().replace(/^"|"$/g, '')); // Last value

    const name = row[idxName] || 'Sem Nome';
    const rawName = name.toUpperCase();

    // Logic defined by user
    // AL/ALC -> Alcance
    // ENG -> Engajamento
    // Whats -> Link (Direcionamento)
    // Implicit logic for Reels if ThruPlay exists or name has REEL

    let format: AdCampaign['format'] = 'Outro';
    let cost = 0;
    
    // Auto-detection logic
    if (rawName.includes('ALC') || rawName.includes(' AL ') || idxReach > -1 && parseNumber(row[idxReach]) > 0) {
        format = 'Alcance';
    } 
    
    if (rawName.includes('ENG') || idxPostEng > -1 && parseNumber(row[idxPostEng]) > 0) {
        // Preference for engagement if marked
        format = 'Engajamento';
    }

    if (rawName.includes('WHATS') || rawName.includes('LINK') || idxLinkClicks > -1 && parseNumber(row[idxLinkClicks]) > 0) {
        format = 'Link';
    }

    if (rawName.includes('REEL') || rawName.includes('VÍDEO') || rawName.includes('VIDEO') || (idxThruPlay > -1 && parseNumber(row[idxThruPlay]) > 0)) {
        format = 'Reel';
    }

    // Override based on strong naming conventions provided
    if (rawName.includes('ALC') || rawName.includes(' AL ')) format = 'Alcance';
    if (rawName.includes('ENG')) format = 'Engajamento';
    if (rawName.includes('WHATS')) format = 'Link'; // Maps to "Direcionamento para Link"
    if (rawName.includes('REEL')) format = 'Reel';

    // Calculate Cost based on format
    const spent = parseCurrency(row[idxSpent]);
    
    // Fallback cost calculations if column missing
    if (format === 'Alcance') {
        cost = parseCurrency(row[idxCpm]);
        if (cost === 0 && parseNumber(row[idxImpressions]) > 0) cost = (spent / parseNumber(row[idxImpressions])) * 1000;
    } else if (format === 'Engajamento') {
        cost = parseCurrency(row[idxCpe]);
        if (cost === 0 && parseNumber(row[idxPostEng]) > 0) cost = spent / parseNumber(row[idxPostEng]);
    } else if (format === 'Reel') {
        cost = parseCurrency(row[idxCpv]);
        if (cost === 0 && parseNumber(row[idxThruPlay]) > 0) cost = spent / parseNumber(row[idxThruPlay]);
    } else if (format === 'Link') {
        cost = parseCurrency(row[idxCpl]);
        if (cost === 0 && parseNumber(row[idxLinkClicks]) > 0) cost = spent / parseNumber(row[idxLinkClicks]);
    }

    data.push({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      format: format,
      validity: 'Mensal', // Default as per request implication
      investment: parseCurrency(row[idxBudget]),
      amountSpent: spent,
      costPerResult: cost,
      reach: parseNumber(row[idxReach]),
      engagement: parseNumber(row[idxPostEng]),
      views: parseNumber(row[idxThruPlay]),
      clicks: parseNumber(row[idxLinkClicks]),
    });
  }

  return {
    alcance: data.filter(d => d.format === 'Alcance'),
    engajamento: data.filter(d => d.format === 'Engajamento'),
    reel: data.filter(d => d.format === 'Reel'),
    link: data.filter(d => d.format === 'Link'),
  };
};