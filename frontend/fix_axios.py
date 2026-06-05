import re

filepath = r"D:\UTC2\SelfOrderingRestaurant\frontend\src\axiosConfig.js"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace "/auth/login" with "/api/auth/login"
content = content.replace('"/auth/login"', '"/api/auth/login"')

# Replace "auth/staff/google-login" with "/api/auth/staff/google-login"
content = content.replace('"auth/staff/google-login"', '"/api/auth/staff/google-login"')

# Replace "/auth/logout" with "/api/auth/logout"
content = content.replace('"/auth/logout"', '"/api/auth/logout"')

# Replace "/auth/forgot-password" with "/api/auth/forgot-password"
content = content.replace('"/auth/forgot-password"', '"/api/auth/forgot-password"')

# Replace "/auth/refresh-token" with "/api/auth/refresh-token"
content = content.replace('"/auth/refresh-token"', '"/api/auth/refresh-token"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated axiosConfig.js!")
