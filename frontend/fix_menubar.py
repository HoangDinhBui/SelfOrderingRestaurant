import glob
d = r'D:\UTC2\SelfOrderingRestaurant\frontend\src'
files = glob.glob(d + r'\**\*.js', recursive=True) + glob.glob(d + r'\**\*.jsx', recursive=True)
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'layout/menuBar' in content:
        content = content.replace('layout/menuBar', 'layout/MenuBar')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        count += 1
print(f'Updated {count} files')
