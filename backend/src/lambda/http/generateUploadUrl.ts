import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getSignedUploadUrl } from '../../businessLogic/movies'
import { createLogger } from '../../utils/logger'
import { getToken, parseUserId } from '../../auth/utils'

const logger = createLogger('get-s3-url')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('get signed upload s3 url')
    try {
      const jwtToken = getToken(event.headers.Authorization)
      const movieId = event.pathParameters.movieId
      const userId = parseUserId(jwtToken)
      logger.info('userId: ', userId)
      const url: string = await getSignedUploadUrl(movieId, userId)
      return {
        statusCode: 200,
        body: JSON.stringify({
          uploadUrl: url
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

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
