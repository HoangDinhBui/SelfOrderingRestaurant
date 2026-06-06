import os
import re

files_to_fix = [
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Staff\Login\Login.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Admin\InventoryManagement\InventoryManagement.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Admin\MenuManagement\MenuManagement.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Admin\StaffManagement\StaffManagement.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Customer\CaptivePortal\CaptivePortal.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Staff\DishManagement\DishManagement.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\components\layout\DishListModal.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\components\layout\MenuBar.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\components\ui\Banner.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Customer\Home\Home.jsx",
    r"D:\UTC2\SelfOrderingRestaurant\frontend\src\pages\Customer\Order\Order.jsx"
]

for file_path in files_to_fix:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove imports
    content = re.sub(r'import\s+(\w+)\s+from\s+[\'"].*?assets/img/([^K\'"]+?)[\'"];?\n?', '', content)
    
    # Replace variables
    content = content.replace('src={loginBg}', 'src="/img/loginBGNew.jpg"')
    content = content.replace('backgroundImage: `url(${loginBg})`', 'backgroundImage: `url(/img/loginBGNew.jpg)`')
    content = content.replace('backgroundImage: "url(" + loginBg + ")"', 'backgroundImage: `url(/img/loginBGNew.jpg)`')
    content = content.replace('src={logo}', 'src="/img/logoremovebg.png"')
    content = content.replace('src={googleLogo}', 'src="/img/gg.webp"')
    content = content.replace('src={logoRemoveBg}', 'src="/img/logoremovebg.png"')
    content = content.replace('src={chefImage}', 'src="/img/chef.png"')
    content = content.replace('src={logoCap}', 'src="/img/CaptiveLogo.png"')
    content = content.replace('src={Bg1}', 'src="/img/CaptiveBg.jpg"')
    content = content.replace('src={Bg2}', 'src="/img/CaptiveBg2.jpg"')
    
    # Fix inline string paths
    content = content.replace('"/src/assets/img/', '"/img/')
    content = content.replace('"/assets/img/', '"/img/')
    content = content.replace('"./src/assets/img/', '"/img/')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed", file_path)
