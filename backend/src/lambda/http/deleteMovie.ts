import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteMovie } from '../../businessLogic/movies'
import { createLogger } from '../../utils/logger'
import { getToken } from '../../auth/utils'

const logger = createLogger('delete-movie')
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('delete movie')
    try {
      const movieId = event.pathParameters.movieId
      const jwtToken: string = getToken(event.headers.Authorization)
      logger.info('movieId: ', movieId)
      logger.info('token: ', jwtToken)
      await deleteMovie(movieId, jwtToken)
      return {
        statusCode: 200,
        body: JSON.stringify(true)
      }
    } catch (e) {
      logger.error(e.message)
      return {
        statusCode: 500,
        body: e.message
      }
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
