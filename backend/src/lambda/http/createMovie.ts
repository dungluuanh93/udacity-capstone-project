import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateMovieRequest } from '../../requests/CreateMovieRequest'
import { createMovie } from '../../businessLogic/movies'
import { getToken } from '../../auth/utils'
import { createLogger } from "../../utils/logger";
const logger = createLogger("create-movie");
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('create movie')
    try {
      const newMovie: CreateMovieRequest = JSON.parse(event.body)
      const jwtToken = getToken(event.headers.Authorization)
      const newCreatedMovie = await createMovie(newMovie, jwtToken)
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
         item: newCreatedMovie
        })
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

handler.use(
  cors({
    credentials: true
  })
)
