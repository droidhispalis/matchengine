import { createObjectCsvStringifier } from 'csv-writer';
import * as XLSX from 'xlsx';

export interface ExportData {
  id: number;
  title: string;
  organism: string;
  specialty?: string;
  position_type?: string;
  access_type?: string;
  disability_quota: boolean;
  disability_percentage?: string;
  education_level?: string;
  application_deadline?: string;
  exam_date?: string;
  syllabus_url?: string;
  province?: string;
  autonomous_region?: string;
  ai_score?: number;
  created_at: string;
}

export function generateCSV(data: ExportData[]): string {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Título' },
      { id: 'organism', title: 'Organismo' },
      { id: 'specialty', title: 'Especialidad' },
      { id: 'position_type', title: 'Tipo de Puesto' },
      { id: 'access_type', title: 'Tipo de Acceso' },
      { id: 'disability_quota', title: 'Cupo Discapacidad' },
      { id: 'disability_percentage', title: '% Discapacidad' },
      { id: 'education_level', title: 'Nivel Educativo' },
      { id: 'application_deadline', title: 'Fecha Límite' },
      { id: 'exam_date', title: 'Fecha Examen' },
      { id: 'syllabus_url', title: 'URL Temario' },
      { id: 'province', title: 'Provincia' },
      { id: 'autonomous_region', title: 'Región Autónoma' },
      { id: 'ai_score', title: 'Score IA' },
      { id: 'created_at', title: 'Fecha Creación' }
    ]
  });

  // Transformar datos
  const transformedData = data.map(item => ({
    ...item,
    disability_quota: item.disability_quota ? 'Sí' : 'No',
    application_deadline: item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('es-ES') : '',
    exam_date: item.exam_date ? new Date(item.exam_date).toLocaleDateString('es-ES') : '',
    created_at: new Date(item.created_at).toLocaleDateString('es-ES')
  }));

  const header = csvStringifier.getHeaderString();
  const records = csvStringifier.stringifyRecords(transformedData);

  return header + records;
}

export function generateExcel(data: ExportData[]): Buffer {
  // Transformar datos para Excel
  const transformedData = data.map(item => ({
    'ID': item.id,
    'Título': item.title || '',
    'Organismo': item.organism || '',
    'Especialidad': item.specialty || '',
    'Tipo de Puesto': item.position_type || '',
    'Tipo de Acceso': item.access_type || '',
    'Cupo Discapacidad': item.disability_quota ? 'Sí' : 'No',
    '% Discapacidad': item.disability_percentage || '',
    'Nivel Educativo': item.education_level || '',
    'Fecha Límite': item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('es-ES') : '',
    'Fecha Examen': item.exam_date ? new Date(item.exam_date).toLocaleDateString('es-ES') : '',
    'URL Temario': item.syllabus_url || '',
    'Provincia': item.province || '',
    'Región Autónoma': item.autonomous_region || '',
    'Score IA': item.ai_score || 50,
    'Fecha Creación': new Date(item.created_at).toLocaleDateString('es-ES')
  }));

  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(transformedData);

  // Ajustar anchos de columna
  const colWidths = [
    { wch: 5 },   // ID
    { wch: 40 },  // Título
    { wch: 30 },  // Organismo
    { wch: 25 },  // Especialidad
    { wch: 15 },  // Tipo Puesto
    { wch: 15 },  // Tipo Acceso
    { wch: 12 },  // Cupo Discapacidad
    { wch: 12 },  // % Discapacidad
    { wch: 20 },  // Nivel Educativo
    { wch: 12 },  // Fecha Límite
    { wch: 12 },  // Fecha Examen
    { wch: 50 },  // URL Temario
    { wch: 15 },  // Provincia
    { wch: 20 },  // Región
    { wch: 8 },   // Score IA
    { wch: 12 }   // Fecha Creación
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');

  // Generar buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
