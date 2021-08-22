import { Router } from '@grammyjs/router';
import Utilities from './class/utils';
import { CustomContext } from './class/context';
import { Room, room as InitRoom } from './class/room';
import { find_chat, db } from './database';
import { InlineKeyboard } from "./class/keyboard";
import * as handle from './handle';

const command = new Router<CustomContext>(ctx => {
    return ctx.parse_command.command;
});

const callback = new Router<CustomContext>(ctx => {
    return ctx.callback_command.command;
})

command.route('start', async (ctx, next) => {
    if(ctx.chat?.type != "private") {
        return await handle.StartMessage(ctx);
    }

    let args = ctx.parse_command.args;

    if( !args || args == "" ) {
        await handle.StartMessage(ctx);
        return;
    }
    let check_room = Room.get_room(args, String(ctx.from?.id));
    if( !check_room ) {
        await handle.StartMessage(ctx);
        return;
    }
    let { answer, image, room_id, attempt } = check_room;
    if( attempt == undefined ) attempt = 3;

    let inline_keyboard = Utilities.create_keyboard_captcha({ room_id, text : answer });
    let caption = `Click on Correct button to Verify Yourself (${attempt} attempts left)`;
    await ctx.replyWithPhoto(image, {
        caption,
        reply_to_message_id : ctx.message?.message_id,
        reply_markup : {
            inline_keyboard
        }
    });
    return;
});

command.route('timeout', async (ctx, next) => {
    if(ctx.chat?.type == "private") {
        return;
    }
    let args = ctx.parse_command.args;
    let timeout : number;
    let dataset = await find_chat(ctx.chat?.id as number);
    if( dataset == undefined ) return await next();
    if(dataset.json.admins == undefined) return ctx.answerCallbackQuery();
    let is_admin = dataset.json.admins.map(e => e.id).includes(Number(ctx.from?.id));
    if(!is_admin) {
        await ctx.reply("You are not admin!!", {
            reply_to_message_id : ctx.message?.message_id
        });
        return;
    }
    if( args == "" ) {
        await ctx.reply("Please add minutes to change the maximum time to answer the captcha.\nExample: <code>/timeout 30</code> (to change the maximum time to answer the captcha to 30 minutes)", {
            reply_to_message_id : ctx.message?.message_id
        });
        return;
    }
    if( !Utilities.isNumber(args) ) {
        await ctx.reply("Minutes not valid!!", {
            reply_to_message_id : ctx.message?.message_id
        });
        return;
    }

    timeout = Number(args);

    if(timeout < 5) {
        await ctx.reply("Minutes min 5", {
            reply_to_message_id : ctx.message?.message_id
        })
        return;
    }

    if(timeout > 1440) {
        await ctx.reply("Minutes max 1440", {
            reply_to_message_id : ctx.message?.message_id
        })
        return;
    }
    try{
        await db.updateOne({ chat_id : ctx.chat?.id }, { timeout });
        await ctx.reply("Success edit timeout captcha", {
            reply_to_message_id : ctx.message?.message_id
        });
        return;
    } catch(e) {
        await ctx.reply("Error while edit timeout captcha", {
            reply_to_message_id : ctx.message?.message_id
        });
        console.log(e.message);
        return;
    }
    return;
});

command.route('on_timeout', async (ctx, next) => {
    if(ctx.chat?.type == "private") {
        return;
    }
    let keyboard = new InlineKeyboard();
    keyboard.text("Ban", "/on_timeout ban").text("Kick", "/on_timeout kick").row();
    keyboard.text("Mute", "/on_timeout mute");
    await ctx.reply("Please select the button bellow", {
        reply_markup : {
            ...keyboard
                },
                reply_to_message_id : ctx.message?.message_id
        });
    return;

});

command.route('reload', async (ctx, next) => {
    if(ctx.chat?.type == "private") {
        return;
    }
    try{
        let dataset = await find_chat(ctx.chat?.id as number);
        if(dataset == undefined) return await next();
        let { json, data } = dataset;
        let reload = Date.now() / 1000;
        let kurang = reload - json.reload;
        let menit = kurang/60;
        if(menit <= 10) {
            return await next();
        }
        let get_admin = await ctx.getChatAdministrators();
        let admins = get_admin.map(e => ({id : e.user.id}));
        let get_chat = await ctx.getChat();
        if(!("permissions" in get_chat)) return await next();
        data.reload = reload;
        data.permissions = (get_chat.permissions as any);
        data.admins = admins;
        await data.save();
        await ctx.reply("Reloaded!!", {
            reply_to_message_id : ctx.message?.message_id
        });
        return;
    } catch(e) {
        await ctx.reply("Failed!!", {
            reply_to_message_id : ctx.message?.message_id
        });
        return;
    }
});

