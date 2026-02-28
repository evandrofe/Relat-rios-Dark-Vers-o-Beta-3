import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, BarChart2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { parseExcel } from './utils/excelParser';
import { ReportData, AdCampaign } from './types';
import ReportTable from './components/ReportTable';
import { exportToExcel } from './utils/exportToExcel';

const App: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseExcel(file);
      setReportData(parsedData);
      setError(null);
    } catch (err) {
      setError('Erro ao processar o arquivo. Certifique-se de que é um arquivo Excel (.xlsx) válido exportado do Gerenciador de Anúncios.');
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    await exportToExcel(reportData.campaigns);
  };

  return (
    <div className="min-h-screen pb-20 print:bg-white print:text-black">
      {/* Header */}
      <header className="bg-brand-darker border-b border-brand-card sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-orange p-2 rounded">
              <BarChart2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Relatórios <span className="text-brand-orange">Ads</span></h1>
          </div>
          
          <div className="flex items-center space-x-4">
             {reportData && (
                <>
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md border border-green-500 transition-colors shadow-sm"
                    title="Baixar planilha para Google Sheets"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">Baixar Excel</span>
                  </button>

                  <button 
                    onClick={handlePrint}
                    className="flex items-center space-x-2 bg-brand-card hover:bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Empty State / Upload Area */}
        {!reportData && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-brand-card rounded-2xl border border-dashed border-gray-600 p-12 text-center">
              <div className="mx-auto h-20 w-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-brand-orange" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Importar Dados da Campanha</h2>
              <p className="text-gray-400 mb-8">
                Carregue o arquivo Excel (XLSX) exportado do Gerenciador de Anúncios do Meta/Facebook para gerar o relatório formatado.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105"
              >
                Selecionar Arquivo Excel
              </button>

              {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg flex items-center justify-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="mt-8 text-left text-sm text-gray-500 bg-gray-900/50 p-4 rounded border border-gray-700">
                <p className="font-bold mb-2 text-gray-400">Instruções:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>O arquivo deve ser um <strong>Excel (.xlsx)</strong>.</li>
                  <li>O sistema identifica campanhas pelos nomes e datas.</li>
                  <li>As campanhas serão ordenadas por data e agrupadas.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Report View */}
        {reportData && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-end mb-6 print:hidden">
                <div>
                   <h2 className="text-2xl font-bold text-white">Visualização do Relatório</h2>
                   <p className="text-gray-400 text-sm">Relatório unificado ordenado por data.</p>
                </div>
                <button 
                  onClick={() => { setReportData(null); setError(null); }}
                  className="text-gray-400 hover:text-white underline text-sm"
                >
                  Importar outro arquivo
                </button>
             </div>

             {/* Table */}
             <div className="print:m-0">
                <ReportTable data={reportData.campaigns} />
             </div>

             {/* Legends */}
             <div className="bg-white border border-black p-4 mt-8 text-black print:break-inside-avoid">
               <h3 className="bg-brand-orange text-white font-bold text-center py-1 mb-4">LEGENDAS</h3>
               <div className="space-y-4 text-sm">
                 <div>
                   <strong>Alcance:</strong> É o número de contas que a postagem alcançou. Ou seja, a quantidade de contas que receberam o post.
                 </div>
                 <div>
                   <strong>Engajamento:</strong> É o número de vezes que houve interação com a postagem de pessoas com maior probabilidade de interesse no produto ofertado. A plataforma analisa os perfis de pessoas que estejam procurando os produtos ofertados, e faz a entrega para estes perfis (sem filtro). Ou seja, a soma da quantidade de vezes que o post foi aberto, curtido, compartilhado, comentado por um público mais engajado.
                 </div>
                 <div className="text-xs text-gray-600 mt-4 border-t border-gray-300 pt-2">
                   *Erros na plataforma em relação a verba não utilizada, ou utilizado parcialmente, em sua totalidade podem acontecer por diversos fatores, como: Público não engajado, concorrentes anunciando no mesmo local com um valor maior, público estagnado com conteúdo ou instabilidade da plataforma. O valor do investimento foi maior, porém o valor que foi consumido pela plataforma é o da coluna "valor gasto".
                 </div>
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;