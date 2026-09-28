# Guia de Docker — RPGCardGame

Guia prático de como interagir com Docker neste projeto: como buildar e
subir as imagens, como ler/editar um `Dockerfile`, e os comandos de CLI do
dia a dia. Escrito pra quem já rodou os comandos abaixo pelo menos uma vez
e quer entender o que cada coisa faz, não só copiar e colar.

## 1. Modelo mental do projeto

**Duas imagens independentes, sem `docker-compose`** (decisão explícita —
projeto pequeno, dois serviços, sem necessidade de rede/orquestração
compartilhada):

- `rpgcardgame-backend` — Node/Express + SQLite, porta `3000`.
- `rpgcardgame-frontend` — nginx servindo os arquivos estáticos de
  `frontend/`, porta `80` dentro do container (mapeada pra `5500` no
  host).

Cada uma tem seu próprio `docker build` + `docker run`, rodados em
terminais/momentos diferentes. O front nunca fala com o backend "por
dentro" do Docker — o `fetch` roda no **navegador** de quem está usando a
página, e o navegador enxerga as duas portas do host (`localhost:3000` e
`localhost:5500`) normalmente, como se fossem dois programas quaisquer
rodando na máquina. É por isso que não precisa de rede compartilhada nem
compose pra esse par: não há comunicação container-a-container, só
container-a-navegador-a-container.

## 2. Pré-requisito: Docker Desktop aberto

Todo comando `docker` fala com o Docker Desktop rodando em segundo plano.
Confira com:

```bash
docker version
```

Se o Desktop estiver fechado, a parte `Client:` aparece normal mas a
`Server:` falha com algo como:

```
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

Solução: abrir o Docker Desktop e esperar o ícone da baleia parar de
animar (totalmente iniciado), depois rodar o comando de novo.

## 3. Build e run — passo a passo

### Backend

Dentro de `backend/`, com `.env` já preenchido (`DND_BASE_URL` e
`JWT_SECRET` — ver `README.md` se não tiver um ainda):

```bash
docker build -t rpgcardgame-backend .
docker run -d --name rpgcardgame-backend --env-file .env -p 3000:3000 -v rpg-data:/data rpgcardgame-backend
```

O que cada flag faz:
- `-d` — roda em segundo plano (sem isso, o terminal fica preso mostrando
  o log e some se você fechar a janela).
- `--name` — dá um nome fixo ao container, pra usar nos comandos de
  `logs`/`stop`/`rm` em vez de decorar um ID gerado.
- `--env-file .env` — injeta `DND_BASE_URL`/`JWT_SECRET` no container. O
  `.env` real nunca entra na imagem (ver `.dockerignore`), só no runtime.
- `-p 3000:3000` — mapeia a porta 3000 do container pra 3000 do host.
- `-v rpg-data:/data` — volume nomeado: o SQLite sobrevive a recriar o
  container (ver seção 5 do `CLAUDE.md` sobre o symlink pra `/data`).

Smoke test:

```bash
curl http://localhost:3000/spells/acid-arrow
curl -i http://localhost:3000/admin/users   # espera 401 (sem token)
```

### Frontend

Dentro de `frontend/`:

```bash
docker build -t rpgcardgame-frontend .
docker run -d --name rpgcardgame-frontend -p 5500:80 rpgcardgame-frontend
```

A porta **5500** importa de verdade: o CORS do backend
(`backend/src/app.ts`) só libera `localhost:5500`/`127.0.0.1:5500` como
origem. Mudar essa porta no `docker run` sem atualizar o CORS quebra o
front dockerizado.

Smoke test:

```bash
curl -I http://localhost:5500/index.html
curl -I http://localhost:5500/components/login/login.html
curl -I http://localhost:5500/components/suporte/suporte.html
curl -I http://localhost:5500/components/bestiario/monster-index.html
```

Todos devem devolver `200`. Se quiser conferir visualmente, abra
`http://localhost:5500` num navegador com o backend também rodando.

## 4. Comandos do dia a dia (CLI)

