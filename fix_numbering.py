import json

def fix_numbering():
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # We want to re-number sequentially within each category
    # But wait, does 'data' maintain order? Yes, it's a list.
    
    counters = {
        "Pequena": 1,
        "Média": 1,
        "Grande": 1
    }
    
    for item in data:
        tamanho = item.get("tamanho")
        if tamanho in counters:
            item["numEmbarcacao"] = counters[tamanho]
            counters[tamanho] += 1
            
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    fix_numbering()
