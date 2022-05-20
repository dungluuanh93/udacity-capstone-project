import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { MovieItem } from '../models/MovieItem'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('MoviesAccess')

export class MoviesAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly moviesIndex = process.env.MOVIES_USER_INDEX,
        private readonly moviesTable = process.env.MOVIES_TABLE,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION),
        private readonly s3 = new XAWS.S3({
            signatureVersion: 'v4'
        }),
    ) {
    }

    async getAllMovies(userId: String): Promise<MovieItem[]> {
        logger.info('Getting all movies by userId')

        const result = await this.docClient.query({
            TableName: this.moviesTable,
            IndexName: this.moviesIndex,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        }).promise()

        const items = result.Items
        logger.info(items)
        return items as MovieItem[]
    }

    async createMovie(movieItem: MovieItem): Promise<MovieItem> {
        logger.info('Storing new item: ', movieItem.movieId)
        const newItem = {
            ...movieItem,
            attachmentUrl: `https://${this.bucketName}.s3.amazonaws.com/${movieItem.movieId}`
        }
        await this.docClient.put({
            TableName: this.moviesTable,
            Item: newItem
        }).promise()
        logger.info(newItem)
        return newItem
    }

    async updateMovie(movieItem: MovieItem): Promise<void> {
        logger.info('Updating new item: ', movieItem.movieId)
        const updateExpression = 'set #name = :name, #releaseDate = :releaseDate, #status = :status'
        const conditionExpression = 'movieId = :movieId'
        await this.docClient.update({
            TableName: this.moviesTable,
            Key: {
                movieId: movieItem.movieId,
                userId: movieItem.userId
            },
            UpdateExpression: updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames: {
                '#name': 'name',
                '#releaseDate': 'releaseDate',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':name': movieItem.name,
                ':releaseDate': movieItem.releaseDate,
                ':status': movieItem.status,
                ':movieId': movieItem.movieId
            }
        }).promise()
        logger.info(movieItem)
    }
    async deleteMovie(movieId: string, userId: string): Promise<void> {
        logger.info('deleting Movie item: ', movieId)
        await this.docClient.delete({
            TableName: this.moviesTable,
            Key: {
                movieId,
                userId
            },
            ConditionExpression: 'movieId = :movieId',
            ExpressionAttributeValues: {
                ':movieId': movieId
            }
        }).promise()

        //delete s3 object
        const params = {
            Bucket: this.bucketName,
            Key: movieId
        }
        await this.s3.deleteObject(params, function (err, data) {
            if (err) logger.info('error while deleting object', err.stack)
            else logger.info(data)
        }).promise()
    }

    async getSignedUploadUrl(movieId: string, userId: string): Promise<string> {
        logger.info('getting upload url')
        const attachmentUrl = this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: movieId,
            Expires: this.urlExpiration
        })
        logger.info(attachmentUrl)

        this.docClient.update(
            {
                TableName: this.moviesTable,
                Key: {
                    movieId,
                    userId,
                },
                UpdateExpression: "set attachmentUrl = :attachmentUrl",
                ExpressionAttributeValues: {
                    ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${movieId}`,
                }
            }
        )
        return attachmentUrl

    }
}
function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        logger.info('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}