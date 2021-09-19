FROM node:14

COPY . /usr/app
WORKDIR /usr/app

RUN yarn global add typescript@4.1.5
RUN yarn install
RUN yarn build

CMD [ "yarn", "start" ]