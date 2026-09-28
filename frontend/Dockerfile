# Frontend estático (HTML/CSS/JS puro, sem bundler): só precisa de um
# servidor de arquivos. nginx alpine é minúsculo e serve isso direto.
#
# COPY . (tudo), não uma lista de arquivo por arquivo: o front ganha
# página nova com frequência (indexMonstros/, login.html, suporte/...)
# e uma lista manual exigiria editar este Dockerfile a cada página nova.
# O que não deve ir pra imagem fica de fora via .dockerignore (notas
# internas, ferramental local), não uma allowlist aqui.
FROM nginx:alpine
COPY . /usr/share/nginx/html/
EXPOSE 80
