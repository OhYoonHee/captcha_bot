## Requirements
- Nodejs 
- Yarn
```shell
$ npm install -g yarn
```
- Typescript
```shell
$ npm install -g typescript
```

## ENV
`BOT_TOKEN` : Your bot token from [@botfather](https://t.me/botfather)\
`DB_URI` : Mongodb uri

## Local Deploy
```shell
$ git clone https://github.com/OhYoonHee/captcha_bot.git
$ cd captcha_bot
$ yarn install
```
Create a .env file and add [env value](#env)
```shell
$ yarn build
$ yarn start
```

## Easy Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2FOhYoonHee%2Fcaptcha_bot%2Ftree%2Fmaster&envs=BOT_TOKEN%2CDB_URI&optionalEnvs=BOT_TOKEN%2CDB_URI&BOT_TOKENDesc=BOT_TOKEN+from+%40botfather&DB_URIDesc=Your+MongoDb+URI)

## Commands
`/start`\
`/on_timeout`\
`/timeout`\
`/reload`







