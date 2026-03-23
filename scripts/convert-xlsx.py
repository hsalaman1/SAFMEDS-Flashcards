"""
Run: python scripts/convert-xlsx.py
Reads: BCBA Terms SAFMEDS.xlsx from Desktop
Writes: src/data/bcba-terms.json
"""
import json
import openpyxl

XLSX_PATH = "C:/Users/HarrySalamanBird/OneDrive - Expanding Horizons/Desktop/BCBA Terms SAFMEDS.xlsx"
OUT_PATH = "src/data/bcba-terms.json"

wb = openpyxl.load_workbook(XLSX_PATH)
ws = wb.active

cards = []
for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    term, answer, term_num, chapter, include = row[0], row[1], row[2], row[3], row[4]
    if term and answer:
        cards.append({
            "id": f"builtin-{i+1}",
            "term": str(term).strip(),
            "answer": str(answer).strip(),
            "chapter": int(chapter) if chapter is not None else None,
            "termNumber": int(term_num) if term_num is not None else None,
            "included": include == "Yes"
        })

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(cards)} cards to {OUT_PATH}")
