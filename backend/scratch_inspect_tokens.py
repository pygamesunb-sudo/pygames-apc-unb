import os
import json

def print_structure(d, indent=0):
    for k, v in d.items():
        if isinstance(v, dict):
            print("  " * indent + f"- {k} (dict):")
            print_structure(v, indent + 1)
        else:
            # Não imprime o valor real se for string longa para manter em segredo
            val_type = type(v).__name__
            val_desc = f"string (len={len(v)})" if isinstance(v, str) else str(v)
            print("  " * indent + f"- {k}: {val_type} ({val_desc if isinstance(v, str) else val_desc})")

def main():
    user_profile = os.environ.get("USERPROFILE")
    config_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
    
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    if "tokens" in data:
        print("Estrutura da chave 'tokens':")
        print_structure(data["tokens"])
    else:
        print("Chave 'tokens' não encontrada.")

if __name__ == "__main__":
    main()
