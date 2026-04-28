ARG NODE_IMAGE=node:20-alpine
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG APK_REPOSITORY=
ARG NPM_FETCH_RETRIES=5
ARG NPM_FETCH_RETRY_MINTIMEOUT=20000
ARG NPM_FETCH_RETRY_MAXTIMEOUT=120000
ARG NPM_FETCH_TIMEOUT=300000
ARG HTTP_PROXY=
ARG HTTPS_PROXY=
ARG NO_PROXY=

FROM ${NODE_IMAGE} AS build
ARG NPM_REGISTRY
ARG APK_REPOSITORY
ARG NPM_FETCH_RETRIES
ARG NPM_FETCH_RETRY_MINTIMEOUT
ARG NPM_FETCH_RETRY_MAXTIMEOUT
ARG NPM_FETCH_TIMEOUT
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

WORKDIR /app

ENV PYTHON=/usr/bin/python3 \
    HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    no_proxy=${NO_PROXY} \
    npm_config_registry=${NPM_REGISTRY} \
    npm_config_fetch_retries=${NPM_FETCH_RETRIES} \
    npm_config_fetch_retry_mintimeout=${NPM_FETCH_RETRY_MINTIMEOUT} \
    npm_config_fetch_retry_maxtimeout=${NPM_FETCH_RETRY_MAXTIMEOUT} \
    npm_config_fetch_timeout=${NPM_FETCH_TIMEOUT} \
    npm_config_update_notifier=false

RUN if [ -n "${APK_REPOSITORY}" ]; then \
        sed -i "s|https://dl-cdn.alpinelinux.org/alpine|${APK_REPOSITORY}|g" /etc/apk/repositories; \
    fi && \
    apk add --no-cache \
        python3 \
        py3-setuptools \
        make \
        g++

COPY package*.json ./
RUN npm ci --include=dev --prefer-offline --no-audit

COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
ARG NPM_REGISTRY
ARG APK_REPOSITORY
ARG NPM_FETCH_RETRIES
ARG NPM_FETCH_RETRY_MINTIMEOUT
ARG NPM_FETCH_RETRY_MAXTIMEOUT
ARG NPM_FETCH_TIMEOUT
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

WORKDIR /app

ENV PYTHON=/usr/bin/python3 \
    HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    no_proxy=${NO_PROXY} \
    npm_config_registry=${NPM_REGISTRY} \
    npm_config_fetch_retries=${NPM_FETCH_RETRIES} \
    npm_config_fetch_retry_mintimeout=${NPM_FETCH_RETRY_MINTIMEOUT} \
    npm_config_fetch_retry_maxtimeout=${NPM_FETCH_RETRY_MAXTIMEOUT} \
    npm_config_fetch_timeout=${NPM_FETCH_TIMEOUT} \
    npm_config_update_notifier=false

RUN if [ -n "${APK_REPOSITORY}" ]; then \
        sed -i "s|https://dl-cdn.alpinelinux.org/alpine|${APK_REPOSITORY}|g" /etc/apk/repositories; \
    fi && \
    apk add --no-cache \
        python3 \
        py3-setuptools \
        make \
        g++

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package*.json ./

RUN npm ci --omit=dev --prefer-offline --no-audit

RUN mkdir -p /app/data && chmod 755 /app/data

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/api/subscriptions || exit 1

CMD ["node", "server.js"]
