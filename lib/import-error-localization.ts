import { NextRequest, NextResponse } from 'next/server';
import { DocumentImportError, DocumentImportErrorCode, isDocumentImportError } from '@/lib/document-import-errors';

type Locale = 'en' | 'de' | 'es' | 'fr' | 'ja' | 'ko' | 'pt-BR' | 'pt-PT' | 'th' | 'vi' | 'zh';

const DEFAULT_LOCALE: Locale = 'en';

const IMPORT_ERROR_MESSAGES: Record<Locale, Record<DocumentImportErrorCode, string>> = {
  en: {
    NO_FILE_PROVIDED: 'No file provided.',
    FILE_TOO_LARGE: 'File is too large.',
    TEXT_TOO_SHORT: 'Please provide at least 50 characters of text.',
    UNSUPPORTED_FILE_TYPE: 'Unsupported file type. Please upload a .docx, .pdf, or .txt file.',
    EMPTY_DOCUMENT: 'Document appears to be empty.',
    PDF_IMAGE_ONLY: 'PDF appears to be empty or contains only images. Please ensure the PDF has extractable text.',
    PARSER_TIMEOUT: 'Document parsing timed out. Please try a smaller file.',
    PARSE_FAILED: 'Failed to parse document. Please ensure the file is not corrupted.',
    OCR_REQUIRED: 'This PDF appears to be scanned. OCR fallback is required to extract text.',
    OCR_FAILED: 'OCR fallback failed. Please try again with a clearer PDF.',
  },
  de: {
    NO_FILE_PROVIDED: 'Keine Datei bereitgestellt.',
    FILE_TOO_LARGE: 'Die Datei ist zu gross.',
    TEXT_TOO_SHORT: 'Bitte geben Sie mindestens 50 Zeichen Text ein.',
    UNSUPPORTED_FILE_TYPE: 'Nicht unterstutzter Dateityp. Bitte laden Sie eine .docx-, .pdf- oder .txt-Datei hoch.',
    EMPTY_DOCUMENT: 'Das Dokument scheint leer zu sein.',
    PDF_IMAGE_ONLY: 'Die PDF scheint leer zu sein oder nur Bilder zu enthalten. Stellen Sie sicher, dass Text extrahierbar ist.',
    PARSER_TIMEOUT: 'Die Dokumentanalyse hat das Zeitlimit uberschritten. Bitte versuchen Sie eine kleinere Datei.',
    PARSE_FAILED: 'Dokument konnte nicht analysiert werden. Stellen Sie sicher, dass die Datei nicht beschadigt ist.',
    OCR_REQUIRED: 'Diese PDF scheint gescannt zu sein. OCR ist erforderlich, um Text zu extrahieren.',
    OCR_FAILED: 'OCR-Fallback fehlgeschlagen. Bitte versuchen Sie es mit einer klareren PDF erneut.',
  },
  es: {
    NO_FILE_PROVIDED: 'No se proporciono ningun archivo.',
    FILE_TOO_LARGE: 'El archivo es demasiado grande.',
    TEXT_TOO_SHORT: 'Proporciona al menos 50 caracteres de texto.',
    UNSUPPORTED_FILE_TYPE: 'Tipo de archivo no compatible. Sube un archivo .docx, .pdf o .txt.',
    EMPTY_DOCUMENT: 'El documento parece estar vacio.',
    PDF_IMAGE_ONLY: 'El PDF parece vacio o contiene solo imagenes. Asegurate de que tenga texto extraible.',
    PARSER_TIMEOUT: 'El analisis del documento excedio el tiempo limite. Intenta con un archivo mas pequeno.',
    PARSE_FAILED: 'No se pudo analizar el documento. Asegurate de que el archivo no este dañado.',
    OCR_REQUIRED: 'Este PDF parece escaneado. Se requiere OCR para extraer texto.',
    OCR_FAILED: 'El respaldo OCR fallo. Intenta nuevamente con un PDF mas claro.',
  },
  fr: {
    NO_FILE_PROVIDED: 'Aucun fichier fourni.',
    FILE_TOO_LARGE: 'Le fichier est trop volumineux.',
    TEXT_TOO_SHORT: 'Veuillez fournir au moins 50 caracteres de texte.',
    UNSUPPORTED_FILE_TYPE: 'Type de fichier non pris en charge. Veuillez telecharger un fichier .docx, .pdf ou .txt.',
    EMPTY_DOCUMENT: 'Le document semble vide.',
    PDF_IMAGE_ONLY: 'Le PDF semble vide ou ne contient que des images. Assurez-vous qu il contient du texte extractible.',
    PARSER_TIMEOUT: 'L analyse du document a expire. Essayez avec un fichier plus petit.',
    PARSE_FAILED: 'Echec de l analyse du document. Verifiez que le fichier n est pas corrompu.',
    OCR_REQUIRED: 'Ce PDF semble numerise. Un OCR est necessaire pour extraire le texte.',
    OCR_FAILED: 'Le recours OCR a echoue. Reessayez avec un PDF plus net.',
  },
  ja: {
    NO_FILE_PROVIDED: 'ファイルが提供されていません。',
    FILE_TOO_LARGE: 'ファイルサイズが大きすぎます。',
    TEXT_TOO_SHORT: '50 文字以上のテキストを入力してください。',
    UNSUPPORTED_FILE_TYPE: 'サポートされていないファイル形式です。.docx、.pdf、.txt をアップロードしてください。',
    EMPTY_DOCUMENT: 'ドキュメントが空のようです。',
    PDF_IMAGE_ONLY: 'PDF が空、または画像のみの可能性があります。抽出可能なテキストを含む PDF を使用してください。',
    PARSER_TIMEOUT: 'ドキュメント解析がタイムアウトしました。より小さいファイルでお試しください。',
    PARSE_FAILED: 'ドキュメントの解析に失敗しました。ファイルが破損していないか確認してください。',
    OCR_REQUIRED: 'この PDF はスキャン文書の可能性があります。OCR フォールバックが必要です。',
    OCR_FAILED: 'OCR フォールバックに失敗しました。より鮮明な PDF で再試行してください。',
  },
  ko: {
    NO_FILE_PROVIDED: '파일이 제공되지 않았습니다.',
    FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
    TEXT_TOO_SHORT: '최소 50자 이상의 텍스트를 제공하세요.',
    UNSUPPORTED_FILE_TYPE: '지원되지 않는 파일 형식입니다. .docx, .pdf 또는 .txt 파일을 업로드하세요.',
    EMPTY_DOCUMENT: '문서가 비어 있는 것 같습니다.',
    PDF_IMAGE_ONLY: 'PDF가 비어 있거나 이미지로만 구성되어 있을 수 있습니다. 추출 가능한 텍스트가 있는지 확인하세요.',
    PARSER_TIMEOUT: '문서 파싱 시간이 초과되었습니다. 더 작은 파일로 다시 시도하세요.',
    PARSE_FAILED: '문서 파싱에 실패했습니다. 파일이 손상되지 않았는지 확인하세요.',
    OCR_REQUIRED: '이 PDF는 스캔본으로 보입니다. 텍스트 추출을 위해 OCR 폴백이 필요합니다.',
    OCR_FAILED: 'OCR 폴백에 실패했습니다. 더 선명한 PDF로 다시 시도하세요.',
  },
  'pt-BR': {
    NO_FILE_PROVIDED: 'Nenhum arquivo fornecido.',
    FILE_TOO_LARGE: 'O arquivo e muito grande.',
    TEXT_TOO_SHORT: 'Forneca pelo menos 50 caracteres de texto.',
    UNSUPPORTED_FILE_TYPE: 'Tipo de arquivo nao suportado. Envie um arquivo .docx, .pdf ou .txt.',
    EMPTY_DOCUMENT: 'O documento parece estar vazio.',
    PDF_IMAGE_ONLY: 'O PDF parece vazio ou contem apenas imagens. Verifique se ha texto extraivel.',
    PARSER_TIMEOUT: 'A analise do documento excedeu o tempo limite. Tente um arquivo menor.',
    PARSE_FAILED: 'Falha ao analisar o documento. Verifique se o arquivo nao esta corrompido.',
    OCR_REQUIRED: 'Este PDF parece digitalizado. O fallback de OCR e necessario para extrair texto.',
    OCR_FAILED: 'Falha no fallback de OCR. Tente novamente com um PDF mais nitido.',
  },
  'pt-PT': {
    NO_FILE_PROVIDED: 'Nenhum ficheiro fornecido.',
    FILE_TOO_LARGE: 'O ficheiro e demasiado grande.',
    TEXT_TOO_SHORT: 'Forneca pelo menos 50 caracteres de texto.',
    UNSUPPORTED_FILE_TYPE: 'Tipo de ficheiro nao suportado. Carregue um ficheiro .docx, .pdf ou .txt.',
    EMPTY_DOCUMENT: 'O documento parece estar vazio.',
    PDF_IMAGE_ONLY: 'O PDF parece vazio ou contem apenas imagens. Verifique se existe texto extraivel.',
    PARSER_TIMEOUT: 'A analise do documento excedeu o tempo limite. Tente um ficheiro mais pequeno.',
    PARSE_FAILED: 'Falha ao analisar o documento. Certifique-se de que o ficheiro nao esta corrompido.',
    OCR_REQUIRED: 'Este PDF parece digitalizado. E necessario OCR para extrair texto.',
    OCR_FAILED: 'Falha no fallback de OCR. Tente novamente com um PDF mais nitido.',
  },
  th: {
    NO_FILE_PROVIDED: 'ไม่ได้ส่งไฟล์มา',
    FILE_TOO_LARGE: 'ไฟล์มีขนาดใหญ่เกินไป',
    TEXT_TOO_SHORT: 'กรุณาใส่ข้อความอย่างน้อย 50 ตัวอักษร',
    UNSUPPORTED_FILE_TYPE: 'ไม่รองรับประเภทไฟล์ กรุณาอัปโหลดไฟล์ .docx, .pdf หรือ .txt',
    EMPTY_DOCUMENT: 'เอกสารดูเหมือนว่างเปล่า',
    PDF_IMAGE_ONLY: 'PDF อาจว่างเปล่าหรือมีแต่รูปภาพ โปรดตรวจสอบว่ามีข้อความที่ดึงได้',
    PARSER_TIMEOUT: 'การแยกวิเคราะห์เอกสารหมดเวลา กรุณาลองไฟล์ที่เล็กลง',
    PARSE_FAILED: 'ไม่สามารถแยกวิเคราะห์เอกสารได้ โปรดตรวจสอบว่าไฟล์ไม่เสียหาย',
    OCR_REQUIRED: 'PDF นี้ดูเหมือนเป็นไฟล์สแกน จำเป็นต้องใช้ OCR เพื่อดึงข้อความ',
    OCR_FAILED: 'OCR fallback ล้มเหลว กรุณาลองใหม่ด้วย PDF ที่คมชัดขึ้น',
  },
  vi: {
    NO_FILE_PROVIDED: 'Khong co tep duoc cung cap.',
    FILE_TOO_LARGE: 'Tep qua lon.',
    TEXT_TOO_SHORT: 'Vui long cung cap it nhat 50 ky tu van ban.',
    UNSUPPORTED_FILE_TYPE: 'Loai tep khong duoc ho tro. Vui long tai len tep .docx, .pdf hoac .txt.',
    EMPTY_DOCUMENT: 'Tai lieu co ve trong.',
    PDF_IMAGE_ONLY: 'PDF co ve trong hoac chi chua hinh anh. Vui long dam bao co van ban co the trich xuat.',
    PARSER_TIMEOUT: 'Phan tich tai lieu qua thoi gian cho phep. Vui long thu tep nho hon.',
    PARSE_FAILED: 'Khong the phan tich tai lieu. Vui long dam bao tep khong bi hong.',
    OCR_REQUIRED: 'PDF nay co ve la ban quet. Can OCR fallback de trich xuat van ban.',
    OCR_FAILED: 'OCR fallback that bai. Vui long thu lai voi PDF ro net hon.',
  },
  zh: {
    NO_FILE_PROVIDED: '未提供文件。',
    FILE_TOO_LARGE: '文件过大。',
    TEXT_TOO_SHORT: '请至少提供 50 个字符的文本。',
    UNSUPPORTED_FILE_TYPE: '不支持的文件类型。请上传 .docx、.pdf 或 .txt 文件。',
    EMPTY_DOCUMENT: '文档似乎为空。',
    PDF_IMAGE_ONLY: 'PDF 似乎为空或仅包含图片。请确保 PDF 含可提取文本。',
    PARSER_TIMEOUT: '文档解析超时。请尝试更小的文件。',
    PARSE_FAILED: '文档解析失败。请确认文件未损坏。',
    OCR_REQUIRED: '该 PDF 可能为扫描件。需要 OCR 回退才能提取文本。',
    OCR_FAILED: 'OCR 回退失败。请尝试更清晰的 PDF。',
  },
};

