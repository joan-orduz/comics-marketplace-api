import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentGatewayException extends HttpException {
  constructor(
    public readonly gatewayCode: string,
    public readonly orderId: string,
    userMessage: string,
  ) {
    super(
      { message: userMessage, gatewayCode },
      HttpStatus.PAYMENT_REQUIRED, // 402
    );
  }
}


export class InsufficientStockException extends HttpException {
  constructor(comicTitle: string, available: number, requested: number) {
    super(
      {
        message: `Insufficient stock for '${comicTitle}'`,
        available,
        requested,
      },
      HttpStatus.CONFLICT, // 409
    );
  }
}
