import os
import shutil
import re

src_dir = r'D:\UTC2\SelfOrderingRestaurant\frontend\src\assets\img'
dst_dir = r'D:\UTC2\SelfOrderingRestaurant\frontend\public\img'

# 1. Copy images
if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)
for f in os.listdir(src_dir):
    shutil.copy(os.path.join(src_dir, f), os.path.join(dst_dir, f))
print('Images copied.')

# 2. Fix JSX files
frontend_src = r'D:\UTC2\SelfOrderingRestaurant\frontend\src'
modified_count = 0

for root, dirs, files in os.walk(frontend_src):
    for file in files:
        if file.endswith('.jsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # replace src='./src/assets/img/...' or src='../../src/assets/img/...' or src='/src/assets/img/...' with src='/img/...'
            new_content = re.sub(r'src=[\'\"].*?src/assets/img/([^K\'\"]+?)[\'\"]', r'src="/img/\1"', content)
            
            # replace url('./src/assets/img/...') with url('/img/...')
            new_content = re.sub(r'url\([\'\"].*?src/assets/img/([^K\'\"]+?)[\'\"]\)', r'url(' + "'" + r'/img/\1' + "'" + r')', new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                modified_count += 1
                print(f'Fixed {file}')

print(f'Modified {modified_count} files.')
