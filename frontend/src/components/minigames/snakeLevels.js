// Banco de dados de scripts Python estruturados em tokens sequenciais para o Snake.py
export const SNAKE_LEVELS = {
  // Fase 1: Scripts de 1 linha (10 variantes)
  1: [
    {
      lines: ['print("Olá, Mundo!")'],
      tokens: ['print', '(', '"Olá, Mundo!"', ')']
    },
    {
      lines: ['x = 42'],
      tokens: ['x', '=', '42']
    },
    {
      lines: ['import math'],
      tokens: ['import', 'math']
    },
    {
      lines: ['import random'],
      tokens: ['import', 'random']
    },
    {
      lines: ['print(abs(-10))'],
      tokens: ['print', '(', 'abs', '(', '-10', ')', ')']
    },
    {
      lines: ['nome = input()'],
      tokens: ['nome', '=', 'input', '(', ')']
    },
    {
      lines: ['print(len("APC"))'],
      tokens: ['print', '(', 'len', '(', '"APC"', ')', ')']
    },
    {
      lines: ['numeros = [1, 2, 3]'],
      tokens: ['numeros', '=', '[1, 2, 3]']
    },
    {
      lines: ['help(print)'],
      tokens: ['help', '(', 'print', ')']
    },
    {
      lines: ['y = True'],
      tokens: ['y', '=', 'True']
    }
  ],

  // Fase 2: Scripts de 2 linhas (10 variantes)
  2: [
    {
      lines: [
        'x = 10',
        'print(x * 2)'
      ],
      tokens: ['x', '=', '10', 'print', '(', 'x', '*', '2', ')']
    },
    {
      lines: [
        'import sys',
        'print(sys.version)'
      ],
      tokens: ['import', 'sys', 'print', '(', 'sys.version', ')']
    },
    {
      lines: [
        'valores = [1, 2]',
        'valores.append(3)'
      ],
      tokens: ['valores', '=', '[1, 2]', 'valores.append', '(', '3', ')']
    },
    {
      lines: [
        'pi = 3.1415',
        'print(round(pi, 2))'
      ],
      tokens: ['pi', '=', '3.1415', 'print', '(', 'round', '(', 'pi', ',', '2', ')', ')']
    },
    {
      lines: [
        'x = True',
        'print(not x)'
      ],
      tokens: ['x', '=', 'True', 'print', '(', 'not', 'x', ')']
    },
    {
      lines: [
        'a, b = 5, 8',
        'print(a + b)'
      ],
      tokens: ['a, b', '=', '5, 8', 'print', '(', 'a', '+', 'b', ')']
    },
    {
      lines: [
        'msg = "Aprender"',
        'print(msg.upper())'
      ],
      tokens: ['msg', '=', '"Aprender"', 'print', '(', 'msg.upper', '(', ')', ')']
    },
    {
      lines: [
        'import os',
        'print(os.getcwd())'
      ],
      tokens: ['import', 'os', 'print', '(', 'os.getcwd', '(', ')', ')']
    },
    {
      lines: [
        'par = lambda n: n % 2 == 0',
        'print(par(4))'
      ],
      tokens: ['par', '=', 'lambda n: n % 2 == 0', 'print', '(', 'par', '(', '4', ')', ')']
    },
    {
      lines: [
        'txt = "Python"',
        'print(txt[0])'
      ],
      tokens: ['txt', '=', '"Python"', 'print', '(', 'txt[0]', ')']
    }
  ],

  // Fase 3: Scripts de 3 linhas (10 variantes)
  3: [
    {
      lines: [
        'def f():',
        '    return 42',
        'print(f())'
      ],
      tokens: ['def f():', 'return 42', 'print', '(', 'f', '(', ')', ')']
    },
    {
      lines: [
        'idade = 18',
        'if idade >= 18:',
        '    print("Maior")'
      ],
      tokens: ['idade', '=', '18', 'if idade >= 18:', 'print', '(', '"Maior"', ')']
    },
    {
      lines: [
        'soma = 0',
        'for i in range(5):',
        '    soma += i'
      ],
      tokens: ['soma', '=', '0', 'for i in range(5):', 'soma += i']
    },
    {
      lines: [
        'a = [10, 20]',
        'a.sort(reverse=True)',
        'print(a)'
      ],
      tokens: ['a', '=', '[10, 20]', 'a.sort', '(', 'reverse=True', ')', 'print', '(', 'a', ')']
    },
    {
      lines: [
        'def saudacao(n):',
        '    return f"Olá {n}"',
        'print(saudacao("Beatriz"))'
      ],
      tokens: ['def saudacao(n):', 'return f"Olá {n}"', 'print', '(', 'saudacao', '(', '"Beatriz"', ')', ')']
    },
    {
      lines: [
        'import math',
        'r = math.sqrt(16)',
        'print(int(r))'
      ],
      tokens: ['import', 'math', 'r', '=', 'math.sqrt', '(', '16', ')', 'print', '(', 'int', '(', 'r', ')', ')']
    },
    {
      lines: [
        'c = 0',
        'while c < 3:',
        '    c += 1'
      ],
      tokens: ['c', '=', '0', 'while c < 3:', 'c += 1']
    },
    {
      lines: [
        'try:',
        '    x = 1 / 0',
        'except ZeroDivisionError: pass'
      ],
      tokens: ['try:', 'x = 1 / 0', 'except ZeroDivisionError: pass']
    },
    {
      lines: [
        'numeros = {1, 2}',
        'numeros.add(3)',
        'print(len(numeros))'
      ],
      tokens: ['numeros', '=', '{1, 2}', 'numeros.add', '(', '3', ')', 'print', '(', 'len', '(', 'numeros', ')', ')']
    },
    {
      lines: [
        'n = [10, 30]',
        'media = sum(n) / len(n)',
        'print(media)'
      ],
      tokens: ['n', '=', '[10, 30]', 'media', '=', 'sum(n) / len(n)', 'print', '(', 'media', ')']
    }
  ],

  // Fase 4: Scripts de 4 linhas (10 variantes)
  4: [
    {
      lines: [
        'class Dog:',
        '    def __init__(self, n):',
        '        self.name = n',
        'd = Dog("Rex")'
      ],
      tokens: ['class Dog:', 'def __init__(self, n):', 'self.name = n', 'd', '=', 'Dog', '(', '"Rex"', ')']
    },
    {
      lines: [
        'def fat(n):',
        '    if n <= 1: return 1',
        '    return n * fat(n-1)',
        'print(fat(5))'
      ],
      tokens: ['def fat(n):', 'if n <= 1: return 1', 'return n * fat(n-1)', 'print', '(', 'fat', '(', '5', ')', ')']
    },
    {
      lines: [
        'l = [1, 2, 3, 4]',
        'pares = [x for x in l if x % 2 == 0]',
        'print(len(pares))',
        'print(pares)'
      ],
      tokens: ['l', '=', '[1, 2, 3, 4]', 'pares = [x for x in l if x % 2 == 0]', 'print', '(', 'len', '(', 'pares', ')', ')', 'print', '(', 'pares', ')']
    },
    {
      lines: [
        'def f(x, y):',
        '    return x if x > y else y',
        'm = f(10, 20)',
        'print(f"Maior: {m}")'
      ],
      tokens: ['def f(x, y):', 'return x if x > y else y', 'm', '=', 'f', '(', '10', ',', '20', ')', 'print', '(', 'f"Maior: {m}"', ')']
    },
    {
      lines: [
        'info = {"nome": "Beatriz"}',
        'info["curso"] = "APC"',
        'for k, v in info.items():',
        '    print(f"{k}: {v}")'
      ],
      tokens: ['info', '=', '{"nome": "Beatriz"}', 'info["curso"] = "APC"', 'for k, v in info.items():', 'print', '(', 'f"{k}: {v}"', ')']
    },
    {
      lines: [
        'import json',
        'data = {"id": 1}',
        'js_str = json.dumps(data)',
        'print(js_str)'
      ],
      tokens: ['import', 'json', 'data', '=', '{"id": 1}', 'js_str', '=', 'json.dumps', '(', 'data', ')', 'print', '(', 'js_str', ')']
    },
    {
      lines: [
        'd = [10, 20, 30]',
        'res = []',
        'for v in d:',
        '    res.append(v + 5)'
      ],
      tokens: ['d', '=', '[10, 20, 30]', 'res', '=', '[]', 'for v in d:', 'res.append', '(', 'v + 5', ')']
    },
    {
      lines: [
        'def dobro(x):',
        '    return x * 2',
        'num = [1, 2, 3]',
        'res = list(map(dobro, num))'
      ],
      tokens: ['def dobro(x):', 'return x * 2', 'num', '=', '[1, 2, 3]', 'res', '=', 'list', '(', 'map', '(', 'dobro', ',', 'num', ')', ')']
    },
    {
      lines: [
        'f = open("log.txt", "w")',
        'f.write("Log executado")',
        'f.close()',
        'print("Arquivo salvo")'
      ],
      tokens: ['f', '=', 'open', '(', '"log.txt"', ',', '"w"', ')', 'f.write', '(', '"Log executado"', ')', 'f.close', '(', ')', 'print', '(', '"Arquivo salvo"', ')']
    },
    {
      lines: [
        'import time',
        't0 = time.time()',
        'time.sleep(0.5)',
        'print(time.time() - t0)'
      ],
      tokens: ['import', 'time', 't0', '=', 'time.time', '(', ')', 'time.sleep', '(', '0.5', ')', 'print', '(', 'time.time', '(', ')', '-', 't0', ')']
    }
  ]
};
