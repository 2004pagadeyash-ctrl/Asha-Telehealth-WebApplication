import bcrypt

pwd_bytes = "123456".encode('utf-8')
hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

with open("app/core/config.py", "r") as f:
    content = f.read()

import re
new_content = re.sub(r'ADMIN_PASSWORD_HASH: str = ".*"', f'ADMIN_PASSWORD_HASH: str = "{hashed}"', content)

with open("app/core/config.py", "w") as f:
    f.write(new_content)

print("Config updated with valid hash.")
