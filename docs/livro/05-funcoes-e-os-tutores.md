# 5. Funções e os tutores

No Pygame-APC, uma função pequena e com nome claro vale mais do que um bloco longo colado na tela. Os exercícios práticos da Docs API pedem exatamente isso: receber dados, devolver um resultado, sem imprimir no meio do caminho se o contrato é devolver.

## Uma função devolve

```python
def criar_mensagem_tutor(mode, message):
    return {
        "mode": mode,
        "message": message,
        "focus_mode": False,
    }

pedido = criar_mensagem_tutor("apc", "Quero uma dica.")
print(pedido["mode"])
```

`mode` e `message` são parâmetros. O `return` entrega um dicionário novo para quem chamou. Quem chama decide se imprime, se guarda ou se manda para a API. A função não precisa saber disso.

Os modos que o backend aceita no chat são `apc`, `python`, `debug`, `practice` e `exercise_generator`, além dos modos antigos de assistente e de exercício. Uma função de validação responde sim ou não:

```python
MODOS = {"apc", "python", "debug", "practice", "exercise_generator"}

def validar_modo_tutor(mode):
    return mode in MODOS

print(validar_modo_tutor("python"))
print(validar_modo_tutor("fliperama"))
```

`return mode in MODOS` já é um booleano. Não precisa de `if` em volta para devolver `True` ou `False`.

## A URL é parte do contrato

O chat dos tutores mora em `/api/tutors/chat`. Montar essa URL é outra função, fácil de testar:

```python
def obter_url_tutor(base):
    base = base.rstrip("/")
    return f"{base}/api/tutors/chat"

print(obter_url_tutor("http://localhost:8000"))
print(obter_url_tutor("http://localhost:8000/"))
```

As duas chamadas precisam chegar no mesmo endereço. O detalhe da barra no fim é o tipo de erro que só aparece quando alguém junta texto à mão em vez de usar uma função só.

## Modo foco é um campo

```python
def payload_foco(message, focus_mode):
    return {
        "surface": "page",
        "message": message,
        "focus_mode": focus_mode,
    }
```

Com `focus_mode` verdadeiro, o tutor responde uma etapa por vez. O campo viaja no pedido. A personalidade do tutor não viaja: o texto longo de cada agente fica no servidor. O navegador manda o modo, a mensagem, o código atual e, se a pessoa ligou a chave personalizada, a chave dela. Desligada, vale a chave do ambiente.

## Função que recebe função

Ordenar o placar passou uma função para `sort`. Dá para fazer o mesmo com os tutores: escolher o título a partir do modo.

```python
TITULOS = {
    "apc": "Tutor APC (LOGAN)",
    "python": "Tutor Python (CAIO)",
    "debug": "Debugador (DEBI)",
    "practice": "Treinador de Exercícios (TITO)",
    "exercise_generator": "Tutor de Exercícios (MIRA)",
}

def titulo_do_tutor(mode):
    return TITULOS.get(mode, "Tutor")
```

O dicionário é o mapa. A função é a porta. Trocar um título não exige caçar `if` espalhado pela tela.

## Para ir além

Funções como objetos de primeira classe são o capítulo 7 do Python Fluente. Dicas de tipo em funções são o capítulo 8. Os dois estão no volume 1 do [repositório](https://github.com/pythonfluente/pythonfluente2e), de Luciano Ramalho, sob CC BY-NC-ND 4.0.
