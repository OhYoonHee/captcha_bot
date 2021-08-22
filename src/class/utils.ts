import { randomText, create } from 'svg-captcha';
import { InlineKeyboard } from './keyboard';
import fetch from 'node-fetch';
import sharp from 'sharp';
import FormData from 'form-data';
import * as typings from '../typings';


// functions for HTML tag escaping, based on https://stackoverflow.com/a/5499821/
const tagsToEscape = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
}
function escapeTag(tag: string): string {
    return tagsToEscape[tag as '&' | '<' | '>'] || tag
}

export class Utilities {
    static sleep(ms : number) : Promise<void> {
        return new Promise((res) => setTimeout(res, ms));
    }

    static random(len : number = 5) : string {
        return randomText(len);
    }

    static chunk_array(array : Array<any>, size : number) {
        return new Array(Math.ceil(array.length / size)).fill(null).map(() => array.splice(0, size))
    }

    static shuffle_array(array : Array<any>) : any[] {
        var currentIndex = array.length,  randomIndex;
      
        while (0 !== currentIndex) {
      
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      
        return array;
    }

    static random_number(min : number, max : number) {
    if (max < min) { 
        [min, max] = [max, min]; 
    }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static async create_captcha(size : number = 5) : Promise<{ text : string, url : string }> {
        let form = new FormData();
        let captcha = create({
            size,
            color : true,
            width : 1366,
            height : 657,
            fontSize : 1102,
            noise : 40
        });
        let { text, data  } : { text : string, data : any } = captcha;
        data = Buffer.from(data);
        let data_buffer = await sharp(data).png().toBuffer();
        form.append('source', data_buffer, {
            filename : "captcha.png"
        });
        form.append('type', 'file');
        form.append('action', 'upload');
        form.append('timestamp', Date.now().toString());
        let ambil_api = await fetch('https://imgbb.com/json', {
            method : "POST",
            body : form
        });
        ambil_api = await ambil_api.json();
        let json : any = ambil_api;
        let url = json.image.url
        return { text, url };
    }

    static random_array(array : Array<any>) : any[] {
        for(let x in [...Array(this.random_number(1, 30))]) {
            array = this.shuffle_array(array);
        }
        return array
    }

    static create_keyboard_captcha(answer : {text : string, room_id : string}) {
        let keyboard = new InlineKeyboard();
        for(let x in [...Array(15)]){
            let random = this.random();
            keyboard.text(random, `/captcha ${answer.room_id} ${answer.text} ${random}`);
        }
        keyboard.text(answer.text, `/captcha ${answer.room_id} ${answer.text} ${answer.text}`);
        let array = keyboard.inline_keyboard[0];
        array = this.random_array(array);
        let inline_keyboard = this.chunk_array(array, 4);
        return inline_keyboard;
    }

    static toArray(input : any) : any[] {
        return Array.isArray(input) ? input : [input];
    }

    static getPeerId(id : number|string, show_normal : boolean = false) : string|string[]|undefined {
        let peer = id.toString().match(/(?:-100)?([^0]\d*)/)
        if(!peer) return undefined;
        if(show_normal){
          return [peer[1], peer[0]];
        }
        return peer[1];
      }

      static create_room_id(chat_id : string, user_id : string) : string {
          let chat = this.getPeerId(chat_id);
          let room = `${chat}_${user_id}`;
          return room;
      }

      static link_html(link : string, text : string) : string {
          return `<a href="${this.escape_html(encodeURI(link))}">${this.escape_html(text)}</a>`
      }
      
      static escape_html(str: string): string {
          return str.replace(/[&<>]/g, escapeTag);
      }

      static create_tag_html(name : string, id : number) {
          return this.link_html(`tg://user?id=${id}`, name);
      }

      static parse_command(text : string, bot_username : string|undefined, prefix : string|string[]="/") : typings.CommandsData | undefined {
		const parse_regex = /([^@\s]+)@?(?:(\S+)|)\s?([\s\S]+)?$/i.exec(text);
        if (!parse_regex) return undefined;
        const [_, command, tag="", args=""] = parse_regex;
		if (command.trim().length < 2) return undefined;
		let prefixs = this.toArray(prefix);
		let start = command[0];
        if (!prefixs.includes(start)) return undefined;
        if (tag != "" && tag.toLowerCase() != (bot_username as string).toLowerCase()) return undefined;
        return { 'command' : command.slice(1).toLowerCase(), args : args as string };
	}

    static isNumber(input : any) {
        return !isNaN(input) && !isNaN(parseFloat(input))
    }

    static array_filter_async(array : any[], predicate : any) {
    const data = Array.from(array);
    return Promise.all(data.map((element, index) => predicate(element, index, data)))
      .then(result => {
        return data.filter((element, index) => {
          return result[index];
        });
      });
    }

}

export default Utilities;