import { Injectable } from '@nestjs/common';
import { getTelegramConfig } from 'src/config/telegram.config';
import {Telegraf} from 'telegraf'
import { Telegram } from './telegram.interface';
import { ExtraReplyMessage} from 'telegraf/typings/telegram-types'

@Injectable()
export class TelegramService {
    bot: Telegraf
    options: Telegram
    
    constructor() {
        this.options = getTelegramConfig()
        this.bot = new Telegraf(this.options.token)
    }

    async sendMessage(message: string, options?: ExtraReplyMessage, chatId: string = this.options.chatId) {
        await this.bot.telegram.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            ...options
        })
    }

    async sendPhoto(
        photo: string,
        message?: string,
        chatId: string = this.options.chatId
    ) {
        await this.bot.telegram.sendPhoto(
            chatId,
            photo,
            message 
            ? {
                caption: message
                } 
            : {})
    }
}
