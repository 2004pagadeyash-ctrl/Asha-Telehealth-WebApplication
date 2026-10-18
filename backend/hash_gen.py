import bcrypt
pwd_bytes = "123456".encode('utf-8')
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(pwd_bytes, salt)
print(hashed.decode('utf-8'))