| Comando | Pra que serve |
| --- | --- |
| `docker ps` | Lista containers **rodando** agora. |
| `docker ps -a` | Lista **todos** os containers, incluindo parados. |
| `docker logs <nome>` | Mostra a saída (stdout/stderr) do container. |
| `docker logs -f <nome>` | Mesma coisa, mas "segue" o log ao vivo (`Ctrl+C` pra sair). |
| `docker exec -it <nome> sh` | Abre um shell **dentro** do container rodando — útil pra inspecionar arquivos/variáveis sem parar nada. |
| `docker stop <nome>` | Para o container (mantém ele existindo, só não roda). |
| `docker start <nome>` | Liga de novo um container parado (com as mesmas flags de quando foi criado). |
| `docker rm <nome>` | Remove um container parado (não pode remover rodando sem `-f`). |
| `docker rm -f <nome>` | Para e remove de uma vez — usado neste guia antes de recriar. |
| `docker images` | Lista as imagens já buildadas localmente. |
| `docker rmi <imagem>` | Remove uma imagem (precisa remover os containers que a usam primeiro). |
| `docker build --no-cache -t <tag> .` | Rebuilda ignorando o cache de camadas — usar quando uma mudança não parece "pegar" (ver seção 6). |
| `docker system df` | Mostra quanto espaço em disco imagens/containers/volumes estão usando. |

⚠️ **`docker system prune`** apaga container parado, imagem sem uso,
rede sem uso e cache de build de uma vez — é destrutivo e não pede
confirmação por container individual. Não usar sem saber exatamente o que
vai ser removido; prefira `docker rm`/`docker rmi` pontuais.

## 5. Como ler um `Dockerfile`

Instruções que aparecem nos dois `Dockerfile` deste projo (linha por
linha, de cima pra baixo, cada uma vira uma "camada" da imagem):

| Instrução | O que faz |
| --- | --- |
| `FROM <imagem>` | Ponto de partida — uma imagem já pronta de outra pessoa (aqui: `node:24-bookworm-slim` e `nginx:alpine`). Tudo abaixo é construído em cima dela. |
| `WORKDIR /app` | Define a pasta de trabalho dentro do container — os comandos seguintes (`COPY`, `RUN`) rodam relativos a ela. |
| `COPY <origem> <destino>` | Copia arquivo(s) da sua máquina (o "build context", normalmente a pasta onde você roda `docker build .`) pra dentro da imagem. |
| `RUN <comando>` | Executa um comando **durante o build** (ex: `npm ci`, `apt-get install`) e grava o resultado como uma camada da imagem. |
| `ENV NOME=valor` | Define uma variável de ambiente fixa, embutida na imagem (diferente de `--env-file`, que é injetado só no `run`). |
| `EXPOSE <porta>` | Documenta qual porta o processo escuta dentro do container — não abre porta nenhuma sozinho, é só metadado (quem abre de verdade é o `-p` do `docker run`). |
| `VOLUME <caminho>` | Marca um caminho como "dado que não deve morrer com o container" — combinado com `-v nome:/caminho` no `run`. |
| `USER <nome>` | Troca de root pro usuário indicado pros comandos seguintes (e pro processo final) — princípio de menor privilégio. |
| `CMD ["cmd", "arg"]` | O comando que roda quando o container **inicia** (diferente de `RUN`, que roda só durante o **build**). Só pode haver um `CMD` por imagem — o último declarado vence. |

### Backend: build em 2 estágios (`backend/Dockerfile`)

```dockerfile
FROM node:24-bookworm-slim AS build   # estágio "build": tem devDependencies (tsc)
...
RUN npm run build                      # compila TS -> dist/

FROM node:24-bookworm-slim             # estágio final: começa do zero
...
COPY --from=build /app/dist ./dist     # só pega o JS já compilado do estágio anterior
CMD ["node", "dist/src/server.js"]
```

Por quê 2 estágios: o TypeScript precisa de `tsc`/`@types/*`
(`devDependencies`) pra compilar, mas o container que fica rodando em
produção não precisa de nada disso — só do JS já pronto. Compilar num
estágio e copiar só o resultado (`COPY --from=build`) pro estágio final
deixa a imagem final menor e sem ferramenta de build sobrando dentro dela.

