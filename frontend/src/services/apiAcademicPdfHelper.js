export function exportAcademicPDF(apiBaseUrl = 'http://localhost:8000') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Pygame-APC - Apresentacao Academica (ABNT)</title>
        <style>
          @page {
            size: A4;
            margin: 3cm 2cm 2cm 3cm; /* Superior 3, Direita 2, Inferior 2, Esquerda 3 */
          }
          body {
            font-family: "Arial", sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 0;
            background: #fff;
            text-align: justify;
          }
          .page-break {
            page-break-after: always;
          }
          /* Capa */
          .cover {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            box-sizing: border-box;
            padding: 2cm 0;
          }
          .institution {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.4;
          }
          .author {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 4cm;
          }
          .title-box {
            margin-top: 4cm;
          }
          .title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.5;
          }
          .subtitle {
            font-size: 12pt;
            font-style: italic;
            margin-top: 10px;
          }
          .natureza {
            font-size: 10pt;
            width: 55%;
            margin: 4cm 0 0 auto;
            text-align: justify;
            line-height: 1.3;
          }
          .local-ano {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: auto;
          }
          /* Sumario e Titulos */
          h1 {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 2cm;
            margin-bottom: 0.5cm;
            page-break-after: avoid;
          }
          h2 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 0.5cm;
            margin-bottom: 0.3cm;
            page-break-after: avoid;
          }
          p {
            margin: 0 0 1.5em 0;
            text-indent: 1.25cm;
          }
          ul, ol {
            margin: 0 0 1.5em 1.25cm;
            padding: 0;
          }
          li {
            margin-bottom: 0.5em;
            text-align: justify;
          }
          /* Tabelas e Codigos */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1cm 0;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            font-weight: bold;
            background-color: #f2f2f2;
          }
          pre {
            background: #f4f4f4;
            border: 1px solid #ccc;
            padding: 10px;
            font-family: "Courier New", monospace;
            font-size: 9pt;
            white-space: pre-wrap;
            margin: 1cm 0;
            text-align: left;
          }
          .bold {
            font-weight: bold;
          }
          .italic {
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <!-- CAPA -->
        <div class="cover page-break">
          <div class="institution">
            Universidade de Brasília<br>
            Instituto de Ciências Exatas<br>
            Departamento de Ciência da Computação<br>
            Algoritmos e Programação de Computadores (APC)
          </div>
          <div class="author">
            Equipe do Projeto Pygame-APC
          </div>
          <div class="title-box">
            <div class="title">Pygame-APC: Plataforma de Letramento Crítico em Inteligência Artificial Generativa e Algoritmos em Python</div>
            <div class="subtitle">Apresentação Acadêmica de Requisitos, Estrutura de Dados e Metodologia Científica de Ensino</div>
          </div>
          <div class="natureza">
            Especificação técnica, projeto de banco de dados, fluxos de interface e metodologia científica apresentados como requisito parcial para avaliação de projeto prático na disciplina de Algoritmos e Programação de Computadores (APC) sob orientação do Prof. Edison Ishikawa e com premissas didáticas do Prof. Rodrigo Duran.
          </div>
          <div class="local-ano">
            Brasília - DF<br>
            2026
          </div>
        </div>

        <!-- SUMARIO -->
        <div class="page-break">
          <h1>Sumário</h1>
          <table style="border: none; margin-top: 1cm;">
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">1. INTRODUÇÃO E PREMISSAS DO LETRAMENTO EM IAG</td>
              <td style="border: none; text-align: right; padding: 6px 0;">3</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">2. VISÃO DO PRODUTO (PYGAME-APC)</td>
              <td style="border: none; text-align: right; padding: 6px 0;">4</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">3. ARQUITETURA DO SOFTWARE E DESIGN DE INTERFACES</td>
              <td style="border: none; text-align: right; padding: 6px 0;">5</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">4. ESTRUTURAS DE DADOS DO BANCO</td>
              <td style="border: none; text-align: right; padding: 6px 0;">6</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">5. PIPELINE DE IA E ALGORITMO PYTHON DE SANDBOX</td>
              <td style="border: none; text-align: right; padding: 6px 0;">7</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">6. METODOLOGIA SCRUM E CRONOGRAMA DE SPRINTS</td>
              <td style="border: none; text-align: right; padding: 6px 0;">8</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">7. METODOLOGIA EXPERIMENTAL E RUBRICAS DE AVALIAÇÃO</td>
              <td style="border: none; text-align: right; padding: 6px 0;">9</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 6px 0;">REFERÊNCIAS BIBLIOGRÁFICAS</td>
              <td style="border: none; text-align: right; padding: 6px 0;">10</td>
            </tr>
          </table>
        </div>

        <!-- SEÇÃO 1 -->
        <div class="page-break">
          <h1>1. Introdução e Premissas do Letramento em IAG</h1>
          <p>Na era contemporânea, marcada pelo advento e consolidação da Inteligência Artificial Generativa (IAG), o letramento digital em nível superior exige uma ressignificação profunda no ensino de computação. Conforme postula Ishikawa (2026), o profissional que apenas reproduz passivamente códigos gerados por IAs está obsoleto. É imperativo que a prática pedagógica evolua de forma a capacitar o estudante a co-criar conhecimento de maneira crítica, autônoma e referenciável.</p>
          <p>Em consonância com esse referencial teórico, adotamos três premissas fundamentais de letramento em IA na disciplina de Algoritmos e Programação de Computadores (APC):</p>
          <ul>
            <li><strong>Sensemaking (Construção de Significado):</strong> O discente atua analisando a corretude, a complexidade e a semântica de algoritmos complexos produzidos pelas IAs generativas, superando a mera cópia e colagem;</li>
            <li><strong>Diálogos Críticos (Abordagem Hipotético-Dedutiva):</strong> O estudante é estimulado a formular hipóteses e refutar respostas inconsequentes ou com erros de lógica através de testes sistemáticos;</li>
            <li><strong>Método Socrático:</strong> O uso guiado de questionamento ativo, onde a própria IA atua como uma monitora que dá pistas sobre os erros de sintaxe sem revelar a resposta definitiva de imediato.</li>
          </ul>
          <p>Adicionalmente, a proposta do Prof. Rodrigo Duran enfatiza que a codificação clássica passa por uma redefinição: a IA generativa reduz substancialmente o custo cognitivo para a escrita de sintaxe simples. Isso libera recursos intelectuais nos discentes para o foco em atividades de maior nível de abstração — tais como o desenho de soluções eficientes, orquestração de APIs, modelagem de prompts refinados e a validação científica de corretude.</p>
        </div>

        <!-- SEÇÃO 2 -->
        <div class="page-break">
          <h1>2. Visão do Produto (Pygame-APC)</h1>
          <p>Para materializar as premissas pedagógicas descritas, idealizou-se o <strong>Pygame-APC</strong>, cuja visão estratégica e mercadológica segue a fórmula clássica de posicionamento do produto:</p>
          <table style="margin-top: 0.5cm;">
            <thead>
              <tr>
                <th style="width: 25%;">Fórmula</th>
                <th>Declaração Acadêmica de Sucesso</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="bold">PARA</td>
                <td>Estudantes e calouros matriculados na disciplina de Algoritmos e Programação de Computadores (APC) da Universidade de Brasília.</td>
              </tr>
              <tr>
                <td class="bold">QUE</td>
                <td>Necessitam desenvolver habilidades robustas de raciocínio algorítmico em Python e assimilar o letramento crítico em Inteligência Artificial Generativa.</td>
              </tr>
              <tr>
                <td class="bold">O</td>
                <td>Pygame-APC é um ambiente gamificado inteligente de desafios computacionais integrados a emuladores de fliperama digitais retrô.</td>
              </tr>
              <tr>
                <td class="bold">QUE</td>
                <td>Oferece geração dinâmica e socrática de problemas em Python aliada a um console com feedback imediato de compilador e testes unitários.</td>
              </tr>
              <tr>
                <td class="bold">AO CONTRÁRIO</td>
                <td>De metodologias tradicionais de ensino focadas em listas de exercícios estáticas e monótonas de fácil burla via copiadores automáticos.</td>
              </tr>
              <tr>
                <td class="bold">A NOSSA SOLUÇÃO</td>
                <td>Promove engajamento dinâmico e gamificado (XP e Leaderboards), aliando diversão clássica à fixação ativa de competências computacionais profundas.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- SEÇÃO 3 -->
        <div class="page-break">
          <h1>3. Arquitetura do Software e Design de Interfaces</h1>
          <p>O ecossistema do software Pygame-APC adota uma arquitetura MVC descentralizada no frontend React, comunicando-se de forma transparente com o backend em FastAPI (Python). O fluxo de interface do usuário foi otimizado para equilibrar motivação e aprendizagem:</p>
          <ul>
            <li><strong>Fliperama Retro:</strong> Emulador leve escrito em JavaScript contendo jogos clássicos de física simples (Snake, Doodle Ninja, Bug Invaders) que servem de distração recreativa e estímulo competitivo enquanto as chamadas assíncronas do pipeline do Gemini são processadas;</li>
            <li><strong>Geração Inteligente:</strong> Entrada intuitiva onde o estudante digita o tema desejado (ex: loops, vetores, ordenação) e a dificuldade, enviando um sinal HTTP para o interpretador de IA;</li>
            <li><strong>Arena de Codificação:</strong> Área de texto limpa com suporte a recuo inteligente, console de erros de sintaxe detalhado e exibição analítica de casos de teste unitários;</li>
            <li><strong>Placar de Líderes (Leaderboard):</strong> Agregador social que exibe o ranking consolidado em tempo real, integrando pontuações arcade e Coding Points obtidos na resolução de desafios Python.</li>
          </ul>
        </div>

        <!-- SEÇÃO 4 -->
        <div class="page-break">
          <h1>4. Estruturas de Dados do Banco</h1>
          <p>A arquitetura de persistência do Pygame-APC no banco de dados NoSQL do Google Firestore divide as estruturas em três modelos de dados centrais. As especificações lógicas dos documentos JSON são as seguintes:</p>
          <h2>4.1 Coleção de Desafios (Problems)</h2>
          <pre>{
  "problem_id": "string (UUID)",
  "title": "string (Título gerado pela IA)",
  "description": "string (Enunciado em texto puro)",
  "difficulty": "facil" | "medio" | "dificil" | "competitivo",
  "test_cases": [
    {
      "input": "string (Input enviado para stdin)",
      "expected_output": "string (Stdout esperado)"
    }
  ],
  "solution": "string (Solução ideal em Python)",
  "hints": ["string (Pistas socráticas para o discente)"],
  "solution_blocks": ["string (Blocos de código misturados)"]
}</pre>

          <h2>4.2 Coleção de Perfis (User Profile)</h2>
          <pre>{
  "uid": "string (Firebase Auth UID)",
  "name": "string (Nome do Jogador)",
  "email": "string",
  "coding_points": "integer (XP obtidos programando)",
  "total_score": "integer (Soma acumulada de jogos + código)",
  "games": {
    "snake": "integer (Highscore)",
    "doodle": "integer (Highscore)",
    "invaders": "integer (Highscore)"
  },
  "created_at": "timestamp"
}</pre>

          <h2>4.3 Coleção de Tentativas (Submissions)</h2>
          <pre>{
  "submission_id": "string",
  "user_id": "string",
  "user_name": "string",
  "problem_id": "string",
  "problem_title": "string",
  "code": "string (Script enviado pelo estudante)",
  "score": "integer (Porcentagem de acertos, 0 a 100)",
  "all_passed": "boolean",
  "timestamp": "timestamp"
}</pre>
        </div>

        <!-- SEÇÃO 5 -->
        <div class="page-break">
          <h1>5. Pipeline de IA e Algoritmo Python de Sandbox</h1>
          <p>O backend executa tarefas fundamentais de geração socrática e compilação isolada de segurança. A geração utiliza três agentes de IA autônomos que realizam chamadas sucessivas à API do Gemini:</p>
          <ul>
            <li><strong>Agente 1 (Gerador Pedagógico):</strong> Recebe as diretrizes, cria o enunciado e gera a solução ideal estruturando-a em blocos didáticos (\`solution_blocks\`);</li>
            <li><strong>Agente 2 (Solucionador de Validação):</strong> Executa a solução ideal no interpretador Python gerando as respostas corretas dos casos de teste de forma confiável;</li>
            <li><strong>Agente 3 (Revisor de Qualidade):</strong> Filtra erros de formatação e afasta potenciais enunciados vulgares ou vulnerabilidades de interpretador.</li>
          </ul>
          <p>Para a compilação do código submetido, o servidor utiliza um subprocesso isolado com monitoramento rígido de segurança e timeout para mitigar ameaças de loops infinitos ou sobrecarga:</p>

          <pre>def _run_user_code(code: str, test_input: str) -> tuple[str, str | None]:
    """
    Executa o código do usuário em um subprocesso isolado com limite de tempo.
    Retorna uma tupla (stdout, stderr).
    """
    tmp_path = None
    try:
        # Cria arquivo temporário com segurança local
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        # Invoca subprocesso passando as entradas por stdin
        proc = subprocess.run(
            [sys.executable, tmp_path],
            input=test_input,
            capture_output=True,
            text=True,
            timeout=5, # Proteção contra loop infinito
        )
        return proc.stdout.strip(), proc.stderr.strip() or None
    except subprocess.TimeoutExpired:
        return "", "Tempo limite excedido (5 segundos)."
    except Exception as e:
        return "", str(e)
    finally:
        # Remove arquivo temporário do sistema de arquivos
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)</pre>
        </div>

        <!-- SEÇÃO 6 -->
        <div class="page-break">
          <h1>6. Metodologia Scrum e Cronograma de Sprints</h1>
          <p>O desenvolvimento da plataforma foi regido pela metodologia ágil Scrum, adaptada aos prazos de aula universitários, com reuniões rápidas e entregas incrementais. O cronograma foi desenhado em três sprints estruturados:</p>
          <h2>6.1 Divisão dos Sprints</h2>
          <ul>
            <li><strong>Sprint Inicial (Especificação):</strong> Definição da visão de sucesso do software, desenho inicial das interfaces em Wireframes, modelagem das tabelas do NoSQL, rascunho do executor e criação da infraestrutura de repositórios organizacionais no GitHub;</li>
            <li><strong>Sprint Intermediário (Implementação & Testes):</strong> Escrita das telas React e rotas FastAPI Python, conexões dinâmicas com o Google Gemini, desenvolvimento de documentações e testes iniciais de interface com usuários piloto;</li>
            <li><strong>Sprint Final (Ajustes & Jornada):</strong> Otimização do compilador sandbox, preparação dos slides e pôster de 7 minutos, e divulgação pública dos resultados na 1ª Jornada de Extensão do IE.</li>
          </ul>
          <h2>6.2 Datas e Marcos Avaliativos</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Marco Acadêmico</th>
                <th>Artefato / Entrega Relacionada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>20/05</td>
                <td>Início Oficial do Projeto</td>
                <td>Definição de equipes no CIC e alinhamento do escopo em aula.</td>
              </tr>
              <tr>
                <td>27/05</td>
                <td>Especificação do Escopo</td>
                <td>Upload do escopo, desenhos e diagramas lógicos no Moodle.</td>
              </tr>
              <tr>
                <td>03/06</td>
                <td>Avaliação Intermediária</td>
                <td>Apresentação do Pitch do produto para os professores e monitores.</td>
              </tr>
              <tr>
                <td>11/06</td>
                <td>1ª Jornada de Extensão do IE</td>
                <td>Apresentação do pôster acadêmico impresso para a comunidade da UnB.</td>
              </tr>
              <tr>
                <td>01/07</td>
                <td>Avaliação Final do Projeto</td>
                <td>Código no GitHub, vídeo de 7min de demonstração e slides.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- SEÇÃO 7 -->
        <div class="page-break">
          <h1>7. Metodologia Experimental e Rubricas de Avaliação</h1>
          <p>O projeto adota uma metodologia científica experimental para aferir de forma quantitativa se o uso prático da plataforma Pygame-APC aumenta o índice de retenção dos conteúdos de programação básica em Python. Formulou-se a hipótese de teste de que alunos que utilizam o letramento socrático e a gamificação retrô obtêm melhor desempenho em provas acadêmicas (P2) se comparados com a metodologia tradicional de ensino expositivo.</p>
          <p>Os dados experimentais agregados contemplam métricas como o tempo de escrita, taxa de acerto por tentativa, velocidade de depuração com dicas e a evolução empírica dos Coding Points.</p>
          <p>Por fim, o processo avaliativo do trabalho prático e experimental obedece à tabela oficial de pesos e rubricas definida pelo DCC/CIC:</p>
          <table>
            <thead>
              <tr>
                <th>Componente Avaliativo</th>
                <th>Peso %</th>
                <th>Critério de Sucesso (Padrão UnB, Nota 9 a 10)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="bold">Especificação do Sistema</td>
                <td>10%</td>
                <td>Cobre todos os requisitos do projeto e modela de forma consistente as regras de dados.</td>
              </tr>
              <tr>
                <td class="bold">Pitch (Avaliação Intermediária)</td>
                <td>10%</td>
                <td>Apresentação profissional focada na demonstração prática dos objetivos e progresso.</td>
              </tr>
              <tr>
                <td class="bold">Código Fonte do Software</td>
                <td>30%</td>
                <td>Implementação completa do ecossistema, com modularização e ampla documentação de rotas.</td>
              </tr>
              <tr>
                <td class="bold">Demonstração e Corretude</td>
                <td>30%</td>
                <td>Execução sem falhas, erros de compilação ou vulnerabilidades lógicas.</td>
              </tr>
              <tr>
                <td class="bold">Apresentação Pôster (Jornada)</td>
                <td>20%</td>
                <td>Metodologia descrita adequadamente, dados consistentes e tabelas/gráficos inteligíveis.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- REFERENCIAS -->
        <div>
          <h1>Referências Bibliográficas</h1>
          <p style="text-indent: 0; margin-bottom: 1em; padding-left: 1.25cm; text-indent: -1.25cm;">
            DURAN, Rodrigo. <strong>Metodologias de Ensino de Programação Computacional na Era dos Grandes Modelos de Linguagem (LLMs)</strong>. Departamento de Ciência da Computação, Universidade de Brasília, Brasília, 2026.
          </p>
          <p style="text-indent: 0; margin-bottom: 1em; padding-left: 1.25cm; text-indent: -1.25cm;">
            ISHIKAWA, Edison. <strong>Premissas de Letramento em IA Generativa para o Ensino Superior</strong>. Departamento de Ciência da Computação (CIC/DCC), Universidade de Brasília (UnB), Brasília, 2026.
          </p>
        </div>

        <script>
          // Aciona a impressao/salvamento do PDF automaticamente
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