function normalizeLocale(raw: string | null): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const value = raw.toLowerCase();
  if (value.startsWith('pt-br')) return 'pt-BR';
  if (value.startsWith('pt-pt') || value.startsWith('pt')) return 'pt-PT';
  if (value.startsWith('zh')) return 'zh';
  if (value.startsWith('ja')) return 'ja';
  if (value.startsWith('ko')) return 'ko';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('de')) return 'de';
  if (value.startsWith('th')) return 'th';
  if (value.startsWith('vi')) return 'vi';
  return 'en';
}

function getLocalizedImportErrorMessage(code: DocumentImportErrorCode, locale: Locale): string {
  return IMPORT_ERROR_MESSAGES[locale][code] || IMPORT_ERROR_MESSAGES[DEFAULT_LOCALE][code];
}

export function getImportErrorResponse(error: unknown, request: NextRequest): NextResponse | null {
  if (!isDocumentImportError(error)) {
    return null;
  }

  const locale = normalizeLocale(request.headers.get('accept-language'));
  const localized = getLocalizedImportErrorMessage(error.code, locale);

  return NextResponse.json(
    {
      error: localized,
      errorCode: error.code,
    },
    { status: error.statusCode }
  );
}

export function getLocalizedImportMessage(
  request: NextRequest,
  code: DocumentImportErrorCode
): string {
  const locale = normalizeLocale(request.headers.get('accept-language'));
  return getLocalizedImportErrorMessage(code, locale);
}

export function mapUnknownImportError(error: unknown): DocumentImportError {
  if (isDocumentImportError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new DocumentImportError('PARSE_FAILED', error.message, 500);
  }
  return new DocumentImportError('PARSE_FAILED', 'Failed to parse document.', 500);
}

