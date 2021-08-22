import { Context } from "grammy";
import { CommandsData } from '../typings';
import Utilities from "./utils";

export class CustomContext extends Context {
    get parse_command() : CommandsData {
        if(!this.message) return { command : "", args : "" };
        if(!("text" in this.message)) return { command : "", args : "" };
        let test_command = Utilities.parse_command(this.message.text as string, this.me.username, '/');
        return test_command || { command : "", args : "" };
    }

    get callback_command() : CommandsData {
        if(!this.callbackQuery) return { command : "", args : "" };
        if(!("data" in this.callbackQuery)) return { command : "", args : "" };
        let test_command = Utilities.parse_command(this.callbackQuery.data as string, this.me.username, ['/', '!']);
        return test_command || { command : "", args : "" };
    }

    public replyWithHTML(...args : Parameters<Context['reply']>) {
        const [ text, payload, ...rest ] = args;
        return this.reply(text, { ...payload, parse_mode : "HTML"}, ...rest);
    }

}