import { Injectable, NotFoundException } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { InjectModel } from 'nestjs-typegoose';
import { UpdateMovieDto } from './update-movie.dto';
import { MovieModel } from './movie.model';
import { Types } from 'mongoose';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class MovieService {
    constructor(@InjectModel(MovieModel) private readonly MovieModel: ModelType<MovieModel>,
    private readonly telegramService: TelegramService) {}

    async getAll(searchTerm?: string) {
        let options = {}

        if (searchTerm)
            options = {
                $or: [
                    {
                        title: new RegExp(searchTerm, 'i')
                    }
                ]
            }

            return this.MovieModel.find(options)
                .select('-updateAt -__v')
                .sort({
                    createdAt: 'desc'
                }).populate('actors genres')
                .exec()
    }

    async bySlug(slug: string) {
        const doc = await this.MovieModel.findOne({slug}).populate('actors genres').exec()
        if (!doc) throw new NotFoundException('Movie not found')
        return doc
    }

    async byActor(actorId: Types.ObjectId) {
        const docs = await this.MovieModel.find({actors: actorId}).exec()
        if (!docs) throw new NotFoundException('Movies not found')
        return docs
    }

    async byGenres(
        genreIds: Types.ObjectId[]
    ) {
        const docs = await this.MovieModel.find({genres: {$in: genreIds}}).exec()
        if (!docs) throw new NotFoundException('Movies not found')
        return docs
    }

    async getMostPopular() {
        return this.MovieModel.find({countOpened: {$gt: 0}}).sort({countOpened: -1}).populate('genres').exec()
    }

    async updateCountOpened(slug: string) {
        const updateDoc = await this.MovieModel.findOneAndUpdate({slug}, {
            $inc: {countOpened: 1}
        },
        {
            new: true
        }).exec()
        if(!updateDoc) throw new NotFoundException('Movie not found')
        return updateDoc
    }

    async updateRating(id: Types.ObjectId, newRating: number) {
        return this.MovieModel.findByIdAndUpdate(
            id, 
            {
                rating: newRating,
            },
            {
                new: true
            }
        ).exec()
    }

    /* Admin place */

    async byId(_id: string) {
        const movie = await this.MovieModel.findById(_id)
        if (!movie) throw new NotFoundException('Movie not found')
        
        return movie
    }

    async create() {
        const defaultValue: UpdateMovieDto = {
            bigPoster: '',
            actors: [],
            genres: [],
            poster: '',
            title: '',
            videoUrl: '',
            slug: ''
        }
        const movie = await this.MovieModel.create(defaultValue)
        return movie._id
    }

    async update(_id: string, dto: UpdateMovieDto) {
        if (!dto.isSendTelegram) {
            await this.sendNotification(dto)
            dto.isSendTelegram = true
        }

        const updateDoc = await this.MovieModel.findByIdAndUpdate(_id, dto, {
            new: true
        }).exec()

        if(!updateDoc) throw new NotFoundException('Genre not found')

        return updateDoc
    }

    async delete(id:string) {
        const deleteDoc = await this.MovieModel.findByIdAndDelete(id).exec()
        
        if(!deleteDoc) throw new NotFoundException('Genre not found')

        return deleteDoc
    }

    async sendNotification(dto: UpdateMovieDto) {
        //if (process.env.NODE_ENV != 'development')
        //await this.telegramService.sendPhoto(dto.poster)
        await this.telegramService.sendPhoto('https://avatars.mds.yandex.net/get-kinopoisk-image/1599028/5ab427c8-4a7d-4766-abf9-a9748a69dbf4/300x450')

        const message = `<b>${dto.title}</b>`

        await this.telegramService.sendMessage(message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            url: 'https://auto.ru/cars/used/sale/bmw/x6/1115319688-c4f170d1/?geo_id=21627',
                            text: 'Go to watch'
                        }
                    ]
                ]
            }
        })
    }
}
