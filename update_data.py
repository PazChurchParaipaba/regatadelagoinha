import zipfile
import xml.etree.ElementTree as ET
import sys
import json
import re
import os

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

def process_data(tables, old_data_path):
    sizes = ["Pequena", "Média", "Grande"]
    
    old_data = []
    if os.path.exists(old_data_path):
        with open(old_data_path, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
            
    id_map = {}
    max_id = 0
    for item in old_data:
        key = (item.get("nomeBarco", "").strip().lower(), item.get("tamanho", ""))
        id_map[key] = item.get("id")
        if item.get("id", 0) > max_id:
            max_id = item.get("id")
            
    new_data = []
    
    for i, table in enumerate(tables):
        if i >= len(sizes):
            break
        size = sizes[i]
        
        for row in table[1:]:
            if len(row) < 3:
                continue
            
            embarcacao_raw = row[0]
            proprietario = row[2] if len(row) > 2 else ""
            patrocinio = row[4] if len(row) > 4 else ""
            
            m = re.match(r'^(\d+)\s*[-]*\s*(.*)$', embarcacao_raw.strip())
            if m:
                num = int(m.group(1))
                nome = m.group(2).strip()
            else:
                num = 0
                nome = embarcacao_raw.strip()
                
            if not nome and not proprietario:
                continue
                
            key = (nome.lower(), size)
            if key in id_map:
                item_id = id_map[key]
            else:
                max_id += 1
                item_id = max_id
                
            item = {
                "id": item_id,
                "numEmbarcacao": num,
                "empresa": patrocinio.strip().replace('\n', ' '),
                "proprietario": proprietario.strip().replace('\n', ' '),
                "tamanho": size,
                "nomeBarco": nome.replace('\n', ' ')
            }
            new_data.append(item)
            
    return new_data

if __name__ == '__main__':
    docx_path = sys.argv[1]
    tables = extract_tables_from_docx(docx_path)
    data = process_data(tables, 'data.json')
    
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
