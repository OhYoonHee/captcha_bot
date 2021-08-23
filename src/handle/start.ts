import { CustomContext } from "../class/context";
import Utilities from "../class/utils";
import { InlineKeyboard } from 'grammy';

export async function StartMessage(ctx : CustomContext) {
    let keyboard = new InlineKeyboard();
    keyboard.url('Update Channel', 'https://t.me/TarianaChannel').url('Source', 'https://github.com/OhYoonHee/captcha_bot');
    if( !ctx.from || !ctx.message ) return await Promise.resolve(false);
    let fullname = ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name;
    let tag = Utilities.create_tag_html(fullname, ctx.from.id);
    let message = `Hi ${tag}, my name is ${ctx.me.first_name} which will help you to verify new members whether they are bot or not.`;
    return await ctx.replyWithHTML(message, {
        reply_to_message_id : ctx.message.message_id
    });
}