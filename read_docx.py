import zipfile
import xml.etree.ElementTree as ET
import sys
import json

def extract_text_from_docx(docx_path):
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
        tree = ET.XML(xml_content)
        
        NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        TEXT = NAMESPACE + 't'
        P = NAMESPACE + 'p'
        
        lines = []
        for p_node in tree.iter(P):
            p_text = ""
            for t_node in p_node.iter(TEXT):
                if t_node.text:
                    p_text += t_node.text
            lines.append(p_text)
                
        return '\n'.join(lines)

if __name__ == '__main__':
    text = extract_text_from_docx(sys.argv[1])
    print(text)
