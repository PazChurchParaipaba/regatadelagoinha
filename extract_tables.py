import zipfile
import xml.etree.ElementTree as ET
import sys
import json

def extract_tables_from_docx(docx_path):
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
        tree = ET.XML(xml_content)
        
        NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        TBL = NAMESPACE + 'tbl'
        TR = NAMESPACE + 'tr'
        TC = NAMESPACE + 'tc'
        P = NAMESPACE + 'p'
        TEXT = NAMESPACE + 't'
        
        tables_data = []
        for tbl_node in tree.iter(TBL):
            table = []
            for tr_node in tbl_node.iter(TR):
                row = []
                for tc_node in tr_node.iter(TC):
                    cell_text = []
                    for p_node in tc_node.iter(P):
                        p_text = ""
                        for t_node in p_node.iter(TEXT):
                            if t_node.text:
                                p_text += t_node.text
                        if p_text:
                            cell_text.append(p_text.strip())
                    row.append('\n'.join(cell_text).strip())
                table.append(row)
            tables_data.append(table)
            
        return tables_data

if __name__ == '__main__':
    tables = extract_tables_from_docx(sys.argv[1])
    print(json.dumps(tables, indent=2, ensure_ascii=False))
