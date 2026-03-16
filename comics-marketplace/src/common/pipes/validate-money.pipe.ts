import { PipeTransform, Injectable, ArgumentMetadata,
         BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidateMoneyPipe implements PipeTransform {
    transform (value: any, metadata: ArgumentMetadata) {
        // convert to number
        const amount = Number(value);

        // verify that is a valid number and is non-negative
        if (isNaN(amount) || amount < 0) {
            throw new BadRequestException(`Invalid money value: ${value}`);
        }

        // payU: minimum amount is $1000 COP , so we can enforce that here
        if (amount < 1000) {
            throw new BadRequestException(`Amount must be at least 1000 COP`);
        }

        // payU: maximum amount is $100,000,000 COP, so we can enforce that here
        if (amount > 100_000_000) {
            throw new BadRequestException(`Amount must not exceed 100,000,000 COP`);
        }

        // verify max 2 decimal places
        if (Math.round(amount * 100) !== Math.round(amount * 100)) {
            throw new BadRequestException(`Amount can have at most 2 decimal places`);
        }

        return amount;
    }
}