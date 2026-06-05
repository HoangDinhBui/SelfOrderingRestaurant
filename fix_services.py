import sys

files = ['frontend/src/services/api.js', 'frontend/src/services/authService.js']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('"/auth/login"', '"/api/auth/login"')
    content = content.replace('"auth/staff/google-login"', '"/api/auth/staff/google-login"')
    content = content.replace('"/auth/logout"', '"/api/auth/logout"')
    content = content.replace('"/auth/forgot-password"', '"/api/auth/forgot-password"')
    content = content.replace('"/auth/refresh-token"', '"/api/auth/refresh-token"')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Safely updated files!")
