# 2. O modelo de dados do aluno

Em Python, todo valor é um objeto. No Pygame-APC isso aparece cedo: o que a API devolve não é “um texto solto”, é um objeto com campos. O perfil público do placar de aprendizados, por exemplo, carrega identificador, nome, foto, pontos de código e quantidade de desafios resolvidos. E-mail e chave de IA não entram nessa lista.

## Um perfil mínimo

```python
perfil = {
    "nome": "Ana",
    "coding_points": 150,
    "solved_count": 3,
}

print(type(perfil))
print(perfil["coding_points"])
```

`perfil` é um dicionário. `perfil["coding_points"]` busca o valor pela chave. `type` devolve a classe do objeto. Essas duas operações, guardar e buscar, são o começo do modelo de dados: o comportamento mora no tipo.

## O que o objeto sabe fazer

Uma string e um número respondem a operações diferentes. O nome aceita método de texto. O ponto aceita conta.

```python
nome = perfil["nome"]
pontos = perfil["coding_points"]

print(nome.upper())
print(pontos + 50)
```

`upper` existe em `str`. Somar existe em `int`. Pedir `upper` num inteiro quebra, e o erro diz qual tipo recebeu a mensagem. No Debugador (DEBI), esse é o tipo de pista que importa: qual objeto, qual operação, qual tipo chegou no lugar errado.

## Um desafio também é um objeto

O exercício que a MIRA acompanha tem enunciado, tema e exemplos. A solução de referência fica no servidor e não volta para o navegador.

```python
exercicio = {
    "title": "Pontos do placar",
    "topic": "dicionarios",
    "examples": [
        {"input": "150", "output": "200"},
    ],
}

print(exercicio["examples"][0]["output"])
```

Ler `exercicio["examples"][0]["output"]` é atravessar três objetos: o desafio, a lista de exemplos e o primeiro exemplo. Se qualquer etapa não existir, Python levanta uma exceção com o nome do tipo. Anote essa mensagem. Ela é o material da próxima conversa com o tutor.

## Para ir além

O capítulo 1 do Python Fluente, “O modelo de dados de Python”, trata de como os métodos especiais ligam a sintaxe da linguagem a esses objetos. O texto está no volume 1 do repositório:

[https://github.com/pythonfluente/pythonfluente2e](https://github.com/pythonfluente/pythonfluente2e)

Autor: Luciano Ramalho. Licença: CC BY-NC-ND 4.0. Veja os [créditos](00-creditos-e-licenca.md).
