import ExcelJS from 'exceljs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const navy = '172D48';
const red = 'D51B1F';
function dateValue(value) {
    if (!value)
        return '';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : date;
}
function cellValue(value, column) {
    if (value === null || value === undefined)
        return '';
    return column.kind === 'date' ? dateValue(value) : value;
}
export async function buildOperationalWorkbook(report, selectedColumnKeys, context) {
    const selected = new Set(selectedColumnKeys);
    const columns = report.columns.filter((column) => selected.has(column.key));
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'A&F Servicios Empresariales';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(context.title.slice(0, 31));
    const lastColumn = Math.max(columns.length, 1);
    const logoBuffer = await readFile(path.resolve('public/logo-reportes.png'));
    const logo = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
    worksheet.addImage(logo, { tl: { col: 0, row: 0 }, ext: { width: 190, height: 120 } });
    const titleColumn = Math.min(4, lastColumn);
    if (titleColumn < lastColumn)
        worksheet.mergeCells(1, titleColumn, 1, lastColumn);
    worksheet.getCell(1, titleColumn).value = context.title.toLocaleUpperCase('es-PE');
    worksheet.getCell(1, titleColumn).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(1, titleColumn).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${navy}` } };
    worksheet.getCell(1, titleColumn).alignment = { horizontal: 'center', vertical: 'middle' };
    for (const [rowNumber, label] of [[2, `Cliente: ${context.company}`], [3, `Proceso: ${context.process}`], [4, `Emitido: ${new Intl.DateTimeFormat('es-PE').format(new Date())}`]]) {
        if (titleColumn < lastColumn)
            worksheet.mergeCells(rowNumber, titleColumn, rowNumber, lastColumn);
        const cell = worksheet.getCell(rowNumber, titleColumn);
        cell.value = label;
        cell.font = { italic: rowNumber === 4, color: { argb: `FF${navy}` } };
    }
    worksheet.getRow(1).height = 26;
    worksheet.getRow(5).height = 10;
    const headerRow = worksheet.getRow(6);
    headerRow.values = columns.map((column) => column.label);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${navy}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { bottom: { style: 'medium', color: { argb: `FF${red}` } } };
    });
    report.rows.forEach((row) => {
        const added = worksheet.addRow(columns.map((column) => cellValue(row[column.key], column)));
        columns.forEach((column, index) => {
            if (column.key === 'diasPorVencer' && Number(row[column.key]) < 0)
                added.getCell(index + 1).font = { bold: true, color: { argb: `FF${red}` } };
        });
    });
    columns.forEach((column, index) => {
        const worksheetColumn = worksheet.getColumn(index + 1);
        worksheetColumn.width = column.width;
        if (column.kind === 'date')
            worksheetColumn.numFmt = 'dd/mm/yyyy';
        if (column.kind === 'currency')
            worksheetColumn.numFmt = '#,##0.00';
    });
    for (let rowNumber = 7; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        row.alignment = { vertical: 'top', wrapText: true };
        if (rowNumber % 2 === 1)
            row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F7FB' } }; });
    }
    worksheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: Math.max(6, worksheet.rowCount), column: lastColumn } };
    worksheet.views = [{ state: 'frozen', ySplit: 6 }];
    worksheet.pageSetup = { orientation: columns.length > 8 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    return Buffer.from(await workbook.xlsx.writeBuffer());
}
