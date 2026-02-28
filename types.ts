export interface AdCampaign {
  id: string;
  name: string; // Nome da Campanha
  format: string; // Extracted format (e.g. Carrossel, Post)
  objective: 'Alcance' | 'Engajamento' | 'Reel' | 'Link' | 'Outro'; // Logic type
  validity: string; // Validade
  investment: number; // Orçamento (Investimento)
  amountSpent: number; // Valor Gasto
  costPerResult: number; // Custo por 1000 / Interação / Thruplay
  reach: number; // Alcance
  engagement: number; // Engajamento
  views: number; // Visualização (ThruPlay)
  clicks: number; // Cliques no Link
  date?: Date; // Parsed date for sorting
}

export interface ReportData {
  campaigns: AdCampaign[];
}

export enum ReportType {
  ALCANCE = 'ALCANCE',
  ENGAJAMENTO = 'ENGAJAMENTO',
  REEL = 'REEL',
  LINK = 'LINK'
}