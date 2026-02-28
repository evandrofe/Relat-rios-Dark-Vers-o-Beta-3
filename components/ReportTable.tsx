import React from 'react';
import { AdCampaign } from '../types';

interface ReportTableProps {
  data: AdCampaign[];
}

const ReportTable: React.FC<ReportTableProps> = ({ data }) => {
  if (data.length === 0) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatNumber = (val: number) => 
    new Intl.NumberFormat('pt-BR').format(val);

  return (
    <div className="mb-12 overflow-hidden rounded-lg shadow-xl bg-brand-card border border-gray-800">
      <div className="bg-brand-orange text-white text-center py-2 font-bold uppercase tracking-wider text-sm">
        AÇÕES MENSAIS
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-400 text-black text-xs uppercase border-b border-black">
              <th className="p-3 font-bold border-r border-black">Nome da Ação</th>
              <th className="p-3 font-bold border-r border-black text-center">Formato</th>
              <th className="p-3 font-bold border-r border-black text-center">Validade</th>
              <th className="p-3 font-bold border-r border-black text-center">Investimento</th>
              <th className="p-3 font-bold border-r border-black text-center">Valor Gasto</th>
              <th className="p-3 font-bold border-r border-black text-center bg-gray-300">Custo por 1.000 Pessoas</th>
              <th className="p-3 font-bold border-r border-black text-center bg-gray-300">Custo por ThruPlay</th>
              <th className="p-3 font-bold border-r border-black text-center bg-gray-300">Custo por Interação</th>
              <th className="p-3 font-bold border-r border-black text-center">Filtro</th>
              <th className="p-3 font-bold border-r border-black text-center">Cidade</th>
              <th className="p-3 font-bold border-r border-black text-center">Alcance</th>
              <th className="p-3 font-bold border-r border-black text-center">Visualização</th>
              <th className="p-3 font-bold text-center bg-gray-400 border-l border-black">Engajamento</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
                // Logic for Costs
                let cost1000 = '-';
                let costThruPlay = '-';
                let costInteraction = '-';

                if (row.objective === 'Alcance') cost1000 = formatCurrency(row.costPerResult);
                else if (row.objective === 'Reel') costThruPlay = formatCurrency(row.costPerResult);
                else if (row.objective === 'Engajamento' || row.objective === 'Link') costInteraction = formatCurrency(row.costPerResult);

                return (
                  <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black text-sm border-b border-gray-200`}>
                    <td className="p-3 border-r border-gray-300">{row.name}</td>
                    <td className="p-3 border-r border-gray-300 text-center">{row.format}</td>
                    <td className="p-3 border-r border-gray-300 text-center">{row.validity}</td>
                    <td className="p-3 border-r border-gray-300 text-center">{formatCurrency(row.investment)}</td>
                    <td className="p-3 border-r border-gray-300 text-center">{formatCurrency(row.amountSpent)}</td>
                    <td className="p-3 border-r border-gray-300 text-center font-bold bg-gray-100">{cost1000}</td>
                    <td className="p-3 border-r border-gray-300 text-center font-bold bg-gray-100">{costThruPlay}</td>
                    <td className="p-3 border-r border-gray-300 text-center font-bold bg-gray-100">{costInteraction}</td>
                    <td className="p-3 border-r border-gray-300 text-center">-</td>
                    <td className="p-3 border-r border-gray-300 text-center">-</td>
                    <td className="p-3 border-r border-gray-300 text-center">{formatNumber(row.reach)}</td>
                    <td className="p-3 border-r border-gray-300 text-center">
                        {row.objective === 'Reel' ? formatNumber(row.views) : '-'}
                    </td>
                    <td className="p-3 text-center bg-gray-200 font-bold border-l border-gray-300">
                        {row.objective !== 'Alcance' && row.objective !== 'Reel' ? formatNumber(row.engagement || row.clicks) : '-'}
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
