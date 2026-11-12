FROM node:24-bookworm AS base

# yarn is no longer bundled with newer node images
RUN command -v yarn || npm install -g yarn@1

FROM base AS setup

ARG TARGETPLATFORM

RUN mkdir root-outputs

COPY docker/scripts/install-s6overlay.sh /tmp

RUN /tmp/install-s6overlay.sh "${TARGETPLATFORM}" /root-outputs

WORKDIR /app

# install the turbo version the repo depends on, so prune matches the lockfile
COPY package.json /tmp/root-package.json
RUN yarn global add "turbo@$(node -p "require('/tmp/root-package.json').dependencies.turbo")"

COPY . .

RUN turbo prune --scope=@dload/aria --scope=@dload/server --scope=@dload/client --docker --out-dir=out

FROM base AS installer

WORKDIR /app

COPY .gitignore .gitignore
COPY --from=setup /app/out/yarn.lock ./yarn.lock
COPY --from=setup /app/out/json/ .
RUN yarn config set registry https://registry.npmjs.org/
RUN yarn config set network-timeout 1200000
RUN yarn install

COPY --from=setup /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn clean

RUN yarn build

FROM debian:bookworm AS runner

ENV \
  S6_CMD_WAIT_FOR_SERVICES_MAXTIME=0

RUN apt update && DEBIAN_FRONTEND=noninteractive apt install -y --no-install-recommends \
      ca-certificates \
      procps \
      bash \
      curl \
      grep \
      git \
      nginx

# same node runtime the app was built with
COPY --from=base /usr/local/bin/node /usr/local/bin/node

COPY docker/root-fs /
COPY --from=setup /root-outputs /
COPY docker/nginx.conf /etc/nginx/nginx.conf

WORKDIR /app

COPY --from=installer /app .
COPY --from=installer /app/apps/client/dist /usr/share/nginx/html

RUN addgroup --system --gid 1000 dload
RUN adduser --system --uid 1000 dload
RUN usermod -g dload dload

ENTRYPOINT [ "/init" ]
