package com.a3n.resumentor.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Component
@Slf4j
public class PDFExtractor {

    public String extractTextFromPDF(String filePath) throws IOException {
        try (PDDocument document = PDDocument.load(new File(filePath))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (IOException e) {
            log.error("Error extracting text from PDF: {}", filePath, e);
            throw e;
        }
    }

    public String extractTextFromDocx(String filePath) throws IOException {
        StringBuilder text = new StringBuilder();
        try (FileInputStream fis = new FileInputStream(new File(filePath));
             XWPFDocument doc = new XWPFDocument(fis)) {
            for (XWPFParagraph paragraph : doc.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return text.toString();
        } catch (IOException e) {
            log.error("Error extracting text from DOCX: {}", filePath, e);
            throw e;
        }
    }

    public String extractText(String filePath) throws IOException {
        String extension = getFileExtension(filePath).toLowerCase();
        return switch (extension) {
            case "pdf" -> extractTextFromPDF(filePath);
            case "docx" -> extractTextFromDocx(filePath);
            default -> throw new IllegalArgumentException("Unsupported file type: " + extension);
        };
    }

    private String getFileExtension(String filePath) {
        if (filePath == null || !filePath.contains(".")) {
            return "";
        }
        return filePath.substring(filePath.lastIndexOf(".") + 1);
    }
}
