import glob
d = r'D:\UTC2\SelfOrderingRestaurant\frontend\src'
files = glob.glob(d + r'\**\*.js', recursive=True) + glob.glob(d + r'\**\*.jsx', recursive=True)
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'http://localhost:8081' in content or 'ws://localhost:8081' in content:
        content = content.replace('http://localhost:8081', 'https://selforderingrestaurant-635x.onrender.com')
        content = content.replace('ws://localhost:8081', 'wss://selforderingrestaurant-635x.onrender.com')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        count += 1
print(f'Updated {count} files')
