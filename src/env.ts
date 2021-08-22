import 'dotenv/config';

export const env = process.env;

if( !env.BOT_TOKEN ) throw new Error("Missing BOT_TOKEN in env");
if( !env.DB_URI ) throw new Error("Missing DB_URI in env");

export default env;