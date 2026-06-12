# Manual de Reconstrução do Ambiente de Desenvolvimento
## Guardiões da Fauna — Jogo Educativo 2D

---

**Disciplina:** Projeto de Aprendizagem Colaborativa Extensionista — PAV IV  
**Curso:** Engenharia de Software — 4º Semestre  
**Instituição:** Católica SC  
**Equipe:** Ana Julia Castelo Branco, Guilherme Gonçalves, João Pedro Monteiro e Maik Oliveira  
**Data:** Maio de 2026  

---

## Apresentação

Professor(a), este manual foi elaborado com o objetivo de orientar a reconstrução completa do ambiente de desenvolvimento utilizado pela equipe durante a criação do jogo *Guardiões da Fauna*. Procuramos descrever cada etapa de forma detalhada, considerando que nem todos os leitores podem ter familiaridade com as ferramentas específicas que utilizamos ao longo do projeto.

O *Guardiões da Fauna* é um jogo educativo de aventura em plataforma 2D desenvolvido inteiramente com tecnologias web nativas — HTML5, CSS3 e JavaScript puro. Uma das decisões mais importantes que tomamos no início do projeto foi justamente evitar dependências externas: não utilizamos nenhum framework de jogos (como Phaser ou Unity), nenhum gerenciador de pacotes (como npm) e nenhum processo de compilação. Isso significa que o jogo roda diretamente no navegador, sem necessidade de instalação de bibliotecas adicionais.

Por essa razão, o processo de reconstrução do ambiente é consideravelmente mais simples do que em projetos com dependências complexas. Ainda assim, há ferramentas essenciais que precisam estar instaladas para que seja possível explorar o código-fonte da maneira como a equipe o desenvolveu, especialmente em relação ao uso do controle de versão com Git.

Seguindo as instruções deste manual passo a passo, qualquer pessoa com acesso a um computador com Windows, macOS ou Linux conseguirá reproduzir fielmente o ambiente de desenvolvimento que utilizamos.

---

## Índice

