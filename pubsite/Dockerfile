FROM node:20 AS build
WORKDIR app
COPY package.json /app
RUN npm install --frozen-lockfile
COPY ./ /app
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=build /app/build .
RUN npm i -g serve

CMD ["serve", "/app"]