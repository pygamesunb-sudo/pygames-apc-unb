import os
import json

def main():
    user_profile = os.environ.get("USERPROFILE")
    if not user_profile:
        print("USERPROFILE não encontrado.")
        return
        
    config_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
    print(f"Buscando config em: {config_path}")
    
    if os.path.exists(config_path):
        print("Arquivo encontrado!")
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Vamos ver quais chaves existem no JSON (sem imprimir o token inteiro por segurança)
            print("Chaves encontradas no arquivo:")
            for k in data.keys():
                print(f"- {k}")
            
            # Verifica se tem tokens de login
            if "tokens" in data:
                print("Tokens de login encontrados!")
            else:
                print("Nenhum token encontrado na chave 'tokens'.")
        except Exception as e:
            print(f"Erro ao ler arquivo: {e}")
    else:
        print("Arquivo de config do Firebase CLI não encontrado.")

if __name__ == "__main__":
    main()
