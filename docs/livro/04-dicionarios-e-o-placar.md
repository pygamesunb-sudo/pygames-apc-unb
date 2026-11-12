# 4. Dicionários e o placar

Lista guarda item por posição. Dicionário guarda valor por chave. O placar de aprendizados precisa das duas ideias: uma lista de alunos, e em cada aluno um conjunto de campos com nome.

## A chave é um contrato

```python
aluno = {
    "uid": "abc123",
    "name": "Ana",
    "coding_points": 200,
    "solved_count": 4,
}

print(aluno["name"])
print(aluno.get("email", ""))
```

`aluno["name"]` exige a chave. Se ela não existir, o programa quebra. `aluno.get("email", "")` devolve o segundo argumento quando a chave falta. No placar público a escolha é de propósito: e-mail e chave de IA não são campos dessa resposta. Quem for montar a linha da tabela usa os campos que existem.

## Vários alunos, uma ordem

A API devolve uma lista já ordenada por pontos de código. Quem tem zero ponto e zero desafio resolvido nem entra.

```python
placar = [
    {"name": "Ana", "coding_points": 200, "solved_count": 4},
    {"name": "Bia", "coding_points": 50, "solved_count": 1},
]

placar.sort(key=lambda linha: linha["coding_points"], reverse=True)

for posicao, linha in enumerate(placar, start=1):
    print(posicao, linha["name"], linha["coding_points"])
```

`sort` muda a própria lista. A chave da ordenação é uma função que recebe a linha e devolve o número que deve mandar na ordem. `reverse=True` coloca o maior primeiro. `enumerate` numera a partir de 1, que é o que a tabela mostra.

O ranking de jogos usa outra medida. Misturar as duas listas na mesma coluna esconde o que o placar de aprendizados quer contar: estudo, não recorde de fliperama.

## Contar sem repetir gente

Um conjunto não guarda duplicata. Serve para saber quais desafios a pessoa já resolveu, quando o que importa é a presença, não a ordem das tentativas.

```python
resolvidos = {"entrada_saida", "funcoes", "tutores"}
resolvidos.add("funcoes")
print(len(resolvidos))
print("tutores" in resolvidos)
```

`add` de um item que já está no conjunto não aumenta o tamanho. A primeira resolução soma os 50 pontos. A segunda tentativa do mesmo desafio não precisa somar de novo.

## Para ir além

O capítulo 3 do Python Fluente trata de dicionários e conjuntos com muito mais detalhes, inclusive de como a chave é calculada. Está no volume 1:

[https://github.com/pythonfluente/pythonfluente2e](https://github.com/pythonfluente/pythonfluente2e)
