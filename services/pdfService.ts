// PDF Generation Service
// Replaces Google Docs generation with local PDF using html2canvas + jsPDF

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Helper to generate a captured canvas from the print section
 */
async function capturePrintSection(): Promise<HTMLCanvasElement> {
    // Ensure all custom fonts are completely loaded before capturing
    await document.fonts.ready;

    const element = document.getElementById('print-section');
    if (!element) {
        throw new Error('No se encontró la sección de impresión');
    }

    // Capture the element as a high-resolution canvas
    return await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true, // Crucial for external logos
        allowTaint: false, // Set to false when useCORS is true for better reliability
        backgroundColor: '#ffffff',
        logging: true, // Enable for debugging if needed
        onclone: (clonedDoc) => {
            // Ensure the print-section is visible in the clone
            const clonedElement = clonedDoc.getElementById('print-section');
            if (clonedElement) {
                clonedElement.style.display = 'block';
                clonedElement.style.padding = '20px'; // Add some internal padding before capture

                // Workaround for local dev CORS with the default logo
                const images = clonedElement.getElementsByTagName('img');
                for (let i = 0; i < images.length; i++) {
                    if (images[i].src && images[i].src.includes('ameizin.red/cotizador/ameizin-img.png')) {
                        images[i].src = '/cotizador/ameizin-img.png';
                    }
                }
            }
        }
    });
}

/**
 * Generate a PDF from the print section element
 * Returns the PDF as a Blob URL for download/sharing
 */
export async function generateQuotePDF(_quoteNumber: string): Promise<string> {
    const canvas = await capturePrintSection();

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Margins (mm)
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin; // Start with top margin

    pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        margin,
        position,
        imgWidth,
        imgHeight
    );
    heightLeft -= (pageHeight - (margin * 2));

    while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            margin,
            position,
            imgWidth,
            imgHeight
        );
        heightLeft -= (pageHeight - (margin * 2));
    }

    const blob = pdf.output('blob');
    return URL.createObjectURL(blob);
}

/**
 * Generate and directly download the PDF
 */
export async function downloadQuotePDF(quoteNumber: string): Promise<void> {
    const canvas = await capturePrintSection();

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Margins (mm)
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin; // Top margin

    pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        margin,
        position,
        imgWidth,
        imgHeight
    );

    heightLeft -= (pageHeight - (margin * 2));

    while (heightLeft > 0) {
        pdf.addPage();
        // Calculate position for subsequent pages to show the next part of the content
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            margin,
            position,
            imgWidth,
            imgHeight
        );
        heightLeft -= (pageHeight - (margin * 2));
    }

    // Sanitize filename: remove special characters that might break things
    const sanitizedNumber = quoteNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Cotizacion_${sanitizedNumber}.pdf`;

    pdf.save(fileName);
}