1. [Visão Geral das Tecnologias Utilizadas](#1-visão-geral-das-tecnologias-utilizadas)
2. [Requisitos de Hardware e Software](#2-requisitos-de-hardware-e-software)
3. [Etapa 1 — Instalação do Editor de Código (Visual Studio Code)](#3-etapa-1--instalação-do-editor-de-código-visual-studio-code)
4. [Etapa 2 — Instalação do Git](#4-etapa-2--instalação-do-git)
5. [Etapa 3 — Obtenção do Código-Fonte via GitHub](#5-etapa-3--obtenção-do-código-fonte-via-github)
6. [Etapa 4 — Abertura do Projeto no Editor](#6-etapa-4--abertura-do-projeto-no-editor)
7. [Etapa 5 — Execução do Jogo no Navegador](#7-etapa-5--execução-do-jogo-no-navegador)
8. [Etapa 6 — Configuração do Servidor Local (Opcional, mas Recomendado)](#8-etapa-6--configuração-do-servidor-local-opcional-mas-recomendado)
9. [Estrutura do Projeto e Responsabilidade dos Arquivos](#9-estrutura-do-projeto-e-responsabilidade-dos-arquivos)
10. [Solução de Problemas Comuns](#10-solução-de-problemas-comuns)

---

## 1. Visão Geral das Tecnologias Utilizadas

Antes de iniciarmos o processo de instalação propriamente dito, achamos importante contextualizar quais tecnologias compõem o projeto e por que cada uma foi escolhida. Essa compreensão facilita a identificação do que precisa ser instalado e o que não precisa.

| Tecnologia | Versão Mínima | Finalidade |
|---|---|---|
| HTML5 | — | Estrutura das telas e elementos do jogo |
| CSS3 | — | Estilização visual, animações de tela |
| JavaScript (ES6+) | — | Lógica do jogo, física, áudio e dados |
| Canvas API | — | Renderização 2D dos personagens e cenários |
| Web Audio API | — | Geração procedural de sons e música |
| localStorage | — | Salvamento automático do progresso |
| Google Fonts | — | Tipografia pixel-art (Press Start 2P, VT323) |
| Git | 2.x | Controle de versão e colaboração em equipe |
| Visual Studio Code | 1.85+ | Editor de código utilizado pela equipe |

> **Nota:** As APIs Canvas, Web Audio e localStorage fazem parte do padrão moderno dos navegadores e **não precisam ser instaladas** — qualquer navegador atualizado (Chrome 90+, Firefox 88+, Edge 90+, Safari 15+) já as suporta nativamente.

---

## 2. Requisitos de Hardware e Software

### 2.1 Requisitos de Hardware

O projeto não exige hardware de alto desempenho. Qualquer computador moderno é suficiente:

- **Processador:** Qualquer processador dual-core fabricado após 2012
- **Memória RAM:** Mínimo de 4 GB (recomendado 8 GB ou mais)
- **Armazenamento:** Aproximadamente 50 MB livres para o projeto e ferramentas
- **Conexão com a Internet:** Necessária apenas para clonar o repositório e carregar as fontes do Google Fonts durante o jogo

### 2.2 Requisitos de Software

- **Sistema Operacional:** Windows 10/11, macOS 10.15+ ou qualquer distribuição Linux moderna
- **Navegador Web:** Google Chrome (recomendado), Mozilla Firefox, Microsoft Edge ou Safari — todos na versão mais recente disponível
- **Git:** Versão 2.x ou superior
- **Visual Studio Code:** Versão 1.85 ou superior (editor utilizado pela equipe)

---

## 3. Etapa 1 — Instalação do Editor de Código (Visual Studio Code)

O Visual Studio Code (VS Code) foi o editor adotado por toda a equipe durante o desenvolvimento. Ele oferece realce de sintaxe para HTML, CSS e JavaScript, além de integração nativa com o Git, o que tornou nossa colaboração muito mais fluida.

### 3.1 Download

1. Acesse o site oficial do Visual Studio Code: **https://code.visualstudio.com**
2. O site detectará automaticamente seu sistema operacional e sugerirá o instalador adequado
3. Clique no botão azul **"Download for Windows"** (ou equivalente para seu sistema)
4. Aguarde o download do arquivo instalador (aproximadamente 90 MB)

### 3.2 Instalação no Windows

1. Execute o arquivo baixado (normalmente nomeado `VSCodeUserSetup-x64-x.xx.x.exe`)
2. Quando a janela do instalador abrir, clique em **"Aceito o acordo"** e depois em **"Próximo"**
3. Na tela de seleção de tarefas adicionais, recomendamos marcar as seguintes opções:
   - ✅ **Adicionar ação "Abrir com Code" ao menu de contexto de arquivo do Windows Explorer**
   - ✅ **Adicionar ação "Abrir com Code" ao menu de contexto de diretório do Windows Explorer**
   - ✅ **Adicionar ao PATH** (muito importante para uso pelo terminal)
4. Clique em **"Próximo"** e depois em **"Instalar"**
5. Ao final, clique em **"Concluir"** — o VS Code abrirá automaticamente

### 3.3 Instalação no macOS

1. Após o download do arquivo `.zip`, clique duas vezes para extrair
2. Arraste o ícone do **Visual Studio Code** para a pasta **Aplicativos**
3. Na primeira execução, clique com o botão direito no ícone e selecione **"Abrir"** para contornar a verificação de segurança do macOS

### 3.4 Extensões Recomendadas

Após instalar o VS Code, sugerimos instalar as seguintes extensões que utilizamos durante o desenvolvimento. Para instalar uma extensão, pressione `Ctrl+Shift+X` (ou `Cmd+Shift+X` no Mac) para abrir o painel de extensões e pesquise pelo nome:

- **Live Server** (autor: Ritwick Dey) — permite executar o jogo com um servidor local integrado ao editor, com atualização automática ao salvar arquivos
- **Prettier - Code Formatter** (autor: Prettier) — formatação automática de código
- **GitLens** (autor: GitKraken) — visualização avançada do histórico Git diretamente no editor

---

## 4. Etapa 2 — Instalação do Git

O Git é o sistema de controle de versão que utilizamos para colaborar e registrar o histórico de mudanças ao longo do desenvolvimento. É através dele que o código-fonte do projeto está hospedado no GitHub.

### 4.1 Verificando se o Git já está instalado

Antes de instalar, verifique se o Git já está presente no seu computador:

1. Abra o terminal do seu sistema:
   - **Windows:** Pressione `Win + R`, digite `cmd` e pressione Enter
   - **macOS:** Pressione `Cmd + Espaço`, digite `Terminal` e pressione Enter
   - **Linux:** Pressione `Ctrl + Alt + T`

2. Digite o seguinte comando e pressione Enter:

```
git --version
```

3. Se o Git já estiver instalado, você verá uma resposta semelhante a:

```
git version 2.43.0
```

Nesse caso, pode pular para a Etapa 3. Se aparecer uma mensagem de erro dizendo que o comando não foi reconhecido, siga as instruções de instalação abaixo.

### 4.2 Download e Instalação no Windows

1. Acesse o site oficial: **https://git-scm.com/download/win**
2. O download iniciará automaticamente. Caso não inicie, clique em **"Click here to download"**
3. Execute o instalador baixado
4. Durante a instalação, na maioria das telas pode-se manter as opções padrão. Contudo, atenção especial para estas configurações:
   - Em **"Choosing the default editor used by Git"**, recomendamos selecionar **"Use Visual Studio Code as Git's default editor"**
   - Em **"Adjusting your PATH environment"**, selecione **"Git from the command line and also from 3rd-party software"** (opção do meio)
   - Em **"Configuring the line ending conversions"**, selecione **"Checkout Windows-style, commit Unix-style line endings"**
5. Clique em **"Next"** nas demais telas e depois em **"Install"**
6. Ao final, clique em **"Finish"**

### 4.3 Download e Instalação no macOS

O macOS geralmente já possui o Git instalado. Caso não esteja, a forma mais simples é:

1. Abra o Terminal e execute:
```
xcode-select --install
```
2. Uma janela aparecerá pedindo permissão para instalar as ferramentas de linha de comando da Apple — clique em **"Instalar"**
3. Aguarde o processo concluir (pode demorar alguns minutos)

Alternativamente, o Git pode ser instalado pelo **Homebrew** (caso já esteja instalado):
```
brew install git
```

### 4.4 Instalação no Linux (Ubuntu/Debian)

Abra o terminal e execute:
```
sudo apt update
sudo apt install git
```

### 4.5 Configuração Inicial do Git

Após a instalação, é necessário configurar seu nome e e-mail. Esses dados serão vinculados a qualquer alteração que você eventualmente fizer no projeto. Abra o terminal e execute os dois comandos abaixo, substituindo pelas suas informações:

```
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu.email@exemplo.com"
```

Para confirmar que a configuração foi salva corretamente:
```
git config --list
```

---

## 5. Etapa 3 — Obtenção do Código-Fonte via GitHub

O código-fonte do projeto está hospedado publicamente no GitHub. Existem duas maneiras de obtê-lo: por clonagem via Git (recomendada) ou por download direto do arquivo comprimido.

### 5.1 Método 1 — Clonagem via Git (Recomendado)

Este método preserva todo o histórico de versões e commits realizados pela equipe ao longo do desenvolvimento, o que permite visualizar a evolução do projeto.

1. Abra o terminal do seu sistema operacional
2. Navegue até a pasta onde deseja salvar o projeto. Por exemplo, para salvar na Área de Trabalho:
   - **Windows:**
   ```
   cd %USERPROFILE%\Desktop
   ```
   - **macOS/Linux:**
   ```
   cd ~/Desktop
   ```

3. Execute o comando de clonagem:
```
git clone https://github.com/anajuliacbf/Jogo-Guardioes-da-Fauna.git
```

4. Aguarde o processo de download. Ao final, você verá uma mensagem semelhante a:
```
Cloning into 'Jogo-Guardioes-da-Fauna'...
remote: Enumerating objects: 47, done.
remote: Counting objects: 100% (47/47), done.
Resolving deltas: 100% (12/12), done.
```

5. Uma pasta chamada `Jogo-Guardioes-da-Fauna` foi criada no local escolhido com todos os arquivos do projeto.

### 5.2 Método 2 — Download Direto (Alternativa)

Caso prefira não utilizar o terminal neste momento:

1. Acesse: **https://github.com/anajuliacbf/Jogo-Guardioes-da-Fauna**
2. Clique no botão verde **"Code"**
3. Selecione **"Download ZIP"**
4. Salve e extraia o arquivo `.zip` em uma pasta de sua preferência

> **Observação:** Este método não preserva o histórico de commits. Para fins de avaliação acadêmica da evolução do projeto, o Método 1 é mais indicado.

---

## 6. Etapa 4 — Abertura do Projeto no Editor

Com o projeto baixado, o próximo passo é abri-lo no Visual Studio Code.

### 6.1 Abrindo a pasta do projeto

**Opção A — Via menu do VS Code:**
1. Abra o Visual Studio Code
2. No menu superior, clique em **"Arquivo"** → **"Abrir Pasta..."** (ou `Ctrl+K Ctrl+O`)
3. Navegue até a pasta `Jogo-Guardioes-da-Fauna` que foi criada pelo `git clone`
4. Clique em **"Selecionar Pasta"**

**Opção B — Via terminal (mais rápido):**
1. Abra o terminal e navegue até a pasta do projeto:
```
cd Jogo-Guardioes-da-Fauna
```
2. Abra o VS Code na pasta atual:
```
code .
```

**Opção C — Via menu de contexto do Windows Explorer:**
Caso tenha marcado a opção durante a instalação do VS Code, você pode clicar com o botão direito sobre a pasta `Jogo-Guardioes-da-Fauna` no Explorador de Arquivos e selecionar **"Abrir com Code"**.

### 6.2 Estrutura que você verá no explorador de arquivos

Após abrir o projeto, o painel esquerdo do VS Code exibirá a seguinte estrutura:

```
Jogo-Guardioes-da-Fauna/
├── index.html          ← Ponto de entrada do jogo
├── css/
│   └── style.css       ← Todos os estilos visuais
├── js/
│   ├── main.js         ← Orquestrador geral do jogo
│   ├── game.js         ← Motor do jogo (física e colisões)
│   ├── audio.js        ← Sistema de áudio procedural
│   └── data.js         ← Dados dos animais, fases e biomas
└── assets/             ← Pasta de assets (sprites embutidos no código)
```

---

## 7. Etapa 5 — Execução do Jogo no Navegador

Esta é, sem dúvida, a etapa mais simples do processo. Por ser desenvolvido com tecnologias web puras, o jogo pode ser executado de duas formas.

### 7.1 Forma mais simples — Abrir o arquivo HTML diretamente

1. No Explorador de Arquivos do seu sistema operacional (não o do VS Code), navegue até a pasta do projeto
2. Dê um duplo clique no arquivo **`index.html`**
3. O arquivo será aberto automaticamente no navegador padrão do sistema
4. O jogo iniciará imediatamente

> **Atenção:** Esta forma é suficiente para jogar e visualizar o jogo. No entanto, em alguns casos, o navegador pode bloquear o carregamento de recursos locais por questões de segurança (política CORS). Se isso acontecer, a tela do jogo pode não aparecer corretamente. Neste caso, recomendamos utilizar um servidor local, conforme descrito na próxima etapa.

### 7.2 Testando se o jogo está funcionando

Ao abrir o `index.html` no navegador, você deverá ver:

- A tela inicial do jogo com o título **"GUARDIÕES da FAUNA"** em letras pixel-art
- Uma animação de fundo com estrelas e vagalumes
- Três botões: **INICIAR JOGO**, **ANIMAIS** e **OPÇÕES**
- Personagens animados na tela (Leo, onça-pintada e lobo-guará)

Se a tela aparecer em branco ou os botões não responderem, consulte a seção de [Solução de Problemas](#10-solução-de-problemas-comuns).

---

## 8. Etapa 6 — Configuração do Servidor Local (Opcional, mas Recomendado)

Para garantir que todos os recursos carreguem corretamente e que a experiência de desenvolvimento seja mais próxima de um ambiente de produção real, recomendamos executar o projeto através de um servidor local. Apresentamos três alternativas, da mais simples à mais robusta.

### 8.1 Alternativa A — Live Server (extensão do VS Code) — Mais recomendada

Esta é a alternativa que utilizamos durante o desenvolvimento por ser extremamente prática: sempre que salvamos um arquivo, o navegador atualiza automaticamente.

**Instalação:**
1. No VS Code, pressione `Ctrl+Shift+X` para abrir as extensões
2. Pesquise por **"Live Server"**
3. Clique em **"Instalar"** na extensão de Ritwick Dey

**Execução:**
1. Com o projeto aberto no VS Code, clique com o botão direito sobre o arquivo `index.html` no painel de arquivos
2. Selecione **"Open with Live Server"**
3. O navegador abrirá automaticamente em `http://127.0.0.1:5500`
4. O jogo estará rodando normalmente

### 8.2 Alternativa B — Python (caso já esteja instalado)

Se o Python estiver instalado no seu computador, esta é a forma mais rápida via terminal:

1. Abra o terminal na pasta do projeto:
```
cd Jogo-Guardioes-da-Fauna
```

2. Execute um dos comandos abaixo conforme a versão do Python instalada:

**Python 3 (mais comum atualmente):**
```
python -m http.server 8000
```

**Python 2 (versão legada):**
```
python -m SimpleHTTPServer 8000
```

3. Abra o navegador e acesse: **http://localhost:8000**

Para encerrar o servidor, pressione `Ctrl+C` no terminal.

### 8.3 Alternativa C — Node.js com http-server

Caso o Node.js esteja instalado:

1. Instale o pacote `http-server` globalmente (precisa ser feito apenas uma vez):
```
npm install -g http-server
```

2. Na pasta do projeto, execute:
```
http-server -p 8080
```

3. Acesse no navegador: **http://localhost:8080**

---

## 9. Estrutura do Projeto e Responsabilidade dos Arquivos

Para que seja possível analisar e compreender o código, apresentamos aqui uma descrição detalhada de cada arquivo e sua função dentro do projeto. Esta organização modular foi uma decisão arquitetural intencional da equipe para facilitar a manutenção e divisão de responsabilidades.

### `index.html` — Ponto de Entrada

Este arquivo contém toda a estrutura HTML do jogo. Nele estão definidas as diversas telas do jogo como elementos `<div>`: tela inicial, seleção de bioma, gameplay, pausa, bestiário, opções e tela de game over. O arquivo também carrega os arquivos JavaScript e CSS.

Todas as telas existem no HTML desde o início, mas apenas uma é visível por vez — o controle de qual tela exibir é feito pelo JavaScript através da manipulação de classes CSS.

### `css/style.css` — Estilos Visuais

Contém toda a estilização do jogo: layout das telas, efeitos visuais dos menus, animações CSS (estrelas piscando, vagalumes voando, personagens animados na tela inicial), configurações de tipografia pixel-art e adaptações para diferentes tamanhos de tela.

### `js/data.js` — Dados do Jogo

Este é o arquivo de configuração central do jogo. Nele estão definidos em JavaScript puro:
- Os **20 animais** distribuídos pelos 4 biomas, com seus nomes científicos, populares, status de conservação e curiosidades
- Os **4 biomas** (Mata Atlântica, Amazônia, Cerrado e Pantanal) com suas configurações visuais
- Os **5 tipos de robôs inimigos** e seus atributos (velocidade, pontos de vida, comportamento)
- O **design dos níveis** com posicionamento de plataformas, obstáculos e animais
- O **estado padrão do salvamento** (`DEFAULT_SAVE`)

### `js/audio.js` — Sistema de Áudio Procedural

Talvez o arquivo mais técnico do projeto. Todo o sistema sonoro do jogo foi construído sem nenhum arquivo de áudio externo (sem MP3, WAV ou OGG). Os sons são gerados programaticamente em tempo real utilizando a **Web Audio API** do navegador através de síntese de formas de onda (senoidal, quadrada, triangular, dente-de-serra) e geração de ruído branco.

O arquivo contém funções para gerar:
- **12 efeitos sonoros** (pulo, coleta de animal, disparo do binóculo, dano, morte de robô, etc.)
- **Músicas de fundo** características para cada bioma

### `js/game.js` — Motor do Jogo

O coração do jogo. Este arquivo implementa:
- O **loop principal** do jogo (atualização de física e renderização via Canvas a 60 FPS)
- O **sistema de física** (gravidade, velocidade, aceleração, detecção e resolução de colisões)
- O **comportamento dos inimigos** (patrulha, perseguição, ataque)
- A **renderização** de todos os elementos visuais no Canvas (personagens, plataformas, HUD)
- O **sistema de animações** dos sprites
- Os **comportamentos especiais** (nadar, escalar, duplo salto)

### `js/main.js` — Orquestrador

Responsável por coordenar todas as partes do jogo:
- **Gerenciamento de telas** (qual tela exibir em cada momento)
- **Sistema de salvamento** (leitura e escrita no localStorage)
- **Processamento de entrada** do teclado e mouse
- **Cutscenes** de introdução a cada bioma
- **Interface do HUD** (barra de vida, contagem de animais, pontuação)
- **Bestiário** (enciclopédia dos animais desbloqueados)

---

## 10. Solução de Problemas Comuns

Listamos aqui os problemas que encontramos durante o desenvolvimento e como resolvê-los:

### Problema 1: A tela do jogo aparece em branco

**Causa mais comum:** O navegador está bloqueando o carregamento de recursos locais (política CORS ao abrir arquivos diretamente pelo sistema de arquivos).

**Solução:** Utilize um servidor local conforme descrito na Etapa 6. A alternativa mais simples é instalar a extensão **Live Server** no VS Code e clicar com o botão direito em `index.html` → **"Open with Live Server"**.

---

### Problema 2: O jogo abre mas o áudio não funciona

**Causa:** A maioria dos navegadores modernos bloqueia a reprodução automática de áudio por padrão até que o usuário interaja com a página.

**Solução:** Clique em qualquer botão da tela inicial para iniciar a interação. O áudio será ativado automaticamente após o primeiro clique.

---

### Problema 3: O jogo está lento ou com travamentos

**Causa:** Pode ser que o navegador esteja renderizando o Canvas com aceleração de hardware desabilitada.

**Solução:** 
- Verifique se outros programas pesados não estão consumindo a memória RAM
- Tente fechar outras abas do navegador
- Prefira o Google Chrome, que tende a ter melhor desempenho com Canvas e Web Audio API

---

### Problema 4: O comando `git clone` retorna erro de autenticação

**Causa:** Repositórios privados requerem autenticação. Porém, como este repositório é público, este erro pode ocorrer se o endereço foi digitado incorretamente.

**Solução:** Confirme que o endereço digitado é exatamente:
```
https://github.com/anajuliacbf/Jogo-Guardioes-da-Fauna.git
```

---

### Problema 5: O VS Code não reconhece o comando `code .` no terminal

**Causa:** O VS Code não foi adicionado ao PATH do sistema durante a instalação.

**Solução:**
- **Windows:** Abra o VS Code, pressione `Ctrl+Shift+P`, pesquise por **"Shell Command: Install 'code' command in PATH"** e execute
- **macOS:** O mesmo procedimento se aplica: `Cmd+Shift+P` → pesquisar por "install code command"
- Em seguida, feche e reabra o terminal para que a mudança tenha efeito

---

### Problema 6: As fontes pixel-art não carregam (aparece texto em fonte comum)

**Causa:** O computador não possui conexão com a internet ou o acesso ao Google Fonts está bloqueado.

**Solução:** As fontes são carregadas do serviço Google Fonts, portanto é necessária conexão com a internet para que apareçam corretamente. Isso afeta apenas a estética visual e não impede o funcionamento do jogo.

---

## Considerações Finais

Professor(a), esperamos que este manual tenha sido suficientemente claro para guiar a reconstrução do ambiente de desenvolvimento do *Guardiões da Fauna*. Escolhemos tecnologias web nativas justamente para garantir que o projeto fosse acessível e fácil de executar, sem barreiras de instalação de dependências complexas.

Caso surja alguma dúvida não contemplada neste documento, o código-fonte está disponível publicamente no repositório GitHub informado e toda a equipe está à disposição para eventuais esclarecimentos.

---

*Documento elaborado pela equipe de desenvolvimento do projeto Guardiões da Fauna — PAV IV, Engenharia de Software, Católica SC, 2026.*
