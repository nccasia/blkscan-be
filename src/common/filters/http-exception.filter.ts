import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter<T extends HttpException>
  implements ExceptionFilter
{
  catch(exception: T, host: ArgumentsHost) {
    console.log('HttpExceptionFilter', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    try {
      const status = exception.getStatus();
      const exceoptionResponse = exception.getResponse();

      const error =
        typeof response === 'string'
          ? { message: exceoptionResponse }
          : (exceoptionResponse as object);

      return response.status(status).json({
        ...error,
        timestamp: new Date().toISOString(),
        path: request.path,
      });
    } catch (error) {
      return response.status(500).json({
        timestamp: new Date().toISOString(),
        path: request.path,
      });
    }
  }
}
