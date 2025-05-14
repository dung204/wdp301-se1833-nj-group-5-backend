FROM node:24.0.1-alpine AS base
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /usr/src/app/
COPY .husky /usr/src/app/.husky
WORKDIR /usr/src/app

FROM base AS prod-deps
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile

FROM base AS dev-deps
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=dev-deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY . /usr/src/app/
RUN pnpm run build

FROM base AS release
ENV NODE_ENV=production
COPY --from=prod-deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY .env /usr/src/app/.env
# COPY cert /usr/src/app/cert

CMD [ "pnpm", "start:prod" ]
