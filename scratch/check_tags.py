
import re

file_path = "/Users/taaha/Desktop/Projects/Products/StockFlow/src/pages/OrderDetail.tsx"
with open(file_path, 'r') as f:
    content = f.read()

tokens = re.finditer(r'<(div\b[^>]*?(/)?>)|(</div>)', content, re.DOTALL)

stack = []
for match in tokens:
    tag = match.group(0)
    start_pos = match.start()
    line_num = content.count('\n', 0, start_pos) + 1
    
    if tag.startswith('</'):
        if not stack:
            print(f"[{line_num}] UNEXPECTED CLOSING: {tag}")
        else:
            open_line = stack.pop()
            # print(f"[{line_num}] Closed div from line {open_line}")
    elif tag.endswith('/>'):
        # print(f"[{line_num}] Self-closing: {tag}")
        pass
    else:
        stack.append(line_num)
        # print(f"[{line_num}] Opening: {tag}")

if stack:
    print(f"UNCLOSED TAGS: {stack}")
else:
    print("ALL BALANCED")
