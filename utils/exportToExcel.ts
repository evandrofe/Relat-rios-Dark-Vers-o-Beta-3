import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AdCampaign } from '../types';

export const exportToExcel = async (data: AdCampaign[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório Geral');

  // Define Columns
  worksheet.columns = [
    { header: 'Nome da Ação', key: 'name', width: 40 },
    { header: 'Formato', key: 'format', width: 15 },
    { header: 'Validade', key: 'validity', width: 15 },
    { header: 'Investimento', key: 'investment', width: 15 },
    { header: 'Valor Gasto', key: 'amountSpent', width: 15 },
    { header: 'Custo por 1.000 Pessoas', key: 'cost1000', width: 20 },
    { header: 'Custo por ThruPlay', key: 'costThruPlay', width: 20 },
    { header: 'Custo por Interação', key: 'costInteraction', width: 20 },
    { header: 'Filtro', key: 'filter', width: 10 },
    { header: 'Cidade', key: 'city', width: 10 },
    { header: 'Alcance', key: 'reach', width: 15 },
    { header: 'Visualização', key: 'views', width: 15 },
    { header: 'Engajamento', key: 'engagement', width: 15 },
  ];

  // --- Title Row (AÇÕES MENSAIS) ---
  // Insert a row at the top for the title
  worksheet.spliceRows(1, 0, ['AÇÕES MENSAIS']);
  const titleRow = worksheet.getRow(1);
  titleRow.height = 30;
  
  // Merge cells for title
  worksheet.mergeCells('A1:M1');
  
  // Style Title
  const titleCell = worksheet.getCell('A1');
  titleCell.style = {
    font: {
      name: 'Arial',
      color: { argb: 'FFFFFFFF' }, // White text
      bold: true,
      size: 14
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF9900' } // Brand Orange #ff9900
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center'
    }
  };

  // --- Header Row (Row 2) ---
  const headerRow = worksheet.getRow(2);
  headerRow.height = 25;
  
  // Style Header Cells
  headerRow.eachCell((cell, colNumber) => {
    // Default Header Style (Gray 400 #9ca3af)
    let bgColor = 'FF9CA3AF'; 

    // Specific Column Colors based on ReportTable.tsx
    // Columns 6, 7, 8 (Custo...) are Gray 300 #d1d5db
    if (colNumber >= 6 && colNumber <= 8) {
      bgColor = 'FFD1D5DB';
    }
    // Column 13 (Engajamento) is Gray 400 #9ca3af (same as default, but let's be explicit)
    if (colNumber === 13) {
      bgColor = 'FF9CA3AF';
    }

    cell.style = {
      font: {
        name: 'Arial',
        color: { argb: 'FF000000' }, // Black text
        bold: true,
        size: 10
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      },
      alignment: {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    };
    
    // First column (Name) alignment left
    if (colNumber === 1) {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }
  });

  // --- Data Rows ---
  data.forEach((item, index) => {
    // Logic for Costs (same as ReportTable.tsx)
    let cost1000: number | string = '-';
    let costThruPlay: number | string = '-';
    let costInteraction: number | string = '-';

    // We keep raw numbers for Excel to format them, unless it's '-'
    if (item.objective === 'Alcance') cost1000 = item.costPerResult;
    else if (item.objective === 'Reel') costThruPlay = item.costPerResult;
    else if (item.objective === 'Engajamento' || item.objective === 'Link') costInteraction = item.costPerResult;

    const rowValues = {
      name: item.name,
      format: item.format,
      validity: item.validity,
      investment: item.investment,
      amountSpent: item.amountSpent,
      cost1000: cost1000,
      costThruPlay: costThruPlay,
      costInteraction: costInteraction,
      filter: '-',
      city: '-',
      reach: item.reach,
      views: item.objective === 'Reel' ? item.views : '-',
      engagement: (item.objective !== 'Alcance' && item.objective !== 'Reel') ? (item.engagement || item.clicks) : '-'
    };

    const row = worksheet.addRow(rowValues);
    
    // Style Data Row
    const isEven = index % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF9FAFB'; // White or Gray 50

    row.eachCell((cell, colNumber) => {
      let cellBgColor = rowBgColor;

      // Specific Column Colors for Data
      // Columns 6, 7, 8 (Custo...) are Gray 100 #f3f4f6
      if (colNumber >= 6 && colNumber <= 8) {
        cellBgColor = 'FFF3F4F6';
      }
      // Column 13 (Engajamento) is Gray 200 #e5e7eb
      if (colNumber === 13) {
        cellBgColor = 'FFE5E7EB';
      }

      cell.style = {
        font: {
          name: 'Arial',
          color: { argb: 'FF000000' },
          size: 10
        },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: cellBgColor }
        },
        alignment: {
          vertical: 'middle',
          horizontal: 'center'
        },
        border: {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, // Gray 300 border
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        }
      };

      // First column alignment left
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Number Formats
      // Investment (4), Spent (5), Costs (6, 7, 8) -> Currency
      if ([4, 5, 6, 7, 8].includes(colNumber)) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '"R$ "#,##0.00';
        }
      }
      // Reach (11), Views (12), Engagement (13) -> Number
      if ([11, 12, 13].includes(colNumber)) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      }
    });
  });

  // Generate Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Relatorio_Ads_Formatado.xlsx');
};
