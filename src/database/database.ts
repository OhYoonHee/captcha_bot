import { DatabaseData } from "./typing";
import mongoose, { Schema } from "mongoose";

const schema = new Schema({
    admins : {
        type : Array
    },
    chat_id : {
        type : Number
    },
    permissions : {
        type : Object
    },
    on_timeout: {
        type : String,
        default : "kick"
    },
    timeout : {
        type : Number,
        default : 30
    },
    reload : {
        type : Number
    }
});

schema.set('strict', false);

export const db = mongoose.model<DatabaseData>('captcha_database', schema, 'captcha');
export default db;