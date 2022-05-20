import { MoviesAccess } from '../dataLayer/moviesAcess'
import { MovieItem } from '../models/MovieItem'
import { CreateMovieRequest } from '../requests/CreateMovieRequest'
import { UpdateMovieRequest } from '../requests/UpdateMovieRequest'
import * as uuid from 'uuid'
import { parseUserId } from '../auth/utils'


const moviesAcess = new MoviesAccess()

export const getAllMovies = async (jwtToken: string): Promise<MovieItem[]> => {
    const userId = parseUserId(jwtToken)
    return await moviesAcess.getAllMovies(userId)
}

export const createMovie = async (createMovieRequest: CreateMovieRequest, jwtToken: string): Promise<MovieItem> => {
    const userId = parseUserId(jwtToken)
    const movieId = uuid.v4()
    const newItem = {
        userId,
        movieId,
        name: createMovieRequest.name,
        releaseDate: createMovieRequest.releaseDate,
        status: false,
        createdAt: new Date().toISOString()
    }
    return await moviesAcess.createMovie(newItem)
}
export const updateMovie = async (updateMovieRequest: UpdateMovieRequest, jwtToken: string, movieId: string): Promise<void> => {
    const userId = parseUserId(jwtToken)
    const updatedItem = {
        userId,
        movieId,
        name: updateMovieRequest.name,
        releaseDate: updateMovieRequest.releaseDate,
        status: updateMovieRequest.status,
        createdAt: new Date().toISOString()
    }
    await moviesAcess.updateMovie(updatedItem)
}

export const deleteMovie = async (movieId: string, jwtToken: string): Promise<void> => {
    const userId = parseUserId(jwtToken)
  await moviesAcess.deleteMovie(movieId, userId)
}

export const getSignedUploadUrl = async (movieId: string, userId: string): Promise<string> =>{
    return moviesAcess.getSignedUploadUrl(movieId, userId)
}

