import mongoose from 'mongoose';
import env from '../env';
import db from './database';

export function connect_database() {
    return new Promise((res, rej) => {
        try{
            mongoose.connect(env.DB_URI as string, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true
            });
    
            mongoose.connection.on('error', (error) => {
                return rej(error);
            });

            mongoose.connection.on('connected', () => {
                return res(true);
            });
        } catch(e) {
            rej(e.message);
        }
    });
}

export async function find_chat(chat_id : number) {
    let data = await db.findOne({ chat_id });
    if(data == undefined) {
        return undefined;
    }
    return {
        data,
        json : data.toJSON()
    }
}

export { db };