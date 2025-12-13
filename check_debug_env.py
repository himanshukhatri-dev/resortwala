
import os

def check():
    try:
        with open('api/.env', 'r') as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith('SANCTUM_STATEFUL_DOMAINS='):
                    print(line.strip())
                if line.startswith('SESSION_DOMAIN='):
                    print(line.strip())
                if line.startswith('APP_URL='):
                    print(line.strip())
                if line.startswith('DB_HOST='):
                    print(line.strip())
    except Exception as e:
        print(e)
check()
