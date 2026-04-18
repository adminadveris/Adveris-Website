import os

file_path = r'c:\Users\HP\Documents\Adveris - google\portal\src\pages\Dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Line 750 (index 749)
    if i == 749:
        # Check if it contains the grid logic
        if 'gridTemplateColumns: editingId && isAdmin ?' in line:
            new_lines.append(line.replace("gridTemplateColumns: editingId && isAdmin ? '1fr 1fr' : '1fr'", "gridTemplateColumns: '1fr'"))
            continue
    
    # Lines 751 to 782 (index 750 to 781)
    if 750 <= i <= 781:
        continue
    
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File updated successfully.")
