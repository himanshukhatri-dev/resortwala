
import os

env_path = 'api/.env'
updates = {
    'APP_URL': 'http://192.168.1.105:8002',
    'SANCTUM_STATEFUL_DOMAINS': 'localhost:3003,192.168.1.105:3003,localhost:5173,192.168.1.105:4173,localhost:8081,192.168.1.105:8081,192.168.1.105:8002',
    'SESSION_DOMAIN': '',
    'DB_HOST': '172.25.0.2'
}

try:
    with open(env_path, 'r') as f:
        lines = f.readlines()

    new_lines = []
    # Track which keys we've updated
    updated_keys = set()

    for line in lines:
        key = line.split('=')[0].strip()
        if key in updates:
            new_lines.append(f"{key}={updates[key]}\n")
            updated_keys.add(key)
        else:
            new_lines.append(line)
    
    # Append missing keys
    for key, value in updates.items():
        if key not in updated_keys:
            new_lines.append(f"{key}={value}\n")

    with open(env_path, 'w') as f:
        f.writelines(new_lines)

    print("Successfully updated .env")

except Exception as e:
    print(f"Error: {e}")
