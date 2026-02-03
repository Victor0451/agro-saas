const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/home/vlongo/Desarrollo/erp/docs/Modelo (1).xlsx');

console.log('=== ANÁLISIS DEL ARCHIVO EXCEL ===\n');
console.log('Hojas disponibles:', workbook.SheetNames);
console.log('\n');

workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`HOJA ${index + 1}: ${sheetName}`);
    console.log('='.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    console.log(`Rango: ${worksheet['!ref']}`);
    console.log(`Filas: ${range.e.r + 1}, Columnas: ${range.e.c + 1}\n`);

    // Convertir a JSON para ver los datos
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Mostrar las primeras 20 filas
    console.log('Primeras filas:');
    jsonData.slice(0, 20).forEach((row, idx) => {
        if (row.some(cell => cell !== '')) {
            console.log(`Fila ${idx + 1}:`, JSON.stringify(row));
        }
    });

    console.log('\n');
});

// Guardar análisis completo en JSON
const analysis = {};
workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    analysis[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
});

fs.writeFileSync(
    '/home/vlongo/Desarrollo/erp/excel-analysis.json',
    JSON.stringify(analysis, null, 2)
);

console.log('\n✅ Análisis completo guardado en: excel-analysis.json');
