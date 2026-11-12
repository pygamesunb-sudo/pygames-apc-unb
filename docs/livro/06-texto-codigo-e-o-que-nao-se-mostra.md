# 6. Texto, código e o que não se mostra

O aluno escreve código como texto. O tutor lê esse texto. A solução de referência também é texto, e ela não pode aparecer na resposta que volta para o navegador. Separar esses três textos é um problema de dado, não de sorte.

## O código do aluno é uma string

```python
codigo = "pontos = 150\nprint(pontos + 50)\n"
print(len(codigo))
print(codigo.startswith("pontos"))
```

Quebra de linha é um caractere. `len` conta caracteres, não linhas. `startswith` responde se o texto começa de um jeito. Nenhuma das duas chama o programa. Executar é outra etapa, feita no servidor, num processo separado, com limite de tempo.

## Normalizar antes de comparar

A saída do aluno e a saída esperada quase nunca vêm idênticas no olho humano. Um espaço no fim, uma linha vazia a mais. Por isso a comparação usa uma forma normalizada:

```python
def normalizar_saida(texto):
    linhas = texto.replace("\r\n", "\n").split("\n")
    return "\n".join(linha.rstrip() for linha in linhas).strip()

esperado = "200\n"
obtido = "200 \r\n"
print(normalizar_saida(esperado) == normalizar_saida(obtido))
```

`replace` unifica a quebra de linha. `rstrip` tira espaço à direita de cada linha. `strip` final tira a sobra nas pontas. O que sobra é o que o teste compara.

## O que a MIRA não copia

Quando o exercício já foi gerado, a conversa continua naquele enunciado. O pedido pode até carregar, no servidor, uma solução de referência. A resposta do tutor não pode repetir esse texto. Uma checagem local, didática, deixa o contrato visível:

```python
def resposta_vazou_solucao(resposta, solucao):
    if not solucao:
        return False
    return solucao.strip() in resposta
```

Se isso devolver verdadeiro, a resposta não segue para o aluno. O tutor pode fazer uma pergunta, apontar a entrada ou comentar o erro que a pessoa colou. Não cola o programa corrigido.

O mesmo vale para o Debugador. Um `IndexError` pede que você olhe o índice e o tamanho da lista. A linha consertada não é o produto da conversa.

## Chave não é texto de exercício

A chave usada para falar com o modelo fica fora do enunciado e fora do placar. No pedido, ou vai a chave que a pessoa guardou no próprio navegador, se a opção estiver ligada, ou a chave do ambiente. O livro não mostra chave nenhuma. Um exemplo didático usa um marcador:

```python
def mascarar_chave(chave):
    if len(chave) < 8:
        return "..."
    return chave[:4] + "..." + chave[-4:]
```

Os quatro primeiros e os quatro últimos bastam para reconhecer qual chave está ativa. O meio não entra em log, em tela de placar nem em mensagem de erro.

## Para ir além

Texto Unicode e bytes são o assunto do capítulo 4 do Python Fluente, no [volume 1](https://github.com/pythonfluente/pythonfluente2e). Autor: Luciano Ramalho. A licença e o que ela permite estão nos [créditos](00-creditos-e-licenca.md).
