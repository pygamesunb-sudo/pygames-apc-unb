# 3. Sequências e a lista de desafios

A Docs API organiza a prática em tópicos. Cada tópico é uma sequência de desafios. A ordem importa: o primeiro exercício do tópico não é o mesmo que o último, e “quantos eu fechei” é o tamanho da lista de concluídos, não um número escrito à mão na tela.

## Uma lista é uma sequência

```python
topicos = [
    "Entrada e saída",
    "Condicionais",
    "Funções",
    "Tutores v2",
]

print(topicos[0])
print(topicos[-1])
print(len(topicos))
```

O índice `0` é o primeiro item. O índice `-1` é o último. `len` devolve o comprimento. No Pygame-APC, a barra de progresso de um tópico usa o tamanho da lista de exercícios daquele tópico. Se o tópico tem 5 desafios, a meta é 5, não um total fixo copiado de outro lugar.

## Fatiar sem estragar a original

```python
primeiros = topicos[:2]
print(primeiros)
print(topicos)
```

`topicos[:2]` devolve uma lista nova com os dois primeiros nomes. A lista original continua inteira. Isso importa quando você monta um recorte para mostrar na tela e não quer apagar o catálogo.

## Percorrer e acumular

Cada desafio resolvido pela primeira vez soma 50 pontos de código. Dá para simular essa conta com um laço:

```python
concluidos = [True, True, False, True, False]
pontos = 0

for feito in concluidos:
    if feito:
        pontos += 50

print(pontos)
```

`for` entrega um item de cada vez. `if` decide se aquele item entra na soma. O placar de aprendizados mostra esse total, separado dos pontos do fliperama.

## Uma sequência de tentativas

O histórico de uma conversa também é uma sequência. Cada mensagem tem papel e texto.

```python
mensagens = [
    {"role": "user", "content": "Quero uma dica."},
    {"role": "assistant", "content": "Qual é a entrada do problema?"},
]

for mensagem in mensagens:
    print(mensagem["role"], ":", mensagem["content"])
```

A ordem é a ordem da conversa. Inserir no fim com `append` preserva o que já foi dito. Substituir a lista inteira apaga o histórico. Quando o tutor retoma uma conversa, ele precisa da sequência antiga, não de uma lista nova vazia.

## Para ir além

Sequências, fatiamento e laços sobre coleções estão no capítulo 2 do Python Fluente, “Uma coleção de sequências”, no [repositório](https://github.com/pythonfluente/pythonfluente2e). Créditos no [capítulo de abertura](00-creditos-e-licenca.md).