callback.route('captcha', async (ctx, next) => {
    let args = ctx.callback_command.args;
    let [room_id, answer, input] = args.split(" ");
    let room = Room.get_room(room_id, ctx.from?.id as number);
    if(!room || room.answer != answer) {
        await ctx.answerCallbackQuery();
        try{
            await ctx.deleteMessage();
        }catch(e) {}
            return;
        }
        let fullname = ctx.from?.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from?.first_name;
        let tag = Utilities.create_tag_html(fullname as string, ctx.from?.id as number);
        if(input == answer) {
            await handle.RestrictMember.UnMuteMember(ctx, room.chat_id, room.user_id);
            await ctx.reply('Congratulations, you Successfully Verified');
            let kirim_group = await ctx.api.sendMessage(room.chat_id, `${tag} Successfully Verified`);
            try{
                await ctx.deleteMessage();
            } catch(e) {}
            Room.delete_room(room_id);
            setTimeout(async () => {
                try{
                    await ctx.api.deleteMessage(kirim_group.chat.id, kirim_group.message_id);
                    await ctx.api.deleteMessage(kirim_group.chat.id, room?.message_id as number);
                } catch(e) {}
            }, 5000);
            return;
        } else {
            if(room.attempt == undefined) room.attempt = 3;
            room.attempt--
            if(room.attempt < 1) {
                await ctx.answerCallbackQuery({
                    text : 'You are not human!!'
                });
                try{
                    await ctx.deleteMessage();
                }catch(e) {}
                let kirim_group = await ctx.api.sendMessage(room.chat_id, `#FAILED\n${tag} Failed Verified in 3 attempts`);
                setTimeout(async () => {
                    try{
                        await ctx.api.deleteMessage(kirim_group.chat.id, kirim_group.message_id);
                        await ctx.api.deleteMessage(kirim_group.chat.id, room?.message_id as number);
                    } catch(e) {}
                }, 5000);
                Room.delete_room(room_id)
                return;
            }
            try{
                await ctx.answerCallbackQuery({
                    text : "Wrong answer, generate new captcha...",
                    show_alert : true
                });
                await ctx.deleteMessage();
            }catch(e) {}
            let { text, url} = await Utilities.create_captcha();
            room.answer = text;
            room.image = url;
            let inline_keyboard = Utilities.create_keyboard_captcha({ room_id, text : room.answer });
            let caption = `Click on Correct button to Verify Yourself (${room.attempt} attempts left)`;
            await ctx.replyWithPhoto(room.image, {
                caption,
                reply_markup : {
                    inline_keyboard
                }
            });
            return;
        }
});

callback.route('pass', async (ctx, next) => {
    let args = ctx.callback_command.args;
    let room_id = args;
    let room = InitRoom.get(room_id);
    if( !room ) {
        await ctx.answerCallbackQuery();
        return;
    };
    let { chat_id, user_id } = room;
    let dataset = await find_chat(chat_id);
    if( dataset != undefined ) {
        if(dataset.json.admins == undefined) return ctx.answerCallbackQuery();
        let is_admin = dataset.json.admins.map(e => e.id).includes(Number(ctx.from?.id));
        if( is_admin ) {
            await handle.RestrictMember.UnMuteMember(ctx, chat_id, user_id);
            let fullname = ctx.from?.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from?.first_name;
            let tag = Utilities.create_tag_html(fullname as string, ctx.from?.id as number);
            let tag2 = Utilities.create_tag_html(room.fullname, user_id);
            await ctx.editMessageText(`${tag} passed ${tag2}`, {
                reply_markup : {
                    inline_keyboard : [[]]
                }
            });
            await Room.delete_room(room_id);
            return;
        } else {
            ctx.answerCallbackQuery({
                text : 'You are not admin',
                show_alert : true
            });
            return;
        }
    }
});

callback.route('on_timeout', async (ctx, next) => {
    let args = ctx.callback_command.args;
    let on_timeout = args as "kick"|"ban"|"mute";
    let chat_id = ctx.msg?.chat.id as number;
    let dataset = await find_chat(chat_id);
    if( dataset != undefined ) {
        if(dataset.json.admins == undefined) return ctx.answerCallbackQuery();
        let is_admin = dataset.json.admins.map(e => e.id).includes(Number(ctx.from?.id));
        if( is_admin ) {
            try{
                await db.updateOne({ chat_id }, { on_timeout });
                await ctx.answerCallbackQuery({
                    text : "Success edit on timeout!!",
                    show_alert : true
                });
                await ctx.deleteMessage();
                return;
            } catch(e) {
                await ctx.answerCallbackQuery({
                    text : "Failed while edit on timeout!!",
                    show_alert : true
                });
                await ctx.deleteMessage();
                return;
            }
        } else {
            ctx.answerCallbackQuery({
                text : 'You are not admin',
                show_alert : true
            });
            return;
        }
        ctx.answerCallbackQuery();
        return;
    }
});

export { command, callback };