### Frontend: 1 estágio só (`frontend/Dockerfile`)

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html/
EXPOSE 80
```

Não tem nada pra "compilar" (HTML/CSS/JS puro, sem bundler) — só copiar os
arquivos pra pasta que o nginx já serve por padrão. Por isso um estágio
só.

## 6. Como editar um `Dockerfile` com segurança

- **Não tem hot reload.** Editar o `Dockerfile` (ou qualquer arquivo que
  ele copia) não muda nada no container já rodando — é preciso
  `docker build` de novo e depois `docker rm -f` + `docker run` de novo
  pra usar a imagem nova. `docker start` num container já criado usa a
  imagem de quando ele foi criado, não a mais recente.
- **A ordem das camadas afeta o cache.** Repare que os dois Dockerfiles
  fazem `COPY package.json package-lock.json ./` **antes** de
  `COPY . .`: assim, se só o código mudou (não as dependências), o Docker
  reaproveita a camada do `npm ci` (lenta) do cache, e só refaz o `COPY`+
  `npm run build` (rápido). Se você inverter a ordem, toda mudança de
  código invalida o cache do `npm ci` também — build fica bem mais lento
  sem ganhar nada.
- **Se uma mudança não parece "pegar"** mesmo depois de rebuildar, tente
  `docker build --no-cache -t <tag> .` — força ignorar o cache de camada
  inteiro (mais lento, mas elimina "cache mentindo" como causa).
- **Os dois `Dockerfile` (backend e frontend) são versionados
  normalmente** — aparecem em `git ls-files`, editar o arquivo já é
  suficiente, sem cópia/espelho em outro lugar. (Até 2026-09-28 o
  `backend/Dockerfile` ficava fora do git, com uma cópia de referência em
  `backend/docker.exemple/` — isso foi descontinuado porque a disciplina
  exige o Dockerfile versionado nos dois projetos; não recriar esse
  espelho.)

## 7. Problemas comuns

- **`Could not find any Python installation` no build do backend**:
  `better-sqlite3` e `argon2` são módulos nativos que compilam via
  `node-gyp` durante o `npm ci`, e a imagem base (`node:24-bookworm-slim`)
  não vem com Python/toolchain de build por padrão. Já corrigido no
  `Dockerfile` atual (`apt-get install python3 make g++` antes do
  `npm ci`, removido de novo depois) — se aparecer nessa mensagem de novo
  depois de editar o Dockerfile, confira se esse passo não foi removido
  por engano.
- **`ports are not available: ... bind: ...`** ao rodar `docker run`: já
  tem algo (outro container, ou um `npm run dev` rodando direto na
  máquina) ouvindo naquela porta. `docker ps` mostra se é outro
  container; se não for, é processo local — no Windows,
  `Get-NetTCPConnection -LocalPort <porta>` (PowerShell) mostra o
  `OwningProcess` pra encerrar.
  - **Pegadinha real**: se um `docker run -p` anterior falhou no meio
    (ex: por causa desse mesmo erro de porta), ele pode deixar pra trás
    um container "fantasma" no estado `Created` (nunca chegou a rodar).
    Esse container sozinho já reserva a porta declarada no `-p`, mesmo
    parado — e como `docker ps` só mostra container **rodando**, ele fica
    invisível ali, e `Get-NetTCPConnection` também não acha nada do lado
    do Windows (a reserva é interna do Docker). Sintoma: toda tentativa
    de `docker run` com aquele nome/porta falha do mesmo jeito, mesmo
    depois de confirmar que nada mais usa a porta. Diagnóstico:
    `docker ps -a` (com `-a`, mostra os parados/criados também) — se
    aparecer um container com o mesmo nome em `Created` ou `Exited`,
    remove com `docker rm -f <nome>` antes de tentar de novo.
- **Container sobe e morre na hora (`docker ps -a` mostra `Exited`)**:
  ver `docker logs <nome>` — no backend, geralmente é `.env` faltando uma
  variável (`JWT_SECRET`/`DND_BASE_URL`) ou o `--env-file` esquecido no
  `docker run`.
- **Front dockerizado não consegue falar com o backend** (erro de CORS no
  console do navegador): confirme a porta do `-p` do frontend
  (`-p 5500:80`) bate com a whitelist de `backend/src/app.ts` — mudou a
  porta de um lado, precisa mudar do outro também.
